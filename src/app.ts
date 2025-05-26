import fs from "fs";
import path from "path";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import helmet from "helmet";
import express from "express";
import mongoose from "mongoose";
import cookieParser from 'cookie-parser';

import routes from "./routes";
import logger from "./utils/logger";
import { config } from "./config/config";
import { requestLogger, errorLogger } from "./middlewares/requestLogger";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";

// Load environment variables
dotenv.config();

const app = express();

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Set up unhandled exception and rejection handlers
process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(error.name, error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error("Reason:", reason);
  process.exit(1);
});

// Function to connect to MongoDB with retry logic
const connectDB = async () => {
  try {
    if (!config.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in config");
    }

    logger.info("Connecting to MongoDB...");
    await mongoose.connect(config.MONGODB_URI);
    logger.info("Connected to MongoDB successfully");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    console.error("Failed to connect to MongoDB:", error);

    // Retry connection after 5 seconds
    logger.info("Retrying connection in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(cookieParser());
// app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);

// Add a simple health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    dbConnection:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Request logging
app.use(requestLogger);

// Routes - Wrap in try/catch to catch any import errors
try {
  app.use("/api/v1", routes);
} catch (error) {
  logger.error("Error setting up routes:", error);
  console.error("Error setting up routes:", error);
}

// 404 Handler
app.use(notFoundHandler);

// Error logging
app.use(errorLogger);

// Error handler
app.use(errorHandler);

export default app;
