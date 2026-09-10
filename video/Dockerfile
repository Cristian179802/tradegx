# ── Studioul de captură TradeGX ──────────────────────────────────────────────
#
# Un browser real, pe un ecran virtual, filmat cu ffmpeg. Nu `recordVideo` din
# Playwright: acela scoate webm VP8 cu framerate variabil, care arată prost
# exact pe ce filmăm noi — text mic de interfață.
#
# Imaginea Playwright oficială aduce deja Chromium cu TOATE bibliotecile lui de
# sistem. Instalate manual pe un Debian gol, lipsește mereu una și o descoperi
# printr-un „Failed to launch browser" fără explicație.

# Versiunea imaginii și cea a pachetului `playwright` TREBUIE să fie aceeași:
# pachetul caută browserele într-un director numit după versiunea lui, iar
# imaginea le-a pus în cel numit după versiunea ei. Diferite, Playwright anunță
# „Executable doesn't exist" și îți cere să rulezi `install` într-un container
# care n-are voie să descarce nimic.
#
# Se schimbă ÎN DOUĂ LOCURI odată: aici și în `video/package.json`.
ARG PLAYWRIGHT_VERSION=1.56.0
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
      # Ecranul virtual și utilitarele lui.
      xvfb x11-utils \
      # Captura propriu-zisă.
      ffmpeg \
      # ── FONTURI ────────────────────────────────────────────────────────────
      # Inter și Space Grotesk NU se instalează aici, deși specul o cere:
      # aplicația folosește `next/font/google`, care descarcă fonturile la BUILD
      # și le servește de pe propriul domeniu. Browserul le ia de la aplicație,
      # nu din sistem. Instalate aici, ar fi copii moarte.
      #
      # Ce lipsește cu adevărat într-un container gol sunt fonturile de REZERVĂ
      # și cele cu simboluri. Fără ele, „×" din „Setup × Sesiune", „·", „→" și
      # diacriticele apar ca dreptunghiuri — și afli abia când te uiți la film.
      fontconfig \
      fonts-liberation \
      fonts-dejavu-core \
      fonts-noto-core \
      fonts-noto-color-emoji \
    && fc-cache -f \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /studio

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY capture ./capture

RUN mkdir -p /studio/out

# Ecranul, într-un singur loc: `entrypoint.sh` și ffmpeg trebuie să fie de acord
# asupra rezoluției, altfel captura iese decupată sau cu benzi negre.
ENV DISPLAY=:99
ENV CAPTURE_WIDTH=1920
ENV CAPTURE_HEIGHT=1080
ENV CAPTURE_FPS=60

COPY entrypoint.sh /studio/entrypoint.sh
RUN chmod +x /studio/entrypoint.sh

ENTRYPOINT ["/studio/entrypoint.sh"]
# entrypoint.sh a pornit deja ecranul (e ENTRYPOINT), deci comanda de aici
# trebuie să fie DOAR captura. `npm run capture` ar chema entrypoint-ul a doua
# oară, iar al doilea Xvfb ar eșua pe :99 deja ocupat.
CMD ["npx", "tsx", "capture/run.ts"]
