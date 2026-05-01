import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';

const SECRET = process.env.JWT_SECRET || 'dev-secret';
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload;
}
