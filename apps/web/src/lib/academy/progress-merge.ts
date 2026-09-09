// ── Progresul în Academie: forma datelor și îmbinarea lor ───────────────────
//
// Progresul trăiește în DOUĂ locuri: în browser (instant, merge și offline) și
// în bază (supraviețuiește schimbării de dispozitiv, ajunge în aplicația
// mobilă). Când cele două nu sunt de acord, nu alegem unul — le ÎMBINĂM, și
// regula e mereu „ce e mai bun pentru elev”:
//
//   - o lecție terminată oriunde rămâne terminată
//   - la quiz contează cel mai bun scor
//   - la exerciții câștigă înregistrarea care arată mai multă muncă, iar seria
//     (streak) e un record personal, deci se ia cea mai lungă
//
// Fișier pur, fără React și fără Prisma, ca să poată fi testat izolat.

export interface DrillStat {
  attempts: number;
  correct: number;
  /** cea mai lungă serie de răspunsuri corecte consecutive */
  bestStreak: number;
}

export interface AcademyProgressData {
  /** chei "moduleId/lessonId" */
  lessons: string[];
  /** cel mai bun scor (%) per modul */
  quizzes: Record<string, number>;
  /** statistici per exercițiu (ex: "pattern-drill", "sl-drill") */
  drills: Record<string, DrillStat>;
  /** întrebări de quiz greșite, cheie "moduleId#index" → de câte ori */
  missed: Record<string, number>;
}

export const EMPTY_PROGRESS: AcademyProgressData = {
  lessons: [],
  quizzes: {},
  drills: {},
  missed: {},
};

/** Îmbină două stări de progres. Comutativă: ordinea argumentelor nu contează. */
export function mergeProgress(a: AcademyProgressData, b: AcademyProgressData): AcademyProgressData {
  const lessons = [...new Set([...a.lessons, ...b.lessons])].sort();

  const quizzes: Record<string, number> = { ...a.quizzes };
  for (const [k, v] of Object.entries(b.quizzes)) {
    quizzes[k] = Math.max(quizzes[k] ?? 0, v);
  }

  const drills: Record<string, DrillStat> = { ...a.drills };
  for (const [k, v] of Object.entries(b.drills)) {
    const cur = drills[k];
    drills[k] = cur ? mergeDrill(cur, v) : { ...v };
  }

  const missed: Record<string, number> = { ...a.missed };
  for (const [k, v] of Object.entries(b.missed)) {
    missed[k] = Math.max(missed[k] ?? 0, v);
  }

  return { lessons, quizzes, drills, missed };
}

/**
 * Îmbină statisticile unui exercițiu.
 *
 * DE CE NU ADUNĂM încercările, deși ar părea evident: îmbinarea trebuie să fie
 * IDEMPOTENTĂ. Clientul trimite starea lui ÎNTREAGĂ, nu diferențe, și o trimite
 * de mai multe ori — reîncercare după un timeout, două taburi deschise, un
 * efect care rulează de două ori. Cu adunare, aceeași stare trimisă a doua oară
 * își dubla cifrele: elevul ar fi văzut 30 de încercări acolo unde făcuse 15.
 *
 * Deci: câștigă înregistrarea care arată mai multă muncă (mai multe încercări;
 * la egalitate, mai multe corecte). Nu amestecăm câmpuri între dispozitive —
 * altfel am putea raporta o acuratețe pe care n-a avut-o niciunul. Singura
 * excepție e seria maximă: aia e un record personal, oriunde a fost stabilit.
 *
 * Compromisul asumat: două dispozitive care exersează în paralel nu-și adună
 * încercările. E rar, iar preferăm o cifră mai mică și adevărată decât una
 * mare și inventată.
 */
function mergeDrill(a: DrillStat, b: DrillStat): DrillStat {
  const bestStreak = Math.max(a.bestStreak, b.bestStreak);
  const bMaiBogat = b.attempts > a.attempts || (b.attempts === a.attempts && b.correct > a.correct);
  const câștigător = bMaiBogat ? b : a;
  return { attempts: câștigător.attempts, correct: câștigător.correct, bestStreak };
}

/** true dacă cele două stări sunt identice — ca să nu scriem degeaba în bază. */
export function sameProgress(a: AcademyProgressData, b: AcademyProgressData): boolean {
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

/**
 * Curăță ce vine din exterior (localStorage vechi, un client mobil cu altă
 * versiune). Nu aruncă niciodată: o valoare ciudată devine valoarea goală.
 */
export function normalize(raw: unknown): AcademyProgressData {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const lessons = Array.isArray(r.lessons)
    ? [...new Set(r.lessons.filter((x): x is string => typeof x === "string" && x.includes("/")))].sort()
    : [];

  const quizzes: Record<string, number> = {};
  if (r.quizzes && typeof r.quizzes === "object") {
    for (const [k, v] of Object.entries(r.quizzes as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v)) quizzes[k] = Math.max(0, Math.min(100, Math.round(v)));
    }
  }

  const drills: Record<string, DrillStat> = {};
  if (r.drills && typeof r.drills === "object") {
    for (const [k, v] of Object.entries(r.drills as Record<string, unknown>)) {
      const d = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
      const n = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0);
      const attempts = n(d.attempts);
      const correct = Math.min(n(d.correct), attempts);
      drills[k] = { attempts, correct, bestStreak: Math.min(n(d.bestStreak), attempts) };
    }
  }

  const missed: Record<string, number> = {};
  if (r.missed && typeof r.missed === "object") {
    for (const [k, v] of Object.entries(r.missed as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v) && v > 0) missed[k] = Math.floor(v);
    }
  }

  return { lessons, quizzes, drills, missed };
}
