import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import ErrorResponse from '../utils/errorResponse';
import asyncHandler from './asyncHandler';
import { AuthRequest } from '../types';

export const protect = asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next(new ErrorResponse('Not authorized', 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new ErrorResponse('User not found', 401));
    if (user.status === 'banned') return next(new ErrorResponse('Account banned', 403));
    if (user.status === 'suspended') return next(new ErrorResponse('Account suspended', 403));
    req.user = user;
    next();
  } catch {
    return next(new ErrorResponse('Not authorized', 401));
  }
});

export const authorize = (...roles: string[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ErrorResponse(`Role '${req.user?.role}' not authorized`, 403));
    }
    next();
  };

export const optionalAuth = asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
      req.user = (await User.findById(decoded.id).select('-password')) ?? undefined;
    } catch {
      req.user = undefined;
    }
  }

  next();
});