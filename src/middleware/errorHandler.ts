import { Request, Response, NextFunction } from 'express';
import { NotFoundError, ValidationError } from '../customErrors';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof NotFoundError) {
    res.status(404).json({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: `The ${err.entityName} with ID ${err.entityId} was not found.`,
      instance: req.originalUrl
    });
  } else if (err instanceof ValidationError) {
    res.status(400).json({
      type: 'about:blank',
      title: 'Validation Error',
      status: 400,
      detail: err.detail,
      instance: req.originalUrl
    });
  } else if (err instanceof Error) {
    res.status(500).json({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred.',
      instance: req.originalUrl
    });
  }
};