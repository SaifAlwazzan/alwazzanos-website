import { NextRequest } from 'next/server';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const modules = await prisma.module.findMany({ orderBy: { category: 'asc' } });
    return ok({ modules });
  } catch (e: any) { return err(e.message, 500); }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const data = await req.json();
    const module = await prisma.module.create({ data });
    return ok({ module }, 201);
  } catch (e: any) { return err(e.message, 500); }
}
