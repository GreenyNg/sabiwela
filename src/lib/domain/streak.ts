import { CONFIG } from "@/lib/config";

export type StreakState = {
  streak_current: number;
  streak_best: number;
  freezes_left: number;
  freeze_month: string | null;
  last_active_date: string | null;
};

/** 'YYYY-MM-DD' in the configured timezone. */
export function dayString(d: Date, tz: string = CONFIG.timezone): string {
  return d.toLocaleDateString("en-CA", { timeZone: tz });
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

export function updateStreak(s: StreakState, today: string): StreakState {
  const month = today.slice(0, 7);
  let freezes = s.freeze_month === month ? s.freezes_left : CONFIG.freezesPerMonth;
  if (s.last_active_date === today) return { ...s, freezes_left: freezes, freeze_month: month };

  let streak = 1;
  if (s.last_active_date) {
    const gap = daysBetween(s.last_active_date, today);
    const missed = gap - 1;
    if (gap === 1) streak = s.streak_current + 1;
    else if (gap > 1 && missed <= freezes) {
      freezes -= missed;
      streak = s.streak_current + 1;
    }
  }
  return {
    streak_current: streak,
    streak_best: Math.max(s.streak_best, streak),
    freezes_left: freezes,
    freeze_month: month,
    last_active_date: today,
  };
}
