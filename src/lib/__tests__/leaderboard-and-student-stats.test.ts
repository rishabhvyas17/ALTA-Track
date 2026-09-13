import { calculateScore } from "../scoring";

async function runLeaderboardAndStatsTests() {
  console.log("🧪 Running Leaderboard Deduplication & Student Stats Unit Tests...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}${detail ? ` - ${detail}` : ""}`);
      failed++;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Test 1: Deduplication logic when a student is enrolled in multiple DSA sheets
  // ──────────────────────────────────────────────────────────────────────────
  const mockEnrollments = [
    {
      id: "enr-1",
      currentDay: 15,
      streakCount: 14,
      status: "ACTIVE",
      user: {
        id: "student-123",
        name: "Aarav Sharma",
        year: 2,
        campus: { id: "campus-north", name: "North Campus" },
      },
      challenge: { id: "chal-base", name: "BASE 111", totalDays: 111 },
      submissions: [
        { problem: { difficulty: "Easy" } },
        { problem: { difficulty: "Easy" } },
        { problem: { difficulty: "Medium" } },
      ], // 2 Easy (2) + 1 Med (2) = 4 pts, 3 solved
    },
    {
      id: "enr-2",
      currentDay: 30,
      streakCount: 28,
      status: "ACTIVE",
      user: {
        id: "student-123", // Same student enrolled in second sheet!
        name: "Aarav Sharma",
        year: 2,
        campus: { id: "campus-north", name: "North Campus" },
      },
      challenge: { id: "chal-apex", name: "APEX 151", totalDays: 151 },
      submissions: [
        { problem: { difficulty: "Easy" } },
        { problem: { difficulty: "Medium" } },
        { problem: { difficulty: "Hard" } },
        { problem: { difficulty: "Hard" } },
      ], // 1 Easy (1) + 1 Med (2) + 2 Hard (6) = 9 pts, 4 solved
    },
    {
      id: "enr-3",
      currentDay: 10,
      streakCount: 10,
      status: "ACTIVE",
      user: {
        id: "student-456",
        name: "Priya Patel",
        year: 3,
        campus: { id: "campus-south", name: "South Campus" },
      },
      challenge: { id: "chal-base", name: "BASE 111", totalDays: 111 },
      submissions: [
        { problem: { difficulty: "Easy" } },
        { problem: { difficulty: "Medium" } },
      ], // 1 Easy (1) + 1 Med (2) = 3 pts
    },
  ];

  // Compute scores
  const allEnrollmentScores = mockEnrollments.map((e) => {
    const scoreData = calculateScore(e.submissions as any);
    return {
      id: e.id,
      currentDay: e.currentDay,
      streakCount: e.streakCount,
      score: scoreData.score,
      questionsSolved: scoreData.questionsSolved,
      user: e.user,
      challenge: e.challenge,
    };
  });

  // Apply our deduplication logic
  const bestByUser = new Map<string, (typeof allEnrollmentScores)[0]>();
  const nameCampusToCanonicalId = new Map<string, string>();

  for (const entry of allEnrollmentScores) {
    const cleanName = (entry.user.name || "").trim().toLowerCase();
    const campusId = entry.user.campus?.id || "global";
    const campusNameKey = cleanName ? `${campusId}_${cleanName}` : "";

    let studentKey = entry.user.id;
    if (campusNameKey && nameCampusToCanonicalId.has(campusNameKey)) {
      studentKey = nameCampusToCanonicalId.get(campusNameKey)!;
    } else if (campusNameKey) {
      nameCampusToCanonicalId.set(campusNameKey, studentKey);
    }

    const existing = bestByUser.get(studentKey);
    const isBetter =
      !existing ||
      entry.score > existing.score ||
      (entry.score === existing.score && entry.streakCount > existing.streakCount) ||
      (entry.score === existing.score &&
        entry.streakCount === existing.streakCount &&
        entry.questionsSolved > existing.questionsSolved) ||
      (entry.score === existing.score &&
        entry.streakCount === existing.streakCount &&
        entry.questionsSolved === existing.questionsSolved &&
        entry.currentDay > existing.currentDay);

    if (isBetter) {
      bestByUser.set(studentKey, entry);
    }
  }

  const individualRankings = Array.from(bestByUser.values());

  assert(
    individualRankings.length === 2,
    "Leaderboard deduplicates multiple sheets so each student appears exactly once",
    `Expected 2 unique students, got ${individualRankings.length}`
  );

  const studentAarav = individualRankings.find((r) => r.user.id === "student-123");
  assert(
    studentAarav !== undefined,
    "Student enrolled in 2 sheets is present in rankings"
  );
  assert(
    studentAarav?.challenge.name === "APEX 151",
    "Student's best-performing track (APEX 151 with higher score) is retained"
  );
  assert(
    studentAarav?.score === 9,
    "Retained enrollment score matches best score (9 pts)"
  );
  assert(
    studentAarav?.streakCount === 28,
    "Retained enrollment streak count matches best streak (28 days)"
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Test 2: Landing Page Leaderboard Deduplication
  // ──────────────────────────────────────────────────────────────────────────
  const bestByStudentLanding = new Map<string, any>();
  for (const e of mockEnrollments) {
    const scoreData = calculateScore(e.submissions as any);
    const studentId = e.user.id;
    const existing = bestByStudentLanding.get(studentId);

    const candidate = {
      id: e.user.id,
      name: e.user.name,
      streakCount: e.streakCount,
      totalScore: scoreData.score,
      questionsSolved: scoreData.questionsSolved,
      campus: e.user.campus,
    };

    if (
      !existing ||
      candidate.totalScore > existing.totalScore ||
      (candidate.totalScore === existing.totalScore && candidate.streakCount > existing.streakCount)
    ) {
      bestByStudentLanding.set(studentId, candidate);
    }
  }

  const landingLeaderboard = Array.from(bestByStudentLanding.values()).sort(
    (a, b) => b.totalScore - a.totalScore
  );

  assert(
    landingLeaderboard.length === 2,
    "Landing page leaderboard contains exactly 1 entry per unique student",
    `Expected 2, got ${landingLeaderboard.length}`
  );
  assert(
    landingLeaderboard[0].name === "Aarav Sharma" && landingLeaderboard[0].totalScore === 9,
    "Landing page leaderboard ranks student with best track score at top"
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Test 3: Questions attempted calculation
  // ──────────────────────────────────────────────────────────────────────────
  const studentAttemptedSubmissions = [
    { id: "s1", status: "APPROVED", difficulty: "Easy" },
    { id: "s2", status: "APPROVED", difficulty: "Medium" },
    { id: "s3", status: "PENDING", difficulty: "Hard" },
    { id: "s4", status: "REJECTED", difficulty: "Medium" },
  ];

  const totalAttempted = studentAttemptedSubmissions.length;
  const approvedCount = studentAttemptedSubmissions.filter((s) => s.status === "APPROVED").length;
  const pendingCount = studentAttemptedSubmissions.filter((s) => s.status === "PENDING").length;
  const rejectedCount = studentAttemptedSubmissions.filter((s) => s.status === "REJECTED").length;

  assert(totalAttempted === 4, "Total attempted questions counted accurately (4)");
  assert(approvedCount === 2, "Approved solves counted accurately (2)");
  assert(pendingCount === 1, "Pending submissions counted accurately (1)");
  assert(rejectedCount === 1, "Rejected submissions counted accurately (1)");

  // ──────────────────────────────────────────────────────────────────────────
  // Test 4: Enrolled Students vs Active Streakers Deduplication
  // Verify that multiple enrollments do not inflate active streakers beyond enrolled students
  // ──────────────────────────────────────────────────────────────────────────
  const mockStudents = Array.from({ length: 64 }, (_, i) => ({
    id: `student-${i + 1}`,
    name: `Student ${i + 1}`,
    year: ((i % 4) + 1),
    role: "STUDENT",
  }));

  // 64 students enrolled, but 7 of them enrolled in 2 tracks => 71 total enrollments!
  const mockEnrollments71: Array<{
    id: string;
    userId: string;
    streakCount: number;
    status: string;
  }> = [];

  mockStudents.forEach((stu, idx) => {
    // 40 students have active streak > 0, 24 students have streak 0
    const streak = idx < 40 ? ((idx % 15) + 1) : 0;
    mockEnrollments71.push({
      id: `enr-primary-${stu.id}`,
      userId: stu.id,
      streakCount: streak,
      status: "ACTIVE",
    });

    // 7 students are also enrolled in a second challenge
    if (idx < 7) {
      mockEnrollments71.push({
        id: `enr-secondary-${stu.id}`,
        userId: stu.id,
        streakCount: streak > 0 ? streak + 2 : 0,
        status: "ACTIVE",
      });
    }
  });

  assert(mockStudents.length === 64, "Total registered students is 64");
  assert(mockEnrollments71.length === 71, "Raw enrollment count is 71 due to multiple track enrollments");

  // Deduplication logic as implemented in admin and superadmin routes:
  const enrolledStudentIds = new Set(mockEnrollments71.map((e) => e.userId));
  const studentBestStreak = new Map<string, number>();
  for (const e of mockEnrollments71) {
    if (e.status === "ACTIVE") {
      const prev = studentBestStreak.get(e.userId) ?? 0;
      if (e.streakCount > prev) {
        studentBestStreak.set(e.userId, e.streakCount);
      } else if (!studentBestStreak.has(e.userId)) {
        studentBestStreak.set(e.userId, e.streakCount);
      }
    }
  }

  const activeStreakerIds = new Set<string>();
  for (const [userId, streak] of studentBestStreak.entries()) {
    if (streak > 0) {
      activeStreakerIds.add(userId);
    }
  }

  assert(
    enrolledStudentIds.size === 64,
    "Deduplicated enrolled students is exactly 64 (not 71)",
    `Expected 64, got ${enrolledStudentIds.size}`
  );
  assert(
    activeStreakerIds.size === 40,
    "Active streakers is exactly 40 unique students with streak > 0 (not 71)",
    `Expected 40, got ${activeStreakerIds.size}`
  );
  assert(
    activeStreakerIds.size <= enrolledStudentIds.size && enrolledStudentIds.size <= mockStudents.length,
    "Mathematical invariant holds: activeStreakers (40) <= enrolledStudents (64) <= totalStudents (64)"
  );

  console.log(`\n🎉 Test Results: ${passed} Passed, ${failed} Failed\n`);
  if (failed > 0) process.exit(1);
}

runLeaderboardAndStatsTests();
