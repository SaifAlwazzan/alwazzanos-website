import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { HttpError } from '../middleware/errorHandler';

const upsertSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionAr: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  defaultPrice: z.union([z.number(), z.string()]).transform((v) => Number(v)),
  currencyCode: z.string().default('IQD'),
  features: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

export async function listModules(req: Request, res: Response, next: NextFunction) {
  try {
    const search = (req.query.search as string) || '';
    const category = req.query.category as string | undefined;
    const modules = await prisma.module.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { nameAr: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          category ? { category } : {},
        ],
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    res.json({ modules });
  } catch (err) {
    next(err);
  }
}

export async function getModule(req: Request, res: Response, next: NextFunction) {
  try {
    const m = await prisma.module.findUnique({ where: { id: req.params.id } });
    if (!m) throw new HttpError(404, 'Module not found');
    res.json({ module: m });
  } catch (err) {
    next(err);
  }
}

export async function createModule(req: Request, res: Response, next: NextFunction) {
  try {
    const data = upsertSchema.parse(req.body);
    const m = await prisma.module.create({ data });
    res.status(201).json({ module: m });
  } catch (err) {
    next(err);
  }
}

export async function updateModule(req: Request, res: Response, next: NextFunction) {
  try {
    const data = upsertSchema.partial().parse(req.body);
    const m = await prisma.module.update({ where: { id: req.params.id }, data });
    res.json({ module: m });
  } catch (err) {
    next(err);
  }
}

export async function deleteModule(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.module.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function listCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.module.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    res.json({ categories: rows.map((r) => r.category).filter(Boolean) });
  } catch (err) {
    next(err);
  }
}
