'use client';

import { useEffect, useMemo, useState } from 'react';
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

interface Installment {
  number: number;
  dueDate: string;
  amount: number;
}

type PlanMode = 'full' | 'monthly' | 'custom';

function addMonths(d: Date, n: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

function toInput(d: Date): string {
  return d.toISOString().substring(0, 10);
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
  const [planMode, setPlanMode] = useState<PlanMode>('full');
  const [monthlyCount, setMonthlyCount] = useState(3);
  const [customInstallments, setCustomInstallments] = useState<Installment[]>([]);
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

  const computedInstallments: Installment[] = useMemo(() => {
    if (planMode === 'full' || total <= 0) return [];
    if (planMode === 'monthly') {
      const start = form.dueDate ? new Date(form.dueDate) : new Date(form.issueDate);
      const per = Math.floor((total / monthlyCount) * 100) / 100;
      const last = Math.round((total - per * (monthlyCount - 1)) * 100) / 100;
      return Array.from({ length: monthlyCount }, (_, i) => ({
        number: i + 1,
        dueDate: toInput(addMonths(start, i)),
        amount: i === monthlyCount - 1 ? last : per,
      }));
    }
    return customInstallments;
  }, [planMode, monthlyCount, total, form.dueDate, form.issueDate, customInstallments]);

  const installmentsSum = computedInstallments.reduce((s, i) => s + i.amount, 0);
  const installmentsValid = planMode === 'full' || Math.abs(installmentsSum - total) < 0.01;

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

  function addCustomInstallment() {
    const next = customInstallments.length + 1;
    const lastDate = customInstallments.length > 0
      ? new Date(customInstallments[customInstallments.length - 1].dueDate)
      : (form.dueDate ? new Date(form.dueDate) : new Date(form.issueDate));
    setCustomInstallments([
      ...customInstallments,
      { number: next, dueDate: toInput(addMonths(lastDate, 1)), amount: 0 },
    ]);
  }
  function updateCustomInstallment(i: number, patch: Partial<Installment>) {
    const arr = [...customInstallments];
    arr[i] = { ...arr[i], ...patch };
    setCustomInstallments(arr);
  }
  function removeCustomInstallment(i: number) {
    setCustomInstallments(customInstallments.filter((_, idx) => idx !== i).map((ins, idx) => ({ ...ins, number: idx + 1 })));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const installments = planMode === 'full' ? [] : computedInstallments;
      const res = await api.post<{ invoice: { id: string } }>('/invoices', {
        ...form,
        projectId: form.projectId || null,
        notes: form.notes || null,
        dueDate: form.dueDate || null,
        installments,
      });
      router.push(`/admin/invoices/${res.invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setSaving(false);
    }
  }

  const canSave = !saving && form.clientId && form.items.length > 0 && installmentsValid;

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

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold">Payment Plan</h2>
        <div className="flex gap-2 flex-wrap">
          {([
            ['full', 'Pay in full'],
            ['monthly', 'Split monthly'],
            ['custom', 'Custom schedule'],
          ] as Array<[PlanMode, string]>).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setPlanMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                planMode === mode ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {planMode === 'monthly' && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-600">Split across</span>
            <input
              type="number"
              min={2}
              max={36}
              className="input w-24"
              value={monthlyCount}
              onChange={(e) => setMonthlyCount(Math.max(2, parseInt(e.target.value) || 2))}
            />
            <span className="text-slate-600">monthly installments starting {form.dueDate ? `on ${form.dueDate}` : 'from issue date'}</span>
          </div>
        )}

        {planMode === 'custom' && (
          <div className="space-y-2">
            <button onClick={addCustomInstallment} className="btn-secondary text-sm"><Plus size={14} /> Add installment</button>
            {customInstallments.length === 0 && <div className="text-sm text-slate-500">No installments yet.</div>}
            {customInstallments.map((ins, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded">
                <div className="col-span-1 text-sm text-slate-500">#{ins.number}</div>
                <input type="date" className="input col-span-5" value={ins.dueDate} onChange={(e) => updateCustomInstallment(i, { dueDate: e.target.value })} />
                <input type="number" className="input col-span-5 text-right" value={ins.amount} onChange={(e) => updateCustomInstallment(i, { amount: parseFloat(e.target.value) || 0 })} />
                <button onClick={() => removeCustomInstallment(i)} className="col-span-1 text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}

        {planMode !== 'full' && computedInstallments.length > 0 && (
          <div className="border-t pt-3 space-y-1.5">
            <div className="text-sm font-semibold text-slate-700 mb-2">Schedule preview</div>
            {computedInstallments.map((ins) => (
              <div key={ins.number} className="flex justify-between text-sm">
                <span className="text-slate-600">#{ins.number} · {ins.dueDate}</span>
                <span className="font-mono">{formatCurrency(ins.amount, form.currencyCode)}</span>
              </div>
            ))}
            <div className={`flex justify-between text-sm pt-2 border-t font-semibold ${installmentsValid ? 'text-emerald-700' : 'text-red-600'}`}>
              <span>Total scheduled</span>
              <span>{formatCurrency(installmentsSum, form.currencyCode)} {installmentsValid ? '✓' : `(should equal ${formatCurrency(total, form.currencyCode)})`}</span>
            </div>
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}

      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} className="btn-primary" disabled={!canSave}>
          {saving ? 'Saving...' : 'Create Invoice'}
        </button>
      </div>
    </div>
  );
}
