import app from './app';
import logger from './utils/logger';

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, () => {
  logger.info(`Server running on ${HOST}:${PORT}`);
});
