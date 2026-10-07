import { CONFIG } from "@/lib/config";

export function awardPoints(args: {
  score: number;
  isReview: boolean;
  previousScore: number | null;
  earnedToday: number;
}): number {
  const { base, reviewBonus, improvementPer10, improvementCap, dailyCap } = CONFIG.kp;
  if (args.score < CONFIG.kp.minScore) return 0;
  let kp = base + Math.floor(args.score / 10);
  if (args.isReview) kp += reviewBonus;
  if (args.previousScore !== null) {
    const gain = args.score - args.previousScore;
    if (gain > 0) kp += Math.min(improvementCap, Math.floor(gain / 10) * improvementPer10);
  }
  return Math.max(0, Math.min(kp, dailyCap - args.earnedToday));
}
