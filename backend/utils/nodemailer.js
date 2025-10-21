import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const readEnv = (k) => {
  const v = process.env[k] ?? process.env[k.replace('SMTP', 'SMPT')] ?? '';
  return String(v).trim().replace(/^['"]|['"]$/g, '');
};

const SMTP_HOST = readEnv('SMTP_HOST') || 'smtp-relay.brevo.com';
const SMTP_PORT = Number(readEnv('SMTP_PORT') || 587);
const SMTP_USER = readEnv('SMTP_USER');
const SMTP_PASS = readEnv('SMTP_PASS');
const SENDER_EMAIL = readEnv('SENDER_EMAIL') || SMTP_USER;
const GMAIL_PASS = readEnv('EMAIL_PASSWORD');

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  requireTLS: SMTP_PORT === 587,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

export async function sendEmail({ to, subject, html, text, from }) {
  const mail = {
    from: from || SENDER_EMAIL || SMTP_USER,
    to,
    subject,
    html,
    text,
  };
  try {
    if (!transporter.options.auth) throw new Error('NO_SMTP_AUTH');
    return await transporter.sendMail(mail);
  } catch (err) {
    // Optional fallback via Gmail App Password if configured
    if (SENDER_EMAIL && GMAIL_PASS) {
      try {
        const gmail = nodemailer.createTransport({ service: 'gmail', auth: { user: SENDER_EMAIL, pass: GMAIL_PASS } });
        return await gmail.sendMail(mail);
      } catch (e) {
        throw err;
      }
    }
    throw err;
  }
}

export default transporter;