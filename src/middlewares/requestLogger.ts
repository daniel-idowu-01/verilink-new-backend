import logger from "../utils/logger";
import expressWinston from "express-winston";

export const requestLogger = expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorize: false,
  ignoreRoute: (req) => {
    // Ignore health check routes in logs
    return req.url === "/health" || req.url === "/favicon.ico";
  },
});

export const errorLogger = expressWinston.errorLogger({
  winstonInstance: logger,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
});
