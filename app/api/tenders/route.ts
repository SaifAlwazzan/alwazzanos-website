import { NextRequest } from 'next/server';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';
import { TenderStatus, Prisma } from '@prisma/client';

async function nextNumber() {
  const year = new Date().getFullYear();
  const prefix = `AWZ-TND-${year}-`;
  const last = await prisma.tender.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: 'desc' },
  });
  const seq = last ? parseInt(last.number.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status') as TenderStatus | null;
    const tenders = await prisma.tender.findMany({
      where: { ...(status ? { status } : {}) },
      include: { _count: { select: { documents: true } } },
      orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
    });
    return ok({ tenders });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const body = await req.json();
    const { estimatedValue, bidBondAmount, performanceBondPct, requirements = [], ...data } = body;
    const number = await nextNumber();
    const tender = await prisma.tender.create({
      data: {
        ...data,
        number,
        requirements,
        estimatedValue: estimatedValue != null ? new Prisma.Decimal(estimatedValue) : null,
        bidBondAmount: bidBondAmount != null ? new Prisma.Decimal(bidBondAmount) : null,
        performanceBondPct: performanceBondPct != null ? new Prisma.Decimal(performanceBondPct) : null,
        publishedDate: data.publishedDate ? new Date(data.publishedDate) : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        openingDate: data.openingDate ? new Date(data.openingDate) : null,
      },
    });
    return ok({ tender }, 201);
  } catch (e: any) {
    return err(e.message, 500);
  }
}
