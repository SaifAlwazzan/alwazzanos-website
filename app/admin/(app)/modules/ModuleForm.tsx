'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/oim-api';
import type { Module } from './page';

export default function ModuleForm({
  module,
  onClose,
}: {
  module: Module | null;
  onClose: (refresh: boolean) => void;
}) {
  const [form, setForm] = useState({
    name: module?.name || '',
    nameAr: module?.nameAr || '',
    description: module?.description || '',
    descriptionAr: module?.descriptionAr || '',
    category: module?.category || 'Hospital',
    defaultPrice: module?.defaultPrice ? String(module.defaultPrice) : '0',
    currencyCode: module?.currencyCode || 'IQD',
    features: module?.features || [],
    active: module?.active ?? true,
  });
  const [newFeature, setNewFeature] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function addFeature() {
    if (!newFeature.trim()) return;
    setForm({ ...form, features: [...form.features, newFeature.trim()] });
    setNewFeature('');
  }

  function removeFeature(idx: number) {
    setForm({ ...form, features: form.features.filter((_, i) => i !== idx) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        nameAr: form.nameAr || null,
        description: form.description || null,
        descriptionAr: form.descriptionAr || null,
        category: form.category || null,
        defaultPrice: parseFloat(form.defaultPrice) || 0,
      };
      if (module) {
        await api.patch(`/modules/${module.id}`, payload);
      } else {
        await api.post('/modules', payload);
      }
      onClose(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold">{module ? 'Edit Module' : 'New Module'}</h2>
          <button onClick={() => onClose(false)} className="p-2 rounded hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name (English) *</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Name (Arabic)</label>
              <input
                type="text"
                className="input"
                dir="rtl"
                value={form.nameAr}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Category</label>
              <input
                type="text"
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Hospital, Lab, ERP, ..."
              />
            </div>
            <div>
              <label className="label">Default Price *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={form.defaultPrice}
                  onChange={(e) => setForm({ ...form, defaultPrice: e.target.value })}
                  required
                />
                <select
                  className="input w-28"
                  value={form.currencyCode}
                  onChange={(e) => setForm({ ...form, currencyCode: e.target.value })}
                >
                  <option value="IQD">IQD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Features (bullet points)</label>
              <div className="space-y-2">
                {form.features.map((f, i) => (
                  <div key={i} className="flex gap-2 items-center bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-brand">•</span>
                    <span className="flex-1 text-sm">{f}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(i)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input"
                    placeholder="Add feature..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                  />
                  <button type="button" onClick={addFeature} className="btn-secondary">
                    <Plus size={16} />
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => onClose(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : module ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
