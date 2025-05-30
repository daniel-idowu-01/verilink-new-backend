import logger from "../utils/logger";
import { config } from "../config/config";
import { transporter } from "../config/emailTransport";

interface EmailOptions {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path: string;
    cid?: string;
  }>;
}

export class EmailService {
  constructor() {}

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await transporter.sendMail({
        ...options,
      });
      logger.info("Message sent: " + info.messageId);
      return true;
    } catch (error) {
      logger.error("Error sending email: " + error);
      return false;
    }
  }

  async sendVendorWelcomeEmail(params: {
    email: string;
    name: string;
    businessName: string;
    verificationToken: string;
    kycRequirements: string[];
  }) {
    const html = `
      <h1>Welcome to Verilink, ${params.name}!</h1>
      <p>Your business <strong>${
        params.businessName
      }</strong> has been registered.</p>
      
      <h3>Next Steps:</h3>
      <ol>
        <li>Verify your email: <a href="${config.BASE_URL}/verify-email?token=${
      params.verificationToken
    }">Click here</a></li>
        <li>Complete KYC by uploading:
          <ul>
            ${params.kycRequirements.map((req) => `<li>${req}</li>`).join("")}
          </ul>
        </li>
      </ol>

      <p>For Nigerian businesses, CAC verification must be completed within 7 days.</p>
    `;

    await transporter.sendMail({
      to: params.email,
      subject: `Action Required: Complete Your Verilink Vendor Setup`,
      html,
    });
  }
}
