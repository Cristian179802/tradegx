#!/usr/bin/env bash
#
# ── O filmare completă, dintr-o singură comandă ──────────────────────────────
#
# Ordinea și motivele:
#
#  1. Rolul contului demo se ridică la USER. Middleware-ul refuză orice cerere
#     care nu e GET pe /api/ cât rolul e DEMO, iar beat-ul Sync trebuie să
#     închidă o tranzacție prin fluxul real al aplicației.
#  2. Seed-ul repopulează contul. Filmarea CONSUMĂ tranzacția deschisă — o
#     închide — deci fiecare rulare pornește de la date proaspete.
#  3. Se filmează.
#  4. Rolul se pune la loc. ÎNTOTDEAUNA.
#
# Punctul 4 e motivul pentru care scriptul ăsta există în locul a patru comenzi
# scrise de mână: `trap … EXIT` prinde și ieșirea normală, și eroarea, și Ctrl+C.
# O restaurare pe care ți-o amintești tu e o restaurare care într-o zi nu se
# face. Iar dacă flip-ul se face manual, captura nu mai e reproductibilă dintr-o
# singură comandă și faza 8 nu mai are ce automatiza.
#
# Baza e cea LOCALĂ de filmare, niciodată producția — vezi local-db.sh. Iar
# `rol-demo.ts` refuză să pornească pe orice gazdă care nu e localhost, deci
# poarta nu depinde de disciplina nimănui.

set -uo pipefail

COPIE="${TGX_LOCAL_DIR:-/root/tradegx}"
WEB="${COPIE}/apps/web"
ENV_VIDEO="${TGX_VIDEO_ENV:-/root/tradegx-video.env}"
VIDEO="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$ENV_VIDEO" ]; then
  echo "  Nu există baza de filmare. Rulează întâi: ./local-db.sh" >&2
  exit 1
fi

rol() { # rol arata | rol seteaza <ROL>
  ( cd "$WEB" && env -u DATABASE_URL bash -c \
      "set -a; . '${ENV_VIDEO}'; set +a; npx tsx scripts/rol-demo.ts $*" )
}

ROL_INITIAL="$(rol arata 2>/dev/null | tr -d '[:space:]')"
if [ -z "$ROL_INITIAL" ]; then
  echo "  Nu pot citi rolul contului demo din baza de filmare." >&2
  exit 1
fi
RESTAURAT=0

restaureaza() {
  local cod=$?
  [ "$RESTAURAT" -eq 1 ] && return
  RESTAURAT=1
  echo
  echo "── restaurez rolul ─────────────────────────────────"
  if rol seteaza "$ROL_INITIAL" >/dev/null 2>&1; then
    echo "  rol pus la loc: ${ROL_INITIAL}"
  else
    # Dacă nici asta nu merge, tăcerea ar fi cea mai proastă variantă posibilă.
    echo "  ATENȚIE: nu am putut restaura rolul la ${ROL_INITIAL}." >&2
    echo "  Rulează manual, din ${WEB}:" >&2
    echo "    set -a; . ${ENV_VIDEO}; set +a; npx tsx scripts/rol-demo.ts seteaza ${ROL_INITIAL}" >&2
  fi
  exit "$cod"
}
trap restaureaza EXIT INT TERM HUP

echo "── rolul contului demo ─────────────────────────────"
echo "  acum: ${ROL_INITIAL}"
rol seteaza USER || { echo "  nu am putut ridica rolul" >&2; exit 1; }

echo
echo "── seed ────────────────────────────────────────────"
( cd "$WEB" && env -u DATABASE_URL bash -c \
    "set -a; . '${ENV_VIDEO}'; set +a; npx tsx scripts/seed-demo-account.ts" ) || exit 1

echo
echo "── captură ─────────────────────────────────────────"
( cd "$VIDEO" && APP_URL="${APP_URL:-http://localhost:3000}" ./entrypoint.sh tsx director.ts "$@" )
