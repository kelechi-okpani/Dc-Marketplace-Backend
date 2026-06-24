import nodemailer from 'nodemailer';
import { SendEmailOptions } from '../types';
import logger from './logger';

const sendEmail = async ({ email, subject, template, data, html, text }: SendEmailOptions): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
  });

  let emailHtml = html;

  if (!emailHtml && template === 'emailVerification' && data) {
    emailHtml = `
      <h2>Welcome to Shuk, ${data.name}!</h2>
      <p>Please verify your email:</p>
      <a href="${data.verifyUrl}" style="background:#7C3AED;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>`;
  }

  if (!emailHtml && template === 'passwordReset' && data) {
    emailHtml = `
      <h2>Hi ${data.name},</h2>
      <p>You requested a password reset:</p>
      <a href="${data.resetUrl}" style="background:#7C3AED;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">
        Reset Password
      </a>
      <p>Expires in 1 hour.</p>`;
  }

  try {
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject,
      html: emailHtml,
      text: text ?? emailHtml?.replace(/<[^>]+>/g, ''),
    });
    logger.info(`Email sent to ${email}`);
  } catch (error) {
    logger.error(`Email error: ${(error as Error).message}`);
    throw error;
  }
};

export default sendEmail;