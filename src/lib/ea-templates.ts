/**
 * Generates MT4 (MQL4) and MT5 (MQL5) Expert Advisor source code
 * that automatically syncs closed trades to Apex Trader via webhook.
 *
 * The EA:
 *  - Runs a timer every 15 seconds
 *  - Detects newly closed trades/deals in account history
 *  - POSTs each trade as JSON to /api/webhooks/mt/[accountId]
 *  - Requires only WebRequest enabled in MT4/MT5 settings
 */

export function generateMQ4(webhookUrl: string, token: string): string {
  return `//+------------------------------------------------------------------+
//|  Apex Trader — Auto Sync EA                                      |
//|  Instalare: copiaza in MT4/Experts si ataseaza la orice chart   |
//|  Setari: Tools > Options > Expert Advisors > Allow WebRequest:  |
//|    ${new URL(webhookUrl).origin}                                  |
//+------------------------------------------------------------------+
#property copyright "Apex Trader"
#property version   "1.10"
#property strict

//--- Configurare (nu modifica)
string WebhookURL = "${webhookUrl}";
string AuthToken  = "${token}";
int    SyncEvery  = 15;  // secunde intre verificari

//--- Stare interna
datetime g_lastSync  = 0;
int      g_lastCount = -1;

//+------------------------------------------------------------------+
int OnInit()
{
   EventSetTimer(SyncEvery);
   Print("[ApexTrader] EA pornit. Sincronizare la fiecare ", SyncEvery, "s.");
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("[ApexTrader] EA oprit.");
}

//+------------------------------------------------------------------+
void OnTimer()
{
   int total = OrdersHistoryTotal();
   if(total == g_lastCount) return;

   int synced = 0;
   for(int i = total - 1; i >= 0; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) continue;
      if(OrderType() > 1) continue;                    // skip pending
      if(OrderCloseTime() <= g_lastSync) continue;     // already sent

      if(SendTrade())
         synced++;
   }

   if(synced > 0)
      Print("[ApexTrader] Sincronizate: ", synced, " tranzactii.");

   g_lastCount = total;
   g_lastSync  = TimeCurrent();
}

//+------------------------------------------------------------------+
bool SendTrade()
{
   string body = StringFormat(
      "{\\"ticket\\":%d,\\"symbol\\":\\"%s\\",\\"type\\":\\"%s\\"," +
      "\\"lots\\":%.2f,\\"openPrice\\":%.5f,\\"closePrice\\":%.5f," +
      "\\"openTime\\":%d,\\"closeTime\\":%d," +
      "\\"profit\\":%.2f,\\"commission\\":%.2f,\\"swap\\":%.2f," +
      "\\"sl\\":%.5f,\\"tp\\":%.5f,\\"balance\\":%.2f}",
      OrderTicket(),
      OrderSymbol(),
      OrderType() == OP_BUY ? "buy" : "sell",
      OrderLots(),
      OrderOpenPrice(),
      OrderClosePrice(),
      (int)OrderOpenTime(),
      (int)OrderCloseTime(),
      OrderProfit(),
      OrderCommission(),
      OrderSwap(),
      OrderStopLoss(),
      OrderTakeProfit(),
      AccountBalance()
   );

   char  post[], res[];
   string resHeaders;
   string headers = "Content-Type: application/json\\r\\n"
                  + "X-Apex-Token: " + AuthToken + "\\r\\n";

   StringToCharArray(body, post, 0, StringLen(body));

   int code = WebRequest("POST", WebhookURL, headers, 5000, post, res, resHeaders);

   if(code < 0)
   {
      Print("[ApexTrader] Eroare WebRequest: ", GetLastError(),
            ". Verifica: Tools > Options > Expert Advisors > Allow WebRequest");
      return false;
   }
   if(code != 200 && code != 201)
   {
      Print("[ApexTrader] Server a raspuns cu codul: ", code);
      return false;
   }

   return true;
}
`;
}

export function generateMQ5(webhookUrl: string, token: string): string {
  return `//+------------------------------------------------------------------+
//|  Apex Trader — Auto Sync EA (MT5)                                |
//|  Instalare: copiaza in MT5/Experts si ataseaza la orice chart   |
//|  Setari: Tools > Options > Expert Advisors > Allow WebRequest:  |
//|    ${new URL(webhookUrl).origin}                                  |
//+------------------------------------------------------------------+
#property copyright "Apex Trader"
#property version   "1.10"

//--- Configurare (nu modifica)
input string WebhookURL = "${webhookUrl}";
input string AuthToken  = "${token}";
input int    SyncEvery  = 15;  // secunde

//--- Stare interna
int      g_lastCount = -1;
datetime g_lastSync  = 0;

//+------------------------------------------------------------------+
int OnInit()
{
   EventSetTimer(SyncEvery);
   Print("[ApexTrader] EA pornit. Sincronizare la fiecare ", SyncEvery, "s.");
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason) { EventKillTimer(); }

//+------------------------------------------------------------------+
void OnTimer()
{
   HistorySelect(0, TimeCurrent());
   int total = (int)HistoryDealsTotal();
   if(total == g_lastCount) return;

   int synced = 0;
   for(int i = total - 1; i >= 0; i--)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;

      ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(entry != DEAL_ENTRY_OUT) continue;  // doar tranzactii inchise

      datetime closeTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
      if(closeTime <= g_lastSync) continue;

      if(SendDeal(ticket)) synced++;
   }

   if(synced > 0)
      Print("[ApexTrader] Sincronizate: ", synced, " pozitii.");

   g_lastCount = total;
   g_lastSync  = TimeCurrent();
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

   string body = StringFormat(
      "{\\"ticket\\":%I64d,\\"positionId\\":%I64d,\\"symbol\\":\\"%s\\"," +
      "\\"type\\":\\"%s\\",\\"lots\\":%.2f," +
      "\\"openPrice\\":%.5f,\\"closePrice\\":%.5f," +
      "\\"openTime\\":%I64d,\\"closeTime\\":%I64d," +
      "\\"profit\\":%.2f,\\"commission\\":%.2f,\\"swap\\":%.2f," +
      "\\"sl\\":%.5f,\\"tp\\":%.5f,\\"balance\\":%.2f}",
      (long)ticket, posId, symbol,
      dealType == DEAL_TYPE_BUY ? "buy" : "sell",
      volume, openPrice, closePrice,
      (long)openTime, (long)closeTime,
      profit, commission, swap,
      sl, tp,
      AccountInfoDouble(ACCOUNT_BALANCE)
   );

   uchar post[], res[];
   string resHeaders;
   string headers = "Content-Type: application/json\\r\\n"
                  + "X-Apex-Token: " + AuthToken + "\\r\\n";
   StringToCharArray(body, post);

   int code = WebRequest("POST", WebhookURL, headers, 5000, post, res, resHeaders);

   if(code < 0)
   {
      Print("[ApexTrader] Eroare WebRequest: ", GetLastError(),
            ". Verifica: Tools > Options > Expert Advisors > Allow WebRequest");
      return false;
   }

   return code == 200 || code == 201;
}
`;
}
