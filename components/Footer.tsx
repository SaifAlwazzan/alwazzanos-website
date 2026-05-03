'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useLang } from '@/lib/lang-context';
import { t, tr } from '@/lib/i18n';

export default function Footer() {
  const { lang } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] mt-20">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <Image src="/logo.svg" alt="AlwazzanOS" width={160} height={70} />
          <p className="mt-3 text-sm text-[var(--muted)]">{tr(t.footer.tagline, lang)}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[var(--text)] mb-3">{tr(t.nav.products, lang)}</h4>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            {['Hospital OS', 'Clinic OS', 'Lab OS', 'Store OS', 'Cashier OS', 'Queue OS'].map(p => (
              <li key={p}><Link href="/products" className="hover:text-[var(--cyan)] transition-colors">{p}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[var(--text)] mb-3">{tr(t.nav.contact, lang)}</h4>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            <li>swordbarsh@gmail.com</li>
            <li>alwazzanos.com</li>
            <li>07777900495</li>
            <li>Iraq — Basra</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--border)] py-4 text-center text-xs text-[var(--muted)]">
        © {year} AlwazzanOS for Software Developing. {tr(t.footer.rights, lang)}.
      </div>
    </footer>
  );
}
