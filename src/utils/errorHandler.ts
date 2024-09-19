import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from './logger';
import { formatErrorResponse } from './responseFormatter';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message, { stack: err.stack });
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
    formatErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR, 'An unexpected error occurred')
  );
};