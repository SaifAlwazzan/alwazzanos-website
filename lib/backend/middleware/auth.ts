import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { HttpError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Missing or invalid Authorization header'));
  }
  try {
    const token = header.substring(7);
    req.user = verifyToken(token);
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'Unauthorized'));
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'Forbidden: insufficient role'));
    }
    next();
  };
}
