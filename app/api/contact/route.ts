import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json();

  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    return NextResponse.json({ error: 'WhatsApp not configured' }, { status: 500 });
  }

  const text = `رسالة جديدة من الموقع:\n\nالاسم: ${name}\nالإيميل: ${email}\nالرسالة: ${message}`;

  const res = await fetch(`https://graph.facebook.com/v25.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: '9647777900495',
      type: 'text',
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
