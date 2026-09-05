// ── Erorile serverului, în limba clientului ──────────────────────────────────
//
// PROBLEMA. Rutele API răspund cu `{ error: "Cont negăsit" }`, iar clientul
// afișează textul ca atare în toast. Mesajele astea nu trec prin
// `useTranslations`, deci poarta de i18n nu le-a văzut niciodată — un utilizator
// pe engleză primea română pe exact drumurile care contează: înregistrare,
// resetare parolă, conectare broker, import, plată.
//
// DE CE SE TRADUCE LA AFIȘARE, NU LA PRODUCERE. Mesajele sunt produse în ~310
// locuri din 101 rute, dar afișate în ~30. Traducerea la afișare atinge de zece
// ori mai puține locuri și, mai important, nu umblă deloc în logica de plăți sau
// autentificare — unde o greșeală mecanică ar costa mult mai mult decât câștigă.
//
// CUM NU POATE SĂ SE DEZLIPEASCĂ. Un dicționar copiat de mână s-ar învechi la
// primul mesaj nou. `scripts/i18n-scan.mjs` extrage acum literalele de eroare din
// rute și pică build-ul dacă vreunul lipsește de aici. Deci nu se poate adăuga
// un mesaj de eroare fără traducerea lui.

export const API_ERROR_EN: Record<string, string> = {
  // Autentificare și cont
  "Neautorizat": "Not authorized",
  "Negăsit": "Not found",
  "Negăsit sau neautorizat": "Not found or not authorized",
  "Credențiale invalide": "Invalid credentials",
  "Email sau parolă invalide": "Invalid email or password",
  "Email invalid": "Invalid email",
  "Email obligatoriu": "Email is required",
  "Un cont cu acest email există deja": "An account with this email already exists",
  "Cont inexistent": "Account doesn't exist",
  "Cont negăsit": "Account not found",
  "Codul este invalid sau expirat": "The code is invalid or expired",
  "Cod lipsă": "Missing code",
  "Cod 2FA invalid": "Invalid 2FA code",
  "Cod 2FA necesar": "2FA code required",
  "Token invalid": "Invalid token",
  "Token lipsă": "Missing token",
  "Refresh token invalid sau expirat": "Refresh token invalid or expired",
  "Linkul a expirat sau este invalid": "The link has expired or is invalid",
  "Parola a fost resetată cu succes.": "Your password has been reset.",
  "Dacă adresa există, vei primi un email cu instrucțiuni.":
    "If the address exists, you'll receive an email with instructions.",
  "Dacă adresa există și nu e verificată, am trimis un email nou.":
    "If the address exists and isn't verified, we've sent a new email.",
  "Prea multe încercări. Încearcă din nou mai târziu.": "Too many attempts. Try again later.",

  // Cereri invalide
  "Cerere invalidă": "Invalid request",
  "Corp de cerere invalid": "Invalid request body",
  "Body invalid": "Invalid body",
  "JSON invalid": "Invalid JSON",
  "Invalid JSON": "Invalid JSON",
  "FormData invalid": "Invalid form data",
  "Date invalide": "Invalid data",
  "Date insuficiente": "Not enough data",
  "Conținut invalid": "Invalid content",
  "Emoji invalid": "Invalid emoji",
  "Serviciu invalid": "Invalid service",
  "Endpoint lipsă": "Missing endpoint",
  "Simbol lipsă": "Missing symbol",
  "Specifică cel puțin un simbol": "Specify at least one symbol",
  "Prea multe cereri. Încearcă din nou mai târziu.": "Too many requests. Try again later.",
  "Eroare internă.": "Internal error.",
  "Eroare internă. Încearcă din nou.": "Internal error. Please try again.",

  // Plan și plată
  "Funcție disponibilă doar în planul PRO": "This feature is only available on the PRO plan",
  "Planul FREE include un singur cont de trading. Treci la PRO pentru conturi nelimitate.":
    "The FREE plan includes a single trading account. Upgrade to PRO for unlimited accounts.",
  "Plățile nu sunt configurate momentan. Revino în curând.":
    "Payments aren't set up right now. Please check back soon.",
  "Prețul nu este configurat pe server.": "That price isn't configured on the server.",
  "Abonament invalid": "Invalid subscription",
  "Webhook signature invalid": "Invalid webhook signature",

  // Conturi de trading, brokeri, burse
  "Cont de trading negăsit": "Trading account not found",
  "Cont de trading inexistent": "Trading account doesn't exist",
  "Cheia API și secretul sunt obligatorii": "API key and secret are required",
  "Bursă nesuportată": "Unsupported exchange",
  "Eroare la bursă": "Exchange error",
  "Eroare la TradeLocker": "TradeLocker error",
  "MetaAPI nu este conectat": "MetaAPI isn't connected",
  "Eroare la sincronizare. Verifică ID-ul contului MetaAPI.":
    "Sync failed. Check the MetaAPI account ID.",
  "Nu s-au putut încărca conturile MetaAPI. Verifică token-ul.":
    "Couldn't load your MetaAPI accounts. Check the token.",
  "Token MetaAPI invalid. Verifică cheia din dashboard.metaapi.cloud → API tokens.":
    "Invalid MetaAPI token. Check your key at dashboard.metaapi.cloud → API tokens.",
  "Sincronizarea MT4/MT5 nu este configurată pe server. Contactează suportul.":
    "MT4/MT5 sync isn't set up on the server. Please contact support.",
  "Login, parolă, server și platformă sunt obligatorii":
    "Login, password, server and platform are required",
  "Email, parolă și server sunt obligatorii": "Email, password and server are required",
  "Autentificare reușită, dar nu am găsit conturi.":
    "Signed in successfully, but no accounts were found.",
  "metaApiAccountId și tradingAccountId sunt obligatorii":
    "metaApiAccountId and tradingAccountId are required",
  "accountId lipsă (folosește null pentru toate conturile)":
    "Missing accountId (use null for all accounts)",
  "accountId și conținut fișier sunt obligatorii": "accountId and file content are required",

  // Import de fișiere
  "Niciun fișier": "No file",
  "Niciun fișier primit": "No file received",
  "Fișierul este gol": "The file is empty",
  "Fișier prea mare. Maximum 8 MB.": "File too large. Maximum 8 MB.",
  "Tip nesuportat. Folosește JPG, PNG, GIF sau WebP.":
    "Unsupported type. Use JPG, PNG, GIF or WebP.",
  "Fișierul HTML nu conține un tabel de tranzacții valid. Asigură-te că dai Save as Report din MetaTrader.":
    "The HTML file doesn't contain a valid trade table. Make sure you use Save as Report in MetaTrader.",
  "Nu am găsit nicio tranzacție în fișier. Asigură-te că exportul conține istoricul complet al contului.":
    "No trades found in the file. Make sure the export contains the account's full history.",
  "Nicio tranzacție găsită în perioada selectată.": "No trades found in the selected period.",

  // Tranzacții și strategii
  "Trade negăsit": "Trade not found",
  "Tranzacție negăsită": "Trade not found",
  "Strategie negăsită": "Strategy not found",
  "Item negăsit": "Item not found",
  "Simbolul există deja în watchlist": "That symbol is already in your watchlist",

  // Date de piață
  "Preț indisponibil pentru acest simbol.": "Price unavailable for this symbol.",
  "Nu am putut obține date de preț pentru acest simbol.":
    "Couldn't get price data for this symbol.",
  "Date insuficiente pentru acest simbol.": "Not enough data for this symbol.",
  "Date de piață indisponibile. Configurați o cheie TwelveData sau verificați conexiunea.":
    "Market data unavailable. Add a TwelveData key or check your connection.",
  "API key TwelveData invalid. Verifică cheia din twelvedata.com/account.":
    "Invalid TwelveData API key. Check your key at twelvedata.com/account.",

  // AI
  "Ai atins limita de analize AI. Încearcă din nou mai târziu.":
    "You've reached the AI analysis limit. Try again later.",
  "Ai atins limita de 30 mesaje/oră. Revino mai târziu.":
    "You've reached the limit of 30 messages per hour. Come back later.",
  "Prea multe analize. Reîncearcă peste puțin timp.": "Too many analyses. Try again shortly.",

  // Comunitate
  "Comunitate negăsită": "Community not found",
  "Cod de invitație invalid": "Invalid invite code",
  "Ești deja membru": "You're already a member",
  "Ești deja în această comunitate": "You're already in this community",
  "Nu ești membru": "You're not a member",
  "Owner-ul nu poate părăsi comunitatea. Șterge-o în schimb.":
    "The owner can't leave the community. Delete it instead.",
  "Post negăsit": "Post not found",
  "Postare negăsită": "Post not found",

  // Integrări
  "Notificările Telegram nu sunt configurate pe server. Contactează suportul.":
    "Telegram notifications aren't set up on the server. Please contact support.",
  "Chat ID invalid. Trebuie să fie un număr (obține-l de la @userinfobot pe Telegram).":
    "Invalid Chat ID. It must be a number — get it from @userinfobot on Telegram.",
  "Nu am putut trimite mesajul de test. Verifică Chat ID-ul și asigură-te că ai apăsat Start în conversația cu botul.":
    "Couldn't send the test message. Check the Chat ID and make sure you pressed Start in the chat with the bot.",
  "Cloudinary necesită Cloud Name, API Key și API Secret":
    "Cloudinary requires a Cloud Name, API Key and API Secret",
  "Serviciul de email nu este disponibil momentan.":
    "The email service is unavailable right now.",
};

/**
 * Traduce un mesaj de eroare venit de la server.
 *
 * Necunoscut → întors neatins. Un mesaj în română e mai bun decât unul lipsă,
 * iar poarta de build acoperă cazul în care ar fi trebuit tradus.
 */
export function translateApiError(text: unknown, locale: string): string | undefined {
  if (typeof text !== "string" || text.length === 0) return undefined;
  if (locale !== "en") return text;
  return API_ERROR_EN[text] ?? text;
}

/**
 * Varianta pentru client: își află singură limba, din același cookie pe care îl
 * citește `i18n/request.ts`.
 *
 * Fără hook intenționat. Toate afișările sunt în handlere de eveniment (click,
 * submit), deci rulează doar în browser — iar o funcție pură se poate aplica în
 * treizeci de locuri fără să atingă corpul fiecărei componente, ceea ce la o
 * editare mecanică pe un site cu clienți plătitori contează mai mult decât
 * eleganța unui hook.
 */
export function tApiError(text: unknown): string | undefined {
  const locale =
    typeof document !== "undefined" && /(?:^|;\s*)locale=en\b/.test(document.cookie)
      ? "en"
      : "ro";
  return translateApiError(text, locale);
}
