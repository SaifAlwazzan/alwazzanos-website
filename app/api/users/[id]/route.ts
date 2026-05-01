import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const { id } = await params;
  try {
    const { password, ...data } = await req.json();
    const update: any = { ...data };
    if (password) update.password = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id }, data: update,
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    return ok({ user });
  } catch (e: any) { return err(e.message, 500); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const { id } = await params;
  try {
    await prisma.user.delete({ where: { id } });
    return ok({ ok: true });
  } catch (e: any) { return err(e.message, 500); }
}
