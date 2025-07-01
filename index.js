import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import { semanticMatchHandler } from "./normalization/api/semanticMatchHandler.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(express.json());
app.post("/api/semantic-match", semanticMatchHandler);

// CORS middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://yourdomain.com"] // Replace with your domain
        : ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files
app.use(express.static("public"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "SKU Embedding Service",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "SKU Embedding Service",
    version: "1.0.0",
    description: "Service for processing SKU data and generating embeddings",
    usage: "Use npm run load-csv to load SKU data from CSV files",
    health: "GET /health",
    endpoints: {
      health: "GET /health",
    },
  });
});

// Dashboard endpoint
app.get("/dashboard", (req, res) => {
  res.sendFile("index.html", { root: "./public" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `The endpoint ${req.method} ${req.path} does not exist`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);

  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// Start server
try {
  app.listen(PORT, () => {
    console.log(`🚀 SKU Embedding Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📖 Service info: http://localhost:${PORT}/`);
    console.log(`🔍 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`📦 To load SKU data: npm run load-csv`);
  });
} catch (error) {
  console.error("Failed to start server:", error);
  process.exit(1);
}
