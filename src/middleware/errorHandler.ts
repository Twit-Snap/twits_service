import { NextFunction, Request, Response } from 'express';
import {
  AuthenticationError,
  BlockedError,
  NotFoundError,
  ServiceUnavailable,
  ValidationError
} from '../types/customErrors';
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
  } else if (err instanceof AuthenticationError) {
    console.warn(`AuthenticationError: ${err.message}`);
    res.status(401).json({
      type: 'about:blank',
      title: 'Unauthorized',
      status: 401,
      detail: 'Authentication error.',
      instance: req.originalUrl
    });
  } else if (err instanceof BlockedError) {
    console.warn(`BlockedError: ${err.message}`);
    res.status(403).json({
      type: 'about:blank',
      title: 'User blocked',
      status: 403,
      detail: `Blocked error`,
      instance: req.originalUrl
    });
  } else if (err instanceof ServiceUnavailable) {
    console.warn(`ServiceUnavailable: ${err.message}`);
    res.status(503).json({
      type: 'about:blank',
      title: 'Service unavailable',
      status: 503,
      detail: 'The server is not ready to handle the request.',
      instance: req.originalUrl
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
