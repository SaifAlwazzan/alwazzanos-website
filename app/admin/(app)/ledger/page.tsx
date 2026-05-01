'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { api } from '@/lib/oim-api';
import { formatCurrency, formatDate } from '@/lib/oim-utils';

interface Balances {
  [currency: string]: { owedBack: number; profitShare: number; withdrawn: number; net: number };
}

interface LedgerEntry {
  partner: { id: string; name: string; profitShare: string; active: boolean };
  balances: Balances;
  expenseCount: number;
}

interface Withdrawal {
  id: string;
  amount: string;
  currencyCode: string;
  date: string;
  notes: string | null;
  partner: { id: string; name: string };
}

export default function LedgerPage() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [totalProfit, setTotalProfit] = useState<Record<string, number>>({});
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [withdrawalPartnerId, setWithdrawalPartnerId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [l, w] = await Promise.all([
        api.get<{ ledger: LedgerEntry[]; totalProfit: Record<string, number> }>('/partners/ledger'),
        api.get<{ withdrawals: Withdrawal[] }>('/partners/withdrawals/all'),
      ]);
      setLedger(l.ledger);
      setTotalProfit(l.totalProfit);
      setWithdrawals(w.withdrawals);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteWithdrawal(id: string) {
    if (!confirm('Delete this withdrawal?')) return;
    try {
      await api.delete(`/partners/withdrawals/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Partner Ledger</h1>
          <p className="text-slate-500 mt-1">Per-partner balances, profit share, and withdrawals</p>
        </div>
        <button onClick={() => { setWithdrawalPartnerId(null); setShowWithdrawal(true); }} className="btn-primary">
          <Plus size={18} /> Record Withdrawal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(totalProfit).map(([cur, p]) => (
          <div key={cur} className="card p-5">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
              <TrendingUp size={14} /> Total Profit ({cur})
            </div>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(p, cur)}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="card p-8 text-center text-slate-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ledger.map((entry) => (
            <div key={entry.partner.id} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{entry.partner.name}</h3>
                  <p className="text-sm text-slate-500">{parseFloat(entry.partner.profitShare)}% profit share</p>
                </div>
                <button
                  onClick={() => { setWithdrawalPartnerId(entry.partner.id); setShowWithdrawal(true); }}
                  className="btn-secondary text-xs"
                >
                  <Wallet size={14} /> Withdraw
                </button>
              </div>

              {Object.keys(entry.balances).length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-6">No transactions yet</div>
              ) : (
                Object.entries(entry.balances).map(([cur, b]) => (
                  <div key={cur} className="border-t border-slate-100 pt-3 mt-3 first:border-0 first:pt-0 first:mt-0">
                    <div className="text-xs uppercase tracking-wider text-slate-500 mb-2 font-semibold">{cur}</div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Owed back (cost paid)</span>
                        <span className="font-semibold">{formatCurrency(b.owedBack, cur)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">+ Profit share</span>
                        <span className="font-semibold text-emerald-600">+{formatCurrency(b.profitShare, cur)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">− Already withdrawn</span>
                        <span className="font-semibold text-amber-600">−{formatCurrency(b.withdrawn, cur)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200 text-base">
                        <span className="font-bold text-slate-900">Net to receive</span>
                        <span className={`font-bold ${b.net >= 0 ? 'text-brand' : 'text-red-600'}`}>
                          {formatCurrency(b.net, cur)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 font-semibold flex items-center justify-between">
          <span>Withdrawal History</span>
          <span className="text-xs text-slate-500">{withdrawals.length} record(s)</span>
        </div>
        {withdrawals.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No withdrawals yet.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Partner</th>
                <th className="text-right px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Amount</th>
                <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Notes</th>
                <th className="text-right px-6 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {withdrawals.map((w) => (
                <tr key={w.id}>
                  <td className="px-6 py-3 text-sm">{formatDate(w.date)}</td>
                  <td className="px-6 py-3 font-medium">{w.partner.name}</td>
                  <td className="px-6 py-3 text-right font-semibold text-amber-600">−{formatCurrency(w.amount, w.currencyCode)}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">{w.notes || '—'}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => deleteWithdrawal(w.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showWithdrawal && (
        <WithdrawalForm
          partners={ledger.map((e) => e.partner)}
          defaultPartnerId={withdrawalPartnerId}
          onClose={(r) => { setShowWithdrawal(false); if (r) load(); }}
        />
      )}
    </div>
  );
}

function WithdrawalForm({
  partners,
  defaultPartnerId,
  onClose,
}: {
  partners: { id: string; name: string }[];
  defaultPartnerId: string | null;
  onClose: (refresh: boolean) => void;
}) {
  const [form, setForm] = useState({
    partnerId: defaultPartnerId || partners[0]?.id || '',
    amount: '',
    currencyCode: 'IQD',
    date: new Date().toISOString().substring(0, 10),
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/partners/withdrawals', {
        ...form,
        amount: parseFloat(form.amount),
        notes: form.notes || null,
      });
      onClose(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">Record Withdrawal</h2>
          <button onClick={() => onClose(false)} className="p-2 rounded hover:bg-slate-100">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Partner *</label>
            <select className="input" value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value })} required>
              {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount *</label>
            <div className="flex gap-2">
              <input type="number" step="0.01" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              <select className="input w-24" value={form.currencyCode} onChange={(e) => setForm({ ...form, currencyCode: e.target.value })}>
                <option value="IQD">IQD</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea rows={2} className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => onClose(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving || !form.amount}>{saving ? 'Saving...' : 'Record Withdrawal'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
