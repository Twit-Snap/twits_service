import app, { connectToMongoDB } from './app';
import logger from './utils/logger';

const PORT = +process.env.PORT! || 8080;

const startServer = async () => {
  await connectToMongoDB();
  app.listen(PORT, '::', () => {
    logger.info(`Server running on []::]${PORT}`);
  });
};

startServer().catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
