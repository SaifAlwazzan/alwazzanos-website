'use client';
import Image from 'next/image';
import { useLang } from '@/lib/lang-context';
import { t, tr } from '@/lib/i18n';
import { products } from '@/lib/data';
import { Check, Monitor, Building2, FlaskConical, ShoppingBag, Calculator, ClipboardList, CreditCard, Users } from 'lucide-react';

const fallbackIcons: Record<string, React.ReactNode> = {
  'clinic-os':      <Monitor  size={36} className="text-blue-400" />,
  'project-os':     <ClipboardList size={36} className="text-emerald-400" />,
  'accounting-app': <Calculator size={36} className="text-sky-400" />,
  'cashier-os':     <CreditCard size={36} className="text-orange-400" />,
  'queue-os':       <Users size={36} className="text-rose-400" />,
};

export default function ProductsPage() {
  const { lang } = useLang();

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-[var(--text)] mb-4">{tr(t.products.title, lang)}</h1>
        <p className="text-[var(--muted)] max-w-2xl mx-auto text-lg">{tr(t.products.sub, lang)}</p>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((p, i) => (
          <div
            key={p.id}
            className="glow-border card-hover rounded-2xl bg-[var(--surface)] p-8 flex flex-col gap-5"
          >
            {/* Icon + name */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg)] flex items-center justify-center shrink-0">
                {p.icon
                  ? <Image src={p.icon} alt={p.name.en} width={40} height={40} />
                  : fallbackIcons[p.id] || <Monitor size={36} className="text-cyan-400" />
                }
              </div>
              <div>
                <div className="text-xs text-cyan-500 font-mono mb-1">0{i + 1}</div>
                <h2 className="text-xl font-bold text-[var(--text)]">{p.name[lang]}</h2>
              </div>
            </div>

            {/* Description */}
            <p className="text-[var(--muted)] leading-relaxed">{p.desc[lang]}</p>

            {/* Features */}
            <ul className="space-y-2">
              {p.features[lang].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                  <Check size={15} className="text-cyan-400 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {/* Color accent line */}
            <div className={`h-0.5 w-20 rounded-full bg-gradient-to-r ${p.color} mt-auto`} />
          </div>
        ))}
      </div>
    </div>
  );
}
