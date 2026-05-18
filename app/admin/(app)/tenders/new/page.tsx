'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/oim-api';

export default function NewTenderPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    issuingEntity: '',
    referenceNumber: '',
    description: '',
    status: 'WATCHING',
    currencyCode: 'IQD',
    estimatedValue: '',
    bidBondAmount: '',
    performanceBondPct: '',
    submissionMethod: '',
    publishedDate: '',
    deadline: '',
    openingDate: '',
    requirements: [] as string[],
    notes: '',
  });
  const [reqInput, setReqInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function addRequirement() {
    const v = reqInput.trim();
    if (!v) return;
    setForm({ ...form, requirements: [...form.requirements, v] });
    setReqInput('');
  }

  function removeRequirement(i: number) {
    setForm({ ...form, requirements: form.requirements.filter((_, idx) => idx !== i) });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        referenceNumber: form.referenceNumber || null,
        description: form.description || null,
        submissionMethod: form.submissionMethod || null,
        notes: form.notes || null,
        estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : null,
        bidBondAmount: form.bidBondAmount ? parseFloat(form.bidBondAmount) : null,
        performanceBondPct: form.performanceBondPct ? parseFloat(form.performanceBondPct) : null,
        publishedDate: form.publishedDate || null,
        deadline: form.deadline || null,
        openingDate: form.openingDate || null,
      };
      const res = await api.post<{ tender: { id: string } }>('/tenders', payload);
      router.push(`/admin/tenders/${res.tender.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-slate-900">New Tender</h1>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold">Basic Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">Issuing Entity *</label>
            <input className="input" placeholder="e.g. Ministry of Health" value={form.issuingEntity} onChange={(e) => setForm({ ...form, issuingEntity: e.target.value })} required />
          </div>
          <div>
            <label className="label">Reference Number</label>
            <input className="input" placeholder="Tender ID from issuer" value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="WATCHING">Watching</option>
              <option value="PREPARING">Preparing</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="label">Submission Method</label>
            <input className="input" placeholder="e.g. Sealed envelope" value={form.submissionMethod} onChange={(e) => setForm({ ...form, submissionMethod: e.target.value })} />
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
              <option value="IQD">IQD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
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
        <h2 className="font-semibold">Key Dates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Published</label>
            <input type="date" className="input" value={form.publishedDate} onChange={(e) => setForm({ ...form, publishedDate: e.target.value })} />
          </div>
          <div>
            <label className="label">Submission Deadline</label>
            <input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div>
            <label className="label">Bid Opening Date</label>
            <input type="date" className="input" value={form.openingDate} onChange={(e) => setForm({ ...form, openingDate: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold">Submission Requirements</h2>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="e.g. Letter of incorporation, Tax clearance certificate..."
            value={reqInput}
            onChange={(e) => setReqInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRequirement(); } }}
          />
          <button onClick={addRequirement} className="btn-primary"><Plus size={16} /> Add</button>
        </div>
        {form.requirements.length === 0 ? (
          <div className="text-sm text-slate-500">No requirements added yet.</div>
        ) : (
          <ul className="space-y-1">
            {form.requirements.map((r, i) => (
              <li key={i} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded text-sm">
                <span>{r}</span>
                <button onClick={() => removeRequirement(i)} className="text-red-600"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-6">
        <label className="label">Notes</label>
        <textarea className="input min-h-[100px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}

      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button
          onClick={handleSave}
          className="btn-primary"
          disabled={saving || !form.title || !form.issuingEntity}
        >
          {saving ? 'Saving...' : 'Create Tender'}
        </button>
      </div>
    </div>
  );
}
