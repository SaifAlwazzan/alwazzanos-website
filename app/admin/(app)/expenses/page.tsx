'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Wallet, Receipt, CheckCircle } from 'lucide-react';
import { api } from '@/lib/oim-api';
import { formatCurrency, formatDate } from '@/lib/oim-utils';
import ExpenseForm, { Expense, Partner, Client, Offer, Project } from './ExpenseForm';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  BILLED: 'bg-blue-100 text-blue-700',
  REIMBURSED: 'bg-emerald-100 text-emerald-700',
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const url = `/expenses${statusFilter ? `?status=${statusFilter}` : ''}`;
      const [exp, par, cli, prj, off] = await Promise.all([
        api.get<{ expenses: Expense[] }>(url),
        api.get<{ partners: Partner[] }>('/partners'),
        api.get<{ clients: Client[] }>('/clients'),
        api.get<{ projects: Project[] }>('/projects'),
        api.get<{ offers: Offer[] }>('/offers'),
      ]);
      setExpenses(exp.expenses);
      setPartners(par.partners);
      setClients(cli.clients);
      setProjects(prj.projects);
      setOffers(off.offers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [statusFilter]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function reimburse(id: string) {
    if (!confirm('Mark as reimbursed?')) return;
    try {
      await api.post(`/expenses/${id}/reimburse`, {});
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  // Aggregate totals by currency
  const totals = expenses.reduce<Record<string, { cost: number; billable: number; profit: number }>>((acc, e) => {
    if (!acc[e.currencyCode]) acc[e.currencyCode] = { cost: 0, billable: 0, profit: 0 };
    acc[e.currencyCode].cost += parseFloat(e.cost);
    acc[e.currencyCode].billable += parseFloat(e.billable);
    acc[e.currencyCode].profit += parseFloat(e.billable) - parseFloat(e.cost);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Expenses</h1>
          <p className="text-slate-500 mt-1">Track project costs and markup billing</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
          <Plus size={18} /> New Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(totals).map(([cur, t]) => (
          <div key={cur} className="card p-5">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Total in {cur}</div>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(t.billable, cur)}</div>
            <div className="text-xs text-slate-500 mt-2">Cost: {formatCurrency(t.cost, cur)}</div>
            <div className="text-xs text-emerald-600 font-semibold">Profit: +{formatCurrency(t.profit, cur)}</div>
          </div>
        ))}
        {Object.keys(totals).length === 0 && (
          <div className="card p-5 col-span-3 text-center text-slate-500">No expenses yet</div>
        )}
      </div>

      <div className="card p-4 flex gap-2 flex-wrap">
        {['', 'PENDING', 'BILLED', 'REIMBURSED'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              statusFilter === s ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Wallet size={40} className="mx-auto mb-3 text-slate-300" />
            No expenses yet.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Paid By</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Client / Project</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Cost</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Markup</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Billable</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{formatDate(e.date)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{e.vendor}</div>
                    {e.description && <div className="text-xs text-slate-500">{e.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm">{e.paidByPartner.name}</td>
                  <td className="px-4 py-3 text-sm">
                    {e.client && <div>{e.client.name}</div>}
                    {e.offer && <div className="text-xs text-slate-500">{e.offer.number}</div>}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">{formatCurrency(e.cost, e.currencyCode)}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600">{parseFloat(e.markupPct)}%</td>
                  <td className="px-4 py-3 text-right font-semibold text-sm">{formatCurrency(e.billable, e.currencyCode)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[e.status]}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {e.receiptUrl && (
                      <a href={`http://localhost:4100${e.receiptUrl}`} target="_blank" rel="noreferrer" className="inline-flex p-1.5 rounded hover:bg-slate-100 text-slate-600" title="View receipt">
                        <Receipt size={14} />
                      </a>
                    )}
                    {e.status === 'BILLED' && (
                      <button onClick={() => reimburse(e.id)} className="inline-flex p-1.5 rounded hover:bg-emerald-50 text-emerald-600" title="Mark reimbursed">
                        <CheckCircle size={14} />
                      </button>
                    )}
                    <button onClick={() => { setEditing(e); setShowForm(true); }} className="inline-flex p-1.5 rounded hover:bg-slate-100 text-slate-600">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(e.id)} className="inline-flex p-1.5 rounded hover:bg-red-50 text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <ExpenseForm
          expense={editing}
          partners={partners}
          clients={clients}
          projects={projects}
          offers={offers}
          onClose={(r) => { setShowForm(false); if (r) load(); }}
        />
      )}
    </div>
  );
}
