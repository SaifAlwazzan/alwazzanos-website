'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { api } from '@/lib/oim-api';
import ClientForm from './ClientForm';

interface Client {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  currencyCode: string;
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ clients: Client[] }>(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setClients(res.clients);
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
    if (!confirm('Delete this client?')) return;
    try {
      await api.delete(`/clients/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  function handleEdit(client: Client) {
    setEditing(client);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 mt-1">Manage your customer database</p>
        </div>
        <button onClick={handleNew} className="btn-primary">
          <Plus size={18} />
          New Client
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No clients yet. Click &quot;New Client&quot; to add one.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Contact</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Phone</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Currency</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                  <td className="px-6 py-4 text-slate-600">{c.contactPerson || '—'}</td>
                  <td className="px-6 py-4 text-slate-600">{c.email || '—'}</td>
                  <td className="px-6 py-4 text-slate-600">{c.phone || '—'}</td>
                  <td className="px-6 py-4 text-slate-600">{c.currencyCode}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(c)} className="p-2 rounded hover:bg-slate-100 text-slate-600">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 rounded hover:bg-red-50 text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && <ClientForm client={editing} onClose={handleClose} />}
    </div>
  );
}
