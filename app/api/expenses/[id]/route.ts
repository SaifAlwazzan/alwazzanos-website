import { NextRequest } from 'next/server';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const { id } = await params;
  try {
    await prisma.expense.delete({ where: { id } });
    return ok({ ok: true });
  } catch (e: any) { return err(e.message, 500); }
}
