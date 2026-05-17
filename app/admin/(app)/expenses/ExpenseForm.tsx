'use client';

import { useState, useMemo } from 'react';
import { X } from 'lucide-react';

export interface Partner {
  id: string;
  name: string;
}

export interface Client {
  id: string;
  name: string;
  currencyCode: string;
}

export interface Offer {
  id: string;
  number: string;
  title: string;
  client: { id: string; name: string };
}

export interface Project {
  id: string;
  name: string;
  code: string | null;
  client: { id: string; name: string } | null;
}

export interface Expense {
  id: string;
  date: string;
  vendor: string;
  description: string | null;
  cost: string;
  currencyCode: string;
  markupPct: string;
  billable: string;
  status: 'PENDING' | 'BILLED' | 'REIMBURSED';
  receiptUrl: string | null;
  notes: string | null;
  paidByPartner: { id: string; name: string };
  client: { id: string; name: string } | null;
  project: { id: string; name: string; code: string | null } | null;
  offer: { id: string; number: string; title: string } | null;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4100/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('oim_token');
}

export default function ExpenseForm({
  expense,
  partners,
  clients,
  projects,
  offers,
  onClose,
}: {
  expense: Expense | null;
  partners: Partner[];
  clients: Client[];
  projects: Project[];
  offers: Offer[];
  onClose: (refresh: boolean) => void;
}) {
  const [form, setForm] = useState({
    date: expense?.date ? expense.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
    vendor: expense?.vendor || '',
    description: expense?.description || '',
    cost: expense?.cost ? String(parseFloat(expense.cost)) : '0',
    currencyCode: expense?.currencyCode || 'IQD',
    markupPct: expense?.markupPct ? String(parseFloat(expense.markupPct)) : '20',
    paidByPartnerId: expense?.paidByPartner.id || partners[0]?.id || '',
    clientId: expense?.client?.id || '',
    projectId: expense?.project?.id || '',
    offerId: expense?.offer?.id || '',
    notes: expense?.notes || '',
  });

  const filteredProjects = form.clientId
    ? projects.filter((p) => !p.client || p.client.id === form.clientId)
    : projects;
  const [receipt, setReceipt] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const billable = useMemo(() => {
    const c = parseFloat(form.cost) || 0;
    const m = parseFloat(form.markupPct) || 0;
    return c * (1 + m / 100);
  }, [form.cost, form.markupPct]);

  const profit = billable - (parseFloat(form.cost) || 0);

  // Filter offers by selected client
  const filteredOffers = form.clientId ? offers.filter((o) => o.client.id === form.clientId) : offers;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const token = getToken();
      const fd = new FormData();
      fd.append('date', form.date);
      fd.append('vendor', form.vendor);
      fd.append('description', form.description || '');
      fd.append('cost', form.cost);
      fd.append('currencyCode', form.currencyCode);
      fd.append('markupPct', form.markupPct);
      fd.append('paidByPartnerId', form.paidByPartnerId);
      if (form.clientId) fd.append('clientId', form.clientId);
      if (form.projectId) fd.append('projectId', form.projectId);
      if (form.offerId) fd.append('offerId', form.offerId);
      if (form.notes) fd.append('notes', form.notes);
      if (receipt) fd.append('receipt', receipt);

      const url = expense ? `${API}/expenses/${expense.id}` : `${API}/expenses`;
      const method = expense ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Save failed');
      }
      onClose(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold">{expense ? 'Edit Expense' : 'New Expense'}</h2>
          <button onClick={() => onClose(false)} className="p-2 rounded hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="label">Paid By *</label>
              <select className="input" value={form.paidByPartnerId} onChange={(e) => setForm({ ...form, paidByPartnerId: e.target.value })} required>
                <option value="">Select partner...</option>
                {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Vendor *</label>
              <input className="input" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} required placeholder="Dell Iraq, Microsoft, Cisco..." />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What was purchased" />
            </div>
            <div>
              <label className="label">Cost *</label>
              <div className="flex gap-2">
                <input type="number" step="0.01" className="input" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required />
                <select className="input w-24" value={form.currencyCode} onChange={(e) => setForm({ ...form, currencyCode: e.target.value })}>
                  <option value="IQD">IQD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Markup % *</label>
              <input type="number" step="0.01" className="input" value={form.markupPct} onChange={(e) => setForm({ ...form, markupPct: e.target.value })} required />
            </div>
            <div>
              <label className="label">Client</label>
              <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, offerId: '', projectId: '' })}>
                <option value="">— None —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Project</label>
              <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                <option value="">— Non-project work —</option>
                {filteredProjects.map((p) => <option key={p.id} value={p.id}>{p.code ? `${p.code} — ` : ''}{p.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Linked Offer (optional)</label>
              <select className="input" value={form.offerId} onChange={(e) => setForm({ ...form, offerId: e.target.value })}>
                <option value="">— None —</option>
                {filteredOffers.map((o) => <option key={o.id} value={o.id}>{o.number} — {o.title}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Receipt (image / PDF)</label>
              <input type="file" accept="image/*,.pdf" onChange={(e) => setReceipt(e.target.files?.[0] || null)} className="input" />
              {expense?.receiptUrl && !receipt && (
                <a href={`http://localhost:4100${expense.receiptUrl}`} target="_blank" rel="noreferrer" className="text-xs text-brand mt-1 inline-block">
                  Current receipt →
                </a>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="label">Notes</label>
              <textarea rows={2} className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-500 uppercase">Cost</div>
              <div className="font-bold text-slate-900">{(parseFloat(form.cost) || 0).toLocaleString()} {form.currencyCode}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase">Billable</div>
              <div className="font-bold text-brand">{billable.toLocaleString()} {form.currencyCode}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase">Profit</div>
              <div className="font-bold text-emerald-600">+{profit.toLocaleString()} {form.currencyCode}</div>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => onClose(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : expense ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
