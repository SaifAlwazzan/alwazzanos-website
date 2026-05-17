'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Printer, Send, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/oim-api';
import { formatCurrency, formatDate } from '@/lib/oim-utils';
import OfferBuilder, { OfferData } from '../OfferBuilder';

interface FullOffer {
  id: string;
  number: string;
  title: string;
  status: string;
  currencyCode: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
  projectId: string | null;
  client: {
    id: string;
    name: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  createdBy: { id: string; name: string };
  items: {
    id: string;
    moduleId: string | null;
    name: string;
    description: string | null;
    quantity: number;
    unitPrice: string;
    total: string;
  }[];
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SENT: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-amber-100 text-amber-700',
};

export default function OfferDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [offer, setOffer] = useState<FullOffer | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ offer: FullOffer }>(`/offers/${params.id}`);
      setOffer(res.offer);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) load();
  }, [params.id]);

  async function setStatus(status: string) {
    try {
      await api.patch(`/offers/${params.id}/status`, { status });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  }

  function openPrintView() {
    window.open(`/offers/${params.id}/print`, '_blank');
  }

  if (loading) return <div className="text-center text-slate-500">Loading...</div>;
  if (!offer) return <div className="text-center text-slate-500">Offer not found</div>;

  if (editing) {
    const initial: OfferData = {
      id: offer.id,
      number: offer.number,
      title: offer.title,
      clientId: offer.client.id,
      projectId: offer.projectId,
      currencyCode: offer.currencyCode,
      discount: parseFloat(offer.discount),
      tax: parseFloat(offer.tax),
      validUntil: offer.validUntil,
      notes: offer.notes,
      items: offer.items.map((it) => ({
        moduleId: it.moduleId,
        name: it.name,
        description: it.description,
        quantity: it.quantity,
        unitPrice: parseFloat(it.unitPrice),
      })),
    };
    return <OfferBuilder initial={initial} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/offers')} className="p-2 rounded hover:bg-slate-100">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{offer.title}</h1>
              <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[offer.status]}`}>
                {offer.status}
              </span>
            </div>
            <div className="text-slate-500 text-sm font-mono">{offer.number}</div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {offer.status === 'DRAFT' && (
            <button onClick={() => setStatus('SENT')} className="btn-secondary">
              <Send size={16} /> Mark as Sent
            </button>
          )}
          {offer.status === 'SENT' && (
            <>
              <button onClick={() => setStatus('ACCEPTED')} className="btn-secondary">
                <CheckCircle size={16} /> Accepted
              </button>
              <button onClick={() => setStatus('REJECTED')} className="btn-secondary">
                <XCircle size={16} /> Rejected
              </button>
            </>
          )}
          <button onClick={openPrintView} className="btn-secondary">
            <Printer size={16} /> Print / PDF
          </button>
          <button onClick={() => setEditing(true)} className="btn-primary">
            <Edit2 size={16} /> Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Client</div>
          <div className="font-semibold text-slate-900">{offer.client.name}</div>
          {offer.client.contactPerson && <div className="text-sm text-slate-600">{offer.client.contactPerson}</div>}
          {offer.client.email && <div className="text-sm text-slate-600">{offer.client.email}</div>}
          {offer.client.phone && <div className="text-sm text-slate-600">{offer.client.phone}</div>}
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Dates</div>
          <div className="text-sm text-slate-600">Created: {formatDate(offer.createdAt)}</div>
          {offer.validUntil && <div className="text-sm text-slate-600">Valid until: {formatDate(offer.validUntil)}</div>}
          <div className="text-sm text-slate-600">By: {offer.createdBy.name}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Total</div>
          <div className="text-2xl font-bold text-brand">{formatCurrency(offer.total, offer.currencyCode)}</div>
          <div className="text-xs text-slate-500 mt-1">{offer.items.length} item(s)</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">#</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Item</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Qty</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Unit</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {offer.items.map((it, idx) => (
              <tr key={it.id}>
                <td className="px-6 py-4 text-slate-500">{idx + 1}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{it.name}</div>
                  {it.description && (
                    <div className="text-xs text-slate-500 mt-1 whitespace-pre-line">{it.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-slate-700">{it.quantity}</td>
                <td className="px-6 py-4 text-right text-slate-700">{formatCurrency(it.unitPrice, offer.currencyCode)}</td>
                <td className="px-6 py-4 text-right font-semibold text-slate-900">{formatCurrency(it.total, offer.currencyCode)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t border-slate-200">
            <tr>
              <td colSpan={4} className="px-6 py-2 text-right text-slate-600">Subtotal</td>
              <td className="px-6 py-2 text-right font-semibold">{formatCurrency(offer.subtotal, offer.currencyCode)}</td>
            </tr>
            {parseFloat(offer.discount) > 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-2 text-right text-slate-600">Discount</td>
                <td className="px-6 py-2 text-right text-slate-700">- {formatCurrency(offer.discount, offer.currencyCode)}</td>
              </tr>
            )}
            {parseFloat(offer.tax) > 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-2 text-right text-slate-600">Tax</td>
                <td className="px-6 py-2 text-right text-slate-700">+ {formatCurrency(offer.tax, offer.currencyCode)}</td>
              </tr>
            )}
            <tr className="border-t border-slate-200">
              <td colSpan={4} className="px-6 py-3 text-right text-lg font-bold text-slate-900">Total</td>
              <td className="px-6 py-3 text-right text-lg font-bold text-brand">{formatCurrency(offer.total, offer.currencyCode)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {offer.notes && (
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Notes</div>
          <p className="text-sm text-slate-700 whitespace-pre-line">{offer.notes}</p>
        </div>
      )}
    </div>
  );
}
