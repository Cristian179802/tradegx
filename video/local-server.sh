#!/usr/bin/env bash
#
# ── Aplicația, local, în WSL ──────────────────────────────────────────────────
#
# Filmăm pe localhost, nu pe deploy. Trei motive, toate practice:
#
#  - Deploy-ul e nedeterminist: latență variabilă, cold start, stări de
#    încărcare care intră în cadru exact când nu trebuie.
#  - „Așteaptă 150 de secunde după push” e o ghicitoare. Dacă build-ul întârzie,
#    filmezi versiunea veche și afli abia la montaj.
#  - Faza 6 are 15+ treceri peste ritm. Cu push + build de fiecare dată, un
#    tweak de 200ms costă patru minute în loc de nouăzeci de secunde.
#
# De ce o COPIE în filesystemul WSL și nu direct din /mnt/c:
#
#   `node_modules` din working tree conține binare Windows — `swc-win32-x64-msvc`
#   și `sharp-win32-x64`. Next pe Linux are nevoie de `swc-linux-x64-gnu`. Un
#   `npm install` făcut din WSL peste același director le-ar înlocui și ar strica
#   lucrul pe Windows.
#
#   Deci: sursa rămâne UNA SINGURĂ, în working tree. Copia primește doar
#   fișierele sursă, iar `verifica` demonstrează prin hash că sunt identice
#   înainte de orice build. Copia are propriul `node_modules`, cu binare Linux.
#
# Baza de date rămâne aceeași (Supabase, din apps/web/.env) — contul demo e deja
# populat, nu se atinge nimic.
#
# Utilizare:
#   ./local-server.sh sync      doar sincronizează sursa
#   ./local-server.sh build     sincronizează, instalează dacă e nevoie, compilează
#   ./local-server.sh start     pornește serverul (în prim-plan)
#   ./local-server.sh verifica   compară sursa și build ID-ul servit
#   ./local-server.sh seed      repopulează contul demo
#   ./local-server.sh stop      oprește serverul

set -euo pipefail

SURSA="$(cd "$(dirname "$0")/.." && pwd)"
COPIE="${TGX_LOCAL_DIR:-/root/tradegx}"
WEB="${COPIE}/apps/web"
PORT="${TGX_PORT:-3000}"

# Ce NU se copiază. `node_modules` și `.next` sunt per-platformă; restul e gunoi
# care ar încetini sincronizarea fără să schimbe nimic în build.
#
# `video/` lipsește deliberat: copia există DOAR ca să compileze și să servească
# aplicația. Regizorul rulează din working tree, cu propriul `node_modules`
# (Playwright e deja instalat acolo pentru Linux). Dacă am copia și `video/`,
# fiecare fișier de lucru scris acolo ar strica amprenta și ar cere o
# resincronizare care nu schimbă nimic în build.
EXCLUDE=(
  --exclude ".git/"
  --exclude "node_modules/"
  --exclude ".next/"
  --exclude ".turbo/"
  --exclude "out/"
  --exclude "coverage/"
  --exclude "playwright-report/"
  --exclude "video/"
)

# ── Amprenta sursei ──────────────────────────────────────────────────────────
#
# Un singur sha256 peste tot ce contează, calculat identic în ambele locuri.
# Dacă cele două se potrivesc, ce se compilează în WSL e exact ce e în working
# tree — nu „probabil”, ci verificat.
amprenta() {
  local radacina="$1"
  ( cd "$radacina" && \
    find . -type f \
      -not -path "./.git/*" \
      -not -path "*/node_modules/*" \
      -not -path "*/.next/*" \
      -not -path "*/.turbo/*" \
      -not -path "./video/*" \
      -not -path "*/coverage/*" \
      -print0 \
    | LC_ALL=C sort -z \
    | xargs -0 sha256sum \
    | sha256sum \
    | cut -c1-16 )
}

cmd_sync() {
  mkdir -p "$COPIE"
  echo "── sincronizez sursa ───────────────────────────────"
  echo "  din  $SURSA"
  echo "  în   $COPIE"
  rsync -a --delete "${EXCLUDE[@]}" "$SURSA/" "$COPIE/"
  echo "  gata"
  scrie_env_baza
}

# Ce bază de date vede copia.
#
# Next citește `.env.local` ÎNAINTEA lui `.env`, iar `.env.local` din working
# tree are `DATABASE_URL=…localhost:5432` — baza de dezvoltare de pe Windows,
# care nu are contul demo. Filmarea trebuie să meargă pe aceeași bază ca
# producția, adică pe cea din `.env`.
#
# Nu atingem `.env.local`: e configurația de lucru a mașinii. În schimb scriem
# în COPIE un `.env.production.local`, care are prioritate peste `.env.local` la
# `next start`, și care conține DOAR `DATABASE_URL`. Restul cheilor — secretul
# de sesiune, NEXTAUTH_URL — rămân de unde erau.
#
# Valoarea se mută dintr-un fișier în altul fără să treacă prin vreun log.
scrie_env_baza() {
  local linie
  # Baza de filmare, NU cea din `.env`.
  #
  # `.env` are DATABASE_URL-ul de producție — Supabase, cu utilizatori reali și
  # clienți plătitori. Am filmat pe el fără să-mi dau seama, și era cât pe ce să
  # ridic acolo rolul contului demo, care are parolă publică.
  #
  # Nu există cădere înapoi pe `.env`. Dacă baza de filmare lipsește, serverul
  # nu pornește. O cădere „doar de data asta” e exact felul în care se ajunge
  # din nou pe producție fără să observe nimeni.
  local env_video="${TGX_VIDEO_ENV:-/root/tradegx-video.env}"
  if [ ! -f "$env_video" ]; then
    echo "  Nu există baza locală de filmare (${env_video})." >&2
    echo "  Rulează:  ./local-db.sh" >&2
    return 1
  fi
  linie="$(grep -E '^DATABASE_URL=' "$env_video" | head -1 || true)"
  if [ -z "$linie" ]; then
    echo "  ${env_video} nu are DATABASE_URL." >&2
    return 1
  fi
  {
    echo "# Generat de video/local-server.sh la fiecare sync. Nu edita."
    echo "$linie"
    # NextAuth v5 refuză gazdele în care nu are încredere. Pe Vercel se
    # activează singur (detectează platforma); la `next start` pe localhost, nu.
    # Fără asta, `/api/auth/csrf` întoarce 500 și login-ul se întoarce la
    # `/login?error=Configuration` — un mesaj care nu spune nimic despre gazdă.
    #
    # E strict o chestiune de servire locală, deci stă aici, în fișierul
    # generat pentru copie, nu în configurația produsului.
    echo "AUTH_TRUST_HOST=true"
  } > "${WEB}/.env.production.local"
  local gazda
  gazda="$(printf '%s' "$linie" | sed -E 's|^DATABASE_URL=||; s|"||g; s|^[a-z]+://[^@]*@||; s|/.*$||; s|\?.*$||')"
  echo "  baza de date pentru copie: ${gazda}"
}

# Amprenta sursei din care s-a compilat, plus build ID-ul rezultat. Scrisă la
# sfârșitul unui build reușit.
#
# Prima variantă compara arborele sursă cu copia, direct. Nu merge, și motivul
# e instructiv: `npm install` rezolvă alt `package-lock.json` pe Linux decât pe
# Windows (binare opționale diferite), iar `next build` mai atinge și el fișiere
# în copie. Deci după orice build cele două arborescențe DIFERĂ legitim, iar
# verificarea ar da alarmă falsă de fiecare dată.
#
# Întrebarea care contează oricum nu era „sunt identice acum”, ci „build-ul
# care se servește vine din working tree-ul de acum”. Asta se răspunde cu o
# amprentă luată la momentul build-ului și păstrată lângă el.
# Stă LÂNGĂ copie, nu ÎN ea. Prima variantă o punea înăuntru, iar `rsync
# --delete` o ștergea la următoarea sincronizare — fișierul nu există în sursă,
# deci era exact genul de gunoi pe care --delete îl curăță. Rezultatul: după
# orice `sync`, verificarea spunea „nu s-a făcut niciun build" despre un build
# perfect valid.
STAMP() { echo "${COPIE}.amprenta"; }

cmd_verifica_sursa() {
  local acum inregistrata
  acum="$(amprenta "$SURSA")"
  if [ ! -f "$(STAMP)" ]; then
    echo "  Nu există amprentă — nu s-a făcut niciun build. Rulează 'build'." >&2
    return 1
  fi
  inregistrata="$(head -1 "$(STAMP)")"
  echo "  working tree acum      : $acum"
  echo "  sursa din care s-a compilat : $inregistrata"
  if [ "$acum" != "$inregistrata" ]; then
    echo "  NU se potrivesc — working tree-ul s-a schimbat după build. Rulează 'build'." >&2
    return 1
  fi
  echo "  ✓ build-ul provine din working tree-ul curent"
}

cmd_build() {
  # Amprenta se ia ÎNAINTE de rsync și se compară DUPĂ: dacă cineva salvează un
  # fișier chiar în timpul sincronizării, copia iese pe jumătate dintr-o versiune
  # și pe jumătate din alta, iar build-ul ar fi al unei surse care n-a existat
  # niciodată. S-a întâmplat exact așa la prima încercare.
  local inainte dupa
  inainte="$(amprenta "$SURSA")"
  cmd_sync
  dupa="$(amprenta "$SURSA")"
  if [ "$inainte" != "$dupa" ]; then
    echo "  Working tree-ul s-a schimbat în timpul sincronizării ($inainte → $dupa)." >&2
    echo "  Nu compilez o sursă amestecată. Rulează din nou." >&2
    exit 1
  fi
  echo "  amprenta sursei: $dupa"
  echo

  if [ ! -d "${COPIE}/node_modules" ]; then
    echo "── npm install (o singură dată, binare Linux) ───────"
    ( cd "$COPIE" && npm install --no-audit --no-fund )
    echo
  fi

  echo "── next build ──────────────────────────────────────"
  # `npm run build` din apps/web ruleaza si poarta i18n si testele. Aici vrem
  # doar compilarea: testele s-au rulat deja in repo, iar pe doua nuclee fiecare
  # minut in plus se simte la fiecare iteratie.
  ( cd "$WEB" && NODE_OPTIONS="--max-old-space-size=3072" npx next build )

  local bid
  bid="$(cat "${WEB}/.next/BUILD_ID")"
  printf '%s\n%s\n' "$dupa" "$bid" > "$(STAMP)"
  echo
  echo "  BUILD_ID: $bid  (sursa $dupa)"
}

# De ce serverul rulează în PRIM-PLAN și nu detașat.
#
# Prima variantă îl pornea cu `nohup … &` și se întorcea imediat. A mers — trei
# secunde. Apoi WSL a închis sesiunea odată cu comanda care îl pornise, și odată
# cu ea și serverul: portul 3000 gol, jurnalul gol, nicio eroare nicăieri.
#
# Un server care rulează în prim-plan ține sesiunea WSL deschisă cât trăiește. E
# și felul normal în care rulezi un server: într-un terminal, cu Ctrl+C la final.
cmd_start() {
  if [ ! -f "${WEB}/.next/BUILD_ID" ]; then
    echo "  Nu există build. Rulează întâi: ./local-server.sh build" >&2
    exit 1
  fi
  cmd_stop
  echo "── next start pe :${PORT} ──────────────────────────"
  echo "  Rămâne în prim-plan. Ctrl+C ca să oprești."
  echo "  Din alt terminal:  ./local-server.sh verifica"
  echo
  cd "$WEB"
  # Ieșirea merge și în jurnal: când serverul răspunde cu 500, stiva de eroare e
  # singurul loc care spune de ce, iar prin conducta care ajunge la mine se
  # tamponează și nu se vede până se termină procesul.
  npx next start -p "$PORT" 2>&1 | tee /tmp/tgx-next.log
}

cmd_stop() {
  # Oprim ce ascultă pe port, oricare ar fi. Nu `pkill -f next`: tiparul acela
  # se potrivește și cu linia de comandă a shell-ului care rulează pkill-ul, și
  # se sinucide în loc să oprească serverul.
  local p
  p="$(ss -ltnp 2>/dev/null | grep ":${PORT} " | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2 || true)"
  if [ -n "${p:-}" ]; then
    kill "$p" 2>/dev/null || true
    sleep 1
    echo "  oprit (PID $p)"
  fi
}

# Seed-ul rulează din COPIE, nu din working tree.
#
# Prisma Client din `node_modules` de pe Windows are engine-ul generat pentru
# „windows”, iar în WSL cere „debian-openssl-3.0.x” — deci un seed pornit din
# /mnt/c moare la prima interogare. Copia are propriul client, generat pentru
# Linux de `postinstall`.
#
# Baza de date e aceeași în ambele cazuri: cea din apps/web/.env.
cmd_seed() {
  if [ ! -d "${COPIE}/node_modules" ]; then
    echo "  Copia n-are node_modules. Rulează întâi: ./local-server.sh build" >&2
    exit 1
  fi
  echo "── seed cont demo ──────────────────────────────────"
  ( cd "$WEB" && npm run --silent db:seed:demo )
}

cmd_verifica() {
  echo "── sursa ───────────────────────────────────────────"
  cmd_verifica_sursa
  echo
  echo "── build ID ────────────────────────────────────────"
  #
  # Prima variantă căuta `"buildId"` în HTML-ul paginii. Nu există: e un obicei
  # de Pages Router, iar aplicația e pe App Router, unde chunk-urile sunt numite
  # după hash de conținut. Verificarea „nu găsea nimic” și raporta „serverul nu
  # răspunde” pe un server care răspundea perfect.
  #
  # Reperul real: `_buildManifest.js` e servit sub calea care conține chiar
  # BUILD_ID-ul. Dacă serverul îl dă pe al nostru cu 200 și pe unul inventat cu
  # 404, atunci servește exact build-ul de pe disc — nu unul vechi din memorie.
  local inregistrat pe_disc cod control
  inregistrat="$(sed -n 2p "$(STAMP)" 2>/dev/null || true)"
  pe_disc="$(cat "${WEB}/.next/BUILD_ID" 2>/dev/null || echo "")"
  echo "  la compilare           : ${inregistrat:-(nimic)}"
  echo "  .next/BUILD_ID pe disc : ${pe_disc:-(niciun build)}"

  if [ -z "$pe_disc" ]; then
    echo "  Nu există build." >&2
    return 1
  fi
  if [ "$inregistrat" != "$pe_disc" ]; then
    echo "  Build-ul de pe disc nu e cel înregistrat la compilare." >&2
    return 1
  fi

  cod="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 \
        "http://localhost:${PORT}/_next/static/${pe_disc}/_buildManifest.js" || true)"
  control="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 \
        "http://localhost:${PORT}/_next/static/nuexistaacestid/_buildManifest.js" || true)"
  echo "  servit sub acest ID    : HTTP $cod   (un ID inventat dă HTTP $control)"

  if [ "$cod" != "200" ]; then
    echo "  Serverul NU servește build-ul ăsta. A pornit înaintea compilării?" >&2
    echo "  Repornește-l: ./local-server.sh start" >&2
    return 1
  fi
  if [ "$control" = "200" ]; then
    echo "  Verificare fără valoare: și un ID inventat întoarce 200." >&2
    return 1
  fi
  echo "  ✓ serverul servește exact build-ul compilat din working tree-ul curent"
}

case "${1:-build}" in
  sync)     cmd_sync ;;
  build)    cmd_build ;;
  start)    cmd_start ;;
  stop)     cmd_stop ;;
  seed)     cmd_seed ;;
  verifica) cmd_verifica ;;
  *) echo "necunoscut: $1 (sync | build | seed | start | stop | verifica)" >&2; exit 1 ;;
esac
