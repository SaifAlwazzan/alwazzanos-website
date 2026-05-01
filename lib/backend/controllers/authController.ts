import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db';
import { signToken } from '../utils/jwt';
import { HttpError } from '../middleware/errorHandler';

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) throw new HttpError(401, 'Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new HttpError(401, 'Invalid credentials');

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    if (!user) throw new HttpError(404, 'User not found');
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
