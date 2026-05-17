import 'dotenv/config';
import { PrismaClient, OfferStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const offerId = 'cmnu52tf6000ie1qbqphijmvy';
  await prisma.offerItem.deleteMany({ where: { offerId } });

  const hospitalModules = await prisma.module.findMany({ where: { category: 'Hospital' } });
  const subtotal = hospitalModules.reduce((s, m) => s + Number(m.defaultPrice), 0);

  await prisma.offer.update({
    where: { id: offerId },
    data: {
      title: 'Hospital Management System',
      clientId: 'seed-almawada',
      projectId: 'seed-project-almawada-his',
      status: OfferStatus.SENT,
      currencyCode: 'IQD',
      subtotal: new Prisma.Decimal(subtotal),
      total: new Prisma.Decimal(subtotal),
      sentAt: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes:
        'Complete HIS proposal for Almawada Hospital. 6-month delivery, 1 year free support, then 2,000,000 IQD/year. Hardware on client side. Payment: 5,000,000 IQD upfront, remaining over 24 monthly installments.',
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
  console.log('Offer restored');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
