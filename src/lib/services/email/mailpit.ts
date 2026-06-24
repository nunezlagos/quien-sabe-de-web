const MAILPIT_URL = process.env.MAILPIT_URL || 'http://quien-sabe-mailpit:8025';

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail(payload: EmailPayload): Promise<boolean> {
  try {
    const res = await fetch(`${MAILPIT_URL}/api/v1/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        To: [{ Address: payload.to, Name: '' }],
        Subject: payload.subject,
        TextBody: payload.text,
        HtmlBody: payload.html || payload.text,
        MessageStream: 'outbound',
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[email] Mailpit send failed:', err);
    return false;
  }
}

export function buildVerificationEmail(email: string, token: string, siteUrl: string) {
  const link = `${siteUrl}/api/v1/auth/verify-email?token=${token}`;
  return {
    to: email,
    subject: 'Verifica tu email — QuiénSabe',
    text: `Haz clic en este enlace para verificar tu email: ${link}`,
    html: `<p>Haz clic en <a href="${link}">${link}</a> para verificar tu email.</p>`,
  };
}

export function buildWelcomeEmail(name: string, email: string) {
  return {
    to: email,
    subject: '¡Bienvenido a QuiénSabe!',
    text: `Hola ${name}, bienvenido a QuiénSabe.`,
    html: `<p>Hola <b>${name}</b>, bienvenido a QuiénSabe.</p>`,
  };
}
