import prisma from './lib/prisma';
import { getJakartaDateString, toDatabaseDate } from './lib/date';

async function main() {
  console.log('[seeder]: Starting database seeding...');

  const today = getJakartaDateString();
  const date = toDatabaseDate(today);
  const perSlotQuotaLimit = 5;
  const slots = [
    { startTime: '08:00', endTime: '10:00' },
    { startTime: '10:00', endTime: '12:00' },
    { startTime: '13:00', endTime: '15:00' },
  ];

  await prisma.quota.createMany({
    data: slots.map((slot) => ({
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxQuota: perSlotQuotaLimit,
        remainingQuota: perSlotQuotaLimit,
      })),
    skipDuplicates: true,
  });

  console.log('[seeder]: Quotas seeded successfully for today.');
}

main()
  .catch((e) => {
    console.error('[seeder]: Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
