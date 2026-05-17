'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/oim-api';
import { formatCurrency, formatDate } from '@/lib/oim-utils';

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
  client: {
    name: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  createdBy: { name: string };
  items: {
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    unitPrice: string;
    total: string;
  }[];
}

export default function OfferPrintPage() {
  const params = useParams<{ id: string }>();
  const [offer, setOffer] = useState<FullOffer | null>(null);

  useEffect(() => {
    api.get<{ offer: FullOffer }>(`/offers/${params.id}`).then((r) => setOffer(r.offer));
  }, [params.id]);

  if (!offer) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="bg-white min-h-screen">
      <style jsx global>{`
        body { background: white !important; }
        .no-print { display: block; }
        @media print {
          .no-print { display: none !important; }
          @page { margin: 12mm; size: A4; }
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

      <div className="max-w-[210mm] mx-auto p-12">
        {/* COVER */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-12 mb-8 text-center" style={{ pageBreakAfter: 'always' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 120" width="280" className="mx-auto mb-8">
            <defs>
              <linearGradient id="cs2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00D4FF" />
                <stop offset="100%" stopColor="#0088FF" />
              </linearGradient>
              <linearGradient id="ws2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#D0D8E0" />
              </linearGradient>
              <linearGradient id="fl2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity="0" />
                <stop offset="50%" stopColor="#00D4FF" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0088FF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <text x="130" y="48" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="34" fontWeight="200" fill="url(#ws2)" letterSpacing="6">ALWAZZAN</text>
            <rect x="22" y="56" width="216" height="1.2" fill="url(#fl2)" />
            <text x="130" y="80" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="17" fontWeight="700" fill="url(#cs2)" letterSpacing="10">OS</text>
            <text x="130" y="100" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="5" fontWeight="300" fill="#4A6070" letterSpacing="3">OPERATING SYSTEMS</text>
          </svg>

          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">{offer.title}</h1>
          <h2 className="text-lg text-slate-400 mb-8">Technical &amp; Commercial Proposal</h2>
          <div className="w-20 h-0.5 bg-gradient-to-r from-cyan-300 to-blue-400 mx-auto mb-8" />
          <div className="text-slate-400 text-sm space-y-1 leading-relaxed">
            <div><strong className="text-slate-300">Prepared by:</strong> {offer.createdBy.name} — AlwazzanOS for Software Developing</div>
            <div><strong className="text-slate-300">Prepared for:</strong> {offer.client.name}</div>
            <div><strong className="text-slate-300">Date:</strong> {formatDate(offer.createdAt)}</div>
            <div><strong className="text-slate-300">Document No:</strong> {offer.number}</div>
            {offer.validUntil && <div><strong className="text-slate-300">Valid until:</strong> {formatDate(offer.validUntil)}</div>}
          </div>
        </div>

        {/* INTRO */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Introduction</h2>
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-700 space-y-3 text-sm leading-relaxed">
            <p><strong>AlwazzanOS for Software Developing</strong> is a professional software development company established in <strong>2011</strong>, with over 15 years of experience specializing in building modern, scalable web applications.</p>
            <p>AlwazzanOS is proudly recognized as the <strong>first company to digitalize the laboratory process</strong>, pioneering lab automation solutions since <strong>2018</strong>.</p>
          </div>
        </section>

        {/* MODULES / ITEMS */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Scope &amp; Modules</h2>
          <div className="grid grid-cols-2 gap-4">
            {offer.items.map((it, idx) => (
              <div key={it.id} className="border border-slate-200 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {idx + 1}
                  </div>
                  <h3 className="font-bold text-slate-900 leading-tight">{it.name}</h3>
                </div>
                {it.description && (
                  <ul className="text-xs text-slate-600 space-y-1 mt-2">
                    {it.description.split('\n').filter(Boolean).map((line, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-blue-500">•</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section className="mb-10" style={{ pageBreakBefore: 'always' }}>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Pricing</h2>
          <table className="w-full border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">Module</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-wider">Price</th>
              </tr>
            </thead>
            <tbody>
              {offer.items.map((it, idx) => (
                <tr key={it.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{it.name}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(it.total, offer.currencyCode)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50">
                <td colSpan={2} className="px-4 py-3 text-right font-semibold text-slate-700">Subtotal</td>
                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(offer.subtotal, offer.currencyCode)}</td>
              </tr>
              {parseFloat(offer.discount) > 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right text-slate-600">Discount</td>
                  <td className="px-4 py-3 text-right">- {formatCurrency(offer.discount, offer.currencyCode)}</td>
                </tr>
              )}
              {parseFloat(offer.tax) > 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right text-slate-600">Tax</td>
                  <td className="px-4 py-3 text-right">+ {formatCurrency(offer.tax, offer.currencyCode)}</td>
                </tr>
              )}
              <tr className="bg-blue-50 border-t-2 border-blue-200">
                <td colSpan={2} className="px-4 py-4 text-right text-lg font-bold text-slate-900">Total Project Cost</td>
                <td className="px-4 py-4 text-right text-xl font-bold text-blue-600">{formatCurrency(offer.total, offer.currencyCode)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {offer.notes && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Notes</h2>
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-700 text-sm whitespace-pre-line">{offer.notes}</div>
          </section>
        )}

        {/* SIGNATURE */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Acceptance</h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="border border-slate-200 rounded-xl p-6">
              <p className="font-bold text-slate-900 mb-4">AlwazzanOS for Software Developing</p>
              <div className="border-b-2 border-slate-200 h-14 mb-2" />
              <p className="text-xs text-slate-500">Authorized Signature &amp; Date</p>
            </div>
            <div className="border border-slate-200 rounded-xl p-6">
              <p className="font-bold text-slate-900 mb-4">{offer.client.name}</p>
              <div className="border-b-2 border-slate-200 h-14 mb-2" />
              <p className="text-xs text-slate-500">Authorized Signature &amp; Date</p>
            </div>
          </div>
        </section>

        <footer className="text-center bg-slate-900 text-slate-400 rounded-2xl p-8 text-xs">
          <div className="text-white text-base font-bold mb-1">AlwazzanOS for Software Developing</div>
          <div className="text-blue-400 mb-2">Building Modern Digital Solutions</div>
          <div>This proposal is valid for 30 days from the date of issue.</div>
          <div className="mt-1">© {new Date().getFullYear()} AlwazzanOS. All rights reserved.</div>
        </footer>
      </div>
    </div>
  );
}
