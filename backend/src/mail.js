import nodemailer from "nodemailer";

let transport;

// SMTP is optional locally. Panel notifications always work without it.
export async function sendMail(to, subject, body) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_FROM || !to) return;
  if (Boolean(SMTP_USER) !== Boolean(SMTP_PASS)) {
    console.error("SMTP_USER and SMTP_PASS must both be set, or both left empty.");
    return;
  }
  try {
    transport ||= nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: Number(SMTP_PORT || 587) === 465,
      ...(SMTP_USER ? { auth: { user: SMTP_USER, pass: SMTP_PASS } } : {}),
    });
    await transport.sendMail({ from: SMTP_FROM, to, subject: `MarketLink: ${subject}`, text: body });
  } catch (error) {
    console.error("SMTP delivery failed:", error.message);
  }
}
