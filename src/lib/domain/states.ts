export type StateKey = "not_studied" | "needs_work" | "developing" | "good" | "strong" | "mastered";

export function stateForScore(score: number | null): StateKey {
  if (score == null) return "not_studied";
  if (score < 40) return "needs_work";
  if (score < 60) return "developing";
  if (score < 75) return "good";
  if (score < 90) return "strong";
  return "mastered";
}

export const STATE_META: Record<StateKey, { label: string; icon: string; color: string }> = {
  not_studied: { label: "Not studied", icon: "○", color: "var(--mute)" },
  needs_work: { label: "Needs work", icon: "◔", color: "var(--s1)" },
  developing: { label: "Developing", icon: "◑", color: "var(--s2)" },
  good: { label: "Good", icon: "◕", color: "var(--s3)" },
  strong: { label: "Strong", icon: "●", color: "var(--s4)" },
  mastered: { label: "Mastered", icon: "★", color: "var(--s5)" },
};

export function whenText(iso: string | null, now = new Date()): string {
  if (!iso) return "";
  const days = Math.ceil((new Date(iso).getTime() - now.getTime()) / 86400000);
  if (days <= 0) return "Due now";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}
