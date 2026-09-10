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

# Ecranul e mai ÎNALT decât cadrul filmat, cu loc pentru taburile și bara de
# adrese ale lui Chromium. Filmăm de sub ele (vezi `decalajY` din recorder.ts),
# deci pagina primește exact înălțimea cerută, iar cromul cade în afara cadrului.
#
# Rezerva e generoasă intenționat: dacă e prea mică, pagina se strânge; dacă e
# prea mare, doar rămâne o fâșie nefolosită jos, care nu se filmează oricum.
REZERVA="${CAPTURE_CHROME_RESERVE:-140}"
H_ECRAN=$((H + REZERVA))

# NU citim `DISPLAY` din mediu, deliberat.
#
# În WSL2 există WSLg — un server X pornit de Windows pentru aplicații grafice —
# iar el pune `DISPLAY=:0`. Cu `${DISPLAY:-:99}`, scriptul păstra `:0`, Xvfb
# eșua cu „server already running", verificarea trecea (chiar RULA un server X
# acolo), și filmam ecranul lui WSLg în loc de al nostru: altă dimensiune, alt
# conținut, fereastra noastră poate nici măcar vizibilă.
#
# Deci ecranul nostru se numește explicit. `CAPTURE_DISPLAY` rămâne pentru cazul
# în care :99 e ocupat.
D="${CAPTURE_DISPLAY:-:99}"
export DISPLAY="$D"

echo "── studio ──────────────────────────────────────────"
echo "  ecran   ${W}x${H_ECRAN}x24 pe ${D}  (cadru ${W}x${H} + ${REZERVA}px rezerva pentru crom)"

# Un ecran rămas de la o rulare anterioară e capcana perfectă: Xvfb scrie
# „Server is already active", dar merge mai departe; `xdpyinfo` răspunde —
# pentru că acolo CHIAR rulează un server; verificarea trece. Doar că geometria
# e a rulării vechi. S-a filmat exact așa: cerusem 1280x860, ecranul era
# 1920x1080 de acum o oră, iar decupajul a ieșit din altă parte decât credeam.
# Niciun mesaj de eroare, nicăieri.
#
# Deci: dacă pe display rulează deja un Xvfb cu ALTĂ geometrie, îl oprim. Doar
# un proces al cărui nume începe exact cu „Xvfb <display> " — WSLg stă pe :0 și
# nu se numește așa, deci nu-l putem atinge din greșeală.
LOCK="/tmp/.X${D#:}-lock"

if xdpyinfo -display "${D}" >/dev/null 2>&1; then
  DIM=$(xdpyinfo -display "${D}" | awk '/dimensions:/ && !gasit {print $2; gasit=1}')
  if [ "${DIM}" = "${W}x${H_ECRAN}" ]; then
    echo "  ecran ${D} era deja pornit, aceeași geometrie — îl refolosesc"
  else
    echo "  ecran ${D} rulează cu ${DIM}, nu ${W}x${H_ECRAN} — îl opresc"
    # Tiparul e ancorat cu `^` dintr-un motiv foarte practic: `pkill -f` compară
    # cu linia de comandă ÎNTREAGĂ a fiecărui proces — inclusiv a shell-ului
    # care rulează pkill-ul, a cărui linie conține chiar șirul căutat. Un
    # `pkill -f "Xvfb ${D}"` neancorat se sinucide: ieșire 15, iar restul
    # scriptului nu mai rulează niciodată.
    pkill -f "^Xvfb ${D} " 2>/dev/null || true
    for i in $(seq 1 30); do
      xdpyinfo -display "${D}" >/dev/null 2>&1 || break
      sleep 0.1
    done
    if xdpyinfo -display "${D}" >/dev/null 2>&1; then
      echo "  EROARE: nu am putut opri ecranul de pe ${D}." >&2
      # Nu recomandăm `pkill -f`: vezi nota de mai sus, s-ar omorî pe sine.
      echo "          Oprește-l manual:  pkill -x Xvfb" >&2
      exit 1
    fi
    rm -f "${LOCK}"
  fi
else
  # `xdpyinfo` nu răspunde, dar lock-ul poate fi rămas de la un proces ucis, iar
  # Xvfb refuză să pornească peste el. Îl curățăm.
  rm -f "${LOCK}"
fi

XVFB_PID=""
JURNAL_X="${CAPTURE_XVFB_LOG:-/tmp/xvfb${D#:}.log}"
if ! xdpyinfo -display "${D}" >/dev/null 2>&1; then
  # `-nolisten tcp` — ecranul nu trebuie să fie accesibil din rețea.
  # `-ac` — fără control de acces: suntem singurii în container.
  #
  # Ieșirea lui Xvfb pleacă în jurnal, NU în terminal. Două motive, ambele
  # învățate pe pielea noastră:
  #
  #  - xkbcomp scoate ~30 de rânduri de „Could not resolve keysym XF86…", care
  #    nu înseamnă nimic (X însuși spune că nu sunt fatale) dar acoperă complet
  #    raportul capturii când ieșirea trece printr-un `tail`.
  #  - Un proces de fundal care moștenește stdout ȚINE conducta deschisă cât
  #    trăiește. Cu `npm run capture | tail`, `tail` nu vedea niciodată sfârșitul
  #    și comanda atârna la nesfârșit, deși captura se terminase demult.
  Xvfb "${D}" -screen 0 "${W}x${H_ECRAN}x24" -nolisten tcp -ac >"${JURNAL_X}" 2>&1 &
  XVFB_PID=$!

  # Așteptăm ecranul, nu presupunem că e gata. `xdpyinfo` întoarce eroare până
  # când X răspunde — deci întrebăm până răspunde, cu o limită.
  for i in $(seq 1 50); do
    if xdpyinfo -display "${D}" >/dev/null 2>&1; then
      echo "  ecran gata după $((i * 100))ms"
      break
    fi
    if [ "$i" -eq 50 ]; then
      echo "  EROARE: Xvfb nu a pornit în 5s. Jurnal: ${JURNAL_X}" >&2
      tail -5 "${JURNAL_X}" >&2 2>/dev/null || true
      exit 1
    fi
    sleep 0.1
  done
fi

# Ultima verificare, după ce ecranul răspunde: are CHIAR geometria cerută?
# Fără ea, orice greșeală de mai sus se vede abia în cadrul filmat.
#
# `awk` citește TOT, deși are nevoie doar de primul rând potrivit. Varianta
# firească — `{print $2; exit}` — închide conducta cât `xdpyinfo` încă scrie în
# ea; `xdpyinfo` primește SIGPIPE, iese cu 141, iar `pipefail` + `set -e` opresc
# scriptul aici, fără niciun mesaj.
#
# Și, mai rău, o face NEDETERMINIST: dacă ieșirea încape în tamponul conductei
# înainte ca awk să iasă, nu se întâmplă nimic. La 1280x860 mergea de fiecare
# dată, la 1920x1220 murea de fiecare dată. Costul citirii până la capăt e o
# fracțiune de milisecundă.
DIM_FINAL=$(xdpyinfo -display "${D}" | awk '/dimensions:/ && !gasit {print $2; gasit=1}')
if [ "${DIM_FINAL}" != "${W}x${H_ECRAN}" ]; then
  echo "  EROARE: ecranul de pe ${D} are ${DIM_FINAL}, nu ${W}x${H_ECRAN}." >&2
  exit 1
fi
echo "  geometrie confirmată ${DIM_FINAL}"

# La ieșire, oprim ecranul indiferent cum s-a terminat captura — dar numai dacă
# noi l-am pornit. Un ecran refolosit rămâne al celui care l-a pornit.
cleanup() {
  [ -n "${XVFB_PID}" ] || return 0
  kill "${XVFB_PID}" 2>/dev/null || true
  wait "${XVFB_PID}" 2>/dev/null || true
}
trap cleanup EXIT

echo "  fonturi $(fc-list | wc -l) instalate"
echo "  ffmpeg  $(ffmpeg -version 2>/dev/null | head -1 | cut -d' ' -f3)"
echo "────────────────────────────────────────────────────"
echo

# NU `exec`. `exec` înlocuiește shell-ul cu procesul capturii, iar odată cu el
# dispare și `trap cleanup EXIT` — deci Xvfb rămânea pornit după fiecare rulare.
# De acolo veneau și „Server is already active", și ecranul cu geometria rulării
# precedente, și conducta care nu se închidea niciodată.
#
# Rulăm captura ca proces-copil, îi păstrăm codul de ieșire și ieșim cu el:
# `npm` de deasupra trebuie să vadă același cod ca înainte.
set +e
"$@"
COD=$?
set -e
exit "${COD}"
