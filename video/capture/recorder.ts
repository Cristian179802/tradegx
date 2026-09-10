import { spawn, type ChildProcess } from "node:child_process";
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

export interface OptiuniInregistrare {
  display: string;
  latime: number;
  inaltime: number;
  fps: number;
  iesire: string;
}

export class Inregistrare {
  private proces: ChildProcess | null = null;
  private pornitLa = 0;
  private stderr = "";

  constructor(private readonly opt: OptiuniInregistrare) {}

  porneste(): void {
    const { display, latime, inaltime, fps, iesire } = this.opt;
    mkdirSync(dirname(iesire), { recursive: true });

    const argumente = [
      "-loglevel", "warning",
      "-f", "x11grab",
      // Framerate CONSTANT: cu variabil, montajul de la faza 5 n-are cum să
      // alinieze zoom-urile la timestamp-uri.
      "-framerate", String(fps),
      "-video_size", `${latime}x${inaltime}`,
      "-draw_mouse", "0", // cursorul real nu ne trebuie: îl desenăm noi, în DOM
      "-i", display,
      "-c:v", "libx264",
      "-preset", "ultrafast",
      // Intermediar fără pierderi. Encodarea finală se face în post, unde ai
      // timp — nu în timpul capturii, unde ai un singur cadru la 16 ms.
      "-qp", "0",
      // yuv444p, nu 420: la 420 se înjumătățește informația de culoare pe
      // orizontală, iar textul mic de interfață colorat (verde/roșu pe fundal
      // închis) capătă margini murdare. Pe un intermediar lossless ar fi absurd
      // să pierdem tocmai asta.
      "-pix_fmt", "yuv444p",
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

  async opreste(): Promise<{ secunde: number; octeti: number }> {
    const p = this.proces;
    if (!p) return { secunde: 0, octeti: 0 };

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
    return { secunde: durata, octeti };
  }
}
