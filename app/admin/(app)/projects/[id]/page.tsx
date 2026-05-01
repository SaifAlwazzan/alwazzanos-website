'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, FileText, Receipt, Wallet, TrendingUp } from 'lucide-react';
import { api } from '@/lib/oim-api';
import { formatCurrency, formatDate } from '@/lib/oim-utils';
import ProjectForm, { Project, Client } from '../ProjectForm';

interface FullProject extends Project {
  client: { id: string; name: string } | null;
  offers: { id: string; number: string; title: string; status: string; total: string; currencyCode: string }[];
  invoices: { id: string; number: string; status: string; total: string; paidAmount: string; currencyCode: string; payments: any[] }[];
  expenses: {
    id: string;
    date: string;
    vendor: string;
    cost: string;
    billable: string;
    markupPct: string;
    currencyCode: string;
    status: string;
    paidByPartner: { id: string; name: string };
  }[];
}

interface Summary {
  [currency: string]: { revenue: number; collected: number; cost: number; billable: number; profit: number };
}

const STATUS_STYLES: Record<string, string> = {
  PLANNING: 'bg-slate-100 text-slate-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  ON_HOLD: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<FullProject | null>(null);
  const [summary, setSummary] = useState<Summary>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        api.get<{ project: FullProject; summary: Summary }>(`/projects/${params.id}`),
        api.get<{ clients: Client[] }>('/clients'),
      ]);
      setProject(p.project);
      setSummary(p.summary);
      setClients(c.clients);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) load();
  }, [params.id]);

  if (loading) return <div className="text-center text-slate-500">Loading...</div>;
  if (!project) return <div className="text-center text-slate-500">Not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/projects')} className="p-2 rounded hover:bg-slate-100">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[project.status]}`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <div className="text-sm text-slate-500">
              {project.code && <span className="font-mono">{project.code} • </span>}
              {project.client && <span>{project.client.name}</span>}
            </div>
          </div>
        </div>
        <button onClick={() => setEditing(true)} className="btn-primary">
          <Edit2 size={16} /> Edit
        </button>
      </div>

      {/* PROFIT SUMMARY */}
      {Object.entries(summary).map(([cur, s]) => {
        const profitPct = s.cost > 0 ? (s.profit / s.cost) * 100 : 0;
        const totalProfitFromAll = s.revenue - s.cost; // includes invoice revenue
        return (
          <div key={cur} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-600" />
                Project Financials ({cur})
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Revenue (Invoiced)</div>
                <div className="text-lg font-bold text-slate-900">{formatCurrency(s.revenue, cur)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Collected</div>
                <div className="text-lg font-bold text-emerald-600">{formatCurrency(s.collected, cur)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Cost (Spent)</div>
                <div className="text-lg font-bold text-amber-600">{formatCurrency(s.cost, cur)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Expense Profit</div>
                <div className="text-lg font-bold text-emerald-600">+{formatCurrency(s.profit, cur)}</div>
                <div className="text-xs text-slate-500">Markup over cost</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Profit Margin</div>
                <div className={`text-lg font-bold ${profitPct >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {profitPct.toFixed(1)}%
                </div>
              </div>
            </div>
            {project.budget && cur === project.currencyCode && (
              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Budget Usage</span>
                    <span>{((s.cost / parseFloat(project.budget)) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-light to-brand"
                      style={{ width: `${Math.min(100, (s.cost / parseFloat(project.budget)) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-slate-500">Budget: </span>
                  <span className="font-semibold">{formatCurrency(project.budget, cur)}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {Object.keys(summary).length === 0 && (
        <div className="card p-8 text-center text-slate-500">
          No financial data yet. Link offers, invoices, or expenses to this project.
        </div>
      )}

      {/* OFFERS */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 font-semibold flex items-center gap-2">
          <FileText size={16} /> Offers ({project.offers.length})
        </div>
        {project.offers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No offers linked to this project.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Number</th>
                <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Title</th>
                <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="text-right px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {project.offers.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3"><Link href={`/offers/${o.id}`} className="font-mono text-sm text-brand hover:underline">{o.number}</Link></td>
                  <td className="px-6 py-3 text-sm">{o.title}</td>
                  <td className="px-6 py-3"><span className="text-xs px-2 py-1 rounded bg-slate-100">{o.status}</span></td>
                  <td className="px-6 py-3 text-right font-semibold">{formatCurrency(o.total, o.currencyCode)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* INVOICES */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 font-semibold flex items-center gap-2">
          <Receipt size={16} /> Invoices ({project.invoices.length})
        </div>
        {project.invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No invoices linked to this project.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Number</th>
                <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="text-right px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Total</th>
                <th className="text-right px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {project.invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3"><Link href={`/invoices/${inv.id}`} className="font-mono text-sm text-brand hover:underline">{inv.number}</Link></td>
                  <td className="px-6 py-3"><span className="text-xs px-2 py-1 rounded bg-slate-100">{inv.status.replace('_', ' ')}</span></td>
                  <td className="px-6 py-3 text-right font-semibold">{formatCurrency(inv.total, inv.currencyCode)}</td>
                  <td className="px-6 py-3 text-right text-emerald-600">{formatCurrency(inv.paidAmount, inv.currencyCode)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* EXPENSES */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 font-semibold flex items-center gap-2">
          <Wallet size={16} /> Expenses ({project.expenses.length})
        </div>
        {project.expenses.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No expenses linked to this project.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">Vendor</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">Paid By</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-slate-600 uppercase">Cost</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-slate-600 uppercase">Markup</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-slate-600 uppercase">Billable</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {project.expenses.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-sm">{formatDate(e.date)}</td>
                  <td className="px-4 py-3 text-sm font-medium">{e.vendor}</td>
                  <td className="px-4 py-3 text-sm">{e.paidByPartner.name}</td>
                  <td className="px-4 py-3 text-right text-sm">{formatCurrency(e.cost, e.currencyCode)}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600">{parseFloat(e.markupPct)}%</td>
                  <td className="px-4 py-3 text-right font-semibold text-sm">{formatCurrency(e.billable, e.currencyCode)}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded bg-slate-100">{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <ProjectForm
          project={project}
          clients={clients}
          onClose={(r) => { setEditing(false); if (r) load(); }}
        />
      )}
    </div>
  );
}
