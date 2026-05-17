'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FileText, Eye, Trash2 } from 'lucide-react';
import { api } from '@/lib/oim-api';
import { formatCurrency, formatDate } from '@/lib/oim-utils';

interface Offer {
  id: string;
  number: string;
  title: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  currencyCode: string;
  total: string | number;
  createdAt: string;
  validUntil: string | null;
  client: { id: string; name: string };
  createdBy: { id: string; name: string };
  _count: { items: number };
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SENT: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-amber-100 text-amber-700',
};

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ offers: Offer[] }>(`/offers${statusFilter ? `?status=${statusFilter}` : ''}`);
      setOffers(res.offers);
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
    if (!confirm('Delete this offer?')) return;
    try {
      await api.delete(`/offers/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Offers</h1>
          <p className="text-slate-500 mt-1">Create and manage client proposals</p>
        </div>
        <Link href="/offers/new" className="btn-primary">
          <Plus size={18} />
          New Offer
        </Link>
      </div>

      <div className="card p-4 flex gap-2 flex-wrap">
        {['', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'].map((s) => (
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
        ) : offers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText size={40} className="mx-auto mb-3 text-slate-300" />
            No offers yet. Create your first one.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Number</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Title</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Total</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Created</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {offers.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono text-sm text-slate-700">{o.number}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{o.title}</td>
                  <td className="px-6 py-4 text-slate-600">{o.client.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[o.status]}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-900">
                    {formatCurrency(o.total, o.currencyCode)}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{formatDate(o.createdAt)}</td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <Link href={`/offers/${o.id}`} className="inline-flex p-2 rounded hover:bg-slate-100 text-slate-600">
                      <Eye size={16} />
                    </Link>
                    <button onClick={() => handleDelete(o.id)} className="p-2 rounded hover:bg-red-50 text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
