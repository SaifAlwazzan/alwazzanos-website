import { NextRequest } from 'next/server';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const [invoices, expenses] = await Promise.all([
      prisma.invoice.findMany({ include: { client: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.expense.findMany({ orderBy: { date: 'desc' } }),
    ]);
    return ok({ invoices, expenses });
  } catch (e: any) { return err(e.message, 500); }
}
