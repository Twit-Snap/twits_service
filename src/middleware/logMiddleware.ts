import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

export const logMiddleware = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method}: ${req.originalUrl}`);
  logger.debug(`body: ${JSON.stringify(req.body)}`);
  logger.debug(`params: ${JSON.stringify(req.params)}`);
  logger.debug(`query: ${JSON.stringify(req.query)}`);
  next();
};
