import dotenv from "dotenv";
import nodemailer, { Transporter, TransportOptions } from "nodemailer";

dotenv.config();

interface SMTPConfig extends TransportOptions {
  service: string;
  port: number | string;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls: {
    rejectUnauthorized: boolean;
  };
}

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

const smtpConfig: SMTPConfig = {
  service: "gmail",
  port: parseInt(getEnv("SMTP_PORT") || "587"),
  secure: false,
  auth: {
    user: getEnv("SMTP_USER"),
    pass: getEnv("SMTP_USER_PASS"),
  },
  tls: {
    rejectUnauthorized: false,
  },
};

export const transporter: Transporter = nodemailer.createTransport(smtpConfig);
