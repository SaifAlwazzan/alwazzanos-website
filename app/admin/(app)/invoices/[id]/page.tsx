'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Plus, Trash2, CheckCircle, Clock, Calendar, Paperclip, Upload, FileText } from 'lucide-react';
import { api } from '@/lib/oim-api';
import { formatCurrency, formatDate } from '@/lib/oim-utils';

interface Invoice {
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
  client: {
    id: string;
    name: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  offer: { id: string; number: string; title: string } | null;
  createdBy: { name: string };
  items: { id: string; name: string; description: string | null; quantity: number; unitPrice: string; total: string }[];
  installments: { id: string; number: number; dueDate: string; amount: string; status: string; paidAt: string | null }[];
  payments: { id: string; amount: string; method: string; reference: string | null; notes: string | null; paidAt: string; installmentId: string | null }[];
  attachments: { id: string; name: string; url: string; mimeType: string | null; size: number | null; notes: string | null; uploadedAt: string }[];
}

const STATUS_STYLES: Record<string, string> = {
  UNPAID: 'bg-amber-100 text-amber-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-700',
};

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentInstallmentId, setPaymentInstallmentId] = useState<string | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ invoice: Invoice }>(`/invoices/${params.id}`);
      setInvoice(res.invoice);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) load();
  }, [params.id]);

  async function deletePayment(pid: string) {
    if (!confirm('Delete this payment?')) return;
    try {
      await api.delete(`/invoices/${params.id}/payments/${pid}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function deleteInstallment(insId: string) {
    if (!confirm('Delete this installment?')) return;
    try {
      await api.delete(`/invoices/${params.id}/installments/${insId}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleUpload(file: File) {
    try {
      const token = localStorage.getItem('oim_token');
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4100/api'}/invoices/${params.id}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Upload failed');
      }
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    }
  }

  async function deleteAttachment(attId: string) {
    if (!confirm('Delete this attachment?')) return;
    try {
      await api.delete(`/invoices/${params.id}/attachments/${attId}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  function formatBytes(bytes: number | null) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (loading) return <div className="text-center text-slate-500">Loading...</div>;
  if (!invoice) return <div className="text-center text-slate-500">Not found</div>;

  const remaining = parseFloat(invoice.total) - parseFloat(invoice.paidAmount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/invoices')} className="p-2 rounded hover:bg-slate-100">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Invoice</h1>
              <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[invoice.status]}`}>
                {invoice.status.replace('_', ' ')}
              </span>
            </div>
            <div className="text-slate-500 text-sm font-mono">{invoice.number}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.open(`/invoices/${invoice.id}/print`, '_blank')} className="btn-secondary">
            <Printer size={16} /> Print / PDF
          </button>
          {invoice.payments.length === 0 && (
            <button onClick={() => setShowPlanForm(true)} className="btn-secondary">
              <Calendar size={16} /> {invoice.installments.length > 0 ? 'Reset Plan' : 'Payment Plan'}
            </button>
          )}
          {remaining > 0 && (
            <button onClick={() => { setPaymentInstallmentId(null); setShowPaymentForm(true); }} className="btn-primary">
              <Plus size={16} /> Record Payment
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Client</div>
          <div className="font-semibold">{invoice.client.name}</div>
          {invoice.client.email && <div className="text-sm text-slate-600">{invoice.client.email}</div>}
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Total</div>
          <div className="text-xl font-bold text-slate-900">{formatCurrency(invoice.total, invoice.currencyCode)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Paid</div>
          <div className="text-xl font-bold text-emerald-600">{formatCurrency(invoice.paidAmount, invoice.currencyCode)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Remaining</div>
          <div className="text-xl font-bold text-amber-600">{formatCurrency(remaining, invoice.currencyCode)}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 font-semibold">Items</div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">#</th>
              <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Item</th>
              <th className="text-right px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Qty</th>
              <th className="text-right px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Unit</th>
              <th className="text-right px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items.map((it, i) => (
              <tr key={it.id}>
                <td className="px-6 py-3 text-slate-500">{i + 1}</td>
                <td className="px-6 py-3">
                  <div className="font-medium">{it.name}</div>
                  {it.description && <div className="text-xs text-slate-500 whitespace-pre-line">{it.description}</div>}
                </td>
                <td className="px-6 py-3 text-right">{it.quantity}</td>
                <td className="px-6 py-3 text-right">{formatCurrency(it.unitPrice, invoice.currencyCode)}</td>
                <td className="px-6 py-3 text-right font-semibold">{formatCurrency(it.total, invoice.currencyCode)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invoice.installments.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 font-semibold flex items-center justify-between">
            <span>Payment Plan ({invoice.installments.length} installments)</span>
            <span className="text-xs text-slate-500 font-normal">
              {invoice.installments.filter((i) => i.status === 'PAID').length} of {invoice.installments.length} paid
            </span>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">#</th>
                <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Due Date</th>
                <th className="text-right px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Amount</th>
                <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="text-right px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.installments.map((ins) => (
                <tr key={ins.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono text-sm">#{ins.number}</td>
                  <td className="px-6 py-3 text-sm">{formatDate(ins.dueDate)}</td>
                  <td className="px-6 py-3 text-right font-semibold">{formatCurrency(ins.amount, invoice.currencyCode)}</td>
                  <td className="px-6 py-3">
                    {ins.status === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-sm"><CheckCircle size={14} /> Paid</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 text-sm"><Clock size={14} /> Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right space-x-1">
                    {ins.status !== 'PAID' && (
                      <>
                        <button onClick={() => { setPaymentInstallmentId(ins.id); setShowPaymentForm(true); }} className="text-brand text-sm font-medium hover:underline mr-2">
                          Pay
                        </button>
                        <button onClick={() => deleteInstallment(ins.id)} className="inline-flex p-1 text-red-600 hover:bg-red-50 rounded" title="Delete installment">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Calendar size={32} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-700 mb-1">No payment plan set</h3>
          <p className="text-sm text-slate-500 mb-4">Set up a payment schedule with optional upfront and installments.</p>
          <button onClick={() => setShowPlanForm(true)} className="btn-primary">
            <Calendar size={16} /> Setup Payment Plan
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 font-semibold">Payments ({invoice.payments.length})</div>
        {invoice.payments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No payments recorded yet.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Method</th>
                <th className="text-left px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Reference</th>
                <th className="text-right px-6 py-2 text-xs font-semibold text-slate-600 uppercase">Amount</th>
                <th className="text-right px-6 py-2 text-xs font-semibold text-slate-600 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-3 text-sm">{formatDate(p.paidAt)}</td>
                  <td className="px-6 py-3 text-sm">{p.method}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">{p.reference || p.notes || '—'}</td>
                  <td className="px-6 py-3 text-right font-semibold text-emerald-600">{formatCurrency(p.amount, invoice.currencyCode)}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => deletePayment(p.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2"><Paperclip size={16} /> Attachments ({invoice.attachments.length})</span>
          <label className="btn-primary cursor-pointer text-sm">
            <Upload size={14} /> Upload File
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {invoice.attachments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No attachments yet. Upload signed contracts, payment receipts, or any supporting documents.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {invoice.attachments.map((att) => (
              <div key={att.id} className="px-6 py-3 flex items-center gap-3 hover:bg-slate-50">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={`http://localhost:4100${att.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-slate-900 hover:text-brand truncate block"
                  >
                    {att.name}
                  </a>
                  <div className="text-xs text-slate-500">
                    {formatBytes(att.size)} • {formatDate(att.uploadedAt)}
                  </div>
                </div>
                <button onClick={() => deleteAttachment(att.id)} className="p-2 rounded hover:bg-red-50 text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPaymentForm && (
        <PaymentForm
          invoiceId={invoice.id}
          installmentId={paymentInstallmentId}
          installment={paymentInstallmentId ? invoice.installments.find((i) => i.id === paymentInstallmentId) : null}
          remaining={remaining}
          currency={invoice.currencyCode}
          onClose={(refresh) => { setShowPaymentForm(false); if (refresh) load(); }}
        />
      )}

      {showPlanForm && (
        <PaymentPlanForm
          invoiceId={invoice.id}
          total={parseFloat(invoice.total)}
          currency={invoice.currencyCode}
          existing={invoice.installments.length}
          onClose={(refresh) => { setShowPlanForm(false); if (refresh) load(); }}
        />
      )}
    </div>
  );
}

function PaymentPlanForm({
  invoiceId,
  total,
  currency,
  existing,
  onClose,
}: {
  invoiceId: string;
  total: number;
  currency: string;
  existing: number;
  onClose: (refresh: boolean) => void;
}) {
  const [upfront, setUpfront] = useState('5000000');
  const [installmentCount, setInstallmentCount] = useState('24');
  const [intervalDays, setIntervalDays] = useState('30');
  const [firstDate, setFirstDate] = useState(new Date().toISOString().substring(0, 10));
  const [recordUpfrontAsPaid, setRecordUpfrontAsPaid] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const upfrontNum = parseFloat(upfront) || 0;
  const count = parseInt(installmentCount) || 1;
  const remaining = Math.max(0, total - upfrontNum);
  const perInstallment = remaining / count;

  async function handleSubmit() {
    setSaving(true);
    setError('');
    try {
      await api.post(`/invoices/${invoiceId}/payment-plan`, {
        upfront: upfrontNum,
        installmentCount: count,
        firstInstallmentDate: firstDate,
        intervalDays: parseInt(intervalDays) || 30,
        recordUpfrontAsPaid,
      });
      onClose(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">Setup Payment Plan</h2>
          <button onClick={() => onClose(false)} className="p-2 rounded hover:bg-slate-100">×</button>
        </div>
        <div className="p-6 space-y-4">
          {existing > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3">
              ⚠ This will delete the existing {existing} unpaid installment(s) and create a new plan.
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Upfront Payment</label>
              <input type="number" className="input" value={upfront} onChange={(e) => setUpfront(e.target.value)} />
            </div>
            <div>
              <label className="label"># Installments</label>
              <input type="number" className="input" value={installmentCount} onChange={(e) => setInstallmentCount(e.target.value)} />
            </div>
            <div>
              <label className="label">First Installment Date</label>
              <input type="date" className="input" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Interval (days)</label>
              <input type="number" className="input" value={intervalDays} onChange={(e) => setIntervalDays(e.target.value)} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={recordUpfrontAsPaid} onChange={(e) => setRecordUpfrontAsPaid(e.target.checked)} className="w-4 h-4" />
            Record upfront amount as already paid
          </label>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Invoice total</span><span className="font-semibold">{formatCurrency(total, currency)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">− Upfront</span><span className="text-amber-600">−{formatCurrency(upfrontNum, currency)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-600">Remaining</span><span className="font-semibold">{formatCurrency(remaining, currency)}</span></div>
            <div className="flex justify-between text-base"><span className="font-bold text-slate-900">Per installment</span><span className="font-bold text-brand">{formatCurrency(perInstallment, currency)}</span></div>
            <div className="text-xs text-slate-500">{count} installments × every {intervalDays} days</div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
        </div>
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={() => onClose(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary" disabled={saving}>
            {saving ? 'Setting up...' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentForm({
  invoiceId,
  installmentId,
  installment,
  remaining,
  currency,
  onClose,
}: {
  invoiceId: string;
  installmentId: string | null;
  installment: { amount: string } | null | undefined;
  remaining: number;
  currency: string;
  onClose: (refresh: boolean) => void;
}) {
  const [amount, setAmount] = useState(installment ? installment.amount : String(remaining));
  const [method, setMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().substring(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setSaving(true);
    setError('');
    try {
      await api.post(`/invoices/${invoiceId}/payments`, {
        amount: parseFloat(amount),
        method,
        reference: reference || null,
        installmentId,
        paidAt,
      });
      onClose(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">Record Payment</h2>
          <button onClick={() => onClose(false)} className="p-2 rounded hover:bg-slate-100">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Amount ({currency})</label>
            <input type="number" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="label">Method</label>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHECK">Check</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Reference / Notes</label>
            <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. Bank receipt #" />
          </div>
          <div>
            <label className="label">Payment Date</label>
            <input type="date" className="input" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
        </div>
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={() => onClose(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn-primary" disabled={saving || !amount}>
            {saving ? 'Saving...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
