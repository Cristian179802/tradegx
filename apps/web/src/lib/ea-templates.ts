/**
 * Generates MT4 (MQL4) and MT5 (MQL5) Expert Advisor source code
 * that automatically syncs closed trades to TradeGx via webhook.
 *
 * The EA:
 *  - Runs a timer every 15 seconds
 *  - Detects newly closed trades/deals in account history
 *  - POSTs each trade as JSON to /api/webhooks/ea/[userId]
 *  - Requires only WebRequest enabled in MT4/MT5 settings
 */

export function generateMQ4(webhookUrl: string, token: string): string {
  return `//+------------------------------------------------------------------+
//|  TradeGx — Auto Sync EA                                      |
//|  Instalare: copiaza in MT4/Experts si ataseaza la orice chart   |
//|  Setari: Tools > Options > Expert Advisors > Allow WebRequest:  |
//|    ${new URL(webhookUrl).origin}                                  |
//+------------------------------------------------------------------+
#property copyright "TradeGx"
#property version   "1.32"
#property strict

//--- Configurare — lipeste valorile din tradegx.com/accounts
extern string WebhookURL  = "${webhookUrl}";
extern string AuthToken   = "${token}";
extern int    SyncEvery   = 15;   // secunde intre verificari
extern int    MaxPerCycle = 100;  // cate tranzactii noi trimite per ciclu (anti-blocare)

//--- Stare interna: tichetele deja confirmate (anti-duplicat local)
int g_sent[];
int g_sentCount = 0;

//+------------------------------------------------------------------+
int OnInit()
{
   ArrayResize(g_sent, 0);
   g_sentCount = 0;
   EventSetTimer(SyncEvery);
   Print("[TradeGx] EA pornit. Trimite catre: ", WebhookURL);
   Print("[TradeGx] Token: ", StringSubstr(AuthToken, 0, 6), "... (", StringLen(AuthToken), " caractere)");
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("[TradeGx] EA oprit.");
}

//+------------------------------------------------------------------+
// Verifica daca un tichet a fost deja trimis cu succes in aceasta sesiune.
bool AlreadySent(int ticket)
{
   for(int k = g_sentCount - 1; k >= 0; k--)
      if(g_sent[k] == ticket) return true;
   return false;
}

// Marcheaza un tichet ca trimis (dedup local, anti-spam).
void MarkSent(int ticket)
{
   ArrayResize(g_sent, g_sentCount + 1);
   g_sent[g_sentCount] = ticket;
   g_sentCount++;
}

//+------------------------------------------------------------------+
void OnTimer()
{
   // Rescaneaza TOT istoricul la fiecare ciclu si trimite orice tichet inca
   // neconfirmat. Nu folosim reper de timp — asa nu se mai pierde nimic, chiar
   // daca o tranzactie apare cu intarziere sau o sincronizare anterioara a esuat.
   // Serverul ignora duplicatele (upsert dupa brokerTradeId), deci e sigur.
   int total = OrdersHistoryTotal();

   int synced = 0, failed = 0;
   for(int i = 0; i < total; i++)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) continue;
      if(OrderType() > 1) continue;                    // skip pending/non-trade
      int ticket = OrderTicket();
      if(AlreadySent(ticket)) continue;                // deja confirmat local

      if(SendTrade()) { MarkSent(ticket); synced++; }
      else            { failed++; }

      if(synced >= MaxPerCycle) break;                 // anti-blocare per ciclu
   }

   if(synced > 0)
      Print("[TradeGx] Sincronizate: ", synced, " tranzactii.");
   if(failed > 0)
      Print("[TradeGx] ", failed, " esuate — reincerc la urmatorul ciclu.");
}

//+------------------------------------------------------------------+
bool SendTrade()
{
   // JSON construit cu IntegerToString/DoubleToString (separator zecimal '.',
   // fara specificatori de format) ca sa fie mereu JSON valid.
   string body = "{"
      + "\\"ticket\\":"       + IntegerToString(OrderTicket())
      + ",\\"symbol\\":\\""   + OrderSymbol() + "\\""
      + ",\\"type\\":\\""     + (OrderType() == OP_BUY ? "buy" : "sell") + "\\""
      + ",\\"lots\\":"        + DoubleToString(OrderLots(), 2)
      + ",\\"openPrice\\":"   + DoubleToString(OrderOpenPrice(), 5)
      + ",\\"closePrice\\":"  + DoubleToString(OrderClosePrice(), 5)
      + ",\\"openTime\\":"    + IntegerToString((int)OrderOpenTime())
      + ",\\"closeTime\\":"   + IntegerToString((int)OrderCloseTime())
      + ",\\"profit\\":"      + DoubleToString(OrderProfit(), 2)
      + ",\\"commission\\":"  + DoubleToString(OrderCommission(), 2)
      + ",\\"swap\\":"        + DoubleToString(OrderSwap(), 2)
      + ",\\"sl\\":"          + DoubleToString(OrderStopLoss(), 5)
      + ",\\"tp\\":"          + DoubleToString(OrderTakeProfit(), 5)
      + ",\\"balance\\":"     + DoubleToString(AccountBalance(), 2)
      + ",\\"login\\":\\""    + IntegerToString(AccountNumber()) + "\\""
      + ",\\"tradeMode\\":"   + IntegerToString(IsDemo() ? 0 : 2)
      + ",\\"server\\":\\""   + AccountServer() + "\\""
      + ",\\"company\\":\\"" + AccountCompany() + "\\""
      + ",\\"platform\\":\\"mt4\\""
      + "}";

   char  post[], res[];
   string resHeaders;
   string headers = "Content-Type: application/json\\r\\n"
                  + "X-Apex-Token: " + AuthToken + "\\r\\n";

   StringToCharArray(body, post, 0, StringLen(body));

   int code = WebRequest("POST", WebhookURL, headers, 5000, post, res, resHeaders);

   if(code < 0)
   {
      Print("[TradeGx] Eroare WebRequest: ", GetLastError(),
            ". Verifica: Tools > Options > Expert Advisors > Allow WebRequest");
      return false;
   }

   string response = CharArrayToString(res);

   if(code != 200 && code != 201)
   {
      Print("[TradeGx] Server a raspuns cu codul: ", code, " | ", StringSubstr(response, 0, 200));
      return false;
   }

   // Confirmare reala: webhook-ul nostru include mereu accountId in raspuns.
   // Daca lipseste => alt raspuns (ex: redirect la pagina de login) = fals succes.
   if(StringFind(response, "accountId") < 0)
   {
      Print("[TradeGx] ATENTIE: cod ", code, " dar raspuns necunoscut. URL gresit sau redirect? Raspuns: ", StringSubstr(response, 0, 200));
      return false;
   }

   return true;
}
`;
}

export function generateMQ5(webhookUrl: string, token: string): string {
  return `//+------------------------------------------------------------------+
//|  TradeGx — Auto Sync EA (MT5)                                |
//|  Instalare: copiaza in MT5/Experts si ataseaza la orice chart   |
//|  Setari: Tools > Options > Expert Advisors > Allow WebRequest:  |
//|    ${new URL(webhookUrl).origin}                                  |
//+------------------------------------------------------------------+
#property copyright "TradeGx"
#property version   "1.32"

//--- Configurare (nu modifica)
input string WebhookURL = "${webhookUrl}";
input string AuthToken  = "${token}";
input int    SyncEvery   = 15;   // secunde intre verificari
input int    MaxPerCycle = 100;  // cate pozitii noi trimite per ciclu (anti-blocare)

//--- Stare interna: tichetele deja confirmate (anti-duplicat local)
ulong g_sent[];
int   g_sentCount = 0;

//+------------------------------------------------------------------+
int OnInit()
{
   EventSetTimer(SyncEvery);
   ArrayResize(g_sent, 0);
   g_sentCount = 0;
   Print("[TradeGx] EA pornit. Trimite catre: ", WebhookURL);
   Print("[TradeGx] Token: ", StringSubstr(AuthToken, 0, 6), "... (", StringLen(AuthToken), " caractere)");
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason) { EventKillTimer(); }

//+------------------------------------------------------------------+
//| Anti-duplicat local: tine minte tichetele deja trimise cu succes |
//+------------------------------------------------------------------+
bool AlreadySent(ulong ticket)
{
   for(int k = g_sentCount - 1; k >= 0; k--)
      if(g_sent[k] == ticket) return true;
   return false;
}

void MarkSent(ulong ticket)
{
   ArrayResize(g_sent, g_sentCount + 1);
   g_sent[g_sentCount] = ticket;
   g_sentCount++;
}

//+------------------------------------------------------------------+
void OnTimer()
{
   // Rescaneaza TOT istoricul la fiecare ciclu si trimite orice pozitie inchisa
   // care nu a fost inca confirmata. Serverul ignora duplicatele (upsert dupa
   // brokerTradeId), deci nu se pierde si nu se dubleaza absolut nimic.
   HistorySelect(0, TimeCurrent());
   int total = (int)HistoryDealsTotal();
   int synced = 0, failed = 0;

   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;

      ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(entry != DEAL_ENTRY_OUT) continue;  // doar inchideri de pozitie
      if(AlreadySent(ticket)) continue;      // deja trimisa in sesiunea asta

      if(SendDeal(ticket)) { MarkSent(ticket); synced++; }
      else                 { failed++; }

      if(synced >= MaxPerCycle) break;        // restul la urmatorul ciclu
   }

   if(synced > 0)
      Print("[TradeGx] Sincronizate: ", synced, " pozitii.");
   if(failed > 0)
      Print("[TradeGx] ", failed, " esuate, reincerc la ciclul urmator.");
}

//+------------------------------------------------------------------+
bool SendDeal(ulong ticket)
{
   long     posId      = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
   string   symbol     = HistoryDealGetString(ticket,  DEAL_SYMBOL);
   double   closePrice = HistoryDealGetDouble(ticket,  DEAL_PRICE);
   double   volume     = HistoryDealGetDouble(ticket,  DEAL_VOLUME);
   double   profit     = HistoryDealGetDouble(ticket,  DEAL_PROFIT);
   double   commission = HistoryDealGetDouble(ticket,  DEAL_COMMISSION);
   double   swap       = HistoryDealGetDouble(ticket,  DEAL_SWAP);
   long     dealType   = HistoryDealGetInteger(ticket, DEAL_TYPE);
   datetime closeTime  = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);

   // Gaseste tranzactia de intrare (DEAL_ENTRY_IN) pentru aceeasi pozitie
   double   openPrice = closePrice;
   datetime openTime  = closeTime;
   double   sl = 0, tp = 0;

   HistorySelect(0, TimeCurrent());
   for(int j = 0; j < (int)HistoryDealsTotal(); j++)
   {
      ulong t2 = HistoryDealGetTicket(j);
      if(HistoryDealGetInteger(t2, DEAL_POSITION_ID) == posId &&
         (ENUM_DEAL_ENTRY)HistoryDealGetInteger(t2, DEAL_ENTRY) == DEAL_ENTRY_IN)
      {
         openPrice = HistoryDealGetDouble(t2, DEAL_PRICE);
         openTime  = (datetime)HistoryDealGetInteger(t2, DEAL_TIME);
         break;
      }
   }

   // Incearca sa ia SL/TP din ordinul corespunzator
   HistoryOrderSelect(posId);
   sl = HistoryOrderGetDouble(posId, ORDER_SL);
   tp = HistoryOrderGetDouble(posId, ORDER_TP);

   // JSON construit cu IntegerToString/DoubleToString (separator zecimal '.',
   // fara %I64d) ca sa fie mereu JSON valid.
   string body = "{"
      + "\\"ticket\\":"       + IntegerToString((long)ticket)
      + ",\\"positionId\\":"  + IntegerToString(posId)
      + ",\\"symbol\\":\\""   + symbol + "\\""
      + ",\\"type\\":\\""     + (dealType == DEAL_TYPE_BUY ? "buy" : "sell") + "\\""
      + ",\\"lots\\":"        + DoubleToString(volume, 2)
      + ",\\"openPrice\\":"   + DoubleToString(openPrice, 5)
      + ",\\"closePrice\\":"  + DoubleToString(closePrice, 5)
      + ",\\"openTime\\":"    + IntegerToString((long)openTime)
      + ",\\"closeTime\\":"   + IntegerToString((long)closeTime)
      + ",\\"profit\\":"      + DoubleToString(profit, 2)
      + ",\\"commission\\":"  + DoubleToString(commission, 2)
      + ",\\"swap\\":"        + DoubleToString(swap, 2)
      + ",\\"sl\\":"          + DoubleToString(sl, 5)
      + ",\\"tp\\":"          + DoubleToString(tp, 5)
      + ",\\"balance\\":"     + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2)
      + ",\\"login\\":\\""    + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\\""
      + ",\\"tradeMode\\":"   + IntegerToString((int)AccountInfoInteger(ACCOUNT_TRADE_MODE))
      + ",\\"server\\":\\""   + AccountInfoString(ACCOUNT_SERVER) + "\\""
      + ",\\"company\\":\\"" + AccountInfoString(ACCOUNT_COMPANY) + "\\""
      + ",\\"platform\\":\\"mt5\\""
      + "}";

   uchar post[], res[];
   string resHeaders;
   string headers = "Content-Type: application/json\\r\\n"
                  + "X-Apex-Token: " + AuthToken + "\\r\\n";
   // count = StringLen(body) => fara byte-ul NULL final, altfel serverul
   // primeste un caracter invalid si raspunde 400 "Invalid JSON".
   StringToCharArray(body, post, 0, StringLen(body));

   int code = WebRequest("POST", WebhookURL, headers, 5000, post, res, resHeaders);

   if(code < 0)
   {
      Print("[TradeGx] Eroare WebRequest: ", GetLastError(),
            ". Verifica: Tools > Options > Expert Advisors > Allow WebRequest");
      return false;
   }

   string response = CharArrayToString(res);

   if(code != 200 && code != 201)
   {
      Print("[TradeGx] Server a raspuns cu codul: ", code, " | ", StringSubstr(response, 0, 200));
      return false;
   }

   // Confirmare reala: webhook-ul nostru include mereu accountId in raspuns.
   // Daca lipseste => alt raspuns (ex: redirect la pagina de login) = fals succes.
   if(StringFind(response, "accountId") < 0)
   {
      Print("[TradeGx] ATENTIE: cod ", code, " dar raspuns necunoscut. URL gresit sau redirect? Raspuns: ", StringSubstr(response, 0, 200));
      return false;
   }

   return true;
}
`;
}
