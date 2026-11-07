import nodemailer, { Transporter } from "nodemailer";
import { ENV } from "../config/env";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const singleLine = (value: string) => value.replace(/[\r\n]+/g, " ");

export class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    if (ENV.SMTP.PASS) {
      this.transporter = nodemailer.createTransport({
        host: ENV.SMTP.HOST,
        port: ENV.SMTP.PORT,
        secure: ENV.SMTP.PORT === 465,
        auth: {
          user: ENV.SMTP.USER,
          pass: ENV.SMTP.PASS,
        },
      });
    }
  }

  async sendContactInquiryNotification(inquiry: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    companyName?: string | null;
  }): Promise<boolean> {
    const adminEmail = ENV.SMTP.ADMIN_EMAIL;

    console.log(
      `[EMAIL INQUIRY NOTIFICATION] 📬 New Inquiry from ${inquiry.name} (${inquiry.email}, ${inquiry.phone}): "${inquiry.subject}"`
    );

    if (!this.transporter) {
      console.log(`[EMAIL] SMTP credentials not set. Simulated email delivery to ${adminEmail}.`);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: ENV.SMTP.FROM,
        to: adminEmail,
        replyTo: inquiry.email,
        subject: `[The Solutions BD Inquiry] ${singleLine(inquiry.subject)} - from ${singleLine(inquiry.name)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0f172a; margin-top: 0;">New Customer / Corporate Inquiry</h2>
            <p><strong>Name:</strong> ${escapeHtml(inquiry.name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(inquiry.email)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(inquiry.phone)}</p>
            ${inquiry.companyName ? `<p><strong>Company:</strong> ${escapeHtml(inquiry.companyName)}</p>` : ""}
            <p><strong>Subject:</strong> ${escapeHtml(inquiry.subject)}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <h3>Message:</h3>
            <p style="white-space: pre-wrap; background: #f8fafc; padding: 15px; border-radius: 6px;">${escapeHtml(inquiry.message)}</p>
            <footer style="margin-top: 20px; font-size: 12px; color: #64748b;">
              Sent automatically from The Solutions BD Platform.
            </footer>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.warn(`[EMAIL] Failed to send email via SMTP:`, (error as Error).message);
      return false;
    }
  }

  async sendEmailVerification(to: string, name: string, code: string): Promise<boolean> {
    return this.sendTransactional(
      to,
      "Your The Solutions BD verification code",
      `<p>Hello ${escapeHtml(name)},</p>
       <p>Your email verification code is:</p>
       <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${escapeHtml(code)}</p>
       <p>This code expires in 15 minutes. If you did not create an account, you can ignore this email.</p>`,
      `verification code ${code}`
    );
  }

  async sendPasswordReset(to: string, name: string, resetUrl: string): Promise<boolean> {
    return this.sendTransactional(
      to,
      "Reset your The Solutions BD password",
      `<p>Hello ${escapeHtml(name)},</p>
       <p>Use this link to choose a new password. It expires in 1 hour.</p>
       <p><a href="${escapeHtml(resetUrl)}">Reset my password</a></p>
       <p>If you did not ask for this, you can ignore this email and your password will not change.</p>`,
      `password reset link ${resetUrl}`
    );
  }

  private async sendTransactional(
    to: string,
    subject: string,
    html: string,
    devPreview: string
  ): Promise<boolean> {
    if (!this.transporter) {
      // Secrets are printed only on a developer machine, never in production logs.
      if (ENV.IS_PRODUCTION) {
        console.error(`[EMAIL] SMTP is not configured. Could not send "${subject}".`);
        return false;
      }
      console.log(`[EMAIL:DEV] To ${to}: ${devPreview}`);
      return true;
    }

    try {
      await this.transporter.sendMail({ from: ENV.SMTP.FROM, to, subject, html });
      return true;
    } catch (error) {
      console.warn(`[EMAIL] Failed to send "${subject}":`, (error as Error).message);
      return false;
    }
  }
}

export const emailService = new EmailService();
