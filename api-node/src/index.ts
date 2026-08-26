import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDb } from './db';
import breweriesRouter from './routes/breweries';
import checkinsRouter from './routes/checkins';
import statsRouter from './routes/stats';
import amenitiesRouter from './routes/amenities';
import healthRouter from './routes/health';
import authRouter from './routes/auth';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://reganbp.github.io'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.github.io')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive for portfolio evaluation
    }
  },
  credentials: true
}));

app.use(express.json());

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/breweries', breweriesRouter);
app.use('/checkins', checkinsRouter);
app.use('/stats', statsRouter);
app.use('/amenities', amenitiesRouter);

async function bootstrap() {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`BrewsTraveller Node.js API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start Node.js API server:', err);
    process.exit(1);
  }
}

bootstrap();
