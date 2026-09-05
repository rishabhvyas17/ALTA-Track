import { parseRules, renderRulesAsPlainText, DEFAULT_RULES } from "../rules";
import { evaluateMissedDay, EnrollmentState } from "../streak-engine";

function runUnitTests() {
  console.log("🧪 Running ALTA-Track Rules & Streak Engine Unit Tests...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Test 1: Rules Parsing
  const rules = parseRules({ graceDaysPerMonth: 2, missedDayAction: "restart_to_day_1" });
  assert(rules.graceDaysPerMonth === 2, "parseRules preserves numeric override");
  assert(rules.missedDayAction === "restart_to_day_1", "parseRules preserves enum override");

  // Test 2: Rules Plain Text Rendering
  const text = renderRulesAsPlainText(rules, { name: "BASE 111", totalDays: 111 });
  assert(text.some((line) => line.includes("2 grace days")), "renderRulesAsPlainText mentions 2 grace days");
  assert(text.some((line) => line.includes("111 days of BASE 111")), "renderRulesAsPlainText mentions challenge name and total days");

  // Test 3: Streak Evaluation with Grace Day Available
  const initialEnrollment: EnrollmentState = {
    id: "e-1",
    currentDay: 5,
    streakCount: 4,
    longestStreak: 4,
    graceDaysUsedThisMonth: 0,
    graceDaysResetAt: new Date(),
    restartCount: 0,
    status: "ACTIVE",
  };

  const eval1 = evaluateMissedDay(initialEnrollment, DEFAULT_RULES);
  assert(eval1.graceDaysUsedThisMonth === 1, "Missed day consumes 1 grace day when available");
  assert(eval1.streakCount === 4, "Streak count is preserved when grace day is consumed");
  assert(eval1.status === "ACTIVE", "Enrollment remains ACTIVE when grace day is consumed");

  // Test 4: Streak Evaluation when Grace Days Exhausted (Restart to Day 1)
  const exhaustedEnrollment: EnrollmentState = {
    ...initialEnrollment,
    graceDaysUsedThisMonth: 1,
  };

  const eval2 = evaluateMissedDay(exhaustedEnrollment, DEFAULT_RULES);
  assert(eval2.status === "BROKEN", "Status set to BROKEN when grace days exhausted");
  assert(eval2.streakCount === 0, "Streak count reset to 0");
  assert(eval2.currentDay === 1, "Current day reset to 1");
  assert(eval2.restartCount === 1, "Restart count incremented by 1");

  console.log(`\n🎉 Test Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runUnitTests();
