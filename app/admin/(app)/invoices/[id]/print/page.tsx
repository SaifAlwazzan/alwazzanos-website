'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/oim-api';
import { formatCurrency, formatDate } from '@/lib/oim-utils';

interface Installment {
  id: string;
  number: number;
  dueDate: string;
  amount: string;
  status: string;
  paidAt: string | null;
}

interface FullInvoice {
  id: string;
  number: string;
  status: string;
  currencyCode: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  paidAmount: string;
  issueDate: string;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  client: {
    name: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  createdBy: { name: string };
  items: { id: string; name: string; description: string | null; quantity: number; unitPrice: string; total: string }[];
  installments: Installment[];
}

const INSTALLMENT_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
};

export default function InvoicePrintPage() {
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<FullInvoice | null>(null);

  useEffect(() => {
    api.get<{ invoice: FullInvoice }>(`/invoices/${params.id}`).then((r) => setInvoice(r.invoice));
  }, [params.id]);

  if (!invoice) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  const balance = Math.max(0, parseFloat(invoice.total) - parseFloat(invoice.paidAmount));

  return (
    <div className="bg-white min-h-screen">
      <style jsx global>{`
        body { background: white !important; }
        @media print {
          .no-print { display: none !important; }
          @page { margin: 14mm; size: A4; }
        }
      `}</style>

      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button onClick={() => window.print()} className="bg-brand text-white px-5 py-2 rounded-lg font-medium shadow-lg hover:bg-brand/90">
          Save as PDF
        </button>
        <button onClick={() => window.close()} className="bg-white border border-slate-200 text-slate-700 px-5 py-2 rounded-lg font-medium shadow-lg">
          Close
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto p-10 text-slate-900">
        {/* HEADER */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-slate-200">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 120" width="200">
              <defs>
                <linearGradient id="invCs" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00D4FF" />
                  <stop offset="100%" stopColor="#0088FF" />
                </linearGradient>
              </defs>
              <text x="130" y="48" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="34" fontWeight="200" fill="#1e293b" letterSpacing="6">ALWAZZAN</text>
              <rect x="22" y="56" width="216" height="1.2" fill="url(#invCs)" />
              <text x="130" y="80" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="17" fontWeight="700" fill="url(#invCs)" letterSpacing="10">OS</text>
              <text x="130" y="100" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="5" fontWeight="300" fill="#4A6070" letterSpacing="3">OPERATING SYSTEMS</text>
            </svg>
            <div className="text-xs text-slate-500 mt-2 leading-relaxed">
              AlwazzanOS for Software Developing<br />
              Basra, Iraq · 07777900495 · info@alwazzanos.com
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-slate-900 mb-1">INVOICE</div>
            <div className="font-mono text-sm text-slate-600">{invoice.number}</div>
            <div className="mt-3 inline-block px-3 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">{invoice.status.replace('_', ' ')}</div>
          </div>
        </div>

        {/* BILL TO + META */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <div className="text-xs uppercase text-slate-500 font-semibold mb-2">Bill To</div>
            <div className="text-lg font-bold text-slate-900">{invoice.client.name}</div>
            {invoice.client.contactPerson && <div className="text-sm text-slate-700">{invoice.client.contactPerson}</div>}
            {invoice.client.address && <div className="text-sm text-slate-600 whitespace-pre-line mt-1">{invoice.client.address}</div>}
            {invoice.client.phone && <div className="text-sm text-slate-600">{invoice.client.phone}</div>}
            {invoice.client.email && <div className="text-sm text-slate-600">{invoice.client.email}</div>}
          </div>
          <div className="text-right">
            <div className="text-xs uppercase text-slate-500 font-semibold mb-2">Details</div>
            <div className="text-sm space-y-1">
              <div className="flex justify-end gap-4"><span className="text-slate-500">Issue Date:</span><span className="font-semibold">{formatDate(invoice.issueDate)}</span></div>
              {invoice.dueDate && <div className="flex justify-end gap-4"><span className="text-slate-500">Due Date:</span><span className="font-semibold">{formatDate(invoice.dueDate)}</span></div>}
              <div className="flex justify-end gap-4"><span className="text-slate-500">Currency:</span><span className="font-semibold">{invoice.currencyCode}</span></div>
            </div>
          </div>
        </div>

        {/* ITEMS */}
        <table className="w-full mb-6 border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">#</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">Description</th>
              <th className="text-right px-4 py-3 text-xs uppercase tracking-wider">Qty</th>
              <th className="text-right px-4 py-3 text-xs uppercase tracking-wider">Unit Price</th>
              <th className="text-right px-4 py-3 text-xs uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it, idx) => (
              <tr key={it.id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-slate-500 align-top">{idx + 1}</td>
                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-slate-900">{it.name}</div>
                  {it.description && <div className="text-xs text-slate-500 mt-1 whitespace-pre-line">{it.description}</div>}
                </td>
                <td className="px-4 py-3 text-right align-top">{it.quantity}</td>
                <td className="px-4 py-3 text-right align-top">{formatCurrency(it.unitPrice, invoice.currencyCode)}</td>
                <td className="px-4 py-3 text-right font-semibold align-top">{formatCurrency(it.total, invoice.currencyCode)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-semibold">{formatCurrency(invoice.subtotal, invoice.currencyCode)}</span></div>
            {parseFloat(invoice.discount) > 0 && <div className="flex justify-between"><span className="text-slate-600">Discount</span><span>- {formatCurrency(invoice.discount, invoice.currencyCode)}</span></div>}
            {parseFloat(invoice.tax) > 0 && <div className="flex justify-between"><span className="text-slate-600">Tax</span><span>+ {formatCurrency(invoice.tax, invoice.currencyCode)}</span></div>}
            <div className="flex justify-between pt-2 border-t-2 border-slate-200 text-lg font-bold text-blue-600">
              <span>Total</span><span>{formatCurrency(invoice.total, invoice.currencyCode)}</span>
            </div>
            {parseFloat(invoice.paidAmount) > 0 && (
              <>
                <div className="flex justify-between text-emerald-700"><span>Paid</span><span>{formatCurrency(invoice.paidAmount, invoice.currencyCode)}</span></div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold"><span>Balance Due</span><span>{formatCurrency(balance, invoice.currencyCode)}</span></div>
              </>
            )}
          </div>
        </div>

        {/* INSTALLMENT SCHEDULE */}
        {invoice.installments.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Payment Schedule</h2>
            <table className="w-full border border-slate-200 rounded-lg overflow-hidden text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs uppercase">Installment</th>
                  <th className="text-left px-4 py-2.5 text-xs uppercase">Due Date</th>
                  <th className="text-right px-4 py-2.5 text-xs uppercase">Amount</th>
                  <th className="text-center px-4 py-2.5 text-xs uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoice.installments.sort((a, b) => a.number - b.number).map((ins) => (
                  <tr key={ins.id} className="border-b border-slate-100">
                    <td className="px-4 py-2.5">#{ins.number}</td>
                    <td className="px-4 py-2.5">{formatDate(ins.dueDate)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(ins.amount, invoice.currencyCode)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${ins.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : ins.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {INSTALLMENT_LABELS[ins.status] || ins.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {invoice.notes && (
          <section className="mb-8">
            <h3 className="font-bold text-slate-900 mb-2">Notes</h3>
            <div className="text-sm text-slate-700 whitespace-pre-line border border-slate-200 rounded-lg p-4 bg-slate-50">{invoice.notes}</div>
          </section>
        )}

        <footer className="border-t-2 border-slate-200 pt-6 text-center text-xs text-slate-500">
          <div className="font-bold text-slate-700 mb-1">Thank you for your business</div>
          <div>Payment terms: Net 30 unless otherwise stated. Please reference invoice number {invoice.number} on all payments.</div>
          <div className="mt-2">AlwazzanOS for Software Developing · © {new Date().getFullYear()}</div>
        </footer>
      </div>
    </div>
  );
}
