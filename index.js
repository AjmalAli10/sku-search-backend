import express from "express";
import { semanticMatchHandler } from "./normalization/api/semanticMatchHandler.js";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// POST /api/search route
// app.post("/api/search", searchHandler);

app.post("/api/semantic-match", semanticMatchHandler);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

try {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
} catch (error) {
  console.error("Failed to start server:", error);
  process.exit(1);
}
