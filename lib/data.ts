export const products = [
  {
    id: 'hospital-os',
    icon: '/os-hospital.svg',
    name:  { ar: 'Hospital OS', en: 'Hospital OS' },
    desc:  {
      ar: 'نظام إدارة مستشفيات متكامل يشمل 14+ وحدة: المرضى، المواعيد، الصيدلية، الفوترة، المستودع، السجلات الطبية الإلكترونية وأكثر.',
      en: 'A complete Hospital Information System with 14+ modules: patients, appointments, pharmacy, billing, inventory, EMR, and more.',
    },
    features: {
      ar: ['إدارة المرضى والملفات الطبية', 'الجدولة والمواعيد', 'الصيدلية والمستودع', 'الفوترة والمحاسبة', 'الطوارئ والأقسام الداخلية', 'لوحة تحليلات وتقارير'],
      en: ['Patient management & EMR', 'Scheduling & appointments', 'Pharmacy & inventory', 'Billing & accounting', 'Emergency & ward management', 'Analytics dashboard & reports'],
    },
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'clinic-os',
    icon: null,
    name:  { ar: 'Clinic OS', en: 'Clinic OS' },
    desc:  {
      ar: 'نظام إدارة عيادة خاصة متكامل: المرضى، المواعيد، الكاشير، التقارير، ودعم الطباعة على الترويسة الرسمية.',
      en: 'A complete private clinic management system: patients, appointments, cashier, reports, and official letterhead printing.',
    },
    features: {
      ar: ['تسجيل المرضى والزيارات', 'إدارة المواعيد', 'الكاشير والفواتير', 'طباعة A5 بترويسة رسمية', 'تقارير يومية وشهرية'],
      en: ['Patient registration & visits', 'Appointment management', 'Cashier & invoicing', 'A5 official letterhead printing', 'Daily & monthly reports'],
    },
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'lab-os',
    icon: '/os-lab.svg',
    name:  { ar: 'Lab OS', en: 'Lab OS' },
    desc:  {
      ar: 'نظام مختبر طبي شامل لإدارة طلبات الفحوصات، إدخال النتائج، توليد تقارير PDF احترافية، وإدارة المرضى.',
      en: 'A comprehensive medical lab system for managing test requests, entering results, generating professional PDF reports, and patient management.',
    },
    features: {
      ar: ['طلبات الفحوصات وتتبع العينات', 'إدخال النتائج والتحقق', 'تقارير PDF احترافية', 'إدارة المرضى والزيارات', 'واجهة عربية كاملة'],
      en: ['Test requests & sample tracking', 'Result entry & validation', 'Professional PDF reports', 'Patient & visit management', 'Full Arabic interface'],
    },
    color: 'from-teal-500 to-cyan-600',
  },
  {
    id: 'store-os',
    icon: '/os-store.svg',
    name:  { ar: 'Store OS', en: 'Store OS' },
    desc:  {
      ar: 'نظام إدارة مخزون ومتجر متكامل مع تتبع المنتجات، الموردين، المبيعات والتقارير.',
      en: 'A complete inventory and store management system with product tracking, suppliers, sales, and reports.',
    },
    features: {
      ar: ['إدارة المخزون والمنتجات', 'الموردين وأوامر الشراء', 'المبيعات والفواتير', 'تنبيهات الحد الأدنى', 'تقارير الأرباح والخسائر'],
      en: ['Inventory & product management', 'Suppliers & purchase orders', 'Sales & invoicing', 'Low stock alerts', 'Profit & loss reports'],
    },
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'cashier-os',
    icon: '/os-cashier.svg',
    name:  { ar: 'Cashier OS', en: 'Cashier OS' },
    desc:  {
      ar: 'نظام كاشير سريع ومتكامل لنقاط البيع مع دعم الدفع النقدي والبطاقات وطباعة الإيصالات.',
      en: 'A fast and complete point-of-sale cashier system with cash, card payments, and receipt printing.',
    },
    features: {
      ar: ['نقطة بيع سريعة وبسيطة', 'دفع نقدي وبطاقات', 'طباعة إيصالات', 'تقرير نهاية الوردية', 'دعم عملات متعددة'],
      en: ['Fast & simple POS', 'Cash & card payments', 'Receipt printing', 'End-of-shift report', 'Multi-currency support'],
    },
    color: 'from-orange-500 to-amber-600',
  },
  {
    id: 'queue-os',
    icon: '/os-queue.svg',
    name:  { ar: 'Queue OS', en: 'Queue OS' },
    desc:  {
      ar: 'نظام إدارة الانتظار للمستشفيات والعيادات مع شاشة عرض وإشعارات صوتية.',
      en: 'Queue management system for hospitals and clinics with display screen and audio notifications.',
    },
    features: {
      ar: ['إصدار أرقام الانتظار', 'شاشة عرض للمرضى', 'إشعارات صوتية', 'إحصائيات الانتظار', 'دعم أقسام متعددة'],
      en: ['Queue number issuance', 'Patient display screen', 'Audio notifications', 'Wait time statistics', 'Multi-department support'],
    },
    color: 'from-rose-500 to-pink-600',
  },
  {
    id: 'project-os',
    icon: null,
    name:  { ar: 'Project Management OS', en: 'Project Management OS' },
    desc:  {
      ar: 'نظام إدارة مشاريع متكامل لتتبع المهام، الفرق، الجداول الزمنية والتقارير.',
      en: 'A complete project management system for tracking tasks, teams, timelines, and reports.',
    },
    features: {
      ar: ['إدارة المشاريع والمهام', 'تتبع الفرق والأدوار', 'الجداول الزمنية', 'تقارير الأداء', 'لوحة تحكم شاملة'],
      en: ['Project & task management', 'Team & role tracking', 'Timelines & milestones', 'Performance reports', 'Comprehensive dashboard'],
    },
    color: 'from-emerald-500 to-green-600',
  },
  {
    id: 'accounting-app',
    icon: null,
    name:  { ar: 'Accounting App', en: 'Accounting App' },
    desc:  {
      ar: 'تطبيق محاسبة يدعم عملتي الدينار العراقي والدولار مع تقارير مالية وإدارة الأقسام.',
      en: 'An accounting app supporting IQD and USD with financial reports and department management.',
    },
    features: {
      ar: ['دعم الدينار والدولار', 'الأقسام والمراكز المالية', 'القيود المحاسبية', 'التقارير المالية', 'تقارير NMM'],
      en: ['IQD & USD support', 'Departments & cost centers', 'Journal entries', 'Financial statements', 'NMM-based reports'],
    },
    color: 'from-sky-500 to-blue-600',
  },
];

export const clients = [
  { name: 'Almawada Hospital',        nameAr: 'مستشفى الموادة',          sector: { ar: 'قطاع صحي',   en: 'Healthcare' },  system: 'Hospital OS' },
  { name: 'Alwazzan Clinic',          nameAr: 'عيادة الوزان',            sector: { ar: 'قطاع صحي',   en: 'Healthcare' },  system: 'Clinic OS' },
  { name: 'Nokia Iraq',               nameAr: 'نوكيا العراق',            sector: { ar: 'قطاع تقني',  en: 'Technology' },  system: 'Project Management OS' },
  { name: 'Anton Oilfield Services',  nameAr: 'أنتون لخدمات النفط',      sector: { ar: 'قطاع نفطي',  en: 'Oil & Gas' },   system: 'Project Management OS' },
  { name: 'Bayan',                    nameAr: 'بيان',                    sector: { ar: 'قطاع مالي',  en: 'Finance' },     system: 'Accounting App' },
];
