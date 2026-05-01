import { NextRequest } from 'next/server';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const { id } = await params;
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { client: true, items: { orderBy: { order: 'asc' } }, installments: { orderBy: { number: 'asc' } }, payments: true },
    });
    if (!invoice) return err('Not found', 404);
    return ok({ invoice });
  } catch (e: any) { return err(e.message, 500); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const { id } = await params;
  try {
    const data = await req.json();
    const invoice = await prisma.invoice.update({ where: { id }, data });
    return ok({ invoice });
  } catch (e: any) { return err(e.message, 500); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const { id } = await params;
  try {
    await prisma.invoice.delete({ where: { id } });
    return ok({ ok: true });
  } catch (e: any) { return err(e.message, 500); }
}
