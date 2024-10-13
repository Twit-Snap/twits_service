import dotenv from 'dotenv';
import path from 'path';
import app, { connectToMongoDB } from './app';
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
  dotenv.config({ path: envFilePath, override: true });

  // Debug environment variables
  const debugEnvVars = {
    NODE_ENV: env,
    MONGODB_URI: env === 'development' ? process.env.MONGODB_URI : 'url its a secret... shhh',
    JWT_SECRET_KEY: env === 'development' ? process.env.JWT_SECRET_KEY : 'jwt its a secret... shhh'
  };
  console.log('envFilePath:', envFilePath);
  console.log('Environment variables: ', debugEnvVars);
}

const startServer = async () => {
  initializeEnvironment();

  await connectToMongoDB();

  const PORT = process.env.PORT || 8080;
  const HOST = process.env.HOST || '0.0.0.0';

  app.listen(PORT, () => {
    logger.info(`Server running on ${HOST}:${PORT}`);
  });
};

startServer().catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
