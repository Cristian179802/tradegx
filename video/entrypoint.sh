#!/usr/bin/env bash
#
# ── Pornirea studioului ──────────────────────────────────────────────────────
#
# Singura treabă a acestui script e să existe un ecran înainte să pornească
# orice altceva. Sincronizarea dintre browser și ffmpeg NU se face aici — se
# face în `capture/run.ts`, care le pornește pe amândouă și știe exact când
# pagina e gata.
#
# Motivul: aici, în shell, „pagina e încărcată" nu se poate ști decât ghicind cu
# un `sleep`. Iar un `sleep` ghicit fie taie începutul filmării, fie lasă în cap
# trei secunde de pagină goală — și afli abia la montaj.

set -euo pipefail

W="${CAPTURE_WIDTH:-1920}"
H="${CAPTURE_HEIGHT:-1080}"
D="${DISPLAY:-:99}"

echo "── studio ──────────────────────────────────────────"
echo "  ecran   ${W}x${H}x24 pe ${D}"

# `-nolisten tcp` — ecranul nu trebuie să fie accesibil din rețea.
# `-ac` — fără control de acces: suntem singurii în container.
Xvfb "${D}" -screen 0 "${W}x${H}x24" -nolisten tcp -ac &
XVFB_PID=$!

# Așteptăm ecranul, nu presupunem că e gata. `xdpyinfo` întoarce eroare până
# când X răspunde — deci întrebăm până răspunde, cu o limită.
for i in $(seq 1 50); do
  if xdpyinfo -display "${D}" >/dev/null 2>&1; then
    echo "  ecran gata după $((i * 100))ms"
    break
  fi
  if [ "$i" -eq 50 ]; then
    echo "  EROARE: Xvfb nu a pornit în 5s" >&2
    exit 1
  fi
  sleep 0.1
done

# La ieșire, oprim ecranul indiferent cum s-a terminat captura.
cleanup() {
  kill "${XVFB_PID}" 2>/dev/null || true
  wait "${XVFB_PID}" 2>/dev/null || true
}
trap cleanup EXIT

echo "  fonturi $(fc-list | wc -l) instalate"
echo "  ffmpeg  $(ffmpeg -version 2>/dev/null | head -1 | cut -d' ' -f3)"
echo "────────────────────────────────────────────────────"
echo

exec "$@"
