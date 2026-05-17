import { NextRequest } from 'next/server';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const settings = await prisma.setting.findMany();
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
    return ok({ settings: map });
  } catch (e: any) { return err(e.message, 500); }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const { settings } = await req.json();
    for (const [key, value] of Object.entries(settings as Record<string, string>)) {
      await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
    }
    return ok({ ok: true });
  } catch (e: any) { return err(e.message, 500); }
}
