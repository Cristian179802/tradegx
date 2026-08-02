import { Resend } from "resend";

// ── Configurare email ────────────────────────────────────────────────────────
//
// Trei capcane reparate aici, toate descoperite pentru că nu ajungeau emailurile
// de verificare la înregistrare:
//
// 1. Cheia lipsă trecea drept "re_placeholder" — deci `new Resend(...)` reușea,
//    apelul pleca și eșua abia la Resend, cu un mesaj greu de legat de cauză.
//    Acum lipsa cheii e o eroare explicită, spusă pe șleau.
// 2. Expeditorul implicit era `noreply@TradeGX.io` — alt domeniu decât cel al
//    site-ului (tradegx.com). Resend refuză trimiterea de pe domenii
//    neverificate, deci fiecare email pica.
// 3. `APP_URL` cădea pe `http://localhost:3000` — deci chiar dacă emailul ar fi
//    plecat, linkul de verificare ducea la localhost pentru fiecare utilizator.
//    În producție cade acum pe domeniul real.

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY lipsește — niciun email nu poate fi trimis. " +
      "Setează-o în variabilele de mediu."
    );
  }
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@tradegx.com";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === "production" ? "https://www.tradegx.com" : "http://localhost:3000");

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Verifică adresa de email — TradeGx",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #09090b; color: #fafafa; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 40px;">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
      <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-weight: 900; font-size: 11px;">Gx</span>
      </div>
      <span style="font-size: 18px; font-weight: 700; color: #fafafa;">Trade<span style="color: #818cf8;">Gx</span></span>
    </div>

    <h1 style="font-size: 22px; font-weight: 700; color: #fafafa; margin: 0 0 12px;">Bun venit la TradeGx!</h1>
    <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
      Verifică adresa de email pentru a-ți activa contul și a începe perioada de probă PRO de 14 zile.
    </p>

    <a href="${verifyUrl}"
       style="display: inline-block; background: linear-gradient(135deg, #6366f1, #7c3aed); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin-bottom: 28px;">
      Verifică emailul →
    </a>

    <p style="color: #71717a; font-size: 13px; line-height: 1.5; margin: 0;">
      Linkul expiră în 24 de ore. Dacă nu ai creat un cont, poți ignora acest email.
    </p>

    <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;">
    <p style="color: #52525b; font-size: 12px; margin: 0;">
      TradeGx · Trading Journal Pro · <a href="${APP_URL}" style="color: #818cf8; text-decoration: none;">${APP_URL}</a>
    </p>
  </div>
</body>
</html>`,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Resetează parola — TradeGx",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #09090b; color: #fafafa; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 40px;">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
      <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-weight: 900; font-size: 11px;">Gx</span>
      </div>
      <span style="font-size: 18px; font-weight: 700; color: #fafafa;">Trade<span style="color: #818cf8;">Gx</span></span>
    </div>

    <h1 style="font-size: 22px; font-weight: 700; color: #fafafa; margin: 0 0 12px;">Resetare parolă</h1>
    <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
      Ai solicitat resetarea parolei. Apasă butonul de mai jos pentru a alege o nouă parolă.
    </p>

    <a href="${resetUrl}"
       style="display: inline-block; background: linear-gradient(135deg, #6366f1, #7c3aed); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin-bottom: 28px;">
      Resetează parola →
    </a>

    <p style="color: #71717a; font-size: 13px; line-height: 1.5; margin: 0;">
      Linkul expiră în 1 oră. Dacă nu ai solicitat resetarea parolei, poți ignora acest email.
    </p>

    <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;">
    <p style="color: #52525b; font-size: 12px; margin: 0;">
      TradeGx · Trading Journal Pro · <a href="${APP_URL}" style="color: #818cf8; text-decoration: none;">${APP_URL}</a>
    </p>
  </div>
</body>
</html>`,
  });
}
