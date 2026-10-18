const JAKARTA_TIME_ZONE = 'Asia/Jakarta';

export const getJakartaDateString = (date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value;

  return `${part('year')}-${part('month')}-${part('day')}`;
};

export const addDaysToDateString = (date: string, days: number): string => {
  const [year, month, day] = date.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
};

export const toDatabaseDate = (date: string): Date =>
  new Date(`${date}T00:00:00.000Z`);

export const getJakartaSlotCutoff = (
  quotaDate: Date,
  startTime: string,
  cutoffMinutes: number,
): Date => {
  const date = quotaDate.toISOString().slice(0, 10);
  const cutoff = new Date(`${date}T${startTime}:00+07:00`);
  cutoff.setMinutes(cutoff.getMinutes() - cutoffMinutes);
  return cutoff;
};
