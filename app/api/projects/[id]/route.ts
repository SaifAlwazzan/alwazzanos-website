import { NextRequest } from 'next/server';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const { id } = await params;
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { client: true, offers: { orderBy: { createdAt: 'desc' } }, invoices: { orderBy: { createdAt: 'desc' } } },
    });
    if (!project) return err('Not found', 404);
    return ok({ project });
  } catch (e: any) { return err(e.message, 500); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const { id } = await params;
  try {
    const data = await req.json();
    const project = await prisma.project.update({ where: { id }, data });
    return ok({ project });
  } catch (e: any) { return err(e.message, 500); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const { id } = await params;
  try {
    await prisma.project.delete({ where: { id } });
    return ok({ ok: true });
  } catch (e: any) { return err(e.message, 500); }
}
