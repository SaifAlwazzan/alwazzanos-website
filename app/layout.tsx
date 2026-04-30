import type { Metadata } from 'next';
import './globals.css';
import { LangProvider } from '@/lib/lang-context';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'AlwazzanOS — Operating Systems for the Future',
  description: 'AlwazzanOS for Software Developing — integrated software systems for healthcare and business in Iraq since 2011.',
  keywords: ['AlwazzanOS', 'Hospital OS', 'Clinic OS', 'Lab OS', 'Iraq software', 'نظام مستشفى'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <LangProvider>
          <Navbar />
          <main className="pt-16">{children}</main>
          <Footer />
        </LangProvider>
      </body>
    </html>
  );
}
