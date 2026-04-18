import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { config } from '../config/env';

/**
 * HTTP request logger
 */
export const requestLogger = morgan(
  config.NODE_ENV === 'development' ? 'dev' : 'combined'
);

/**
 * Custom request logger
 */
export const logRequest = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};
