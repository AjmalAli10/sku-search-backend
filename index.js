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

// Import services
import ChromaVisualizationService from "./services/chromaVisualizationService.js";
import ChromaVectorDBService from "./services/chromaVectorDBService.js";

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "SKU Embedding Service",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Data storage status endpoint
app.get("/api/storage/status", async (req, res) => {
  try {
    const chromaService = new ChromaVectorDBService();
    await chromaService.initializeCollection();
    const stats = await chromaService.getCollectionStats();

    res.json({
      status: "success",
      data: {
        totalSKUs: stats.totalVectorCount,
        collectionName: stats.collectionName,
        dimension: stats.dimension,
        hasData: stats.totalVectorCount > 0,
        sampleIds: stats.sampleIds.slice(0, 5),
        timestamp: stats.timestamp,
      },
    });
  } catch (error) {
    console.error("Error checking storage status:", error);
    res.status(500).json({
      status: "error",
      error: "Failed to check storage status",
      message: error.message,
    });
  }
});

// Get sample data endpoint
app.get("/api/storage/sample", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const chromaService = new ChromaVectorDBService();
    await chromaService.initializeCollection();

    const stats = await chromaService.getCollectionStats();
    if (stats.totalVectorCount === 0) {
      return res.json({
        status: "success",
        data: [],
        message: "No data found in collection",
      });
    }

    const sampleIds = stats.sampleIds.slice(0, limit);
    const skus = await chromaService.getSKUs(sampleIds);

    res.json({
      status: "success",
      data: skus.map((sku) => ({
        id: sku.id,
        name: sku.metadata?.name,
        category: sku.metadata?.category_name,
        brand: sku.metadata?.brand,
        price: sku.metadata?.price,
        hasEmbedding: !!sku.embedding,
        documentPreview: sku.document?.substring(0, 100),
      })),
    });
  } catch (error) {
    console.error("Error getting sample data:", error);
    res.status(500).json({
      status: "error",
      error: "Failed to get sample data",
      message: error.message,
    });
  }
});

// Chroma visualization endpoints
app.get("/api/chroma/overview", async (req, res) => {
  try {
    const visualizationService = new ChromaVisualizationService();
    const overview = await visualizationService.getCollectionOverview();
    res.json(overview);
  } catch (error) {
    console.error("Error getting Chroma overview:", error);
    res.status(500).json({
      error: "Failed to get Chroma overview",
      message: error.message,
    });
  }
});

app.get("/api/chroma/export", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const visualizationService = new ChromaVisualizationService();
    const exportData = await visualizationService.exportForVisualization(limit);
    res.json(exportData);
  } catch (error) {
    console.error("Error exporting Chroma data:", error);
    res.status(500).json({
      error: "Failed to export Chroma data",
      message: error.message,
    });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "SKU Embedding Service",
    version: "1.0.0",
    description: "Service for processing SKU data and generating embeddings",
    usage: "Use npm run load-csv to load SKU data from CSV files",
    health: "GET /health",
    dashboard: "Visit /dashboard to view Chroma data",
    endpoints: {
      health: "GET /health",
      storageStatus: "GET /api/storage/status",
      storageSample: "GET /api/storage/sample?limit=5",
      chromaOverview: "GET /api/chroma/overview",
      chromaExport: "GET /api/chroma/export",
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
    console.log(`🔍 Chroma Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`📦 To load SKU data: npm run load-csv`);
  });
} catch (error) {
  console.error("Failed to start server:", error);
  process.exit(1);
}
