import { NextRequest } from 'next/server';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const expenses = await prisma.expense.findMany({
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    });
    return ok({ expenses });
  } catch (e: any) { return err(e.message, 500); }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const data = await req.json();
    const expense = await prisma.expense.create({ data: { ...data, createdById: auth.userId } });
    return ok({ expense }, 201);
  } catch (e: any) { return err(e.message, 500); }
}
