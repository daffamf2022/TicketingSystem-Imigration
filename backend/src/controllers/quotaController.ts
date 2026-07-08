import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

/**
 * Controller to fetch available quotas for Today and Tomorrow in real-time.
 */
export const getAvailableQuotas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const getUtcMidnight = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    };

    const todayVal = getUtcMidnight(new Date());
    const tomorrowVal = new Date(todayVal);
    tomorrowVal.setUTCDate(todayVal.getUTCDate() + 1);

    // Fetch quotas matching Today and Tomorrow
    const quotas = await prisma.quota.findMany({
      where: {
        date: {
          in: [todayVal, tomorrowVal],
        },
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        maxQuota: true,
        remainingQuota: true,
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // Format response parameters to snake_case as requested
    const formattedQuotas = quotas.map((q) => ({
      id: q.id,
      date: q.date.toISOString().split('T')[0],
      start_time: q.startTime,
      end_time: q.endTime,
      max_quota: q.maxQuota,
      remaining_quota: q.remainingQuota,
    }));

    res.status(200).json({
      status: 'success',
      data: formattedQuotas,
    });
  } catch (error) {
    next(error);
  }
};
