import { Request, Response, NextFunction } from 'express';
import { NotFoundError, ValidationError } from '../types/customErrors';
import logger from '../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof NotFoundError) {
    logger.warn(`NotFoundError: ${err.message}`, {
      entityName: err.entityName,
      entityId: err.entityId
    });
    res.status(404).json({
      type: 'about:blank',
      title: `${err.entityName} Not Found`,
      status: 404,
      detail: `The ${err.entityName} with ID ${err.entityId} was not found.`,
      instance: req.originalUrl
    });
  } else if (err instanceof ValidationError) {
    logger.warn(`ValidationError: ${err.message}`, { field: err.field, detail: err.detail });
    res.status(400).json({
      type: 'about:blank',
      title: 'Validation Error',
      status: 400,
      detail: err.detail,
      instance: req.originalUrl,
      'custom-field': err.field
    });
  } else if (err instanceof Error) {
    logger.error(`Unexpected error: ${err.message}`, { stack: err.stack });
    res.status(500).json({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred.',
      instance: req.originalUrl
    });
  }
};
