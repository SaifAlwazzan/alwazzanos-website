import { NextRequest } from 'next/server';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

async function nextNumber() {
  const year = new Date().getFullYear();
  const prefix = `AWZ-INV-${year}-`;
  const last = await prisma.invoice.findFirst({ where: { number: { startsWith: prefix } }, orderBy: { number: 'desc' } });
  const seq = last ? parseInt(last.number.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const { searchParams } = req.nextUrl;
    const clientId = searchParams.get('clientId');
    const invoices = await prisma.invoice.findMany({
      where: { ...(clientId ? { clientId } : {}) },
      include: { client: { select: { id: true, name: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return ok({ invoices });
  } catch (e: any) { return err(e.message, 500); }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const { items = [], installments = [], discount = 0, tax = 0, ...data } = await req.json();
    const subtotal = items.reduce((s: number, it: any) => s + it.quantity * Number(it.unitPrice), 0);
    const total = Math.max(0, subtotal - Number(discount) + Number(tax));
    const number = await nextNumber();
    const invoice = await prisma.invoice.create({
      data: {
        ...data, number, subtotal, total,
        discount: new Prisma.Decimal(discount),
        tax: new Prisma.Decimal(tax),
        createdById: auth.userId,
        items: { create: items.map((it: any, i: number) => ({ ...it, unitPrice: Number(it.unitPrice), total: it.quantity * Number(it.unitPrice), order: i })) },
        installments: { create: installments.map((ins: any) => ({ ...ins, amount: new Prisma.Decimal(ins.amount) })) },
      },
      include: { items: true, client: true },
    });
    return ok({ invoice }, 201);
  } catch (e: any) { return err(e.message, 500); }
}
