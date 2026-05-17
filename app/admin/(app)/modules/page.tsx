'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { api } from '@/lib/oim-api';
import { formatCurrency } from '@/lib/oim-utils';
import ModuleForm from './ModuleForm';

export interface Module {
  id: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  category: string | null;
  defaultPrice: string | number;
  currencyCode: string;
  features: string[];
  active: boolean;
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Module | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ modules: Module[] }>(`/modules${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setModules(res.modules);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this module?')) return;
    try {
      await api.delete(`/modules/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  function handleEdit(m: Module) {
    setEditing(m);
    setShowForm(true);
  }

  function handleNew() {
    setEditing(null);
    setShowForm(true);
  }

  function handleClose(refresh: boolean) {
    setShowForm(false);
    setEditing(null);
    if (refresh) load();
  }

  // Group by category
  const grouped = modules.reduce<Record<string, Module[]>>((acc, m) => {
    const key = m.category || 'Uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Modules Library</h1>
          <p className="text-slate-500 mt-1">Reusable building blocks for your offers</p>
        </div>
        <button onClick={handleNew} className="btn-primary">
          <Plus size={18} />
          New Module
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search modules..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-slate-500">Loading...</div>
      ) : modules.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          No modules yet. Click &quot;New Module&quot; to add one.
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((m) => (
                <div key={m.id} className="card p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-light to-brand text-white flex items-center justify-center">
                        <Package size={18} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{m.name}</h3>
                        {m.nameAr && <p className="text-xs text-slate-500" dir="rtl">{m.nameAr}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(m)} className="p-1.5 rounded hover:bg-slate-100 text-slate-600">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-brand mb-2">
                    {formatCurrency(m.defaultPrice, m.currencyCode)}
                  </div>
                  {m.features.length > 0 && (
                    <ul className="text-xs text-slate-600 space-y-1 mt-3">
                      {m.features.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-brand">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                      {m.features.length > 4 && (
                        <li className="text-slate-400 italic">+{m.features.length - 4} more</li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {showForm && <ModuleForm module={editing} onClose={handleClose} />}
    </div>
  );
}
