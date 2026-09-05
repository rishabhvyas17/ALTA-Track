import { z } from "zod";

// ─── Challenge Rules Zod Schema ─────────────────────────────────────────────

export const ChallengeRulesSchema = z.object({
  graceDaysPerMonth: z
    .number()
    .int()
    .min(0)
    .max(10)
    .describe("Number of grace days allowed per month"),

  graceDaysResetPolicy: z
    .enum(["calendar_month", "rolling_30_days"])
    .describe("When grace days counter resets"),

  missedDayAction: z
    .enum(["restart_to_day_1", "pause_streak_only"])
    .describe("What happens when a student misses a day without grace days left"),

  allowOutOfOrderSubmission: z
    .boolean()
    .describe("Whether students can submit for any day, not just the current day"),

  proofRequired: z
    .enum(["linkedin_post", "any_link"])
    .describe("What type of proof is required"),

  supportingLinkRequired: z
    .boolean()
    .describe("Whether at least one supporting link (LeetCode/GFG or GitHub) is required"),

  supportingLinkTypes: z
    .array(z.enum(["leetcode_gfg", "github"]))
    .describe("Accepted types of supporting links"),

  resubmissionAllowedOnReject: z
    .boolean()
    .describe("Whether students can resubmit after a rejection"),

  streakBreakGraceWindow: z
    .boolean()
    .describe("Whether there's a grace window before a streak break takes effect"),
});

export type ChallengeRules = z.infer<typeof ChallengeRulesSchema>;

// ─── Default Rules ──────────────────────────────────────────────────────────

export const DEFAULT_RULES: ChallengeRules = {
  graceDaysPerMonth: 1,
  graceDaysResetPolicy: "calendar_month",
  missedDayAction: "restart_to_day_1",
  allowOutOfOrderSubmission: false,
  proofRequired: "linkedin_post",
  supportingLinkRequired: false,
  supportingLinkTypes: ["leetcode_gfg", "github"],
  resubmissionAllowedOnReject: true,
  streakBreakGraceWindow: false,
};

// ─── Rules → Plain Text Renderer ────────────────────────────────────────────

/**
 * Single source of truth: renders rules JSON into a human-readable bullet list.
 * Used in both the admin preview and the student-facing rules page.
 */
export function renderRulesAsPlainText(
  rules: ChallengeRules,
  challenge: { name: string; totalDays: number }
): string[] {
  const lines: string[] = [];

  // Submission order
  if (rules.allowOutOfOrderSubmission) {
    lines.push("You can submit problems in any order.");
  } else {
    lines.push("Solve and submit one problem per day, in order.");
  }

  // Grace days
  const graceResetLabel =
    rules.graceDaysResetPolicy === "calendar_month"
      ? "per calendar month"
      : "per rolling 30-day period";

  if (rules.graceDaysPerMonth === 0) {
    lines.push(
      `No grace days — miss a single day and your ${
        rules.missedDayAction === "restart_to_day_1"
          ? "streak restarts from Day 1"
          : "streak is paused"
      }.`
    );
  } else {
    const missedAction =
      rules.missedDayAction === "restart_to_day_1"
        ? "your streak restarts from Day 1"
        : "your streak is paused until you submit again";

    lines.push(
      `You get ${rules.graceDaysPerMonth} grace day${
        rules.graceDaysPerMonth > 1 ? "s" : ""
      } ${graceResetLabel} — miss more than that and ${missedAction}.`
    );
  }

  // Proof requirements
  if (rules.proofRequired === "linkedin_post") {
    const supportingParts: string[] = [];
    if (rules.supportingLinkTypes.includes("leetcode_gfg")) {
      supportingParts.push("a LeetCode/GFG link");
    }
    if (rules.supportingLinkTypes.includes("github")) {
      supportingParts.push("a GitHub link to your code");
    }

    const supportingText = supportingParts.length > 0
      ? ` ${supportingParts.join(" and ")} ${
          supportingParts.length > 1 ? "are" : "is"
        } ${rules.supportingLinkRequired ? "also required" : "optional but helpful"}`
      : "";

    lines.push(
      `Post your solution to LinkedIn and submit that post's link — that's your proof.${
        supportingText ? ` ${supportingText.trim()}, but the LinkedIn post is what gets verified.` : ""
      }`
    );
  } else {
    lines.push("Submit a link to your solution as proof.");
  }

  // Resubmission
  if (rules.resubmissionAllowedOnReject) {
    lines.push(
      "If your submission is rejected, you can fix and resubmit for the same day."
    );
  } else {
    lines.push(
      "Rejected submissions cannot be resubmitted — make sure your proof is correct before submitting."
    );
  }

  // Challenge total
  lines.push(
    `Complete all ${challenge.totalDays} days of ${challenge.name} to finish the challenge.`
  );

  return lines;
}

// ─── Rules Validation Helper ────────────────────────────────────────────────

/**
 * Validate and parse rules JSON, returning a typed ChallengeRules object.
 * Falls back to DEFAULT_RULES for any missing fields.
 */
export function parseRules(rulesJson: unknown): ChallengeRules {
  try {
    const merged = { ...DEFAULT_RULES, ...(rulesJson as Record<string, unknown>) };
    return ChallengeRulesSchema.parse(merged);
  } catch {
    return DEFAULT_RULES;
  }
}
