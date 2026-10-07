import { CONFIG } from "@/lib/config";

export function intervalDaysForScore(score: number, intervals: number[] = CONFIG.reviewIntervalsDays): number {
  if (score < 30) return intervals[0];
  if (score < 50) return intervals[1];
  if (score < 70) return intervals[2];
  if (score < 85) return intervals[3];
  return intervals[4];
}

export function nextReviewDate(score: number, now: Date = new Date(), intervals?: number[]): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + intervalDaysForScore(score, intervals));
  return d;
}
