import "server-only";
import nodemailer from "nodemailer";

const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  : null;

export async function sendMail(to: string, subject: string, html: string) {
  if (!transporter) {
    // ponytail: sin SMTP configurado, logueamos el link en vez de fallar.
    console.log(`[mail:dev] to=${to} subject="${subject}"\n${html}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM_ADDRESS || "no-reply@miseby.com",
    to,
    subject,
    html,
  });
}
