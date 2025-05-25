import winston from "winston";
import { config } from "../config/config";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Determine log level based on environment
const level = () => {
  return config.NODE_ENV === "development" ? "debug" : "info";
};

// Define log colors
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Custom log format
const logFormat = combine(
  timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  errors({ stack: true }),
  printf((info) => {
    let message = `${info.timestamp} ${info.level}: ${info.message}`;
    if (info.stack) {
      message += `\n${info.stack}`;
    }
    return message;
  })
);

// Console transport format (with colors)
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  printf((info) => {
    let message = `${info.timestamp} ${info.level}: ${info.message}`;
    if (info.stack) {
      message += `\n${info.stack}`;
    }
    return message;
  })
);

// File transport for errors only
const errorFileTransport = new DailyRotateFile({
  level: "error",
  filename: "logs/error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "30d",
});

// File transport for all logs
const combinedFileTransport = new DailyRotateFile({
  filename: "logs/combined-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "30d",
});

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    errorFileTransport,
    combinedFileTransport,
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
});

// Stream for morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;
