import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return ok({ users });
  } catch (e: any) { return err(e.message, 500); }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const { password, ...data } = await req.json();
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { ...data, password: hashed },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    return ok({ user }, 201);
  } catch (e: any) { return err(e.message, 500); }
}
