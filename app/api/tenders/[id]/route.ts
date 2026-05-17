import { NextRequest } from 'next/server';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const { id } = await ctx.params;
    const tender = await prisma.tender.findUnique({
      where: { id },
      include: { documents: { orderBy: { uploadedAt: 'desc' } } },
    });
    if (!tender) return err('Not found', 404);
    return ok({ tender });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const { estimatedValue, bidBondAmount, performanceBondPct, requirements, ...data } = body;
    const patch: any = { ...data };
    if (estimatedValue !== undefined) patch.estimatedValue = estimatedValue != null ? new Prisma.Decimal(estimatedValue) : null;
    if (bidBondAmount !== undefined) patch.bidBondAmount = bidBondAmount != null ? new Prisma.Decimal(bidBondAmount) : null;
    if (performanceBondPct !== undefined) patch.performanceBondPct = performanceBondPct != null ? new Prisma.Decimal(performanceBondPct) : null;
    if (requirements !== undefined) patch.requirements = requirements;
    for (const field of ['publishedDate', 'deadline', 'openingDate', 'submittedAt', 'resultAt'] as const) {
      if (data[field] !== undefined) patch[field] = data[field] ? new Date(data[field]) : null;
    }
    const tender = await prisma.tender.update({ where: { id }, data: patch });
    return ok({ tender });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const { id } = await ctx.params;
    await prisma.tender.delete({ where: { id } });
    return ok({ ok: true });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
