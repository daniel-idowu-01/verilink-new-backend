import app from "./app";
import logger from "./utils/logger";
import { config } from "./config/config";

// Start server with proper error handling
const PORT = config.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});

// Handle server errors
server.on("error", (error) => {
  logger.error("Server error:", error);
  console.error("Server error:", error);
  process.exit(1);
});
