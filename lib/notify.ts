function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let p = raw.replace(/[^\d+]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('00')) p = p.slice(2);
  if (p.startsWith('0')) p = '964' + p.slice(1);
  if (!/^\d{8,15}$/.test(p)) return null;
  return p;
}

export async function sendWhatsAppText(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return { ok: false, error: 'WhatsApp not configured' };

  const normalized = normalizePhone(to);
  if (!normalized) return { ok: false, error: `Invalid phone number: ${to}` };

  const res = await fetch(`https://graph.facebook.com/v25.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalized,
      type: 'text',
      text: { body },
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    return { ok: false, error: e?.error?.message || `WhatsApp send failed (${res.status})` };
  }
  return { ok: true };
}

export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string }): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'AlwazzanOS <invoices@alwazzanos.com>';
  if (!apiKey) return { ok: false, error: 'Resend not configured (set RESEND_API_KEY)' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    return { ok: false, error: e?.message || `Email send failed (${res.status})` };
  }
  return { ok: true };
}

export function formatMoney(amount: string | number, currency: string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency === 'IQD' ? 'IQD' : currency, maximumFractionDigits: 0 }).format(n);
}
