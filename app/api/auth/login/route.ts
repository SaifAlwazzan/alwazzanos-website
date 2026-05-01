import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma, signToken, ok, err } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return err('Missing credentials');
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) return err('Invalid credentials', 401);
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return err('Invalid credentials', 401);
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return ok({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
