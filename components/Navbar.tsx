'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLang } from '@/lib/lang-context';
import { t, tr } from '@/lib/i18n';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { lang, toggle } = useLang();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/',         label: tr(t.nav.home,     lang) },
    { href: '/products', label: tr(t.nav.products, lang) },
    { href: '/about',    label: tr(t.nav.about,    lang) },
    { href: '/contact',  label: tr(t.nav.contact,  lang) },
  ];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="AlwazzanOS" width={160} height={70} priority />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm transition-colors ${
                pathname === l.href
                  ? 'text-[var(--cyan)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={toggle}
            className="px-3 py-1 rounded border border-[var(--border)] text-xs text-[var(--muted)] hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition-colors"
          >
            {lang === 'ar' ? 'EN' : 'ع'}
          </button>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={toggle}
            className="px-3 py-1 rounded border border-[var(--border)] text-xs text-[var(--muted)]"
          >
            {lang === 'ar' ? 'EN' : 'ع'}
          </button>
          <button onClick={() => setOpen(o => !o)} className="text-[var(--muted)]">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 flex flex-col gap-3">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`text-sm py-2 ${
                pathname === l.href ? 'text-[var(--cyan)]' : 'text-[var(--muted)]'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
