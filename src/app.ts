import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { jwtMiddleware } from './middleware/jwtMiddleware';
import hashtagsRoutes from './routes/hashtagsRoutes';
import likeRoutes from './routes/likesRoutes';
import snapRoutes from './routes/snapRoutes';
import logger from './utils/logger';

// Función para inicializar el entorno
function initializeEnvironment() {
  // Determine environment

  const env = process.env.NODE_ENV || 'development';
  const envFilePath =
    env === 'development'
      ? path.resolve(__dirname, '../.env.dev')
      : path.resolve(__dirname, '../.env');

  // Overload environment variables
  dotenv.config({ path: envFilePath });

  // Debug environment variables
  const debugEnvVars = {
    NODE_ENV: env,
    MONGODB_URI: env === 'development' ? process.env.MONGODB_URI : 'url its a secret... shhh',
    JWT_SECRET_KEY: env === 'development' ? process.env.JWT_SECRET_KEY : 'jwt its a secret... shhh'
  };
  console.log('envFilePath:', envFilePath);
  console.log('Environment variables: ', debugEnvVars);
}

initializeEnvironment();

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
