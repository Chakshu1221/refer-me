import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import profileRoutes from './routes/profile.js';
import requestRoutes from './routes/requests.js';
import offerRoutes from './routes/offers.js';
import uploadRoutes from './routes/uploads.js';
import subscriptionRoutes from './routes/subscriptions.js';
import documentRoutes from './routes/documents.js';
import openingRoutes from './routes/openings.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const START_TS = Date.now();

// ---- middleware ----
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ---- health + keep-alive ----
app.get('/', (_req, res) => res.json({ ok: true, service: 'refer-me-api' }));
app.get('/health', (_req, res) => res.json({ status: 'healthy', ts: Date.now() }));

/**
 * GET /ping  -> lightweight keep-alive.
 * Point an external cron (cron-job.org, UptimeRobot, GitHub Action, etc.)
 * at https://YOUR-API.onrender.com/ping every ~10-14 min to stop the
 * Render free instance from sleeping.
 */
app.get('/ping', (_req, res) => {
  const uptimeSec = Math.round((Date.now() - START_TS) / 1000);
  res.json({ pong: true, uptime_seconds: uptimeSec, ts: Date.now() });
});

// ---- routes ----
app.use('/api/profile', profileRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/openings', openingRoutes);

// ---- 404 + error handlers ----
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error('[server] unhandled', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Refer Me! API running on port ${PORT}`);
});
