import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import snapRoutes from './routes/snapRoutes';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';

dotenv.config();

const app = express();

app.use(express.json());

// Routes
app.use('/snaps', snapRoutes);

// Error handling middleware
app.use(errorHandler);

// Separate function for MongoDB connection
export const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

export default app;
