'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/oim-api';
import { formatCurrency } from '@/lib/oim-utils';

interface Client {
  id: string;
  name: string;
  currencyCode: string;
}

interface Project {
  id: string;
  name: string;
  code: string | null;
  client: { id: string } | null;
}

interface Item {
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({
    clientId: '',
    projectId: '',
    currencyCode: 'IQD',
    discount: 0,
    tax: 0,
    issueDate: new Date().toISOString().substring(0, 10),
    dueDate: '',
    notes: '',
    items: [] as Item[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ clients: Client[] }>('/clients').then((r) => setClients(r.clients));
    api.get<{ projects: Project[] }>('/projects').then((r) => setProjects(r.projects));
  }, []);

  const filteredProjects = form.clientId
    ? projects.filter((p) => !p.client || p.client.id === form.clientId)
    : projects;

  const subtotal = form.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const total = Math.max(0, subtotal - form.discount + form.tax);

  function addItem() {
    setForm({ ...form, items: [...form.items, { name: '', description: null, quantity: 1, unitPrice: 0 }] });
  }

  function updateItem(idx: number, patch: Partial<Item>) {
    const items = [...form.items];
    items[idx] = { ...items[idx], ...patch };
    setForm({ ...form, items });
  }

  function removeItem(idx: number) {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await api.post<{ invoice: { id: string } }>('/invoices', {
        ...form,
        projectId: form.projectId || null,
        notes: form.notes || null,
        dueDate: form.dueDate || null,
      });
      router.push(`/invoices/${res.invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">New Invoice</h1>

      <div className="card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Client *</label>
            <select className="input" value={form.clientId} onChange={(e) => {
              const c = clients.find((c) => c.id === e.target.value);
              setForm({ ...form, clientId: e.target.value, projectId: '', currencyCode: c?.currencyCode || form.currencyCode });
            }} required>
              <option value="">Select...</option>
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
          <div>
            <label className="label">Currency</label>
            <select className="input" value={form.currencyCode} onChange={(e) => setForm({ ...form, currencyCode: e.target.value })}>
              <option value="IQD">IQD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div>
            <label className="label">Issue Date</label>
            <input type="date" className="input" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Items</h2>
          <button onClick={addItem} className="btn-primary"><Plus size={16} /> Add Item</button>
        </div>
        {form.items.length === 0 && <div className="text-center text-slate-500 py-8 text-sm">No items yet</div>}
        {form.items.map((it, idx) => (
          <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50 grid grid-cols-12 gap-3">
            <input className="input col-span-12 md:col-span-5" placeholder="Item" value={it.name} onChange={(e) => updateItem(idx, { name: e.target.value })} />
            <input type="number" className="input col-span-4 md:col-span-2" placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 1 })} />
            <input type="number" className="input col-span-8 md:col-span-3" placeholder="Unit price" value={it.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })} />
            <div className="col-span-10 md:col-span-2 flex items-center justify-end font-semibold">{formatCurrency(it.quantity * it.unitPrice, form.currencyCode)}</div>
            <button onClick={() => removeItem(idx)} className="col-span-2 md:col-span-12 text-red-600 text-right"><Trash2 size={16} className="inline" /></button>
          </div>
        ))}
      </div>

      <div className="card p-6 space-y-3">
        <h2 className="font-semibold mb-2">Summary</h2>
        <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-semibold">{formatCurrency(subtotal, form.currencyCode)}</span></div>
        <div className="flex justify-between items-center gap-3"><span className="text-slate-600">Discount</span><input type="number" className="input w-48 text-right" value={form.discount} onChange={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })} /></div>
        <div className="flex justify-between items-center gap-3"><span className="text-slate-600">Tax</span><input type="number" className="input w-48 text-right" value={form.tax} onChange={(e) => setForm({ ...form, tax: parseFloat(e.target.value) || 0 })} /></div>
        <div className="flex justify-between pt-3 border-t text-lg font-bold text-brand"><span>Total</span><span>{formatCurrency(total, form.currencyCode)}</span></div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}

      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} className="btn-primary" disabled={saving || !form.clientId || form.items.length === 0}>
          {saving ? 'Saving...' : 'Create Invoice'}
        </button>
      </div>
    </div>
  );
}
