/**
 * Transactional Mailer Service for Ableo
 * Supports Resend API in production or secure server-side logging in development.
 * Note: Never sends secrets/tokens over client JSON responses.
 */

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<{ sent: boolean; provider: string; error?: string }> {
  const resendApiKey = process.env["RESEND_API_KEY"];
  const fromEmail = process.env["EMAIL_FROM"] || "Ableo <support@ableo.app>";

  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[Mailer] Resend API error:", response.status, errText);
        return { sent: false, provider: "resend", error: errText };
      }

      console.info(`[Mailer] Transactional email sent to ${to} via Resend.`);
      return { sent: true, provider: "resend" };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[Mailer] Failed to send via Resend:", errorMsg);
      return { sent: false, provider: "resend", error: errorMsg };
    }
  }

  // Safe development / fallback logging (visible ONLY on server terminal, NEVER returned to client)
  console.info("\n" + "=".repeat(64));
  console.info(`📬 [ABLEO MAILER - SECURE SERVER LOG]`);
  console.info(`   To:      ${to}`);
  console.info(`   Subject: ${subject}`);
  console.info(`   Content:\n${text}`);
  console.info("=".repeat(64) + "\n");

  return { sent: true, provider: "server-console-fallback" };
}

export async function sendPasswordResetEmail(options: {
  to: string;
  token: string;
  appUrl?: string;
}): Promise<boolean> {
  const baseUrl = options.appUrl || process.env["APP_URL"] || "http://localhost:8080";
  const resetLink = `${baseUrl.replace(/\/$/, "")}/login?token=${encodeURIComponent(options.token)}&email=${encodeURIComponent(options.to)}`;

  const subject = "Reset your Ableo password";
  const text = `Hello,

A password reset was requested for your Ableo account (${options.to}).

To reset your password, visit the following secure link:
${resetLink}

Or enter your 64-character token manually on the login page:
${options.token}

This link is valid for 1 hour. If you did not request this reset, you can safely ignore this message.

— Team Ableo`;

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1c1917;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">Reset your Ableo password</h2>
      <p style="font-size: 15px; line-height: 1.5;">A password reset was requested for your account (<strong>${options.to}</strong>).</p>
      <div style="margin: 24px 0;">
        <a href="${resetLink}" style="background-color: #0f766e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 14px; display: inline-block;">Reset Password</a>
      </div>
      <p style="font-size: 13px; color: #57534e;">If the button above does not work, copy and paste this link into your browser:<br/><a href="${resetLink}" style="color: #0f766e;">${resetLink}</a></p>
      <p style="font-size: 13px; color: #78716c; margin-top: 24px; border-top: 1px solid #e7e5e4; padding-top: 16px;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
  `;

  const res = await sendEmail({ to: options.to, subject, html, text });
  return res.sent;
}

export async function sendEmailVerificationCode(options: {
  to: string;
  code: string;
}): Promise<boolean> {
  const subject = `Your Ableo verification code is ${options.code}`;
  const text = `Hello,

Your verification code for Ableo is: ${options.code}

Enter this 6-digit code on the Ableo platform to verify your email address. This code expires in 15 minutes.

— Team Ableo`;

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1c1917;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">Verify your Ableo email address</h2>
      <p style="font-size: 15px; line-height: 1.5;">Enter the following 6-digit code to complete verification:</p>
      <div style="margin: 24px 0; background: #f5f5f4; padding: 16px 24px; border-radius: 12px; display: inline-block; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f766e;">
        ${options.code}
      </div>
      <p style="font-size: 13px; color: #78716c; margin-top: 24px; border-top: 1px solid #e7e5e4; padding-top: 16px;">This code expires in 15 minutes. If you did not request this code, no action is needed.</p>
    </div>
  `;

  const res = await sendEmail({ to: options.to, subject, html, text });
  return res.sent;
}
