import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import snapRoutes from './routes/snapRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/snaps', snapRoutes);

// Error handling middleware
app.use(errorHandler);

export default app;