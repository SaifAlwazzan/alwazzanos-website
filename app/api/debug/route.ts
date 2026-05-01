import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL ? 'SET ✓' : 'MISSING ✗',
    JWT_SECRET: process.env.JWT_SECRET ? 'SET ✓' : 'MISSING ✗',
    NODE_ENV: process.env.NODE_ENV,
  });
}
