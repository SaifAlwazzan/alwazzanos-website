'use client';
import { useState } from 'react';
import { useLang } from '@/lib/lang-context';
import { t, tr } from '@/lib/i18n';
import { Send, Mail, Globe, MapPin, Phone, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const { lang } = useLang();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="text-4xl font-bold text-[var(--text)] mb-4">{tr(t.contact.title, lang)}</h1>
        <p className="text-[var(--muted)] text-lg">{tr(t.contact.sub, lang)}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Info */}
        <div className="space-y-5">
          {[
            { icon: <Phone size={20} className="text-cyan-400" />,  label: lang === 'ar' ? 'الهاتف' : 'Phone',            value: '07777900495' },
            { icon: <Mail size={20} className="text-cyan-400" />,  label: lang === 'ar' ? 'البريد الإلكتروني' : 'Email',   value: 'swordbarsh@gmail.com' },
            { icon: <Globe size={20} className="text-cyan-400" />, label: lang === 'ar' ? 'الموقع الإلكتروني' : 'Website', value: 'alwazzanos.com' },
            { icon: <MapPin size={20} className="text-cyan-400" />, label: lang === 'ar' ? 'الموقع' : 'Location',         value: lang === 'ar' ? 'العراق — البصرة' : 'Iraq — Basra' },
          ].map(item => (
            <div key={item.label} className="glow-border rounded-2xl bg-[var(--surface)] p-5 flex items-start gap-4">
              <div className="mt-0.5">{item.icon}</div>
              <div>
                <div className="text-xs text-[var(--muted)] mb-0.5">{item.label}</div>
                <div className="text-[var(--text)] font-medium">{item.value}</div>
              </div>
            </div>
          ))}

          <div className="glow-border rounded-2xl bg-[var(--surface)] p-6">
            <p className="text-[var(--muted)] text-sm leading-relaxed">
              {lang === 'ar'
                ? 'نرد على استفساراتك في أقرب وقت ممكن. يمكنك أيضاً التواصل معنا مباشرة عبر البريد الإلكتروني لمناقشة احتياجات مؤسستك.'
                : 'We respond to your inquiries as soon as possible. You can also reach us directly via email to discuss your institution\'s needs.'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="glow-border rounded-2xl bg-[var(--surface)] p-8">
          {sent ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-10">
              <CheckCircle size={56} className="text-cyan-400" />
              <p className="text-[var(--text)] text-lg font-semibold">{tr(t.contact.sent, lang)}</p>
              <p className="text-[var(--muted)] text-sm text-center">
                {lang === 'ar' ? 'سنتواصل معك قريباً.' : 'We will get back to you soon.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">{tr(t.contact.name, lang)}</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder={lang === 'ar' ? 'الاسم الكامل' : 'Full name'}
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">{tr(t.contact.email, lang)}</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder={lang === 'ar' ? 'example@email.com' : 'example@email.com'}
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">{tr(t.contact.message, lang)}</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                  placeholder={lang === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading
                  ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                  : <><Send size={18} /> {tr(t.contact.send, lang)}</>
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
