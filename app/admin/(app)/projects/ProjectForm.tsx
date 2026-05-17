'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/oim-api';

export interface Client {
  id: string;
  name: string;
  currencyCode: string;
}

export interface Project {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
  clientId: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: string | null;
  currencyCode: string;
  notes: string | null;
}

export default function ProjectForm({
  project,
  clients,
  onClose,
}: {
  project: Project | null;
  clients: Client[];
  onClose: (refresh: boolean) => void;
}) {
  const [form, setForm] = useState({
    name: project?.name || '',
    code: project?.code || '',
    description: project?.description || '',
    status: project?.status || 'ACTIVE',
    clientId: project?.clientId || '',
    startDate: project?.startDate ? project.startDate.substring(0, 10) : '',
    endDate: project?.endDate ? project.endDate.substring(0, 10) : '',
    budget: project?.budget ? String(parseFloat(project.budget)) : '',
    currencyCode: project?.currencyCode || 'IQD',
    notes: project?.notes || '',
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
        code: form.code || null,
        description: form.description || null,
        clientId: form.clientId || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        budget: form.budget ? parseFloat(form.budget) : null,
        notes: form.notes || null,
      };
      if (project) {
        await api.patch(`/projects/${project.id}`, payload);
      } else {
        await api.post('/projects', payload);
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
          <h2 className="text-xl font-bold">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={() => onClose(false)} className="p-2 rounded hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
            </div>
            <div>
              <label className="label">Code</label>
              <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ALMAWADA-HIS" />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label">Client</label>
              <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                <option value="">— None —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
              <label className="label">Budget</label>
              <input type="number" className="input" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea rows={2} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Notes</label>
              <textarea rows={2} className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => onClose(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : project ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
