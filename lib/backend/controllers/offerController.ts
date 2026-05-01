import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { OfferStatus, Prisma } from '@prisma/client';
import { prisma } from '../db';
import { HttpError } from '../middleware/errorHandler';

const itemSchema = z.object({
  moduleId: z.string().nullable().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.union([z.number(), z.string()]).transform((v) => Number(v)),
});

const upsertSchema = z.object({
  title: z.string().min(1),
  clientId: z.string().min(1),
  projectId: z.string().nullable().optional(),
  status: z.nativeEnum(OfferStatus).default(OfferStatus.DRAFT),
  currencyCode: z.string().default('IQD'),
  discount: z.union([z.number(), z.string()]).transform((v) => Number(v)).default(0),
  tax: z.union([z.number(), z.string()]).transform((v) => Number(v)).default(0),
  validUntil: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  termsJson: z.any().optional(),
  items: z.array(itemSchema).default([]),
});

function calcTotals(items: { quantity: number; unitPrice: number }[], discount: number, tax: number) {
  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const total = Math.max(0, subtotal - discount + tax);
  return { subtotal, total };
}

async function nextOfferNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `AWZ-OFF-${year}-`;
  const last = await prisma.offer.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: 'desc' },
  });
  const seq = last ? parseInt(last.number.substring(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export async function listOffers(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as OfferStatus | undefined;
    const clientId = req.query.clientId as string | undefined;
    const projectId = req.query.projectId as string | undefined;
    const offers = await prisma.offer.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(clientId ? { clientId } : {}),
        ...(projectId ? { projectId } : {}),
      },
      include: {
        client: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ offers });
  } catch (err) {
    next(err);
  }
}

export async function getOffer(req: Request, res: Response, next: NextFunction) {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: { orderBy: { order: 'asc' } },
      },
    });
    if (!offer) throw new HttpError(404, 'Offer not found');
    res.json({ offer });
  } catch (err) {
    next(err);
  }
}

export async function createOffer(req: Request, res: Response, next: NextFunction) {
  try {
    const data = upsertSchema.parse(req.body);
    const { subtotal, total } = calcTotals(data.items, data.discount, data.tax);
    const number = await nextOfferNumber();

    const offer = await prisma.offer.create({
      data: {
        number,
        title: data.title,
        clientId: data.clientId,
        projectId: data.projectId ?? null,
        status: data.status,
        currencyCode: data.currencyCode,
        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(data.discount),
        tax: new Prisma.Decimal(data.tax),
        total: new Prisma.Decimal(total),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        notes: data.notes ?? null,
        termsJson: data.termsJson ?? undefined,
        createdById: req.user!.userId,
        items: {
          create: data.items.map((it, idx) => ({
            moduleId: it.moduleId ?? null,
            name: it.name,
            description: it.description ?? null,
            quantity: it.quantity,
            unitPrice: new Prisma.Decimal(it.unitPrice),
            total: new Prisma.Decimal(it.quantity * it.unitPrice),
            order: idx,
          })),
        },
      },
      include: { items: true, client: true },
    });
    res.status(201).json({ offer });
  } catch (err) {
    next(err);
  }
}

export async function updateOffer(req: Request, res: Response, next: NextFunction) {
  try {
    const data = upsertSchema.parse(req.body);
    const { subtotal, total } = calcTotals(data.items, data.discount, data.tax);

    const offer = await prisma.$transaction(async (tx) => {
      await tx.offerItem.deleteMany({ where: { offerId: req.params.id } });
      return tx.offer.update({
        where: { id: req.params.id },
        data: {
          title: data.title,
          clientId: data.clientId,
          projectId: data.projectId ?? null,
          status: data.status,
          currencyCode: data.currencyCode,
          subtotal: new Prisma.Decimal(subtotal),
          discount: new Prisma.Decimal(data.discount),
          tax: new Prisma.Decimal(data.tax),
          total: new Prisma.Decimal(total),
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          notes: data.notes ?? null,
          termsJson: data.termsJson ?? undefined,
          items: {
            create: data.items.map((it, idx) => ({
              moduleId: it.moduleId ?? null,
              name: it.name,
              description: it.description ?? null,
              quantity: it.quantity,
              unitPrice: new Prisma.Decimal(it.unitPrice),
              total: new Prisma.Decimal(it.quantity * it.unitPrice),
              order: idx,
            })),
          },
        },
        include: { items: true, client: true },
      });
    });
    res.json({ offer });
  } catch (err) {
    next(err);
  }
}

export async function deleteOffer(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.offer.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function updateOfferStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const status = z.nativeEnum(OfferStatus).parse(req.body.status);
    const data: Prisma.OfferUpdateInput = { status };
    if (status === OfferStatus.SENT) data.sentAt = new Date();
    if (status === OfferStatus.ACCEPTED) data.acceptedAt = new Date();
    const offer = await prisma.offer.update({ where: { id: req.params.id }, data });
    res.json({ offer });
  } catch (err) {
    next(err);
  }
}
