'use client';

import { useEffect, useState } from 'react';
import { Building2, FileText, Receipt, DollarSign } from 'lucide-react';
import { getUser } from '@/lib/oim-api';

interface User {
  name: string;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUser<User>());
  }, []);

  const stats = [
    { label: 'Clients', value: '0', icon: Building2, color: 'bg-blue-500' },
    { label: 'Open Offers', value: '0', icon: FileText, color: 'bg-purple-500' },
    { label: 'Unpaid Invoices', value: '0', icon: Receipt, color: 'bg-amber-500' },
    { label: 'Total Revenue', value: '0 IQD', icon: DollarSign, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Welcome back{user ? `, ${user.name}` : ''}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl text-white`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-2">Phase 1 — Foundation Complete</h2>
        <p className="text-slate-600 text-sm">
          Auth, users, and clients are wired up. Next phases will add modules library, offers,
          invoices, payments, and email integration.
        </p>
      </div>
    </div>
  );
}
