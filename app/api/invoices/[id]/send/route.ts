import { NextRequest } from 'next/server';
import { prisma, requireAuth, ok, err } from '@/lib/api-helpers';
import { sendWhatsAppText, sendEmail, formatMoney } from '@/lib/notify';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  try {
    const { id } = await ctx.params;
    const { channels } = (await req.json()) as { channels: ('whatsapp' | 'email')[] };
    if (!channels?.length) return err('Pick at least one channel');

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { client: true, installments: { orderBy: { number: 'asc' } } },
    });
    if (!invoice) return err('Invoice not found', 404);

    const total = formatMoney(invoice.total, invoice.currencyCode);
    const due = invoice.dueDate ? new Date(invoice.dueDate).toISOString().substring(0, 10) : null;

    const planLines = invoice.installments.length
      ? '\n\nPayment plan:\n' + invoice.installments
          .map((i) => `  #${i.number} — ${new Date(i.dueDate).toISOString().substring(0, 10)} — ${formatMoney(i.amount, invoice.currencyCode)}`)
          .join('\n')
      : '';

    const text =
      `Hello ${invoice.client.contactPerson || invoice.client.name},\n\n` +
      `Invoice ${invoice.number} for ${total} is ready${due ? `, due ${due}` : ''}.${planLines}\n\n` +
      `— AlwazzanOS for Software Developing`;

    const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
      <h2 style="margin:0 0 16px;">Invoice ${invoice.number}</h2>
      <p>Hello ${invoice.client.contactPerson || invoice.client.name},</p>
      <p>Please find the details of your invoice below:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">Total</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold">${total}</td></tr>
        ${due ? `<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">Due date</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right">${due}</td></tr>` : ''}
      </table>
      ${invoice.installments.length ? `<h3>Payment plan</h3><ul>${invoice.installments.map((i) => `<li>#${i.number} — ${new Date(i.dueDate).toISOString().substring(0, 10)} — <b>${formatMoney(i.amount, invoice.currencyCode)}</b></li>`).join('')}</ul>` : ''}
      <p style="color:#64748b;font-size:13px;margin-top:24px;">— AlwazzanOS for Software Developing</p>
    </div>`;

    const results: Record<string, { ok: boolean; error?: string }> = {};
    if (channels.includes('whatsapp')) {
      if (!invoice.client.phone) results.whatsapp = { ok: false, error: 'Client has no phone number on file' };
      else results.whatsapp = await sendWhatsAppText(invoice.client.phone, text);
    }
    if (channels.includes('email')) {
      if (!invoice.client.email) results.email = { ok: false, error: 'Client has no email on file' };
      else results.email = await sendEmail({ to: invoice.client.email, subject: `Invoice ${invoice.number}`, html, text });
    }

    return ok({ results });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
