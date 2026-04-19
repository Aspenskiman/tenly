import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import teamRoutes from './routes/teams.js';
import executiveRoutes from './routes/executive.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startScheduler } from './services/schedulerService.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow all vercel.app domains, localhost, and any configured CLIENT_URL
      if (
        !origin ||
        origin.includes('vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('render.com') ||
        (process.env.CLIENT_URL && origin.startsWith(process.env.CLIENT_URL))
      ) {
        cb(null, true);
      } else {
        cb(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/company', executiveRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Tenly server running on port ${PORT}`);
  startScheduler();
});
