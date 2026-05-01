import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';

export async function getSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.setting.findMany();
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

const updateSchema = z.record(z.string());

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateSchema.parse(req.body);
    for (const [key, value] of Object.entries(data)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
