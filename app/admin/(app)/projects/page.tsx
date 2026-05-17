'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Eye, Trash2, Edit2, FolderKanban } from 'lucide-react';
import { api } from '@/lib/oim-api';
import { formatCurrency, formatDate } from '@/lib/oim-utils';
import ProjectForm, { Project, Client } from './ProjectForm';

const STATUS_STYLES: Record<string, string> = {
  PLANNING: 'bg-slate-100 text-slate-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  ON_HOLD: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

interface ProjectListItem extends Project {
  client: { id: string; name: string } | null;
  _count: { offers: number; invoices: number; expenses: number };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProjectListItem | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        api.get<{ projects: ProjectListItem[] }>(`/projects${statusFilter ? `?status=${statusFilter}` : ''}`),
        api.get<{ clients: Client[] }>('/clients'),
      ]);
      setProjects(p.projects);
      setClients(c.clients);
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
    if (!confirm('Delete this project? Linked offers/invoices/expenses will be unlinked.')) return;
    try {
      await api.delete(`/projects/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 mt-1">Group offers, invoices and expenses by project</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
          <Plus size={18} /> New Project
        </button>
      </div>

      <div className="card p-4 flex gap-2 flex-wrap">
        {['', 'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'].map((s) => (
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

      {loading ? (
        <div className="card p-8 text-center text-slate-500">Loading...</div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <FolderKanban size={40} className="mx-auto mb-3 text-slate-300" />
          No projects yet. Click &quot;New Project&quot; to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <Link href={`/projects/${p.id}`} className="font-semibold text-slate-900 hover:text-brand">
                    {p.name}
                  </Link>
                  {p.code && <div className="text-xs text-slate-500 font-mono mt-0.5">{p.code}</div>}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[p.status]}`}>
                  {p.status.replace('_', ' ')}
                </span>
              </div>
              {p.client && <div className="text-sm text-slate-600 mb-3">{p.client.name}</div>}
              {p.budget && (
                <div className="text-lg font-bold text-brand mb-3">
                  {formatCurrency(p.budget, p.currencyCode)}
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span>{p._count.offers} offers</span>
                <span>•</span>
                <span>{p._count.invoices} invoices</span>
                <span>•</span>
                <span>{p._count.expenses} expenses</span>
              </div>
              <div className="flex justify-end gap-1 mt-3">
                <Link href={`/projects/${p.id}`} className="p-2 rounded hover:bg-slate-100 text-slate-600" title="View">
                  <Eye size={16} />
                </Link>
                <button onClick={() => { setEditing(p); setShowForm(true); }} className="p-2 rounded hover:bg-slate-100 text-slate-600" title="Edit">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-2 rounded hover:bg-red-50 text-red-600" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProjectForm
          project={editing}
          clients={clients}
          onClose={(r) => { setShowForm(false); setEditing(null); if (r) load(); }}
        />
      )}
    </div>
  );
}
