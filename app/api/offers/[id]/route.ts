import { NextRequest } from 'next/server';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const { id } = await params;
  try {
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: { client: true, createdBy: { select: { id: true, name: true, email: true } }, items: { orderBy: { order: 'asc' } } },
    });
    if (!offer) return err('Not found', 404);
    return ok({ offer });
  } catch (e: any) { return err(e.message, 500); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const { id } = await params;
  try {
    const { items = [], discount = 0, tax = 0, ...data } = await req.json();
    const subtotal = items.reduce((s: number, it: any) => s + it.quantity * Number(it.unitPrice), 0);
    const total = Math.max(0, subtotal - Number(discount) + Number(tax));
    await prisma.offerItem.deleteMany({ where: { offerId: id } });
    const offer = await prisma.offer.update({
      where: { id },
      data: {
        ...data, subtotal, total,
        discount: new Prisma.Decimal(discount),
        tax: new Prisma.Decimal(tax),
        items: { create: items.map((it: any, i: number) => ({ ...it, unitPrice: Number(it.unitPrice), total: it.quantity * Number(it.unitPrice), order: i })) },
      },
      include: { items: { orderBy: { order: 'asc' } }, client: true },
    });
    return ok({ offer });
  } catch (e: any) { return err(e.message, 500); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const { id } = await params;
  try {
    await prisma.offer.delete({ where: { id } });
    return ok({ ok: true });
  } catch (e: any) { return err(e.message, 500); }
}
