'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/oim-api';
import { formatCurrency, formatDate } from '@/lib/oim-utils';

interface FullTender {
  id: string;
  number: string;
  title: string;
  issuingEntity: string;
  referenceNumber: string | null;
  description: string | null;
  status: string;
  currencyCode: string;
  estimatedValue: string | null;
  bidBondAmount: string | null;
  performanceBondPct: string | null;
  submissionMethod: string | null;
  publishedDate: string | null;
  deadline: string | null;
  openingDate: string | null;
  requirements: string[];
  notes: string | null;
  createdAt: string;
}

export default function TenderPrintPage() {
  const params = useParams<{ id: string }>();
  const [tender, setTender] = useState<FullTender | null>(null);

  useEffect(() => {
    api.get<{ tender: FullTender }>(`/tenders/${params.id}`).then((r) => setTender(r.tender));
  }, [params.id]);

  if (!tender) return <div className="p-8 text-center text-slate-500">Loading...</div>;

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
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-slate-200">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 120" width="200">
              <defs>
                <linearGradient id="tnCs" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00D4FF" />
                  <stop offset="100%" stopColor="#0088FF" />
                </linearGradient>
              </defs>
              <text x="130" y="48" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="34" fontWeight="200" fill="#1e293b" letterSpacing="6">ALWAZZAN</text>
              <rect x="22" y="56" width="216" height="1.2" fill="url(#tnCs)" />
              <text x="130" y="80" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="17" fontWeight="700" fill="url(#tnCs)" letterSpacing="10">OS</text>
              <text x="130" y="100" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="5" fontWeight="300" fill="#4A6070" letterSpacing="3">OPERATING SYSTEMS</text>
            </svg>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">TENDER FILE</div>
            <div className="font-mono text-sm text-slate-600">{tender.number}</div>
            <div className="mt-3 inline-block px-3 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">{tender.status}</div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">{tender.title}</h1>
          <div className="text-slate-600">
            <span className="font-semibold">{tender.issuingEntity}</span>
            {tender.referenceNumber && <span> · Ref: <span className="font-mono">{tender.referenceNumber}</span></span>}
          </div>
        </div>

        {tender.description && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-2">Description</h2>
            <div className="text-sm text-slate-700 whitespace-pre-line border border-slate-200 rounded-lg p-4 bg-slate-50">{tender.description}</div>
          </section>
        )}

        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2">Key Dates</h2>
          <table className="w-full border border-slate-200 rounded-lg overflow-hidden text-sm">
            <tbody>
              {tender.publishedDate && <tr className="border-b border-slate-100"><td className="px-4 py-2.5 text-slate-500 w-1/3">Published</td><td className="px-4 py-2.5 font-semibold">{formatDate(tender.publishedDate)}</td></tr>}
              {tender.deadline && <tr className="border-b border-slate-100"><td className="px-4 py-2.5 text-slate-500">Submission Deadline</td><td className="px-4 py-2.5 font-semibold text-red-600">{formatDate(tender.deadline)}</td></tr>}
              {tender.openingDate && <tr><td className="px-4 py-2.5 text-slate-500">Bid Opening</td><td className="px-4 py-2.5 font-semibold">{formatDate(tender.openingDate)}</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2">Financials</h2>
          <table className="w-full border border-slate-200 rounded-lg overflow-hidden text-sm">
            <tbody>
              {tender.estimatedValue != null && <tr className="border-b border-slate-100"><td className="px-4 py-2.5 text-slate-500 w-1/3">Estimated Value</td><td className="px-4 py-2.5 font-semibold">{formatCurrency(tender.estimatedValue, tender.currencyCode)}</td></tr>}
              {tender.bidBondAmount != null && <tr className="border-b border-slate-100"><td className="px-4 py-2.5 text-slate-500">Bid Bond Amount</td><td className="px-4 py-2.5 font-semibold">{formatCurrency(tender.bidBondAmount, tender.currencyCode)}</td></tr>}
              {tender.performanceBondPct != null && <tr><td className="px-4 py-2.5 text-slate-500">Performance Bond</td><td className="px-4 py-2.5 font-semibold">{tender.performanceBondPct}%</td></tr>}
              {tender.submissionMethod && <tr className="border-t border-slate-100"><td className="px-4 py-2.5 text-slate-500">Submission Method</td><td className="px-4 py-2.5 font-semibold">{tender.submissionMethod}</td></tr>}
            </tbody>
          </table>
        </section>

        {tender.requirements.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-2">Submission Requirements</h2>
            <ul className="text-sm space-y-1.5 border border-slate-200 rounded-lg p-4">
              {tender.requirements.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-mono text-slate-400 w-6">{i + 1}.</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tender.notes && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-2">Notes</h2>
            <div className="text-sm text-slate-700 whitespace-pre-line border border-slate-200 rounded-lg p-4 bg-slate-50">{tender.notes}</div>
          </section>
        )}

        <footer className="border-t-2 border-slate-200 pt-6 text-center text-xs text-slate-500 mt-8">
          <div className="font-bold text-slate-700 mb-1">AlwazzanOS for Software Developing</div>
          <div>Generated on {formatDate(new Date().toISOString())} · Document {tender.number}</div>
        </footer>
      </div>
    </div>
  );
}
