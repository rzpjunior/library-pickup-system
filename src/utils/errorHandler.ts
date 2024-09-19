import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from './logger';
import { formatErrorResponse } from './responseFormatter';
import { CustomError } from './customError';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message, { stack: err.stack });

  if (err instanceof CustomError) {
    return res.status(err.statusCode).json(formatErrorResponse(err.statusCode, err.message));
  }

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
    formatErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR, 'An unexpected error occurred')
  );
};