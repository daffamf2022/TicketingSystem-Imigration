import prisma from './lib/prisma';

async function main() {
  const quotas = await prisma.quota.findMany({
    orderBy: { date: 'asc' }
  });
  console.log('QUOTAS IN DB:', quotas.map(q => ({
    id: q.id,
    date: q.date,
    dateType: typeof q.date,
    dateString: q.date instanceof Date ? q.date.toISOString() : String(q.date),
    startTime: q.startTime,
    endTime: q.endTime,
    remainingQuota: q.remainingQuota
  })));
  console.log('TODAY LOCAL:', new Date().toString());
  console.log('TODAY ISO:', new Date().toISOString());
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
