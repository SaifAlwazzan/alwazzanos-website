'use client';

import { useEffect, useState } from 'react';
import { Save, Building, DollarSign, Mail, Palette } from 'lucide-react';
import { api } from '@/lib/oim-api';

interface SettingsMap {
  [key: string]: string;
}

const SECTIONS = [
  {
    id: 'company',
    title: 'Company Info',
    icon: Building,
    fields: [
      { key: 'company.name', label: 'Company Name', placeholder: 'AlwazzanOS for Software Developing' },
      { key: 'company.tagline', label: 'Tagline', placeholder: 'Building Modern Digital Solutions' },
      { key: 'company.foundedYear', label: 'Founded Year', placeholder: '2011' },
      { key: 'company.address', label: 'Address' },
      { key: 'company.phone', label: 'Phone' },
      { key: 'company.email', label: 'Email' },
      { key: 'company.website', label: 'Website' },
      { key: 'company.taxId', label: 'Tax ID' },
    ],
  },
  {
    id: 'currency',
    title: 'Currency',
    icon: DollarSign,
    fields: [
      { key: 'currency.base', label: 'Base Currency', placeholder: 'IQD' },
      { key: 'currency.symbol', label: 'Symbol', placeholder: 'د.ع' },
      { key: 'currency.usdRate', label: 'USD Exchange Rate (1 USD = X IQD)', placeholder: '1310', type: 'number' },
      { key: 'currency.eurRate', label: 'EUR Exchange Rate (1 EUR = X IQD)', placeholder: '1420', type: 'number' },
    ],
  },
  {
    id: 'branding',
    title: 'Branding',
    icon: Palette,
    fields: [
      { key: 'branding.primaryColor', label: 'Primary Color', placeholder: '#0088FF', type: 'color' },
      { key: 'branding.accentColor', label: 'Accent Color', placeholder: '#00D4FF', type: 'color' },
      { key: 'branding.logoUrl', label: 'Logo URL' },
    ],
  },
  {
    id: 'email',
    title: 'Email (SMTP)',
    icon: Mail,
    fields: [
      { key: 'smtp.host', label: 'SMTP Host', placeholder: 'smtp.gmail.com' },
      { key: 'smtp.port', label: 'Port', placeholder: '587', type: 'number' },
      { key: 'smtp.user', label: 'Username' },
      { key: 'smtp.password', label: 'Password', type: 'password' },
      { key: 'smtp.from', label: 'From Address', placeholder: 'noreply@alwazzanos.com' },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<{ settings: SettingsMap }>('/settings')
      .then((res) => setSettings(res.settings))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function update(key: string, value: string) {
    setSettings({ ...settings, [key]: value });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.patch('/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center text-slate-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Company info, currency, branding, and email</p>
        </div>
        <button onClick={handleSave} className="btn-primary" disabled={saving}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg p-3">
          ✓ Settings saved successfully
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {SECTIONS.map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.id} className="card p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-light to-brand text-white flex items-center justify-center">
                <Icon size={18} />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map((field) => (
                <div key={field.key} className={field.type === 'color' ? '' : ''}>
                  <label className="label">{field.label}</label>
                  {field.type === 'color' ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        className="w-12 h-10 rounded border border-slate-200 cursor-pointer"
                        value={settings[field.key] || field.placeholder || '#0088FF'}
                        onChange={(e) => update(field.key, e.target.value)}
                      />
                      <input
                        type="text"
                        className="input"
                        value={settings[field.key] || ''}
                        onChange={(e) => update(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    </div>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      className="input"
                      value={settings[field.key] || ''}
                      onChange={(e) => update(field.key, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex justify-end pt-2">
        <button onClick={handleSave} className="btn-primary" disabled={saving}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
