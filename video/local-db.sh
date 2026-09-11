#!/usr/bin/env bash
#
# ── Baza de date pentru filmare ──────────────────────────────────────────────
#
# O bază PostgreSQL în WSL, separată de orice altceva, pe care pipeline-ul o
# poate reconstrui de la zero oricând.
#
# De ce există: filmam pe baza de PRODUCȚIE fără să-mi dau seama.
# `apps/web/.env` are DATABASE_URL-ul de Supabase — 6 utilizatori reali, 387 de
# tranzacții, clienți plătitori. Beat-ul Sync are nevoie să ridice pentru câteva
# zeci de secunde rolul contului demo, ca să poată închide o tranzacție prin
# fluxul real. Pe producție asta ar însemna scriere deschisă pe un cont cu
# parolă publică. Nu se face, nici măcar „doar un minut”.
#
# Pe o bază locală, aruncabilă, aceeași operație nu riscă nimic. În plus faza 8
# oricum n-ar fi putut rula pe producție.
#
# Parola bazei se generează aici și rămâne în ${ENV_VIDEO}, în afara repo-ului.
# Nu protejează nimic dincolo de localhost, dar n-are ce căuta nici în git, nici
# într-un log.
#
# Utilizare:
#   ./local-db.sh          pregătește tot (idempotent)
#   ./local-db.sh sterge   aruncă baza, ca să poți reconstrui de la zero

set -euo pipefail

SURSA="$(cd "$(dirname "$0")/.." && pwd)"
COPIE="${TGX_LOCAL_DIR:-/root/tradegx}"
WEB="${COPIE}/apps/web"
ENV_VIDEO="${TGX_VIDEO_ENV:-/root/tradegx-video.env}"
BAZA="tradegx_video"
ROL="tgxvideo"

# ── Serverul ─────────────────────────────────────────────────────────────────

instaleaza() {
  if command -v psql >/dev/null 2>&1; then
    echo "  postgresql: deja instalat ($(psql --version | awk '{print $3}'))"
    return
  fi
  echo "── instalez postgresql ─────────────────────────────"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq postgresql postgresql-client >/dev/null
  echo "  gata ($(psql --version | awk '{print $3}'))"
}

# Portul NU se presupune că e 5432.
#
# Cu `networkingMode=mirrored`, WSL și Windows împart localhost — iar pe mașina
# asta Windows are deja un PostgreSQL pe 5432. Clusterul din WSL a văzut portul
# ocupat și s-a mutat singur pe 5433. Scriptul scria totuși 5432 în
# DATABASE_URL, deci vorbea cu serverul de pe Windows, care habar n-are de rolul
# nostru: „Authentication failed for tgxvideo” — un mesaj care arată a parolă
# greșită și e de fapt alt server.
PORT=""
afla_port() {
  PORT="$(pg_lsclusters -h | awk 'NR==1 {print $3}')"
  if [ -z "$PORT" ]; then
    echo "  EROARE: nu găsesc niciun cluster PostgreSQL în WSL." >&2
    exit 1
  fi
}

porneste() {
  afla_port
  # Întrebăm CHIAR portul clusterului nostru. Un `pg_isready` fără port verifică
  # 5432 și ar răspunde „da” despre serverul de pe Windows.
  if pg_isready -q -h 127.0.0.1 -p "$PORT" 2>/dev/null; then
    echo "  serverul răspunde pe portul ${PORT}"
    return
  fi
  echo "  pornesc clusterul pe portul ${PORT}…"
  local cluster
  cluster="$(pg_lsclusters -h | awk 'NR==1 {print $1" "$2}')"
  # shellcheck disable=SC2086
  pg_ctlcluster ${cluster} start >/dev/null 2>&1 || true
  for i in $(seq 1 30); do
    pg_isready -q -h 127.0.0.1 -p "$PORT" 2>/dev/null && { echo "  gata după $((i))s"; return; }
    sleep 1
  done
  echo "  EROARE: serverul nu a pornit în 30s" >&2
  exit 1
}

# ── Baza și rolul ────────────────────────────────────────────────────────────

pregateste_baza() {
  local parola
  if [ -f "$ENV_VIDEO" ]; then
    parola="$(sed -n 's/^PGPAROLA=//p' "$ENV_VIDEO")"
  fi
  if [ -z "${parola:-}" ]; then
    # Locală, aruncabilă, folosită doar între WSL și el însuși.
    parola="$(head -c 18 /dev/urandom | base64 | tr -d '/+=' | head -c 24)"
  fi

  local p="psql -p ${PORT}"
  su - postgres -c "${p} -tAc \"SELECT 1 FROM pg_roles WHERE rolname='${ROL}'\"" \
    | grep -q 1 \
    || su - postgres -c "${p} -q -c \"CREATE ROLE ${ROL} LOGIN PASSWORD '${parola}'\"" >/dev/null
  su - postgres -c "${p} -q -c \"ALTER ROLE ${ROL} PASSWORD '${parola}'\"" >/dev/null

  su - postgres -c "${p} -tAc \"SELECT 1 FROM pg_database WHERE datname='${BAZA}'\"" \
    | grep -q 1 \
    || su - postgres -c "createdb -p ${PORT} -O ${ROL} ${BAZA}" >/dev/null

  umask 077
  printf 'PGPAROLA=%s\nPGPORT=%s\nDATABASE_URL="postgresql://%s:%s@127.0.0.1:%s/%s?schema=public"\n' \
    "$parola" "$PORT" "$ROL" "$parola" "$PORT" "$BAZA" > "$ENV_VIDEO"
  echo "  baza ${BAZA}, rol ${ROL}, port ${PORT} — configurație în ${ENV_VIDEO}"
}

# ── Schema și datele ─────────────────────────────────────────────────────────

migreaza() {
  if [ ! -d "${WEB}/node_modules" ] && [ ! -d "${COPIE}/node_modules" ]; then
    echo "  Copia n-are node_modules. Rulează întâi: ./local-server.sh build" >&2
    exit 1
  fi
  echo "── schema ──────────────────────────────────────────"
  ( cd "$WEB" && env -u DATABASE_URL bash -c "set -a; . '${ENV_VIDEO}'; set +a; npx prisma migrate deploy" )
  echo
  echo "── utilizatorul demo ───────────────────────────────"
  ( cd "$WEB" && env -u DATABASE_URL bash -c "set -a; . '${ENV_VIDEO}'; set +a; npx tsx scripts/pregateste-video-db.ts" )
  echo
  echo "── tranzacțiile demo ───────────────────────────────"
  ( cd "$WEB" && env -u DATABASE_URL bash -c "set -a; . '${ENV_VIDEO}'; set +a; npx tsx scripts/seed-demo-account.ts" )
}

cmd_sterge() {
  porneste
  su - postgres -c "dropdb -p ${PORT} --if-exists ${BAZA}" >/dev/null
  rm -f "$ENV_VIDEO"
  echo "  baza ${BAZA} ștearsă"
}

case "${1:-pregateste}" in
  pregateste)
    instaleaza
    porneste
    pregateste_baza
    migreaza
    echo
    echo "────────────────────────────────────────────────────"
    echo "  Gata. Filmarea folosește baza asta, nu producția."
    echo "────────────────────────────────────────────────────"
    ;;
  sterge) cmd_sterge ;;
  *) echo "necunoscut: $1 (pregateste | sterge)" >&2; exit 1 ;;
esac
