import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { PDFDocument, PDFFont, PDFPage, rgb, RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { auth } from "@/lib/auth";
import { getTaxReportData } from "@/lib/tax-report-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Paletă (aliniată cu UI-ul) ──
const C = {
  indigo: rgb(0.31, 0.275, 0.898),
  indigoDark: rgb(0.215, 0.188, 0.639),
  indigoBg: rgb(0.933, 0.937, 0.996),
  violet: rgb(0.486, 0.227, 0.929),
  emerald: rgb(0.02, 0.588, 0.412),
  rose: rgb(0.882, 0.075, 0.282),
  amberText: rgb(0.706, 0.325, 0.035),
  amberBg: rgb(1, 0.984, 0.922),
  amberBorder: rgb(0.988, 0.827, 0.302),
  zinc800: rgb(0.153, 0.153, 0.165),
  zinc600: rgb(0.322, 0.322, 0.357),
  zinc500: rgb(0.443, 0.443, 0.478),
  zinc400: rgb(0.631, 0.631, 0.667),
  zinc300: rgb(0.831, 0.831, 0.851),
  zinc200: rgb(0.894, 0.894, 0.906),
  zinc100: rgb(0.957, 0.957, 0.965),
  zinc50: rgb(0.98, 0.98, 0.98),
  white: rgb(1, 1, 1),
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const isPro = session.user.plan === "PRO" || session.user.isTrialing;
  if (!isPro) return new Response("Forbidden", { status: 403 });

  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value === "en" ? "en" : "ro";
  const t = await getTranslations({ locale, namespace: "taxReport" });
  const months = t.raw("months") as string[];

  const yearParam = req.nextUrl.searchParams.get("year") ?? undefined;
  const data = await getTaxReportData(session.user.id, yearParam);
  const { summary: s, currency, year } = data;

  const nf = new Intl.NumberFormat(locale === "ro" ? "ro-RO" : "en-US", {
    style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
  const money = (n: number) => nf.format(n);

  // ── Fonturi (încorporate din /public/fonts) ──
  const origin = req.nextUrl.origin;
  const [regBytes, boldBytes] = await Promise.all([
    fetch(`${origin}/fonts/DejaVuSans.ttf`).then((r) => r.arrayBuffer()),
    fetch(`${origin}/fonts/DejaVuSans-Bold.ttf`).then((r) => r.arrayBuffer()),
  ]);

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const reg = await pdf.embedFont(regBytes, { subset: true });
  const bold = await pdf.embedFont(boldBytes, { subset: true });

  const W = 595.28;
  const H = 841.89;
  const M = 42;
  const CW = W - 2 * M;

  let page = pdf.addPage([W, H]);
  let y = M; // distanță de la marginea de sus până la baseline-ul curent

  // ── Helperi ──
  const txt = (
    str: string, x: number, size: number, font: PDFFont, color: RGB, opts?: { align?: "left" | "right" | "center"; maxX?: number }
  ) => {
    let drawX = x;
    if (opts?.align === "right") drawX = (opts.maxX ?? W - M) - font.widthOfTextAtSize(str, size);
    else if (opts?.align === "center") drawX = x - font.widthOfTextAtSize(str, size) / 2;
    page.drawText(str, { x: drawX, y: H - y, size, font, color });
  };
  const rect = (x: number, yTop: number, w: number, h: number, opts: { fill?: RGB; border?: RGB; bw?: number }) =>
    page.drawRectangle({ x, y: H - yTop - h, width: w, height: h, color: opts.fill, borderColor: opts.border, borderWidth: opts.bw ?? (opts.border ? 1 : 0) });
  const line = (x1: number, yTop: number, x2: number, color: RGB, thickness = 1) =>
    page.drawLine({ start: { x: x1, y: H - yTop }, end: { x: x2, y: H - yTop }, color, thickness });
  const ensure = (needed: number) => {
    if (y + needed > H - M) { page = pdf.addPage([W, H]); y = M; }
  };
  const sectionHeader = (label: string) => {
    ensure(28);
    txt(label.toUpperCase(), M, 8.5, bold, C.indigo);
    y += 16;
  };

  // ═══ Antet ═══
  // Stânga: logo + brand
  rect(M, y - 2, 22, 22, { fill: C.indigo });
  txt("T", M + 6.5, 13, bold, C.white);
  txt("TradeGx", M + 30, 15, bold, C.zinc800);
  page.drawText("PRO TRADING JOURNAL", { x: M + 31, y: H - (y + 12), size: 6.5, font: bold, color: C.zinc400 });

  // Dreapta: titlu + subtitlu + dată
  const genAt = new Date().toLocaleString(locale === "ro" ? "ro-RO" : "en-US", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  txt(t("title", { year }), W - M, 14, bold, C.zinc800, { align: "right" });
  page.drawText(t("subtitle"), { x: W - M - reg.widthOfTextAtSize(t("subtitle"), 8.5), y: H - (y + 15), size: 8.5, font: reg, color: C.zinc600 });
  page.drawText(`${t("generated")} ${genAt}`, { x: W - M - reg.widthOfTextAtSize(`${t("generated")} ${genAt}`, 7.5), y: H - (y + 28), size: 7.5, font: reg, color: C.zinc400 });

  y += 42;
  line(M, y, W - M, C.indigo, 1.5);
  y += 22;

  if (data.empty) {
    ensure(60);
    txt(t("empty", { year }), W / 2, 13, bold, C.zinc800, { align: "center" });
    y += 20;
    txt(t("emptyDesc"), W / 2, 9, reg, C.zinc500, { align: "center" });
  } else {
    // ═══ Sumar ═══
    sectionHeader(t("summaryTitle", { year }));
    const kpis = [
      { label: t("kTotalTrades"), value: String(s.totalTrades), color: C.zinc800 },
      { label: t("kGrossGain"), value: money(s.grossGain), color: C.emerald },
      { label: t("kGrossLoss"), value: `-${money(s.grossLoss)}`, color: C.rose },
      { label: t("kNetResult"), value: `${s.net >= 0 ? "+" : ""}${money(s.net)}`, color: s.net >= 0 ? C.emerald : C.rose },
    ];
    const gap = 8;
    const cellW = (CW - gap * 3) / 4;
    const cellH = 46;
    kpis.forEach((k, i) => {
      const cx = M + i * (cellW + gap);
      rect(cx, y, cellW, cellH, { fill: C.zinc50, border: C.zinc200 });
      page.drawText(k.label.toUpperCase(), { x: cx + 8, y: H - (y + 15), size: 6.5, font: bold, color: C.zinc400 });
      // valoare (redusă dacă e prea lată)
      let vs = 12;
      while (bold.widthOfTextAtSize(k.value, vs) > cellW - 16 && vs > 7) vs -= 0.5;
      page.drawText(k.value, { x: cx + 8, y: H - (y + 34), size: vs, font: bold, color: k.color });
    });
    y += cellH + 20;

    // ═══ Estimare impozit ═══
    sectionHeader(t("taxTitle"));
    const gap2 = 8;
    const boxW = (CW - gap2) / 2;
    const boxH = 40;
    rect(M, y, boxW, boxH, { fill: C.indigoBg, border: C.indigo, bw: 0.8 });
    page.drawText(t("taxableBase").toUpperCase(), { x: M + 8, y: H - (y + 14), size: 6.5, font: bold, color: C.indigo });
    page.drawText(money(s.taxable), { x: M + 8, y: H - (y + 31), size: 11, font: bold, color: C.indigoDark });
    const bx2 = M + boxW + gap2;
    rect(bx2, y, boxW, boxH, { fill: C.amberBg, border: C.amberBorder, bw: 0.8 });
    page.drawText(t("estTax").toUpperCase(), { x: bx2 + 8, y: H - (y + 14), size: 6.5, font: bold, color: C.amberText });
    page.drawText(money(s.estTax), { x: bx2 + 8, y: H - (y + 31), size: 11, font: bold, color: C.amberText });
    y += boxH + 12;
    if (s.taxable <= 0) { txt(t("noGain"), M, 8, reg, C.zinc500); y += 12; }
    // notă (wrap)
    y = wrapText(page, reg, t("taxNote"), M, y, CW, 7.5, 10, C.zinc500, H);
    y += 14;

    // ═══ Lunar ═══
    if (data.monthly.length > 0) {
      sectionHeader(t("monthlyTitle"));
      const cols = [M, M + CW * 0.55, W - M];
      // header
      txt(t("colMonth"), cols[0], 8, bold, C.zinc500);
      txt(t("colTrades"), cols[1], 8, bold, C.zinc500, { align: "center" });
      txt(t("colNetPnl"), cols[2], 8, bold, C.zinc500, { align: "right" });
      y += 6;
      line(M, y, W - M, C.zinc300, 1.2);
      y += 13;
      for (const m of data.monthly) {
        ensure(16);
        txt(months[m.month], cols[0], 9, reg, C.zinc800);
        txt(String(m.trades), cols[1], 9, reg, C.zinc600, { align: "center" });
        txt(`${m.pnl >= 0 ? "+" : ""}${money(m.pnl)}`, cols[2], 9, bold, m.pnl >= 0 ? C.emerald : C.rose, { align: "right" });
        y += 5;
        line(M, y, W - M, C.zinc100, 0.6);
        y += 12;
      }
      y += 10;
    }

    // ═══ Pe instrument ═══
    if (data.byInstrument.length > 0) {
      sectionHeader(t("instrumentTitle"));
      const cols = [M, M + CW * 0.42, M + CW * 0.66, W - M];
      txt(t("colInstrument"), cols[0], 8, bold, C.zinc500);
      txt(t("colTrades"), cols[1], 8, bold, C.zinc500, { align: "center" });
      txt(t("colWinRate"), cols[2], 8, bold, C.zinc500, { align: "center" });
      txt(t("colNetPnl"), cols[3], 8, bold, C.zinc500, { align: "right" });
      y += 6;
      line(M, y, W - M, C.zinc300, 1.2);
      y += 13;
      for (const r of data.byInstrument) {
        ensure(16);
        txt(r.label, cols[0], 9, reg, C.zinc800);
        txt(String(r.total), cols[1], 9, reg, C.zinc600, { align: "center" });
        txt(`${r.winRate}%`, cols[2], 9, reg, C.zinc600, { align: "center" });
        txt(`${r.pnl >= 0 ? "+" : ""}${money(r.pnl)}`, cols[3], 9, bold, r.pnl >= 0 ? C.emerald : C.rose, { align: "right" });
        y += 5;
        line(M, y, W - M, C.zinc100, 0.6);
        y += 12;
      }
      y += 12;
    }

    // ═══ Disclaimer ═══
    ensure(56);
    const discLines = wrapMeasure(reg, t("disclaimer"), CW - 20, 8);
    const dH = 22 + discLines.length * 10.5;
    rect(M, y, CW, dH, { fill: C.amberBg, border: C.amberBorder, bw: 0.8 });
    page.drawText(t("disclaimerTitle").toUpperCase(), { x: M + 10, y: H - (y + 15), size: 7.5, font: bold, color: C.amberText });
    let dy = y + 27;
    for (const ln of discLines) {
      page.drawText(ln, { x: M + 10, y: H - dy, size: 8, font: reg, color: C.zinc600 });
      dy += 10.5;
    }
    y += dH + 8;
  }

  // ═══ Subsol ═══
  ensure(24);
  line(M, y, W - M, C.zinc200, 0.8);
  y += 12;
  txt(t("footer"), W / 2, 7.5, reg, C.zinc400, { align: "center" });

  const bytes = await pdf.save();
  const fileName = `TradeGx-${t("navTitle").replace(/\s+/g, "-")}-${year}.pdf`;
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

// Măsoară textul înfășurat în linii care încap în lățimea dată.
function wrapMeasure(font: PDFFont, text: string, maxWidth: number, size: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Desenează text înfășurat și întoarce noul y.
function wrapText(
  page: PDFPage, font: PDFFont, text: string, x: number, yTop: number, maxWidth: number,
  size: number, lineH: number, color: RGB, H: number
): number {
  const lines = wrapMeasure(font, text, maxWidth, size);
  let yy = yTop;
  for (const ln of lines) {
    page.drawText(ln, { x, y: H - yy, size, font, color });
    yy += lineH;
  }
  return yy;
}
