"use client";

import * as React from "react";
import { ascultaEroriGlobale } from "@/lib/report-client-error";

/**
 * Ascultătorul global de erori de browser.
 *
 * Se montează o singură dată, în layout-ul rădăcină, ca să acopere și paginile
 * publice — landing, înregistrare, autentificare. Acolo o eroare costă un client
 * care încă n-a devenit client, deci exact acolo contează cel mai mult.
 *
 * Nu randează nimic.
 */
export function ClientErrorReporter() {
  React.useEffect(() => ascultaEroriGlobale(), []);
  return null;
}
