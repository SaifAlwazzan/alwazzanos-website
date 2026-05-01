import { NextRequest, NextResponse } from 'next/server';
import express from 'express';
import cors from 'cors';
import { errorHandler } from '@/lib/backend/middleware/errorHandler';
import authRoutes from '@/lib/backend/routes/auth';
import userRoutes from '@/lib/backend/routes/users';
import clientRoutes from '@/lib/backend/routes/clients';
import moduleRoutes from '@/lib/backend/routes/modules';
import offerRoutes from '@/lib/backend/routes/offers';
import invoiceRoutes from '@/lib/backend/routes/invoices';
import partnerRoutes from '@/lib/backend/routes/partners';
import expenseRoutes from '@/lib/backend/routes/expenses';
import projectRoutes from '@/lib/backend/routes/projects';
import settingsRoutes from '@/lib/backend/routes/settings';

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/settings', settingsRoutes);
app.use(errorHandler);

function runMiddleware(req: express.Request, res: express.Response) {
  return new Promise<void>((resolve, reject) => {
    app(req, res, (err) => (err ? reject(err) : resolve()));
  });
}

async function handler(req: NextRequest) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const expressReq = {
    method: req.method,
    url: req.nextUrl.pathname + (req.nextUrl.search || ''),
    headers: Object.fromEntries(req.headers.entries()),
    body: req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.json().catch(() => undefined)
      : undefined,
  } as unknown as express.Request;

  let statusCode = 200;
  let responseHeaders: Record<string, string> = {};
  let responseBody = '';

  const expressRes = {
    statusCode: 200,
    status(code: number) { statusCode = code; return this; },
    setHeader(key: string, value: string) { responseHeaders[key] = value; return this; },
    getHeader(key: string) { return responseHeaders[key]; },
    json(body: unknown) {
      responseHeaders['Content-Type'] = 'application/json';
      responseBody = JSON.stringify(body);
      return this;
    },
    send(body: unknown) {
      responseBody = typeof body === 'string' ? body : JSON.stringify(body);
      return this;
    },
    end() { return this; },
  } as unknown as express.Response;

  await runMiddleware(expressReq, expressRes);

  return new NextResponse(responseBody || null, {
    status: statusCode,
    headers: { 'Content-Type': 'application/json', ...responseHeaders },
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
