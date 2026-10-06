// ── Limba în care îi scriem unui utilizator când NU e o cerere ───────────────
//
// Notificările push, mesajele Telegram, emailurile din cron nu au un cookie de
// limbă din care să citim: pleacă de pe server, către mulți oameni deodată.
// Singura sursă e preferința salvată în cont (`User.language`), pe care o
// scriu atât site-ul, cât și comutatorul din aplicație.
//
// Româna rămâne română; orice altă limbă (EN, ES, DE…) primește engleza.
// Produsul are doar RO și EN, iar pentru un vorbitor de germană engleza e mult
// mai aproape decât româna.

export type Limba = "ro" | "en";

export function limbaUtilizatorului(language: string | null | undefined): Limba {
  return !language || language === "RO" ? "ro" : "en";
}
