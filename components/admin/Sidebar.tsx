'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Receipt,
  Package,
  Settings,
  LogOut,
  Wallet,
  HandCoins,
  UserSquare2,
  FolderKanban,
} from 'lucide-react';
import { clearToken } from '@/lib/oim-api';
import { cn } from '@/lib/oim-utils';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Building2 },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/modules', label: 'Modules', icon: Package },
  { href: '/offers', label: 'Offers', icon: FileText },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/expenses', label: 'Expenses', icon: Wallet },
  { href: '/partners', label: 'Partners', icon: UserSquare2 },
  { href: '/ledger', label: 'Partner Ledger', icon: HandCoins },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearToken();
    router.replace('/admin/login');
  }

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-slate-800">
        <div className="text-xl font-light tracking-[4px]">ALWAZZAN</div>
        <div className="h-px bg-gradient-to-r from-transparent via-brand-light to-transparent my-1"></div>
        <div className="text-sm font-bold tracking-[6px] bg-gradient-to-r from-brand-light to-brand bg-clip-text text-transparent">
          OS
        </div>
        <div className="text-xs text-slate-400 mt-2">Offer &amp; Invoice Manager</div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-brand text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white w-full"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
