/**
 * Contul își ia soldul direct de la bursă?
 *
 * Contează pentru că restul aplicației deduce soldul din `initialBalance` plus
 * P&L-ul realizat — o formulă corectă pentru importurile CSV, dar care pe un cont
 * de bursă rescrie adevărul cu o aproximare. Motivul: pozițiile DESCHISE au
 * `pnlMoney` null (intenționat, ca să nu intre în statistica tranzacțiilor
 * încheiate), deci formula ratează exact partea nerealizată. Un cont cu poziții
 * deschise n-are cum să iasă din ea.
 *
 * Pe scurt: aici bursa e sursa de adevăr, nu jurnalul.
 */
export function isExchangeSourced(brokerSource: string | null | undefined): boolean {
  return brokerSource === "BINANCE" || brokerSource === "BYBIT";
}
