import { describe, it, expect } from "vitest";
import { intervalDaysForScore } from "@/lib/domain/scheduling";
import { awardPoints } from "@/lib/domain/points";
import { updateStreak, type StreakState } from "@/lib/domain/streak";
import { stateForScore } from "@/lib/domain/states";

describe("scheduling", () => {
  it("maps scores to review gaps", () => {
    expect([10, 45, 65, 80, 95].map((s) => intervalDaysForScore(s))).toEqual([1, 3, 6, 14, 30]);
  });
});

describe("states", () => {
  it("maps scores to states", () => {
    expect([null, 10, 45, 65, 80, 95].map(stateForScore)).toEqual([
      "not_studied", "needs_work", "developing", "good", "strong", "mastered",
    ]);
  });
});

describe("points", () => {
  it("awards base points for a first explanation", () => {
    expect(awardPoints({ score: 72, isReview: false, previousScore: null, earnedToday: 0 })).toBe(17);
  });
  it("adds review bonus and improvement", () => {
    expect(awardPoints({ score: 72, isReview: true, previousScore: 62, earnedToday: 0 })).toBe(24);
  });
  it("respects the daily cap", () => {
    expect(awardPoints({ score: 72, isReview: false, previousScore: null, earnedToday: 95 })).toBe(5);
    expect(awardPoints({ score: 72, isReview: false, previousScore: null, earnedToday: 100 })).toBe(0);
  });
});

const base: StreakState = {
  streak_current: 3, streak_best: 3, freezes_left: 2, freeze_month: "2026-10", last_active_date: "2026-10-05",
};

describe("streak", () => {
  it("keeps the same day unchanged", () => {
    expect(updateStreak(base, "2026-10-05").streak_current).toBe(3);
  });
  it("extends on the next day", () => {
    expect(updateStreak(base, "2026-10-06").streak_current).toBe(4);
  });
  it("uses a freeze for one missed day", () => {
    const r = updateStreak(base, "2026-10-07");
    expect(r.streak_current).toBe(4);
    expect(r.freezes_left).toBe(1);
  });
  it("resets after too many missed days", () => {
    expect(updateStreak(base, "2026-10-10").streak_current).toBe(1);
  });
  it("refills freezes in a new month", () => {
    const r = updateStreak({ ...base, freezes_left: 0, last_active_date: "2026-10-31" }, "2026-11-01");
    expect(r.streak_current).toBe(4);
    expect(r.freezes_left).toBe(2);
  });
});

describe("points threshold", () => {
  it("gives no points when the score is below the minimum", () => {
    expect(awardPoints({ score: 5, isReview: false, previousScore: null, earnedToday: 0 })).toBe(0);
  });
});
