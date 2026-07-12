'use strict';

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

const { errorHandler } = require('./src/middleware/errorHandler');
const authRouter = require('./src/routes/auth');
const dashboardRouter = require('./src/routes/dashboard');
const trackingRouter = require('./src/routes/tracking');

const app = express();

// ── Global middleware ────────────────────────────────────────
app.use(helmet());
// ── CORS — require explicit origin when credentials: true ──
const corsOrigin = process.env.CORS_ORIGIN;
if (!corsOrigin || corsOrigin === '*') {
  console.warn('[WARN] CORS_ORIGIN is not set or is wildcard. Defaulting to http://localhost:5500 for development.');
}
app.use(cors({
  origin: (corsOrigin && corsOrigin !== '*') ? corsOrigin : 'http://localhost:5500',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ── Health check (unauthenticated) ──────────────────────────
app.get('/health', (_req, res) =>
  res.json({ success: true, data: { status: 'ok', ts: new Date().toISOString() } })
);

// ── API v1 — Auth routes ────────────────────────────────────
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/tracking', trackingRouter);

// ── 404 handler ─────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found.' },
  })
);

// ── Central error handler (must be last) ────────────────────
app.use(errorHandler);

module.exports = app;
