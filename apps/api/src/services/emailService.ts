import nodemailer, { Transporter } from "nodemailer";
import { ENV } from "../config/env";

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
        subject: `[Solusation BD Inquiry] ${inquiry.subject} - from ${inquiry.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0f172a; margin-top: 0;">New Customer / Corporate Inquiry</h2>
            <p><strong>Name:</strong> ${inquiry.name}</p>
            <p><strong>Email:</strong> ${inquiry.email}</p>
            <p><strong>Phone:</strong> ${inquiry.phone}</p>
            ${inquiry.companyName ? `<p><strong>Company:</strong> ${inquiry.companyName}</p>` : ""}
            <p><strong>Subject:</strong> ${inquiry.subject}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <h3>Message:</h3>
            <p style="white-space: pre-wrap; background: #f8fafc; padding: 15px; border-radius: 6px;">${inquiry.message}</p>
            <footer style="margin-top: 20px; font-size: 12px; color: #64748b;">
              Sent automatically from The Solusation BD Platform.
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
}

export const emailService = new EmailService();
