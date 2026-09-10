#!/usr/bin/env bash
#
# ── Pregătirea studioului în WSL2 (Ubuntu) ───────────────────────────────────
#
# Aceleași unelte ca în container, dar instalate direct în Ubuntu. Fără Docker.
#
# DE CE NU DOCKER AICI: fazele 4-6 sunt iterație pe ritm — schimbi un `hold` în
# timeline, rulezi, te uiți, schimbi iar. Cu Docker, fiecare tur ar cere un
# `docker build`. Nativ, e o comandă și câteva secunde. Dockerfile-ul rămâne
# pentru CI, unde reproductibilitatea contează mai mult decât viteza.
#
# Se poate rula de câte ori vrei: verifică înainte să instaleze.

set -euo pipefail

cd "$(dirname "$0")"

info()  { printf '  %s\n' "$*"; }
titlu() { printf '\n── %s %s\n' "$*" "$(printf '─%.0s' $(seq 1 $((46 - ${#1}))))"; }

if ! grep -qi microsoft /proc/version 2>/dev/null; then
  echo "Scriptul e pentru WSL2. Pe alt Linux merge la fel, dar verifică pachetele." >&2
fi

# ── 1. Pachete de sistem ────────────────────────────────────────────────────
titlu "pachete de sistem"

# NU instalăm Inter și Space Grotesk: aplicația folosește `next/font/google`,
# care le descarcă la build și le servește de pe propriul domeniu. Browserul le
# ia de la aplicație. Aici ne trebuie doar fonturile de REZERVĂ și cele cu
# SIMBOLURI — fără ele „×", „·", „→" și diacriticele ies dreptunghiuri.
PACHETE=(
  xvfb x11-utils          # ecranul virtual și xdpyinfo, ca să știm când e gata
  ffmpeg                  # captura
  fontconfig
  fonts-liberation fonts-dejavu-core fonts-noto-core fonts-noto-color-emoji
)

LIPSA=()
for p in "${PACHETE[@]}"; do
  dpkg -s "$p" >/dev/null 2>&1 || LIPSA+=("$p")
done

if [ ${#LIPSA[@]} -eq 0 ]; then
  info "toate prezente"
else
  info "instalez: ${LIPSA[*]}"
  sudo apt-get update -qq
  sudo apt-get install -y -qq --no-install-recommends "${LIPSA[@]}"
  sudo fc-cache -f >/dev/null
fi

# ── 2. Node.js ──────────────────────────────────────────────────────────────
titlu "node"

if command -v node >/dev/null 2>&1 && [ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -ge 20 ]; then
  info "$(node -v) — ok"
else
  info "instalez Node.js 22 (nodesource)"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - >/dev/null
  sudo apt-get install -y -qq nodejs
  info "$(node -v)"
fi

# ── 3. Dependințele proiectului ─────────────────────────────────────────────
titlu "dependințe npm"

if [ -d node_modules/playwright ]; then
  info "deja instalate"
else
  npm install --no-audit --no-fund
fi

# ── 4. Chromium pentru Playwright ───────────────────────────────────────────
titlu "chromium"

# `--with-deps` aduce bibliotecile de sistem de care are nevoie Chromium.
# Instalate manual, lipsește mereu una și afli printr-un „Failed to launch
# browser" care nu spune care.
npx playwright install --with-deps chromium

# ── 5. Verificare ───────────────────────────────────────────────────────────
titlu "verificare"

ok=0
verifica() {
  if eval "$2" >/dev/null 2>&1; then
    info "✓ $1"
  else
    info "✗ $1"
    ok=1
  fi
}

verifica "Xvfb"        "command -v Xvfb"
verifica "ffmpeg"      "command -v ffmpeg"
verifica "xdpyinfo"    "command -v xdpyinfo"
verifica "node ≥ 20"   "[ \"\$(node -v | sed 's/v\([0-9]*\).*/\1/')\" -ge 20 ]"
verifica "playwright"  "[ -d node_modules/playwright ]"

# Fonturile: numărul contează mai puțin decât prezența unuia cu simboluri.
NR_FONTURI=$(fc-list 2>/dev/null | wc -l)
verifica "fonturi ($NR_FONTURI)" "[ $NR_FONTURI -gt 10 ]"

# Proba adevărată: chiar pornește Chromium pe un ecran virtual?
titlu "probă: chromium pe ecran virtual"
Xvfb :98 -screen 0 1280x720x24 -nolisten tcp -ac >/dev/null 2>&1 &
PROBA=$!
sleep 1
if DISPLAY=:98 npx playwright screenshot --browser chromium \
     "data:text/html,<h1 style='font-family:sans-serif'>Setup × Sesiune · 61% →</h1>" \
     out/proba-fonturi.png >/dev/null 2>&1; then
  info "✓ a pornit — vezi out/proba-fonturi.png"
  info "  dacă în imagine sunt dreptunghiuri în loc de × · →, lipsesc fonturi"
else
  info "✗ Chromium n-a pornit pe :98"
  ok=1
fi
kill $PROBA 2>/dev/null || true

printf '\n'
if [ $ok -eq 0 ]; then
  info "gata. rulează:  ./entrypoint.sh npm run capture"
else
  info "au rămas lucruri nerezolvate — vezi ✗ de mai sus" >&2
  exit 1
fi
