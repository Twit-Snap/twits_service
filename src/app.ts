import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import snapRoutes from './routes/snapRoutes';
import hashtagsRoutes from './routes/hashtagsRoutes';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import {
  getAllSnaps
} from './controllers/snapController';
import { SnapResponse, RankRequest } from './types/types';
import axios from 'axios';

dotenv.config();
const cors = require('cors');
const app = express();

//CORS middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/snaps', snapRoutes);
app.use('/hashtags', hashtagsRoutes);

// Error handling middleware
app.use(errorHandler);

// Separate function for MongoDB connection
export const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    logger.info('Connected to MongoDB');

    //Load all snaps to feed algorithm
    const snaps: SnapResponse[] = await getAllSnaps();
    const snapData : RankRequest = {
      data:
        snaps.map(snap => {
          return {
            id: snap.id,
            content: snap.content,
          };
        })
    };
    await axios.post(`${process.env.FEED_ALGORITHM_URL}/`, snapData);
    console.log('Snaps loaded to feed algorithm');

  } catch (err) {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

export default app;
