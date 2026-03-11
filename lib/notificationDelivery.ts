const APP_NAME = process.env.APP_NAME || "RollVault";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO;

class DeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeliveryError";
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(task: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        await sleep(150 * (i + 1));
      }
    }
  }
  throw lastError;
}

function ensureEmailConfigured() {
  if (RESEND_API_KEY && EMAIL_FROM) return true;
  if (IS_PRODUCTION) {
    throw new DeliveryError("Email provider is not configured.");
  }
  return false;
}

async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const configured = ensureEmailConfigured();
  if (!configured) {
    console.warn(
      "Email provider not configured. Skipping email delivery in non-production mode."
    );
    return;
  }

  await withRetry(async () => {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject,
        html,
        text,
        ...(EMAIL_REPLY_TO ? { reply_to: EMAIL_REPLY_TO } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new DeliveryError(`Resend API error: ${response.status} ${body}`);
    }
  });
}

export async function sendEmailVerificationCode({
  toEmail,
  code,
}: {
  toEmail: string;
  code: string;
}) {
  const subject = `${APP_NAME} email verification code`;
  const text = `Your ${APP_NAME} verification code is ${code}. It expires in 15 minutes.`;
  const html = `<p>Your <strong>${APP_NAME}</strong> verification code is:</p><p style="font-size:24px;letter-spacing:3px;"><strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`;

  await sendEmail({ to: toEmail, subject, text, html });
}

export async function sendPasswordResetEmail({
  toEmail,
  resetLink,
}: {
  toEmail: string;
  resetLink: string;
}) {
  const subject = `${APP_NAME} password reset`;
  const text = `Reset your ${APP_NAME} password using this link: ${resetLink}. This link expires in 30 minutes.`;
  const html = `<p>Reset your <strong>${APP_NAME}</strong> password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link expires in 30 minutes.</p>`;

  await sendEmail({ to: toEmail, subject, text, html });
}
