'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Receipt, Eye, Trash2, FileDown } from 'lucide-react';
import { api } from '@/lib/oim-api';
import { formatCurrency, formatDate } from '@/lib/oim-utils';

interface Invoice {
  id: string;
  number: string;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  currencyCode: string;
  total: string;
  paidAmount: string;
  issueDate: string;
  dueDate: string | null;
  client: { id: string; name: string };
  _count: { items: number; installments: number; payments: number };
}

const STATUS_STYLES: Record<string, string> = {
  UNPAID: 'bg-amber-100 text-amber-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-700',
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showFromOffer, setShowFromOffer] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ invoices: Invoice[] }>(`/invoices${statusFilter ? `?status=${statusFilter}` : ''}`);
      setInvoices(res.invoices);
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
    if (!confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
          <p className="text-slate-500 mt-1">Track invoices and payments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFromOffer(true)} className="btn-secondary">
            <FileDown size={18} /> From Offer
          </button>
          <Link href="/invoices/new" className="btn-primary">
            <Plus size={18} /> New Invoice
          </Link>
        </div>
      </div>

      <div className="card p-4 flex gap-2 flex-wrap">
        {['', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              statusFilter === s ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Receipt size={40} className="mx-auto mb-3 text-slate-300" />
            No invoices yet.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Number</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Total</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Paid</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Issue Date</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono text-sm">{inv.number}</td>
                  <td className="px-6 py-4 font-medium">{inv.client.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[inv.status]}`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold">{formatCurrency(inv.total, inv.currencyCode)}</td>
                  <td className="px-6 py-4 text-right text-emerald-600">
                    {formatCurrency(inv.paidAmount, inv.currencyCode)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(inv.issueDate)}</td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <Link href={`/invoices/${inv.id}`} className="inline-flex p-2 rounded hover:bg-slate-100 text-slate-600">
                      <Eye size={16} />
                    </Link>
                    <button onClick={() => handleDelete(inv.id)} className="p-2 rounded hover:bg-red-50 text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showFromOffer && <FromOfferModal onClose={() => setShowFromOffer(false)} onCreated={load} />}
    </div>
  );
}

function FromOfferModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [offers, setOffers] = useState<{ id: string; number: string; title: string; total: string; currencyCode: string; client: { name: string } }[]>([]);
  const [offerId, setOfferId] = useState('');
  const [upfront, setUpfront] = useState('5000000');
  const [installmentCount, setInstallmentCount] = useState('24');
  const [intervalDays, setIntervalDays] = useState('30');
  const [firstDate, setFirstDate] = useState(new Date().toISOString().substring(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ offers: typeof offers }>('/offers?status=ACCEPTED').then((r) => setOffers(r.offers));
    api.get<{ offers: typeof offers }>('/offers').then((r) => {
      // also include all offers as fallback
      setOffers((prev) => {
        const ids = new Set(prev.map((o) => o.id));
        return [...prev, ...r.offers.filter((o) => !ids.has(o.id))];
      });
    });
  }, []);

  async function handleSubmit() {
    setSaving(true);
    setError('');
    try {
      await api.post('/invoices/from-offer', {
        offerId,
        upfront: parseFloat(upfront) || 0,
        installmentCount: parseInt(installmentCount) || 0,
        firstInstallmentDate: firstDate,
        intervalDays: parseInt(intervalDays) || 30,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">Generate Invoice from Offer</h2>
          <button onClick={onClose} className="p-2 rounded hover:bg-slate-100">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Offer *</label>
            <select className="input" value={offerId} onChange={(e) => setOfferId(e.target.value)}>
              <option value="">Select offer...</option>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.number} — {o.client.name} — {o.title}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Upfront Payment</label>
              <input type="number" className="input" value={upfront} onChange={(e) => setUpfront(e.target.value)} />
            </div>
            <div>
              <label className="label"># Installments</label>
              <input type="number" className="input" value={installmentCount} onChange={(e) => setInstallmentCount(e.target.value)} />
            </div>
            <div>
              <label className="label">First Installment Date</label>
              <input type="date" className="input" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Interval (days)</label>
              <input type="number" className="input" value={intervalDays} onChange={(e) => setIntervalDays(e.target.value)} />
            </div>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
        </div>
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary" disabled={saving || !offerId}>
            {saving ? 'Generating...' : 'Generate Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}
