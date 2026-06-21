import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");
}
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@TradeGX.io";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Verifică adresa de email — TradeGX",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #09090b; color: #fafafa; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 40px;">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
      <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-weight: 900; font-size: 11px;">GX</span>
      </div>
      <span style="font-size: 18px; font-weight: 700; color: #fafafa;">Trade<span style="color: #34d399;">GX</span></span>
    </div>

    <h1 style="font-size: 22px; font-weight: 700; color: #fafafa; margin: 0 0 12px;">Bun venit la TradeGX!</h1>
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
      TradeGX · Trading Journal Pro · <a href="${APP_URL}" style="color: #818cf8; text-decoration: none;">${APP_URL}</a>
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
    subject: "Resetează parola — TradeGX",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #09090b; color: #fafafa; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 40px;">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
      <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-weight: 900; font-size: 11px;">GX</span>
      </div>
      <span style="font-size: 18px; font-weight: 700; color: #fafafa;">Trade<span style="color: #34d399;">GX</span></span>
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
      TradeGX · Trading Journal Pro · <a href="${APP_URL}" style="color: #818cf8; text-decoration: none;">${APP_URL}</a>
    </p>
  </div>
</body>
</html>`,
  });
}
