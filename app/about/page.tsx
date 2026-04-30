'use client';
import { useLang } from '@/lib/lang-context';
import { t, tr } from '@/lib/i18n';
import { Calendar, Users, Layers, Award } from 'lucide-react';

export default function AboutPage() {
  const { lang } = useLang();

  const stats = [
    { icon: <Calendar size={24} className="text-cyan-400" />, value: '2011',   label: tr(t.about.founded, lang) },
    { icon: <Users    size={24} className="text-cyan-400" />, value: '5+',     label: tr(t.about.clients, lang) },
    { icon: <Layers   size={24} className="text-cyan-400" />, value: '8+',     label: tr(t.about.systems, lang) },
    { icon: <Award    size={24} className="text-cyan-400" />, value: '14+',    label: tr(t.about.years,   lang) },
  ];

  const timeline = [
    { year: '2011', ar: 'تأسيس AlwazzanOS for Software Developing على يد سيف الوزان', en: 'AlwazzanOS for Software Developing founded by Saif Alwazzan' },
    { year: '2015', ar: 'إطلاق أول إصدار من نظام إدارة المتاجر (Store OS)', en: 'First release of Store OS — store management system' },
    { year: '2018', ar: 'بناء نظام إدارة المستشفيات الكامل (Hospital OS)', en: 'Full Hospital Information System (Hospital OS) built' },
    { year: '2020', ar: 'إطلاق Lab OS ونظام إدارة المشاريع لنوكيا العراق', en: 'Lab OS launched; Project Management OS delivered to Nokia Iraq' },
    { year: '2022', ar: 'Clinic OS وتوسع المنظومة الصحية مع دعم كامل للعربية', en: 'Clinic OS launched; full Arabic & RTL healthcare ecosystem' },
    { year: '2024', ar: 'منظومة متكاملة من 8 أنظمة تشغيل تخدم القطاعين الصحي والتجاري', en: 'Complete 8-system suite serving healthcare and commerce sectors' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-[var(--text)] mb-4">{tr(t.about.title, lang)}</h1>
        <div className="w-16 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 mx-auto" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-16">
        {stats.map(s => (
          <div key={s.value} className="glow-border rounded-2xl bg-[var(--surface)] p-6 text-center">
            <div className="flex justify-center mb-3">{s.icon}</div>
            <div className="text-3xl font-bold gradient-text">{s.value}</div>
            <div className="text-sm text-[var(--muted)] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Story */}
      <div className="grid md:grid-cols-2 gap-10 mb-20">
        <div className="glow-border rounded-2xl bg-[var(--surface)] p-8">
          <h2 className="text-xl font-bold text-[var(--text)] mb-4">{tr(t.about.title, lang)}</h2>
          <p className="text-[var(--muted)] leading-relaxed">{tr(t.about.body, lang)}</p>
        </div>
        <div className="glow-border rounded-2xl bg-[var(--surface)] p-8">
          <h2 className="text-xl font-bold text-[var(--text)] mb-4">{tr(t.about.mission, lang)}</h2>
          <p className="text-[var(--muted)] leading-relaxed">{tr(t.about.missionBody, lang)}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['RTL Support', 'IQD + USD', 'Arabic First', 'Healthcare', 'Enterprise'].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-400 text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text)] mb-8 text-center">
          {lang === 'ar' ? 'مسيرتنا' : 'Our Journey'}
        </h2>
        <div className="relative">
          <div className="absolute start-[28px] top-0 bottom-0 w-px bg-[var(--border)]" />
          <div className="space-y-6">
            {timeline.map(item => (
              <div key={item.year} className="flex gap-5 items-start">
                <div className="w-14 h-14 rounded-full bg-[var(--surface)] border border-cyan-500/30 flex items-center justify-center shrink-0 z-10">
                  <span className="text-xs font-bold text-cyan-400">{item.year}</span>
                </div>
                <div className="glow-border rounded-xl bg-[var(--surface)] p-4 flex-1 mt-2">
                  <p className="text-[var(--muted)] text-sm leading-relaxed">
                    {lang === 'ar' ? item.ar : item.en}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
