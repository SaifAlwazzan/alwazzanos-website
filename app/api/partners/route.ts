import { NextRequest } from 'next/server';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const partners = await prisma.partner.findMany({ orderBy: { name: 'asc' } });
    return ok({ partners });
  } catch (e: any) { return err(e.message, 500); }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const data = await req.json();
    const partner = await prisma.partner.create({ data });
    return ok({ partner }, 201);
  } catch (e: any) { return err(e.message, 500); }
}
