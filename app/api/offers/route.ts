import { NextRequest } from 'next/server';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';
import { OfferStatus, Prisma } from '@prisma/client';

async function nextNumber() {
  const year = new Date().getFullYear();
  const prefix = `AWZ-OFF-${year}-`;
  const last = await prisma.offer.findFirst({ where: { number: { startsWith: prefix } }, orderBy: { number: 'desc' } });
  const seq = last ? parseInt(last.number.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status') as OfferStatus | null;
    const clientId = searchParams.get('clientId');
    const projectId = searchParams.get('projectId');
    const offers = await prisma.offer.findMany({
      where: { ...(status ? { status } : {}), ...(clientId ? { clientId } : {}), ...(projectId ? { projectId } : {}) },
      include: { client: { select: { id: true, name: true } }, createdBy: { select: { id: true, name: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return ok({ offers });
  } catch (e: any) { return err(e.message, 500); }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const { items = [], discount = 0, tax = 0, ...data } = await req.json();
    const subtotal = items.reduce((s: number, it: any) => s + it.quantity * Number(it.unitPrice), 0);
    const total = Math.max(0, subtotal - Number(discount) + Number(tax));
    const number = await nextNumber();
    const offer = await prisma.offer.create({
      data: {
        ...data, number, subtotal, total,
        discount: new Prisma.Decimal(discount),
        tax: new Prisma.Decimal(tax),
        createdById: auth.userId,
        items: { create: items.map((it: any, i: number) => ({ ...it, unitPrice: Number(it.unitPrice), total: it.quantity * Number(it.unitPrice), order: i })) },
      },
      include: { items: true, client: true },
    });
    return ok({ offer }, 201);
  } catch (e: any) { return err(e.message, 500); }
}
