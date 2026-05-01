import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { HttpError } from '../middleware/errorHandler';

const upsertSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  currencyCode: z.string().default('IQD'),
  notes: z.string().optional().nullable(),
});

export async function listClients(req: Request, res: Response, next: NextFunction) {
  try {
    const search = (req.query.search as string) || '';
    const clients = await prisma.client.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ clients });
  } catch (err) {
    next(err);
  }
}

export async function getClient(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        offers: { orderBy: { createdAt: 'desc' }, take: 20 },
        invoices: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!client) throw new HttpError(404, 'Client not found');
    res.json({ client });
  } catch (err) {
    next(err);
  }
}

export async function createClient(req: Request, res: Response, next: NextFunction) {
  try {
    const data = upsertSchema.parse(req.body);
    const client = await prisma.client.create({ data });
    res.status(201).json({ client });
  } catch (err) {
    next(err);
  }
}

export async function updateClient(req: Request, res: Response, next: NextFunction) {
  try {
    const data = upsertSchema.partial().parse(req.body);
    const client = await prisma.client.update({ where: { id: req.params.id }, data });
    res.json({ client });
  } catch (err) {
    next(err);
  }
}

export async function deleteClient(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.client.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
