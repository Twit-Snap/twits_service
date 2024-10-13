import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorHandler';
import { jwtMiddleware } from './middleware/jwtMiddleware';
import hashtagsRoutes from './routes/hashtagsRoutes';
import likeRoutes from './routes/likesRoutes';
import snapRoutes from './routes/snapRoutes';
import logger from './utils/logger';

dotenv.config();
const cors = require('cors');
const app = express();

//CORS middleware
app.use(cors());
app.use(express.json());
app.use(jwtMiddleware);

// Routes
app.use('/snaps', snapRoutes);
app.use('/hashtags', hashtagsRoutes);
app.use('/likes', likeRoutes);

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
