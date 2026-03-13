// =============================================================================
// Application Entry Point
// =============================================================================
// Bootstraps the Express server with all middleware, routes, and error handlers.
// =============================================================================

import dotenv from "dotenv";

// Load environment variables BEFORE importing anything that depends on them
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import consultationRoutes from "./routes/consultationRoutes";

// Import OpenAPI spec directly as JSON for serverless portability
import swaggerDocument from "./openapi.json";

// ---------------------------------------------------------------------------
// Express App
// ---------------------------------------------------------------------------

const app = express();
const PORT = parseInt(process.env.PORT || "8000", 10);

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------

/**
 * CORS — configured for local frontend development.
 * In production, replace the origin with your actual frontend domain.
 */
app.use(
  cors({
    origin: [
      "http://localhost:3000", // Next.js / Vite default
      "http://localhost:5173", // Vite alternate
      "http://localhost:5174", // Vite alternate
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

/** Parse JSON request bodies (for the /send endpoint) */
app.use(express.json({ limit: "10mb" }));

/** Parse URL-encoded bodies (rarely needed but good to have) */
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

/**
 * GET /health
 * Simple health-check endpoint for uptime monitors and load balancers.
 */
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "doctor-backend",
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Swagger UI — interactive API documentation
// ---------------------------------------------------------------------------

/**
 * GET /api-docs
 * Serves the Swagger UI with the OpenAPI spec from docs/openapi.yaml.
 */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: "Doctor Backend — API Docs",
  customCss: ".swagger-ui .topbar { display: none }",
}));

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

app.use("/api/consultation", consultationRoutes);

// ---------------------------------------------------------------------------
// 404 Handler
// ---------------------------------------------------------------------------

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found.",
  });
});

// ---------------------------------------------------------------------------
// Global Error Handler
// ---------------------------------------------------------------------------

/**
 * Centralised error handler.
 * Catches all errors thrown or forwarded via next(error) in controllers.
 * In development we expose the full error message; in production we hide it.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Unhandled error:", err.message);
  console.error(err.stack);

  // Multer-specific errors (file too large, wrong type, etc.)
  if (err.message.includes("Unsupported audio format")) {
    res.status(415).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Multer file-size limit
  if (err.message.includes("File too large")) {
    res.status(413).json({
      success: false,
      error: "File too large. Maximum upload size is 20 MB.",
    });
    return;
  }

  // Generic server error
  const isDev = process.env.NODE_ENV !== "production";
  res.status(500).json({
    success: false,
    error: "Internal server error.",
    ...(isDev && { details: err.message }),
  });
});

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`
  ┌──────────────────────────────────────────────┐
  │                                              │
  │   🏥  Doctor Backend is running              │
  │   📡  http://localhost:${PORT}                 │
  │   🩺  POST /api/consultation/process         │
  │   📱  POST /api/consultation/send            │
  │   💚  GET  /health                           │
  │   📖  GET  /api-docs                         │
  │                                              │
  └──────────────────────────────────────────────┘
    `);
  });
}

export default app;
