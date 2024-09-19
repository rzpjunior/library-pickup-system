import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ error: 'An unexpected error occurred' });
};