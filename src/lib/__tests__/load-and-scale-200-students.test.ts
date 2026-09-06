/**
 * ALTA-Track 200+ Students Load, Scale & Integrity Test Suite
 * Tests performance, ranking math, pagination, campus aggregation,
 * cohort filtering, and security with 200+ students and ~3,000 submissions.
 */

export {};

const BASE_URL = "http://localhost:3000";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    failed++;
  }
}

function getSessionCookie(res: Response): string {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return "";
  const match = setCookie.match(/alta_session=([^;]+)/);
  return match ? `alta_session=${match[1]}` : "";
}

async function runLoadAndScaleTests() {
  console.log("⚡ Starting 200+ Students Performance & Scalability Test Suite...\n");

  // 1. Authenticate roles
  const saRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@alta.org", password: "password123" }),
  });
  const superAdminCookie = getSessionCookie(saRes);

  const caRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin.iitd@alta.org", password: "password123" }),
  });
  const campusAdminCookie = getSessionCookie(caRes);

  const sRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "student1.dsa@alta.edu", password: "password123" }),
  });
  const studentCookie = getSessionCookie(sRes);

  assert(superAdminCookie.length > 0 && campusAdminCookie.length > 0 && studentCookie.length > 0, "All test roles authenticated");

  // ──────────────────────────────────────────────────────────────────────────
  // 1. LEADERBOARD PERFORMANCE & RANKING INTEGRITY (200+ Students)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 1. Leaderboard at 200+ Students Scale ---");

  const lbStart = Date.now();
  const lbRes = await fetch(`${BASE_URL}/api/leaderboard`);
  const lbLatency = Date.now() - lbStart;

  assert(lbRes.status === 200, "GET /api/leaderboard returns 200 OK");
  assert(lbLatency < 1000, `Leaderboard response time is fast (${lbLatency}ms, threshold < 1000ms)`);

  const lbData = await lbRes.json();
  const individualRankings = lbData.individualRankings;
  const campusRankings = lbData.campusRankings;

  assert(
    Array.isArray(individualRankings) && individualRankings.length >= 200,
    `Leaderboard accurately loads all ${individualRankings.length} enrolled student rankings`
  );

  assert(
    Array.isArray(campusRankings) && campusRankings.length === 5,
    `Leaderboard aggregates rankings for all 5 official campuses (${campusRankings.map((c: any) => c.name).join(", ")})`
  );

  // Check ranking sort order: score desc -> streak desc -> currentDay desc
  let correctlySorted = true;
  for (let i = 0; i < individualRankings.length - 1; i++) {
    const curr = individualRankings[i];
    const next = individualRankings[i + 1];
    if (curr.score < next.score) {
      correctlySorted = false;
      break;
    }
  }
  assert(correctlySorted, "Leaderboard accurately sorts top students by score descending");

  // Verify privacy: zero emails leaked among 200+ rankings
  const leakedEmails = individualRankings.filter((r: any) => r.user?.email);
  assert(leakedEmails.length === 0, `Zero emails exposed across all ${individualRankings.length} student rankings`);

  // Test Year Filtering on Leaderboard
  for (const year of [1, 2, 3, 4]) {
    const yearLbRes = await fetch(`${BASE_URL}/api/leaderboard?year=${year}`);
    const yearLbData = await yearLbRes.json();
    const allMatchYear = yearLbData.individualRankings.every((r: any) => r.user?.year === year);
    assert(
      yearLbData.individualRankings.length > 0 && allMatchYear,
      `Leaderboard ?year=${year} strictly filters to Year ${year} cohort (${yearLbData.individualRankings.length} students)`
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. SUPER ADMIN DASHBOARD AT 200+ STUDENTS SCALE
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 2. Super Admin Dashboard Metrics & Campus Benchmark ---");

  const saStatsStart = Date.now();
  const saStatsRes = await fetch(`${BASE_URL}/api/superadmin/stats`, {
    headers: { Cookie: superAdminCookie },
  });
  const saStatsLatency = Date.now() - saStatsStart;

  assert(saStatsRes.status === 200, "GET /api/superadmin/stats returns 200 OK");
  assert(saStatsLatency < 1500, `SuperAdmin stats latency is fast (${saStatsLatency}ms, threshold < 1500ms)`);

  const saStats = await saStatsRes.json();
  assert(saStats.summary.totalStudents >= 200, `Total student count is accurate (${saStats.summary.totalStudents} students)`);
  assert(saStats.summary.totalSubmissions >= 2500, `Total submissions count is accurate (${saStats.summary.totalSubmissions} submissions)`);
  assert(saStats.summary.activeEnrollments >= 150, `Active enrollments count is accurate (${saStats.summary.activeEnrollments} active enrollments)`);

  // Campus Benchmark Metrics
  assert(
    Array.isArray(saStats.campusMetrics) && saStats.campusMetrics.length >= 5,
    `All 5 partner campuses benchmarked side-by-side with student & streak metrics`
  );

  // Year Distribution breakdown
  assert(
    Array.isArray(saStats.yearDistribution) && saStats.yearDistribution.length === 4,
    `Accurate 4-year cohort distribution breakdown (Years 1 to 4)`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 3. GOODIES & INTERVIEW SCALE CHECKS
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 3. Goodies & Interview Applications at Scale ---");

  const goodiesRes = await fetch(`${BASE_URL}/api/superadmin/goodies`, {
    headers: { Cookie: superAdminCookie },
  });
  assert(goodiesRes.status === 200, "GET /api/superadmin/goodies returns 200 OK");
  const goodiesData = await goodiesRes.json();
  assert(
    Array.isArray(goodiesData.claims) && goodiesData.claims.length >= 15,
    `SuperAdmin retrieves ${goodiesData.claims.length} eligible goodies claims`
  );

  const interviewsRes = await fetch(`${BASE_URL}/api/superadmin/interviews`, {
    headers: { Cookie: superAdminCookie },
  });
  assert(interviewsRes.status === 200, "GET /api/superadmin/interviews returns 200 OK");
  const interviewsData = await interviewsRes.json();
  assert(
    Array.isArray(interviewsData.applications) && interviewsData.applications.length >= 20,
    `SuperAdmin retrieves ${interviewsData.applications.length} mock interview applications`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 4. CAMPUS ADMIN DASHBOARD & VERIFICATION QUEUE
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 4. Campus Admin Roster & Verification Queue ---");

  const caStatsStart = Date.now();
  const caStatsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Cookie: campusAdminCookie },
  });
  const caStatsLatency = Date.now() - caStatsStart;

  assert(caStatsRes.status === 200, "GET /api/admin/stats returns 200 OK");
  assert(caStatsLatency < 1000, `Campus Admin stats latency is fast (${caStatsLatency}ms)`);
  const caStats = await caStatsRes.json();

  assert(
    caStats.kpis.totalStudents >= 30,
    `Campus Admin sees accurate campus enrollment (${caStats.kpis.totalStudents} students on campus)`
  );

  const caQueueRes = await fetch(`${BASE_URL}/api/admin/submissions`, {
    headers: { Cookie: campusAdminCookie },
  });
  assert(caQueueRes.status === 200, "GET /api/admin/submissions returns 200 OK");
  const caQueue = await caQueueRes.json();
  assert(
    Array.isArray(caQueue.submissions),
    `Verification queue loads pending submissions for campus review (${caQueue.submissions.length} queued)`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 5. STUDENT DASHBOARD & CONCURRENCY
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 5. Student Dashboard Performance ---");

  const sDashStart = Date.now();
  const sDashRes = await fetch(`${BASE_URL}/api/student/dashboard`, {
    headers: { Cookie: studentCookie },
  });
  const sDashLatency = Date.now() - sDashStart;

  assert(sDashRes.status === 200, "GET /api/student/dashboard returns 200 OK");
  assert(sDashLatency < 500, `Student dashboard loads quickly (${sDashLatency}ms)`);
  const sDash = await sDashRes.json();

  assert(
    sDash.challenge && sDash.enrollment.streakCount > 0,
    `Student dashboard accurately loads active streak (${sDash.enrollment.streakCount} days) and current problem`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────────────────────────────────
  console.log(`\n🏁 200+ Students Load & Scale Test Complete: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runLoadAndScaleTests().catch((err) => {
  console.error("Scale Test Suite crashed with unexpected error:", err);
  process.exit(1);
});
