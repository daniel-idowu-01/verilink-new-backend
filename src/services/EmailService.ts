import logger from "../utils/logger";
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
}
