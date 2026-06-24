import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import ErrorResponse from '../utils/errorResponse';

const errorHandler = (
  err: ErrorResponse & { code?: number; name: string; keyValue?: Record<string, string>; errors?: Record<string, { message: string }> },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err, message: err.message };

  logger.error(err);

  if (err.name === 'CastError') error = new ErrorResponse('Resource not found', 404);
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0];
    error = new ErrorResponse(`${field} already exists`, 400);
  }
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors ?? {}).map((v) => v.message).join(', ');
    error = new ErrorResponse(message, 400);
  }
  if (err.name === 'JsonWebTokenError') error = new ErrorResponse('Invalid token', 401);
  if (err.name === 'TokenExpiredError') error = new ErrorResponse('Token expired', 401);

  res.status(error.statusCode || 500).json({ success: false, error: error.message || 'Server Error' });
};

export default errorHandler;