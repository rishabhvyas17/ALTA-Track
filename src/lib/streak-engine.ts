import { ChallengeRules } from "./rules";

export interface EnrollmentState {
  id: string;
  currentDay: number;
  streakCount: number;
  longestStreak: number;
  graceDaysUsedThisMonth: number;
  graceDaysResetAt: Date | null;
  restartCount: number;
  status: "ACTIVE" | "BROKEN" | "COMPLETED";
  completedAt?: Date | null;
}

export function evaluateMissedDay(
  enrollment: EnrollmentState,
  rules: ChallengeRules,
  today: Date = new Date()
): EnrollmentState {
  const next = { ...enrollment };

  // 1. Check if grace days counter should reset (calendar_month policy)
  if (rules.graceDaysResetPolicy === "calendar_month") {
    const lastReset = enrollment.graceDaysResetAt
      ? new Date(enrollment.graceDaysResetAt)
      : null;

    if (!lastReset || lastReset.getMonth() !== today.getMonth()) {
      next.graceDaysUsedThisMonth = 0;
      next.graceDaysResetAt = today;
    }
  }

  // 2. Evaluate missed day
  if (next.graceDaysUsedThisMonth < rules.graceDaysPerMonth) {
    // Consume grace day, preserve streak count
    next.graceDaysUsedThisMonth += 1;
  } else {
    // Grace days exhausted, apply configured missed day action
    if (rules.missedDayAction === "restart_to_day_1") {
      next.status = "BROKEN";
      next.currentDay = 1;
      next.streakCount = 0;
      next.restartCount += 1;
    } else {
      // pause_streak_only
      next.status = "ACTIVE";
    }
  }

  return next;
}
