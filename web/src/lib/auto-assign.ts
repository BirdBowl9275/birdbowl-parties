// Rules for the automatic assignment run. Pure, so they are unit tested.
//
// The run happens at 8:00 p.m. Eastern on Wednesday, when availability closes for the current
// schedule week. It fills and re-ranks only Thursday to Sunday of that week. Monday to Wednesday
// are already past or closed, and a party is fixed once its details are revealed.
import { addDays } from './parties';

const NY = 'America/New_York';

// True on Wednesday from 8 p.m. Eastern to midnight. The cron runs once a day, on Thursday at
// 01:00 UTC, which is 8 p.m. Eastern in winter and 9 p.m. in summer. Either way it falls inside
// the window, and the cron runs only once a week.
export function isAutoRunWindow(now: Date): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: NY,
    weekday: 'short',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value;
  const hour = parts.find((p) => p.type === 'hour')?.value;
  return weekday === 'Wed' && Number(hour) >= 20;
}

// Thursday, Friday, Saturday and Sunday of the week that starts on `monday`.
export function autoRunDays(monday: string): string[] {
  return [3, 4, 5, 6].map((offset) => addDays(monday, offset));
}
