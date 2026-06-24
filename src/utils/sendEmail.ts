import nodemailer from 'nodemailer';
import { SendEmailOptions } from '../types';
import logger from './logger';

// Helper component for a consistent professional email layout
const getEmailWrapper = (title: string, contentHTML: string): string => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F9FAFB;padding:40px 20px;">
      <tr>
        <td align="center">
          <table width="100%" max-width="570" border="0" cellspacing="0" cellpadding="0" style="max-width:570px;background-color:#FFFFFF;border:1px solid:#E5E7EB;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
            <!-- Header Brand Element -->
            <tr>
              <td style="background-color:#7C3AED;padding:32px;text-align:center;">
                <h1 style="margin:0;color:#FFFFFF;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Shuk</h1>
              </td>
            </tr>
            <!-- Main Core Content -->
            <tr>
              <td style="padding:40px 32px;color:#1F2937;font-size:16px;line-height:24px;">
                ${contentHTML}
              </td>
            </tr>
            <!-- Clean Context Footer -->
            <tr>
              <td style="padding:0 32px 40px 32px;text-align:center;color:#9CA3AF;font-size:13px;line-height:20px;">
                <p style="margin:0 0 16px 0;">You received this because an action was requested on your Shuk account.</p>
                <p style="margin:0;">&copy; ${new Date().getFullYear()} Shuk. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

const getTemplateHtml = (template: string, data: any): string | undefined => {
  if (template === 'emailVerification' && data) {
    return getEmailWrapper(
      'Verify your email address',
      `
      <h2 style="margin:0 0 16px 0;color:#111827;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Welcome to Shuk, ${data.name}!</h2>
      <p style="margin:0 0 24px 0;color:#4B5563;">Thank you for signing up. Please verify your account email address by clicking the action button below:</p>
      <table border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 28px auto;">
        <tr>
          <td align="center" style="border-radius:8px;" bgcolor="#7C3AED">
            <a href="${data.verifyUrl}" target="_blank" style="font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;padding:14px 32px;display:inline-block;letter-spacing:0.2px;">
              Verify Email Address
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 16px 0;color:#6B7280;font-size:14px;text-align:center;">This secure confirmation link will expire in 24 hours.</p>
      <hr style="border:0;border-top:1px solid #E5E7EB;margin:24px 0;" />
      <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:18px;word-break:break-all;">If you are having trouble clicking the button, copy and paste this URL directly into your browser:<br/><a href="${data.verifyUrl}" style="color:#7C3AED;text-decoration:underline;">${data.verifyUrl}</a></p>
      `
    );
  }

  if (template === 'passwordReset' && data) {
    return getEmailWrapper(
      'Reset your password',
      `
      <h2 style="margin:0 0 16px 0;color:#111827;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Hello ${data.name},</h2>
      <p style="margin:0 0 24px 0;color:#4B5563;">We received a request to securely reset your password for your Shuk account. Click the button below to complete the setup process:</p>
      <table border="0" cellspacing="0" cellpadding="0" style="margin:0 auto 28px auto;">
        <tr>
          <td align="center" style="border-radius:8px;" bgcolor="#7C3AED">
            <a href="${data.resetUrl}" target="_blank" style="font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;padding:14px 32px;display:inline-block;letter-spacing:0.2px;">
              Reset Password
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 16px 0;color:#EF4444;font-size:14px;font-weight:500;text-align:center;">This secure link expires in 1 hour.</p>
      <p style="margin:0 0 16px 0;color:#6B7280;font-size:14px;">If you did not request this configuration adjustment, you can safely ignore this automated message—your current credentials will remain safe and unchanged.</p>
      <hr style="border:0;border-top:1px solid #E5E7EB;margin:24px 0;" />
      <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:18px;word-break:break-all;">If you are having trouble clicking the button, copy and paste this URL directly into your browser:<br/><a href="${data.resetUrl}" style="color:#7C3AED;text-decoration:underline;">${data.resetUrl}</a></p>
      `
    );
  }

  return undefined;
};

const sendEmail = async (
  { email, subject, template, data, html, text }: SendEmailOptions & { text?: string }
): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
  });

  const emailHtml = html || (template ? getTemplateHtml(template, data) : undefined);

  try {
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject,
      html: emailHtml,
      text: text ?? emailHtml?.replace(/<[^>]+>/g, '') ?? '',
    });
    logger.info(`Email sent to ${email}`);
  } catch (error) {
    logger.error(`Email error: ${(error as Error).message}`);
    throw error;
  }
};

export default sendEmail;

// import nodemailer from 'nodemailer';
// import { SendEmailOptions } from '../types';
// import logger from './logger';

// const sendEmail = async (
//   { email, subject, template, data, html, text }: SendEmailOptions & { text?: string }
// ): Promise<void> => {
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: Number(process.env.SMTP_PORT),
//     auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
//   });

//   let emailHtml = html;

//   if (!emailHtml && template === 'emailVerification' && data) {
//     emailHtml = `
//       <h2>Welcome to Shuk, ${data.name}!</h2>
//       <p>Please verify your email:</p>
//       <a href="${data.verifyUrl}" style="background:#7C3AED;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">
//         Verify Email
//       </a>
//       <p>This link expires in 24 hours.</p>`;
//   }

//   if (!emailHtml && template === 'passwordReset' && data) {
//     emailHtml = `
//       <h2>Hi ${data.name},</h2>
//       <p>You requested a password reset:</p>
//       <a href="${data.resetUrl}" style="background:#7C3AED;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">
//         Reset Password
//       </a>
//       <p>Expires in 1 hour.</p>`;
//   }

//   try {
//     await transporter.sendMail({
//       from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
//       to: email,
//       subject,
//       html: emailHtml,
//       text: text ?? emailHtml?.replace(/<[^>]+>/g, ''),
//     });
//     logger.info(`Email sent to ${email}`);
//   } catch (error) {
//     logger.error(`Email error: ${(error as Error).message}`);
//     throw error;
//   }
// };

// export default sendEmail;