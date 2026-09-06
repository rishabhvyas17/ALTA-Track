/**
 * Scoring and Ranking Utilities for ALTA Track
 *
 * Scoring Rules:
 * - Easy Question   = 1 Point
 * - Medium Question = 2 Points
 * - Hard Question   = 3 Points
 *
 * Total Score = (Easy * 1) + (Medium * 2) + (Hard * 3)
 * Primary Leaderboard Rank: Total Score (descending)
 * Tiebreaker: Daily Streak Count (descending)
 */

export interface SubmissionForScoring {
  problem?: {
    difficulty?: string | null;
  } | null;
}

export interface ScoreBreakdown {
  score: number;
  questionsSolved: number;
  easy: number;
  medium: number;
  hard: number;
}

export function calculateScore(
  approvedSubmissions: SubmissionForScoring[] = []
): ScoreBreakdown {
  let easy = 0;
  let medium = 0;
  let hard = 0;

  for (const sub of approvedSubmissions) {
    const diff = (sub.problem?.difficulty || "").toLowerCase();
    if (diff.includes("hard")) {
      hard++;
    } else if (diff.includes("medium")) {
      medium++;
    } else {
      // Defaults to Easy if marked "Easy" or unspecified
      easy++;
    }
  }

  const score = easy * 1 + medium * 2 + hard * 3;

  return {
    score,
    questionsSolved: approvedSubmissions.length,
    easy,
    medium,
    hard,
  };
}
