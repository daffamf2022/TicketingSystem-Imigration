import prisma from './lib/prisma';

async function main() {
  console.log('[seeder]: Starting database seeding...');

  // Normalize date to UTC midnight to prevent timezone shifts during serialization
  const getUtcMidnight = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  };

  const today = getUtcMidnight(new Date());
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);

  const dates = [today, tomorrow];
  const slots = [
    { startTime: '08:00', endTime: '10:00' },
    { startTime: '10:00', endTime: '12:00' },
    { startTime: '13:00', endTime: '15:00' },
  ];

  for (const date of dates) {
    for (const slot of slots) {
      await prisma.quota.upsert({
        where: {
          date_startTime_endTime: {
            date,
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
        },
        update: {
          maxQuota: 50,
          remainingQuota: 50,
        },
        create: {
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          maxQuota: 50,
          remainingQuota: 50,
        },
      });
    }
  }

  console.log('[seeder]: Quotas seeded successfully for today and tomorrow.');
}

main()
  .catch((e) => {
    console.error('[seeder]: Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
