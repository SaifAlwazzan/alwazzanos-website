'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useLang } from '@/lib/lang-context';
import { t, tr } from '@/lib/i18n';
import { products, clients } from '@/lib/data';
import { ArrowLeft, ArrowRight, Building2, FlaskConical, ShoppingBag, Monitor } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  'hospital-os':    <Building2 size={28} className="text-cyan-400" />,
  'clinic-os':      <Monitor  size={28} className="text-blue-400" />,
  'lab-os':         <FlaskConical size={28} className="text-teal-400" />,
  'store-os':       <ShoppingBag  size={28} className="text-violet-400" />,
};

export default function HomePage() {
  const { lang } = useLang();
  const isRtl = lang === 'ar';
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const featured = products.slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-cyan-500/5 blur-[120px]" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="mb-8 flex justify-center">
            <Image src="/logo.svg" alt="AlwazzanOS" width={400} height={175} priority />
          </div>
          <p className="text-xl md:text-2xl text-[var(--text)] font-light mb-4 leading-relaxed">
            {tr(t.hero.tagline, lang)}
          </p>
          <p className="text-[var(--muted)] text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            {tr(t.hero.sub, lang)}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
            >
              {tr(t.hero.cta, lang)}
              <Arrow size={18} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-[var(--border)] text-[var(--muted)] hover:border-cyan-500/50 hover:text-[var(--text)] transition-colors"
            >
              {tr(t.hero.contact, lang)}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '2011', label: { ar: 'تأسست', en: 'Founded' } },
            { value: '8+',   label: { ar: 'أنظمة متكاملة', en: 'Integrated Systems' } },
            { value: '5+',   label: { ar: 'عملاء موثوقون', en: 'Trusted Clients' } },
            { value: '14+',  label: { ar: 'سنة خبرة', en: 'Years Experience' } },
          ].map(s => (
            <div key={s.value}>
              <div className="text-3xl font-bold gradient-text">{s.value}</div>
              <div className="text-sm text-[var(--muted)] mt-1">{tr(s.label, lang)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[var(--text)]">{tr(t.products.title, lang)}</h2>
          <p className="text-[var(--muted)] mt-3 max-w-xl mx-auto">{tr(t.products.sub, lang)}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map(p => (
            <div
              key={p.id}
              className="glow-border card-hover rounded-2xl bg-[var(--surface)] p-6 flex flex-col gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--bg)] flex items-center justify-center">
                {p.icon
                  ? <Image src={p.icon} alt={p.name.en} width={32} height={32} />
                  : iconMap[p.id] || <Monitor size={28} className="text-cyan-400" />
                }
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text)] text-lg">{p.name[lang]}</h3>
                <p className="text-[var(--muted)] text-sm mt-2 leading-relaxed line-clamp-3">
                  {p.desc[lang]}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
          >
            {tr(t.products.learnMore, lang)} <Arrow size={16} />
          </Link>
        </div>
      </section>

      {/* Clients */}
      <section className="bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[var(--text)]">{tr(t.clients.title, lang)}</h2>
            <p className="text-[var(--muted)] mt-2">{tr(t.clients.sub, lang)}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {clients.map(c => (
              <div
                key={c.name}
                className="glow-border rounded-xl bg-[var(--bg)] px-6 py-4 flex flex-col items-center gap-1 min-w-[160px]"
              >
                <span className="text-[var(--text)] font-medium text-sm">{lang === 'ar' ? c.nameAr : c.name}</span>
                <span className="text-xs text-cyan-500/70">{tr(c.sector, lang)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold text-[var(--text)] mb-4">
          {lang === 'ar' ? 'هل أنت مستعد لرقمنة مؤسستك؟' : 'Ready to digitize your institution?'}
        </h2>
        <p className="text-[var(--muted)] mb-8 max-w-xl mx-auto">
          {lang === 'ar'
            ? 'تواصل معنا اليوم وسنساعدك في اختيار النظام المناسب لاحتياجاتك.'
            : 'Contact us today and we will help you choose the right system for your needs.'}
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-opacity text-lg"
        >
          {tr(t.hero.contact, lang)} <Arrow size={20} />
        </Link>
      </section>
    </div>
  );
}
