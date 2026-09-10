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

# Rulat ca root (cazul obisnuit in WSL proaspat instalat), sudo nu e nici
# necesar, nici garantat prezent. Rulat ca utilizator normal, e obligatoriu.
if [ "$(id -u)" -eq 0 ]; then
  SUDO=""
elif command -v sudo >/dev/null 2>&1; then
  SUDO="sudo"
else
  echo "Rulezi ca utilizator normal și nu există sudo. Rulează ca root:" >&2
  echo '  wsl -d Ubuntu -u root -- bash -lc "cd <cale> && ./setup-wsl.sh"' >&2
  exit 1
fi

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
  $SUDO apt-get update -qq
  $SUDO apt-get install -y -qq --no-install-recommends "${LIPSA[@]}"
  $SUDO fc-cache -f >/dev/null
fi

# ── 2. Node.js ──────────────────────────────────────────────────────────────
titlu "node"

if command -v node >/dev/null 2>&1 && [ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -ge 20 ]; then
  info "$(node -v) — ok"
else
  info "instalez Node.js 22 (nodesource)"
  # Descărcat într-un fișier, apoi rulat — nu prin conductă spre `$SUDO -E`.
  # Ca root, `$SUDO` e gol, iar `| -E bash -` face shell-ul să caute o comandă
  # numită „-E". Cu fișier, aceeași linie merge și ca root, și cu sudo.
  curl -fsSL https://deb.nodesource.com/setup_22.x -o /tmp/nodesource.sh
  $SUDO bash /tmp/nodesource.sh >/dev/null
  rm -f /tmp/nodesource.sh
  $SUDO apt-get install -y -qq nodejs
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

# `--with-deps` e calea preferată: Playwright știe exact ce biblioteci îi
# trebuie lui Chromium pe fiecare distribuție. Dar lista aia e scrisă pe
# versiuni CUNOSCUTE, iar pe una mai nouă decât Playwright răspunde
# „Playwright does not support chromium on ubuntu26.04-x64" și se oprește —
# deși browserul în sine ar merge perfect.
#
# Deci: încercăm cu deps, iar dacă distribuția e prea nouă, luăm browserul
# separat și punem bibliotecile de mână. Lista e cea din documentația
# Playwright pentru Chromium; ce lipsește din depozite se sare, fiindcă
# numele se schimbă între versiuni de Ubuntu (`libasound2` → `libasound2t64`).
if npx playwright install --with-deps chromium 2>&1 | tee /tmp/pw.log; then
  info "instalat cu dependințe"
else
  info "distribuția e prea nouă pentru lista Playwright — pun bibliotecile de mână"

  DEPS=(
    libnss3 libnspr4 libdbus-1-3 libatk1.0-0t64 libatk1.0-0
    libatk-bridge2.0-0t64 libatk-bridge2.0-0 libatspi2.0-0t64 libatspi2.0-0
    libcups2t64 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1
    libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2
    libasound2t64 libasound2
  )

  # Instalate UNUL CÂTE UNUL, cu eșecul ignorat.
  #
  # Am încercat întâi să filtrez lista dinainte — cu `apt-cache show`, apoi cu
  # `apt-cache policy`. Prima a lăsat să treacă pachete tranziționale fără
  # candidat („libasound2 has no installation candidate"), a doua a filtrat tot
  # dintr-un motiv pe care nu l-am putut reproduce izolat: aceeași comandă,
  # rulată de mână, întorcea rezultatul corect.
  #
  # Deci nu mai încerc să prezic ce se poate instala. Cer fiecare pachet și
  # număr ce a reușit. Numele diferă între versiuni de Ubuntu
  # (`libasound2` → `libasound2t64`), deci lista conține ambele variante și e
  # NORMAL ca vreo șase să eșueze.
  REUSITE=0
  for p in "${DEPS[@]}"; do
    if $SUDO apt-get install -y -qq --no-install-recommends "$p" >/dev/null 2>&1; then
      REUSITE=$((REUSITE + 1))
    fi
  done
  info "instalate $REUSITE din ${#DEPS[@]} (restul n-au variantă pe versiunea asta)"

  # Browserul, fără dependințe — ele tocmai s-au instalat.
  npx playwright install chromium
fi

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
# `;charset=utf-8` NU e decorativ. Fără el, Chromium citește octeții unui URL
# `data:` ca Latin-1, iar „×" apare ca „Ã—" — mojibake, nu fonturi lipsă. Prima
# variantă a probei n-avea charset-ul și arăta exact ca un defect de fonturi,
# adică fix concluzia greșită pe care proba trebuia s-o prevină.
PROBA_HTML="data:text/html;charset=utf-8,<body style='font-family:sans-serif;font-size:34px'>Setup × Sesiune · 61% → ăâîșț</body>"
if DISPLAY=:98 npx playwright screenshot --browser chromium "$PROBA_HTML" \
     out/proba-fonturi.png >/dev/null 2>&1; then
  info "✓ a pornit — vezi out/proba-fonturi.png"
  info "  trebuie să scrie: Setup × Sesiune · 61% → ăâîșț"
  info "  dreptunghiuri = lipsesc fonturi;  Ã— sau Â· = problemă de codare"
else
  info "✗ Chromium n-a pornit pe :98"
  ok=1
fi
kill $PROBA 2>/dev/null || true

printf '\n'
if [ $ok -eq 0 ]; then
  # `npm run capture` cheamă el însuși entrypoint-ul, care pornește ecranul.
  info "gata. rulează:  npm run capture"
else
  info "au rămas lucruri nerezolvate — vezi ✗ de mai sus" >&2
  exit 1
fi
