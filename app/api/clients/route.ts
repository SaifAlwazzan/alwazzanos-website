import { NextRequest } from 'next/server';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const clients = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
    return ok({ clients });
  } catch (e: any) { return err(e.message, 500); }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const data = await req.json();
    const client = await prisma.client.create({ data });
    return ok({ client }, 201);
  } catch (e: any) { return err(e.message, 500); }
}
