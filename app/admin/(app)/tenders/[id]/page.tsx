'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, Trash2, Printer } from 'lucide-react';
import { api } from '@/lib/oim-api';
import { formatCurrency, formatDate } from '@/lib/oim-utils';

type Status = 'WATCHING' | 'PREPARING' | 'SUBMITTED' | 'SHORTLISTED' | 'WON' | 'LOST' | 'CANCELLED';

interface TenderDocument {
  id: string;
  name: string;
  url: string;
  category: string | null;
  uploadedAt: string;
}

interface Tender {
  id: string;
  number: string;
  title: string;
  issuingEntity: string;
  referenceNumber: string | null;
  description: string | null;
  status: Status;
  currencyCode: string;
  estimatedValue: string | number | null;
  bidBondAmount: string | number | null;
  performanceBondPct: string | number | null;
  submissionMethod: string | null;
  publishedDate: string | null;
  deadline: string | null;
  openingDate: string | null;
  submittedAt: string | null;
  resultAt: string | null;
  resultNotes: string | null;
  requirements: string[];
  notes: string | null;
  documents: TenderDocument[];
}

function toInput(date: string | null) {
  return date ? new Date(date).toISOString().substring(0, 10) : '';
}

export default function TenderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [tender, setTender] = useState<Tender | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [reqInput, setReqInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const res = await api.get<{ tender: Tender }>(`/tenders/${id}`);
      setTender(res.tender);
      setForm({
        ...res.tender,
        estimatedValue: res.tender.estimatedValue ?? '',
        bidBondAmount: res.tender.bidBondAmount ?? '',
        performanceBondPct: res.tender.performanceBondPct ?? '',
        referenceNumber: res.tender.referenceNumber ?? '',
        description: res.tender.description ?? '',
        submissionMethod: res.tender.submissionMethod ?? '',
        notes: res.tender.notes ?? '',
        resultNotes: res.tender.resultNotes ?? '',
        publishedDate: toInput(res.tender.publishedDate),
        deadline: toInput(res.tender.deadline),
        openingDate: toInput(res.tender.openingDate),
        submittedAt: toInput(res.tender.submittedAt),
        resultAt: toInput(res.tender.resultAt),
      });
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        estimatedValue: form.estimatedValue !== '' ? parseFloat(form.estimatedValue) : null,
        bidBondAmount: form.bidBondAmount !== '' ? parseFloat(form.bidBondAmount) : null,
        performanceBondPct: form.performanceBondPct !== '' ? parseFloat(form.performanceBondPct) : null,
        referenceNumber: form.referenceNumber || null,
        description: form.description || null,
        submissionMethod: form.submissionMethod || null,
        notes: form.notes || null,
        resultNotes: form.resultNotes || null,
        publishedDate: form.publishedDate || null,
        deadline: form.deadline || null,
        openingDate: form.openingDate || null,
        submittedAt: form.submittedAt || null,
        resultAt: form.resultAt || null,
      };
      await api.patch(`/tenders/${id}`, payload);
      setEditing(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function addRequirement() {
    const v = reqInput.trim();
    if (!v) return;
    setForm({ ...form, requirements: [...(form.requirements || []), v] });
    setReqInput('');
  }

  function removeRequirement(i: number) {
    setForm({ ...form, requirements: form.requirements.filter((_: string, idx: number) => idx !== i) });
  }

  if (!tender) return <div className="p-8 text-slate-500">Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link href="/tenders" className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-2 text-sm">
          <ArrowLeft size={16} /> Back to Tenders
        </Link>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); load(); }} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => window.open(`/tenders/${id}/print`, '_blank')} className="btn-secondary">
                <Printer size={16} /> Print / PDF
              </button>
              <button onClick={() => setEditing(true)} className="btn-primary">Edit</button>
            </>
          )}
        </div>
      </div>

      <div>
        <div className="text-sm font-mono text-slate-500">{tender.number}</div>
        <h1 className="text-3xl font-bold text-slate-900">{tender.title}</h1>
        <div className="text-slate-600 mt-1">{tender.issuingEntity}{tender.referenceNumber && ` · Ref: ${tender.referenceNumber}`}</div>
      </div>

      {editing ? (
        <>
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold">Basic Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Title</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Issuing Entity</label>
                <input className="input" value={form.issuingEntity} onChange={(e) => setForm({ ...form, issuingEntity: e.target.value })} />
              </div>
              <div>
                <label className="label">Reference Number</label>
                <input className="input" value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {['WATCHING','PREPARING','SUBMITTED','SHORTLISTED','WON','LOST','CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Submission Method</label>
                <input className="input" value={form.submissionMethod} onChange={(e) => setForm({ ...form, submissionMethod: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Description</label>
                <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-semibold">Financials</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Currency</label>
                <select className="input" value={form.currencyCode} onChange={(e) => setForm({ ...form, currencyCode: e.target.value })}>
                  <option value="IQD">IQD</option><option value="USD">USD</option><option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="label">Estimated Value</label>
                <input type="number" className="input" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })} />
              </div>
              <div>
                <label className="label">Bid Bond Amount</label>
                <input type="number" className="input" value={form.bidBondAmount} onChange={(e) => setForm({ ...form, bidBondAmount: e.target.value })} />
              </div>
              <div>
                <label className="label">Performance Bond %</label>
                <input type="number" step="0.01" className="input" value={form.performanceBondPct} onChange={(e) => setForm({ ...form, performanceBondPct: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-semibold">Dates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="label">Published</label><input type="date" className="input" value={form.publishedDate} onChange={(e) => setForm({ ...form, publishedDate: e.target.value })} /></div>
              <div><label className="label">Submission Deadline</label><input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
              <div><label className="label">Bid Opening</label><input type="date" className="input" value={form.openingDate} onChange={(e) => setForm({ ...form, openingDate: e.target.value })} /></div>
              <div><label className="label">Submitted On</label><input type="date" className="input" value={form.submittedAt} onChange={(e) => setForm({ ...form, submittedAt: e.target.value })} /></div>
              <div><label className="label">Result Date</label><input type="date" className="input" value={form.resultAt} onChange={(e) => setForm({ ...form, resultAt: e.target.value })} /></div>
            </div>
          </div>

          <div className="card p-6 space-y-3">
            <h2 className="font-semibold">Requirements</h2>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Add requirement..." value={reqInput} onChange={(e) => setReqInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRequirement(); } }} />
              <button onClick={addRequirement} className="btn-primary"><Plus size={16} /></button>
            </div>
            <ul className="space-y-1">
              {(form.requirements || []).map((r: string, i: number) => (
                <li key={i} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded text-sm">
                  <span>{r}</span>
                  <button onClick={() => removeRequirement(i)} className="text-red-600"><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6 space-y-3">
            <h2 className="font-semibold">Notes</h2>
            <textarea className="input min-h-[80px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes" />
            <label className="label">Result Notes</label>
            <textarea className="input min-h-[80px]" value={form.resultNotes} onChange={(e) => setForm({ ...form, resultNotes: e.target.value })} placeholder="Outcome details, winner info..." />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
        </>
      ) : (
        <>
          <div className="card p-6 space-y-3">
            <h2 className="font-semibold mb-2">Overview</h2>
            <Row label="Status" value={<span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium">{tender.status}</span>} />
            <Row label="Submission Method" value={tender.submissionMethod || '—'} />
            <Row label="Description" value={tender.description || '—'} />
          </div>

          <div className="card p-6 space-y-3">
            <h2 className="font-semibold mb-2">Financials</h2>
            <Row label="Estimated Value" value={tender.estimatedValue != null ? formatCurrency(tender.estimatedValue, tender.currencyCode) : '—'} />
            <Row label="Bid Bond" value={tender.bidBondAmount != null ? formatCurrency(tender.bidBondAmount, tender.currencyCode) : '—'} />
            <Row label="Performance Bond" value={tender.performanceBondPct != null ? `${tender.performanceBondPct}%` : '—'} />
          </div>

          <div className="card p-6 space-y-3">
            <h2 className="font-semibold mb-2">Dates</h2>
            <Row label="Published" value={tender.publishedDate ? formatDate(tender.publishedDate) : '—'} />
            <Row label="Submission Deadline" value={tender.deadline ? formatDate(tender.deadline) : '—'} />
            <Row label="Bid Opening" value={tender.openingDate ? formatDate(tender.openingDate) : '—'} />
            <Row label="Submitted" value={tender.submittedAt ? formatDate(tender.submittedAt) : '—'} />
            <Row label="Result Date" value={tender.resultAt ? formatDate(tender.resultAt) : '—'} />
          </div>

          {tender.requirements?.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold mb-3">Submission Requirements</h2>
              <ul className="space-y-1.5 text-sm">
                {tender.requirements.map((r, i) => (
                  <li key={i} className="flex gap-2"><span className="text-slate-400">•</span>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {(tender.notes || tender.resultNotes) && (
            <div className="card p-6 space-y-4">
              {tender.notes && (<div><h3 className="font-semibold text-sm mb-1">Notes</h3><div className="text-sm text-slate-700 whitespace-pre-wrap">{tender.notes}</div></div>)}
              {tender.resultNotes && (<div><h3 className="font-semibold text-sm mb-1">Result Notes</h3><div className="text-sm text-slate-700 whitespace-pre-wrap">{tender.resultNotes}</div></div>)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-500 mr-4 min-w-[140px]">{label}</span>
      <span className="text-slate-900 text-right">{value}</span>
    </div>
  );
}
