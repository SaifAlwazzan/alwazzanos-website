'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FolderKanban, Eye, Trash2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/oim-api';
import { formatCurrency, formatDate } from '@/lib/oim-utils';

type Status = 'WATCHING' | 'PREPARING' | 'SUBMITTED' | 'SHORTLISTED' | 'WON' | 'LOST' | 'CANCELLED';

interface Tender {
  id: string;
  number: string;
  title: string;
  issuingEntity: string;
  referenceNumber: string | null;
  status: Status;
  currencyCode: string;
  estimatedValue: string | number | null;
  deadline: string | null;
  submittedAt: string | null;
  createdAt: string;
  _count: { documents: number };
}

const STATUS_STYLES: Record<Status, string> = {
  WATCHING: 'bg-slate-100 text-slate-700',
  PREPARING: 'bg-blue-100 text-blue-700',
  SUBMITTED: 'bg-indigo-100 text-indigo-700',
  SHORTLISTED: 'bg-amber-100 text-amber-700',
  WON: 'bg-emerald-100 text-emerald-700',
  LOST: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export default function TendersPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status | ''>('');

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ tenders: Tender[] }>(
        `/tenders${statusFilter ? `?status=${statusFilter}` : ''}`
      );
      setTenders(res.tenders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this tender?')) return;
    try {
      await api.delete(`/tenders/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  const statuses: Array<Status | ''> = ['', 'WATCHING', 'PREPARING', 'SUBMITTED', 'SHORTLISTED', 'WON', 'LOST', 'CANCELLED'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tenders</h1>
          <p className="text-slate-500 mt-1">Track tender opportunities, submissions, and outcomes</p>
        </div>
        <Link href="/admin/tenders/new" className="btn-primary">
          <Plus size={18} />
          New Tender
        </Link>
      </div>

      <div className="card p-4 flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              statusFilter === s ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : tenders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FolderKanban size={40} className="mx-auto mb-3 text-slate-300" />
            No tenders yet. Add your first one.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Number</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Title</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Issuing Entity</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Est. Value</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Deadline</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tenders.map((t) => {
                const days = daysUntil(t.deadline);
                const urgent = days !== null && days >= 0 && days <= 7 && t.status !== 'SUBMITTED' && t.status !== 'WON' && t.status !== 'LOST' && t.status !== 'CANCELLED';
                const overdue = days !== null && days < 0 && (t.status === 'WATCHING' || t.status === 'PREPARING');
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-sm text-slate-700">{t.number}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {t.title}
                      {t.referenceNumber && <div className="text-xs text-slate-500 font-mono">Ref: {t.referenceNumber}</div>}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{t.issuingEntity}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[t.status]}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900">
                      {t.estimatedValue != null ? formatCurrency(t.estimatedValue, t.currencyCode) : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {t.deadline ? (
                        <div className={`flex items-center gap-1.5 ${overdue ? 'text-red-600 font-semibold' : urgent ? 'text-amber-600 font-semibold' : 'text-slate-600'}`}>
                          {(urgent || overdue) && <AlertCircle size={14} />}
                          <span>{formatDate(t.deadline)}{days !== null && ` (${days >= 0 ? `${days}d` : `${Math.abs(days)}d late`})`}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <Link href={`/admin/tenders/${t.id}`} className="inline-flex p-2 rounded hover:bg-slate-100 text-slate-600">
                        <Eye size={16} />
                      </Link>
                      <button onClick={() => handleDelete(t.id)} className="p-2 rounded hover:bg-red-50 text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
