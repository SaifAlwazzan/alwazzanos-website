import { NextRequest } from 'next/server';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const projects = await prisma.project.findMany({
      include: { client: { select: { id: true, name: true } }, _count: { select: { offers: true, invoices: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return ok({ projects });
  } catch (e: any) { return err(e.message, 500); }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const data = await req.json();
    const project = await prisma.project.create({ data });
    return ok({ project }, 201);
  } catch (e: any) { return err(e.message, 500); }
}
