import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role, OfferStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Currencies
  await prisma.currency.upsert({
    where: { code: 'IQD' },
    update: {},
    create: { code: 'IQD', symbol: 'د.ع', name: 'Iraqi Dinar', exchangeRate: 1, isBase: true },
  });
  await prisma.currency.upsert({
    where: { code: 'USD' },
    update: {},
    create: { code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 1310, isBase: false },
  });
  await prisma.currency.upsert({
    where: { code: 'EUR' },
    update: {},
    create: { code: 'EUR', symbol: '€', name: 'Euro', exchangeRate: 1420, isBase: false },
  });

  // Admin user (simple username/password)
  const adminUsername = 'admin';
  await prisma.user.upsert({
    where: { email: adminUsername },
    update: {
      password: await bcrypt.hash('admin', 10),
      role: Role.ADMIN,
      active: true,
    },
    create: {
      name: 'Saif Alwazzan',
      email: adminUsername,
      password: await bcrypt.hash('admin', 10),
      role: Role.ADMIN,
    },
  });
  console.log(`Admin ready: ${adminUsername} / admin`);

  // Default settings
  await prisma.setting.upsert({
    where: { key: 'company.name' },
    update: {},
    create: { key: 'company.name', value: 'AlwazzanOS for Software Developing' },
  });
  await prisma.setting.upsert({
    where: { key: 'company.foundedYear' },
    update: {},
    create: { key: 'company.foundedYear', value: '2011' },
  });
  await prisma.setting.upsert({
    where: { key: 'currency.base' },
    update: {},
    create: { key: 'currency.base', value: 'IQD' },
  });

  // Default module library (from hospital proposal template)
  const defaultModules: {
    name: string;
    category: string;
    defaultPrice: number;
    features: string[];
    description?: string;
  }[] = [
    { name: 'Patient Management', category: 'Hospital', defaultPrice: 5000000, features: ['Patient registration & medical records', 'Visit history & appointment tracking', 'Insurance information management', 'Patient search & filtering'] },
    { name: 'Appointments & Scheduling', category: 'Hospital', defaultPrice: 5000000, features: ['Book / reschedule / cancel appointments', 'Doctor availability calendar', 'SMS & email reminders', 'Walk-in queue management'] },
    { name: 'Doctors & Staff Management', category: 'Hospital', defaultPrice: 5000000, features: ['Doctor profiles & specialties', 'Staff department assignment', 'Schedule & shift management', 'Attendance tracking'] },
    { name: 'Departments & Clinics', category: 'Hospital', defaultPrice: 4000000, features: ['Department listing & management', 'Clinic rooms & capacity', 'Equipment assignment', 'Department-level reporting'] },
    { name: 'Electronic Medical Records (EMR)', category: 'Hospital', defaultPrice: 7000000, features: ['Diagnosis & prescriptions', 'Lab results & radiology reports', 'File attachments (X-ray, scans)', 'Complete medical history timeline'] },
    { name: 'Pharmacy', category: 'Hospital', defaultPrice: 6000000, features: ['Medication inventory management', 'Prescription fulfillment', 'Low stock alerts & reordering', 'Expiry date tracking'] },
    { name: 'Billing & Invoicing', category: 'Hospital', defaultPrice: 6000000, features: ['Service & procedure pricing', 'Invoice generation & printing', 'Insurance claims integration', 'Payment tracking & receipts'] },
    { name: 'Cashier', category: 'Hospital', defaultPrice: 4000000, features: ['Point-of-service payment collection', 'Cash, card & insurance payments', 'Daily cash register open/close', 'Receipt printing & reprinting', 'Shift-end reconciliation report'] },
    { name: 'Accountant Department', category: 'Hospital', defaultPrice: 7000000, features: ['General ledger & chart of accounts', 'Accounts payable & receivable', 'Revenue tracking per department & doctor', 'Expense management & vendor payments', 'Payroll processing & salary disbursement', 'Financial statements', 'Tax reporting & compliance'] },
    { name: 'Emergency Department', category: 'Hospital', defaultPrice: 6000000, features: ['Emergency patient registration & triage', 'Priority-based queue management', 'Vital signs recording & monitoring', 'Emergency doctor assignment', 'Transfer to inpatient or discharge'] },
    { name: 'Hospitalization & Ward Management', category: 'Hospital', defaultPrice: 7000000, features: ['Patient admission & bed assignment', 'Ward & room capacity management', 'Daily nursing notes & follow-ups', 'Meal & diet planning per patient', 'Discharge process & summary'] },
    { name: 'Store & Inventory', category: 'Hospital', defaultPrice: 5000000, features: ['Central warehouse management', 'Stock-in & stock-out tracking', 'Purchase orders & supplier management', 'Department-level stock requests', 'Minimum stock level alerts', 'Expiry date monitoring'] },
    { name: 'Dashboard & Reports', category: 'Hospital', defaultPrice: 4000000, features: ['Admin analytics dashboard', 'Patient count, revenue, occupancy', 'Department-level KPIs', 'Exportable reports (PDF / Excel)'] },
    { name: 'Role-Based Access Control & Bilingual UI', category: 'Hospital', defaultPrice: 4000000, features: ['Multiple roles & permissions', 'Per-module access control', 'Arabic & English UI', 'Full RTL support'] },
    { name: 'Laboratory Information System', category: 'Lab', defaultPrice: 6000000, features: ['Test requests & sample tracking', 'Results entry & validation', 'PDF report generation', 'Integration with EMR'] },
    {
      name: 'Hospital Management System (Complete Bundle)',
      category: 'Bundles',
      defaultPrice: 75000000,
      description: 'Complete HIS bundle including all 14 modules. 6-month delivery, 1 year free support.',
      features: [
        'Patient Management',
        'Appointments & Scheduling',
        'Doctors & Staff Management',
        'Departments & Clinics',
        'Electronic Medical Records (EMR)',
        'Pharmacy',
        'Billing & Invoicing',
        'Cashier',
        'Accountant Department',
        'Emergency Department',
        'Hospitalization & Ward Management',
        'Store & Inventory',
        'Dashboard & Reports',
        'Role-Based Access Control & Bilingual UI (AR/EN)',
        '6-month delivery timeline',
        '1 year free online & onsite support',
        'Annual support renewal: 2,000,000 IQD/year',
      ],
    },
  ];
  for (const m of defaultModules) {
    const existing = await prisma.module.findFirst({ where: { name: m.name } });
    if (!existing) await prisma.module.create({ data: m });
  }
  console.log(`Seeded ${defaultModules.length} default modules.`);

  // Default partners
  const partners = [
    { id: 'partner-saif', name: 'Saif Alwazzan', profitShare: 50 },
    { id: 'partner-brother', name: 'Brother', profitShare: 50 },
  ];
  for (const p of partners) {
    await prisma.partner.upsert({
      where: { id: p.id },
      update: {},
      create: { id: p.id, name: p.name, profitShare: new Prisma.Decimal(p.profitShare) },
    });
  }
  console.log('Seeded 2 partners (50/50 split)');

  // Sample client: Almawada Hospital
  const client = await prisma.client.upsert({
    where: { id: 'seed-almawada' },
    update: {},
    create: {
      id: 'seed-almawada',
      name: 'Almawada Hospital',
      contactPerson: 'Hospital Director',
      currencyCode: 'IQD',
    },
  });

  // Sample project: Almawada HIS
  const almawadaProject = await prisma.project.upsert({
    where: { id: 'seed-project-almawada-his' },
    update: {},
    create: {
      id: 'seed-project-almawada-his',
      name: 'Almawada Hospital — HIS',
      code: 'ALMAWADA-HIS',
      description: 'Complete Hospital Information System for Almawada Hospital. 14 modules, 6-month delivery.',
      status: 'ACTIVE',
      clientId: client.id,
      currencyCode: 'IQD',
      budget: new Prisma.Decimal(75000000),
      startDate: new Date(),
    },
  });
  console.log('Seeded sample project: ALMAWADA-HIS');

  // Sample offer: HIS for Almawada (SENT status, 75M IQD, 14 modules)
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin' } });
  if (adminUser) {
    const existingOffer = await prisma.offer.findFirst({ where: { clientId: client.id, title: { contains: 'Hospital Management System' } } });
    if (!existingOffer) {
      const hospitalModules = await prisma.module.findMany({ where: { category: 'Hospital' } });
      const subtotal = hospitalModules.reduce((s, m) => s + Number(m.defaultPrice), 0);
      await prisma.offer.create({
        data: {
          number: 'AWZ-OFF-2026-0001',
          title: 'Hospital Management System',
          clientId: client.id,
          projectId: almawadaProject.id,
          status: OfferStatus.SENT,
          currencyCode: 'IQD',
          subtotal: new Prisma.Decimal(subtotal),
          discount: new Prisma.Decimal(0),
          tax: new Prisma.Decimal(0),
          total: new Prisma.Decimal(subtotal),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          notes: 'Complete HIS proposal for Almawada Hospital. 6-month delivery, 1 year free support, then 2,000,000 IQD/year. Hardware on client side. Payment: 5,000,000 IQD upfront, remaining over 24 monthly installments.',
          createdById: adminUser.id,
          sentAt: new Date(),
          items: {
            create: hospitalModules.map((m, idx) => ({
              moduleId: m.id,
              name: m.name,
              description: m.features.join('\n'),
              quantity: 1,
              unitPrice: m.defaultPrice,
              total: m.defaultPrice,
              order: idx,
            })),
          },
        },
      });
      console.log(`Created sample HIS offer for Almawada Hospital (SENT, ${subtotal} IQD)`);
    } else {
      console.log('Sample HIS offer already exists');
    }
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
