import type { Metadata } from 'next';
import { LangProvider } from '@/lib/lang-context';

export const metadata: Metadata = {
  title: 'AlwazzanOS — Admin',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <div className="min-h-screen bg-[var(--bg)]">{children}</div>
    </LangProvider>
  );
}
