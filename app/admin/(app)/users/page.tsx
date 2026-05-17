'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { api } from '@/lib/oim-api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  SALES: 'bg-blue-100 text-blue-700',
  ACCOUNTANT: 'bg-emerald-100 text-emerald-700',
  VIEWER: 'bg-slate-100 text-slate-700',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ users: User[] }>('/users');
      setUsers(res.users);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 mt-1">Manage team members and access</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
          <Plus size={18} /> New User
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Username/Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">{u.name}</td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-sm">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${ROLE_STYLES[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.active ? (
                      <span className="text-emerald-600 text-sm">● Active</span>
                    ) : (
                      <span className="text-slate-400 text-sm">○ Inactive</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => { setEditing(u); setShowForm(true); }} className="p-2 rounded hover:bg-slate-100 text-slate-600">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="p-2 rounded hover:bg-red-50 text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && <UserForm user={editing} onClose={(r) => { setShowForm(false); if (r) load(); }} />}
    </div>
  );
}

function UserForm({ user, onClose }: { user: User | null; onClose: (refresh: boolean) => void }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'SALES',
    active: user?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        role: form.role,
        active: form.active,
      };
      if (form.password) payload.password = form.password;
      if (user) {
        await api.patch(`/users/${user.id}`, payload);
      } else {
        if (!form.password) throw new Error('Password is required for new users');
        await api.post('/users', payload);
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
          <h2 className="text-xl font-bold">{user ? 'Edit User' : 'New User'}</h2>
          <button onClick={() => onClose(false)} className="p-2 rounded hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
          </div>
          <div>
            <label className="label">Username / Email *</label>
            <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <p className="text-xs text-slate-500 mt-1">Used to log in</p>
          </div>
          <div>
            <label className="label">Password {user && <span className="text-xs text-slate-500">(leave blank to keep current)</span>}</label>
            <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="ADMIN">Admin — full access</option>
              <option value="SALES">Sales — clients, offers</option>
              <option value="ACCOUNTANT">Accountant — invoices, payments</option>
              <option value="VIEWER">Viewer — read only</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4" />
            Active
          </label>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => onClose(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : user ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
