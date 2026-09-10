import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname } from "node:path";

// ── Reportofonul ─────────────────────────────────────────────────────────────
//
// ffmpeg pe x11grab. Două lucruri contează, și amândouă se văd abia la montaj
// dacă sunt greșite:
//
// 1. CÂND PORNEȘTE. Nu la lansarea containerului — atunci ar filma secunde de
//    pagină albă și de login. Pornește când browserul spune că pagina e gata,
//    deci controlul stă în `run.ts`, nu în shell.
//
// 2. CUM SE OPREȘTE. `kill` taie fișierul în mijlocul unui frame și strică
//    indexul. Se trimite „q" pe stdin: ffmpeg închide curat, scrie indexul, iese
//    cu 0. Diferența dintre un .mkv care se deschide și unul care se plânge.

/**
 * Encoderul intermediar. Ambele variante sunt FĂRĂ PIERDERI — diferă doar cât
 * procesor cer, iar asta decide dacă prinzi toate cadrele sau nu.
 *
 *   x264   comprimă mult mai bine (fișier mic), dar la 1080p60 cere un
 *          procesor serios. Pe unul slab, ffmpeg rămâne în urmă și x11grab
 *          pierde cadre — iar pierderea NU se vede în metadate: fișierul spune
 *          tot „60fps", doar că are un sfert din cadre.
 *
 *   ffvhuff  predicție simplă + Huffman. Aproape gratis pentru procesor, dar
 *          scoate fișiere de câteva ori mai mari. Pentru un intermediar care
 *          oricum se re-encodează la montaj, mărimea contează mult mai puțin
 *          decât cadrele lipsă.
 *
 * Implicit x264. Pe mașini slabe, `CAPTURE_CODEC=ffvhuff`.
 */
function codecArgs(): string[] {
  const codec = process.env.CAPTURE_CODEC ?? "x264";
  if (codec === "ffvhuff") {
    return ["-c:v", "ffvhuff", "-pix_fmt", "yuv444p"];
  }
  if (codec === "rawvideo") {
    // Zero encodare. Fișiere enorme (~350 MB/s la 1080p60), dar dacă nici
    // ffvhuff nu ține pasul, ăsta e ultimul refugiu.
    return ["-c:v", "rawvideo", "-pix_fmt", "yuv444p"];
  }
  return [
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-qp", "0",
    // yuv444p, nu 420: la 420 se înjumătățește informația de culoare pe
    // orizontală, iar textul mic de interfață colorat (verde/roșu pe fundal
    // închis) capătă margini murdare. Pe un intermediar lossless ar fi absurd
    // să pierdem tocmai asta.
    "-pix_fmt", "yuv444p",
  ];
}

export interface OptiuniInregistrare {
  display: string;
  latime: number;
  inaltime: number;
  fps: number;
  iesire: string;
  /**
   * De la ce înălțime începe filmarea, în pixeli.
   *
   * Fereastra lui Chromium are deasupra taburi și bară de adrese. `--kiosk` nu
   * le scoate când fereastra e condusă de Playwright, iar un cadru de marketing
   * cu bara de adrese în el arată a înregistrare de ecran, nu a produs.
   *
   * Deci ecranul virtual e mai ÎNALT decât cadrul cerut cu exact atât cât ocupă
   * cromul, iar x11grab începe de sub el. Valoarea se MĂSOARĂ în browser
   * (`outerHeight - innerHeight`), nu se ghicește: diferă între versiuni de
   * Chromium și între setări.
   */
  decalajY?: number;
}

export class Inregistrare {
  private proces: ChildProcess | null = null;
  private pornitLa = 0;
  private stderr = "";

  constructor(private readonly opt: OptiuniInregistrare) {}

  /**
   * Decalajul se află abia după ce browserul deschide o pagină, deci nu poate
   * veni prin constructor. Se pune înainte de `porneste()`.
   */
  seteazaDecalaj(y: number): void {
    this.opt.decalajY = Math.max(0, Math.round(y));
  }

  porneste(): void {
    const { display, latime, inaltime, fps, iesire, decalajY = 0 } = this.opt;
    mkdirSync(dirname(iesire), { recursive: true });
    // `:99+0,87` = ecranul :99, începând de la x=0, y=87. Așa cade cromul
    // browserului în afara cadrului, fără să tăiem din pagină.
    const sursa = decalajY > 0 ? `${display}+0,${decalajY}` : display;

    const argumente = [
      "-loglevel", "warning",
      "-f", "x11grab",
      // Framerate CONSTANT: cu variabil, montajul de la faza 5 n-are cum să
      // alinieze zoom-urile la timestamp-uri.
      "-framerate", String(fps),
      "-video_size", `${latime}x${inaltime}`,
      "-draw_mouse", "0", // cursorul real nu ne trebuie: îl desenăm noi, în DOM
      "-i", sursa,
      ...codecArgs(),
      "-y", iesire,
    ];

    this.proces = spawn("ffmpeg", argumente, { stdio: ["pipe", "ignore", "pipe"] });
    this.pornitLa = Date.now();
    this.proces.stderr?.on("data", (b) => (this.stderr += String(b)));
    this.proces.on("error", (e) => {
      console.error("  ffmpeg n-a putut porni:", e.message);
    });
  }

  /** Milisecunde de la primul cadru — baza de timp pentru keyframes.json. */
  get msDeLaStart(): number {
    return this.pornitLa ? Date.now() - this.pornitLa : 0;
  }

  async opreste(): Promise<{ secunde: number; octeti: number; cadre: number; fpsReal: number }> {
    const p = this.proces;
    if (!p) return { secunde: 0, octeti: 0, cadre: 0, fpsReal: 0 };

    const durata = (Date.now() - this.pornitLa) / 1000;

    await new Promise<void>((rezolva) => {
      // Plasă de siguranță: dacă ffmpeg nu iese în 10s, îl oprim oricum — mai
      // bine un fișier posibil ciuntit decât un container care atârnă la
      // nesfârșit în CI.
      const limita = setTimeout(() => {
        console.error("  ffmpeg n-a ieșit în 10s — îl opresc forțat");
        p.kill("SIGKILL");
        rezolva();
      }, 10_000);

      p.on("exit", (cod) => {
        clearTimeout(limita);
        if (cod !== 0 && this.stderr.trim()) {
          console.error("  ffmpeg:", this.stderr.trim().split("\n").slice(-3).join("\n"));
        }
        rezolva();
      });

      p.stdin?.write("q");
      p.stdin?.end();
    });

    this.proces = null;
    const octeti = existsSync(this.opt.iesire) ? statSync(this.opt.iesire).size : 0;
    const { cadre, fpsReal } = this.masoaraCadre();
    return { secunde: durata, octeti, cadre, fpsReal };
  }

  /**
   * Câte cadre are FIȘIERUL, nu câte am cerut.
   *
   * Asta e verificarea care lipsea și fără de care totul pare în regulă:
   * ffmpeg scrie în antet framerate-ul CERUT, deci `ffprobe` raportează
   * senin „60/1" chiar dacă x11grab a apucat să prindă doar un sfert din
   * cadre. Fișierul spune 60fps, playerul spune 60fps, și abia când te uiți
   * la animație observi că sacadează — după ce ai filmat tot.
   *
   * Deci numărăm pachetele reale și împărțim la durată. E singurul număr
   * care descrie ce s-a întâmplat.
   */
  private masoaraCadre(): { cadre: number; fpsReal: number } {
    if (!existsSync(this.opt.iesire)) return { cadre: 0, fpsReal: 0 };
    try {
      const n = Number(
        execFileSync("ffprobe", [
          "-v", "error",
          "-select_streams", "v:0",
          "-count_packets",
          "-show_entries", "stream=nb_read_packets",
          "-of", "csv=p=0",
          this.opt.iesire,
        ]).toString().trim()
      );
      const d = Number(
        execFileSync("ffprobe", [
          "-v", "error",
          "-show_entries", "format=duration",
          "-of", "csv=p=0",
          this.opt.iesire,
        ]).toString().trim()
      );
      return { cadre: n, fpsReal: d > 0 ? n / d : 0 };
    } catch {
      // Măsurarea e informativă; dacă eșuează, captura rămâne bună.
      return { cadre: 0, fpsReal: 0 };
    }
  }
}
