'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { api } from '@/lib/oim-api';

interface Partner {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  profitShare: string;
  active: boolean;
  notes: string | null;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ partners: Partner[] }>('/partners');
      setPartners(res.partners);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this partner?')) return;
    try {
      await api.delete(`/partners/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  const totalShare = partners.reduce((s, p) => s + parseFloat(p.profitShare), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Partners</h1>
          <p className="text-slate-500 mt-1">Business partners and profit shares</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
          <Plus size={18} /> New Partner
        </button>
      </div>

      {totalShare !== 100 && partners.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3">
          ⚠ Profit shares sum to {totalShare}% (should be 100%)
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center text-slate-500">Loading...</div>
        ) : (
          partners.map((p) => (
            <div key={p.id} className="card p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{p.name}</h3>
                  {p.email && <p className="text-sm text-slate-500">{p.email}</p>}
                  {p.phone && <p className="text-sm text-slate-500">{p.phone}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(p); setShowForm(true); }} className="p-2 rounded hover:bg-slate-100">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 rounded hover:bg-red-50 text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="text-3xl font-bold text-brand">{parseFloat(p.profitShare)}%</div>
              <div className="text-xs text-slate-500 mt-1">Profit share</div>
            </div>
          ))
        )}
      </div>

      {showForm && <PartnerForm partner={editing} onClose={(r) => { setShowForm(false); if (r) load(); }} />}
    </div>
  );
}

function PartnerForm({ partner, onClose }: { partner: Partner | null; onClose: (refresh: boolean) => void }) {
  const [form, setForm] = useState({
    name: partner?.name || '',
    email: partner?.email || '',
    phone: partner?.phone || '',
    profitShare: partner?.profitShare ? String(parseFloat(partner.profitShare)) : '50',
    notes: partner?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        email: form.email || null,
        phone: form.phone || null,
        notes: form.notes || null,
        profitShare: parseFloat(form.profitShare),
      };
      if (partner) {
        await api.patch(`/partners/${partner.id}`, payload);
      } else {
        await api.post('/partners', payload);
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">{partner ? 'Edit Partner' : 'New Partner'}</h2>
          <button onClick={() => onClose(false)} className="p-2 rounded hover:bg-slate-100">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Profit Share (%)</label>
            <input type="number" step="0.01" className="input" value={form.profitShare} onChange={(e) => setForm({ ...form, profitShare: e.target.value })} required />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => onClose(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : partner ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
