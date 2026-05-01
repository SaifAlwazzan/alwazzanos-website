import { NextRequest } from 'next/server';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    if (!user) return err('Not found', 404);
    return ok({ user });
  } catch (e: any) { return err(e.message, 500); }
}
