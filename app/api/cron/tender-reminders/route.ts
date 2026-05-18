import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/api-helpers';
import { sendWhatsAppText, sendEmail } from '@/lib/notify';

const TEAM_WHATSAPP = process.env.TEAM_WHATSAPP || '9647777900495';
const TEAM_EMAIL = process.env.TEAM_EMAIL || 'info@alwazzanos.com';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 7 * 86_400_000);

  const tenders = await prisma.tender.findMany({
    where: {
      status: { in: ['WATCHING', 'PREPARING'] },
      deadline: { gte: now, lte: horizon },
    },
    orderBy: { deadline: 'asc' },
  });

  if (tenders.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'no upcoming deadlines' });
  }

  const lines = tenders.map((t) => {
    const days = Math.ceil((new Date(t.deadline!).getTime() - now.getTime()) / 86_400_000);
    return `• ${t.number} — ${t.title} (${t.issuingEntity}) — due in ${days}d (${new Date(t.deadline!).toISOString().substring(0, 10)})`;
  });

  const text = `Tender deadlines this week:\n\n${lines.join('\n')}\n\nView all: https://alwazzanos.com/admin/tenders`;

  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
    <h2>Tender deadlines this week</h2>
    <ul>${tenders.map((t) => {
      const days = Math.ceil((new Date(t.deadline!).getTime() - now.getTime()) / 86_400_000);
      return `<li><b>${t.number}</b> — ${t.title} <em>(${t.issuingEntity})</em><br><span style="color:${days <= 2 ? '#dc2626' : '#d97706'};font-weight:bold">due in ${days}d</span> · ${new Date(t.deadline!).toISOString().substring(0, 10)}</li>`;
    }).join('')}</ul>
    <p><a href="https://alwazzanos.com/admin/tenders">Open admin</a></p>
  </div>`;

  const [whatsapp, email] = await Promise.all([
    sendWhatsAppText(TEAM_WHATSAPP, text),
    sendEmail({ to: TEAM_EMAIL, subject: `Tender deadlines this week (${tenders.length})`, html, text }),
  ]);

  return NextResponse.json({
    ok: true,
    count: tenders.length,
    tenders: tenders.map((t) => ({ number: t.number, title: t.title, deadline: t.deadline })),
    whatsapp,
    email,
  });
}
