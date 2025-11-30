// src/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

// Only load morgan & swagger when not running tests (keeps Jest output clean & fast)
const isTest = process.env.NODE_ENV === "test";
const morgan = !isTest ? require("morgan") : null;
const swaggerUi = !isTest ? require("swagger-ui-express") : null;
const swaggerSpecs = !isTest ? require("./config/swagger") : null;

const userRoutes = require("./routes/userRoutes");
const photographerRoutes = require("./routes/photographerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const parentRoutes = require("./routes/parentRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

const { stripeWebhookHandler } = require("./controllers/admin/stripeWebhookController");

const app = express();

// Disable ETag headers (so clients never get a 304)
app.disable("etag");

// ── CORS ──────────────────────────────────────────────────────────────────────
// - In test: allow all origins to simplify Supertest runs.
// - In dev: allow a small whitelist (plus any CLIENT_URL provided).
// - In prod: lock to single CLIENT_URL.
const isDev = process.env.NODE_ENV === "development";
const corsOptions = isTest
  ? { origin: true, credentials: true }
  : {
      origin: isDev
        ? [
            process.env.CLIENT_URL || "http://localhost:3000",
            "http://localhost:5000",
            "http://localhost:8081",
            "http://10.213.202.86:8081",
          ]
        : process.env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    };

app.use(cors(corsOptions));

// Stripe webhook must come before express.json()
app.post(
  "/api/admin/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler
);

// Global middleware
app.use(express.json());
app.use(cookieParser());
if (!isTest && morgan) app.use(morgan("dev"));

// ─── NO-CACHE for API ─────────────────────────────────────────────────────────
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// ── Swagger (skip during tests) ───────────────────────────────────────────────
if (!isTest && swaggerUi && swaggerSpecs) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpecs, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "School Photography API Documentation",
      swaggerOptions: {
        defaultModelsExpandDepth: 3,
        defaultModelExpandDepth: 3,
        docExpansion: "list",
        filter: true,
        showRequestHeaders: true,
        tryItOutEnabled: true,
        requestInterceptor: (req) => req,
        responseInterceptor: (res) => res,
      },
    })
  );
}

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 message:
 *                   type: string
 *                   example: "API is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Current server timestamp
 *                 environment:
 *                   type: string
 *                   description: Current environment
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api", userRoutes);
app.use("/api/photographer", photographerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/parent", parentRoutes);

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get user profile (alternative endpoint)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   description: User ID
 *                 role:
 *                   type: string
 *                   enum: ['admin', 'parent', 'photographer']
 *                   description: User role
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get("/api/profile", authMiddleware, (req, res) => {
  res.json({ userId: req.user.userId, role: req.user.role });
});

/**
 * @swagger
 * /admin:
 *   get:
 *     summary: Admin-only endpoint
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Admin access granted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secret:
 *                   type: string
 *                   example: "only for admins"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get("/api/admin", authMiddleware, roleMiddleware("admin"), (req, res) => {
  res.json({ secret: "only for admins" });
});

// Serve React in production...
if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "..", "webpage", "build");
  app.use(express.static(buildPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

module.exports = app;
