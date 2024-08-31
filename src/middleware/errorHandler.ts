import { Request, Response, NextFunction } from 'express';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    type: 'about:blank',
    title: message,
    status,
    detail: err.stack,
    instance: req.originalUrl
  });
};

export default errorHandler;