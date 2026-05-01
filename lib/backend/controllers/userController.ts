import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../db';
import { HttpError } from '../middleware/errorHandler';

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().min(1),
  password: z.string().min(1),
  role: z.nativeEnum(Role).default(Role.SALES),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  role: z.nativeEnum(Role).optional(),
  active: z.boolean().optional(),
});

export async function listUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new HttpError(409, 'Email already in use');

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { ...data, password: hashed },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateSchema.parse(req.body);
    const updateData: Record<string, unknown> = { ...data };
    if (data.password) updateData.password = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
