'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, GripVertical, Package } from 'lucide-react';
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

interface Module {
  id: string;
  name: string;
  description: string | null;
  defaultPrice: string | number;
  currencyCode: string;
  category: string | null;
  features: string[];
}

export interface Item {
  id?: string;
  moduleId: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
}

export interface OfferData {
  id?: string;
  number?: string;
  title: string;
  clientId: string;
  projectId: string | null;
  status?: string;
  currencyCode: string;
  discount: number;
  tax: number;
  validUntil: string | null;
  notes: string | null;
  items: Item[];
}

export default function OfferBuilder({ initial }: { initial?: OfferData }) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [showModulePicker, setShowModulePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<OfferData>(
    initial || {
      title: '',
      clientId: '',
      projectId: null,
      currencyCode: 'IQD',
      discount: 0,
      tax: 0,
      validUntil: null,
      notes: null,
      items: [],
    }
  );

  useEffect(() => {
    api.get<{ clients: Client[] }>('/clients').then((r) => setClients(r.clients));
    api.get<{ projects: Project[] }>('/projects').then((r) => setProjects(r.projects));
    api.get<{ modules: Module[] }>('/modules').then((r) => setModules(r.modules));
  }, []);

  const filteredProjects = form.clientId
    ? projects.filter((p) => !p.client || p.client.id === form.clientId)
    : projects;

  const subtotal = useMemo(
    () => form.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0),
    [form.items]
  );
  const total = Math.max(0, subtotal - Number(form.discount || 0) + Number(form.tax || 0));

  function addModule(m: Module) {
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          moduleId: m.id,
          name: m.name,
          description: m.features.length ? m.features.join('\n') : m.description,
          quantity: 1,
          unitPrice: Number(m.defaultPrice),
        },
      ],
    });
    setShowModulePicker(false);
  }

  function addCustomItem() {
    setForm({
      ...form,
      items: [
        ...form.items,
        { moduleId: null, name: '', description: null, quantity: 1, unitPrice: 0 },
      ],
    });
  }

  function updateItem(idx: number, patch: Partial<Item>) {
    const items = [...form.items];
    items[idx] = { ...items[idx], ...patch };
    setForm({ ...form, items });
  }

  function removeItem(idx: number) {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  }

  function moveItem(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= form.items.length) return;
    const items = [...form.items];
    [items[idx], items[target]] = [items[target], items[idx]];
    setForm({ ...form, items });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        notes: form.notes || null,
        validUntil: form.validUntil || null,
      };
      const res = initial?.id
        ? await api.patch<{ offer: { id: string } }>(`/offers/${initial.id}`, payload)
        : await api.post<{ offer: { id: string } }>('/offers', payload);
      router.push(`/offers/${res.offer.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {initial?.id ? `Edit Offer ${initial.number}` : 'New Offer'}
        </h1>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Offer Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Title *</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Hospital Management System Proposal"
              required
            />
          </div>
          <div>
            <label className="label">Client *</label>
            <select
              className="input"
              value={form.clientId}
              onChange={(e) => {
                const c = clients.find((c) => c.id === e.target.value);
                setForm({ ...form, clientId: e.target.value, currencyCode: c?.currencyCode || form.currencyCode });
              }}
              required
            >
              <option value="">Select client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Project</label>
            <select
              className="input"
              value={form.projectId || ''}
              onChange={(e) => setForm({ ...form, projectId: e.target.value || null })}
            >
              <option value="">— Non-project work —</option>
              {filteredProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code ? `${p.code} — ` : ''}{p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Currency</label>
            <select
              className="input"
              value={form.currencyCode}
              onChange={(e) => setForm({ ...form, currencyCode: e.target.value })}
            >
              <option value="IQD">IQD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div>
            <label className="label">Valid Until</label>
            <input
              type="date"
              className="input"
              value={form.validUntil ? form.validUntil.substring(0, 10) : ''}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value || null })}
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <input
              className="input"
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value || null })}
            />
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Items</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowModulePicker(true)} className="btn-secondary">
              <Package size={16} /> From Module Library
            </button>
            <button onClick={addCustomItem} className="btn-primary">
              <Plus size={16} /> Custom Item
            </button>
          </div>
        </div>

        {form.items.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">No items yet — add from the module library or as a custom line.</div>
        )}

        <div className="space-y-3">
          {form.items.map((it, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex gap-3">
                <div className="flex flex-col">
                  <button onClick={() => moveItem(idx, -1)} className="text-slate-400 hover:text-slate-700 px-1" title="Move up">
                    <GripVertical size={14} />
                  </button>
                </div>
                <div className="flex-1 grid grid-cols-12 gap-3">
                  <div className="col-span-12 md:col-span-5">
                    <input
                      className="input"
                      placeholder="Item name"
                      value={it.name}
                      onChange={(e) => updateItem(idx, { name: e.target.value })}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <input
                      type="number"
                      className="input"
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="col-span-8 md:col-span-3">
                    <input
                      type="number"
                      className="input"
                      placeholder="Unit price"
                      value={it.unitPrice}
                      onChange={(e) => updateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-2 flex items-center justify-end font-semibold text-slate-900">
                    {formatCurrency(it.quantity * it.unitPrice, form.currencyCode)}
                  </div>
                  <div className="col-span-12">
                    <textarea
                      rows={2}
                      className="input text-sm"
                      placeholder="Description / features (one per line)"
                      value={it.description || ''}
                      onChange={(e) => updateItem(idx, { description: e.target.value || null })}
                    />
                  </div>
                </div>
                <button onClick={() => removeItem(idx)} className="text-red-600 hover:bg-red-50 p-2 rounded h-fit">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6 space-y-3">
        <h2 className="font-semibold text-slate-900 mb-2">Summary</h2>
        <div className="flex justify-between items-center">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-semibold">{formatCurrency(subtotal, form.currencyCode)}</span>
        </div>
        <div className="flex justify-between items-center gap-3">
          <span className="text-slate-600">Discount</span>
          <input
            type="number"
            className="input w-48 text-right"
            value={form.discount}
            onChange={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="flex justify-between items-center gap-3">
          <span className="text-slate-600">Tax</span>
          <input
            type="number"
            className="input w-48 text-right"
            value={form.tax}
            onChange={(e) => setForm({ ...form, tax: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-lg font-bold text-brand">
          <span>Total</span>
          <span>{formatCurrency(total, form.currencyCode)}</span>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}

      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
        <button onClick={handleSave} className="btn-primary" disabled={saving || !form.title || !form.clientId}>
          {saving ? 'Saving...' : initial?.id ? 'Update Offer' : 'Create Offer'}
        </button>
      </div>

      {showModulePicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-bold">Pick a Module</h3>
              <button onClick={() => setShowModulePicker(false)} className="btn-secondary">
                Close
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              {modules.map((m) => (
                <button
                  key={m.id}
                  onClick={() => addModule(m)}
                  className="text-left card p-4 hover:border-brand transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-slate-900">{m.name}</span>
                    <span className="text-brand font-bold text-sm">
                      {formatCurrency(m.defaultPrice, m.currencyCode)}
                    </span>
                  </div>
                  {m.category && <span className="text-xs text-slate-500">{m.category}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
