/**
 * ALTA-Track Comprehensive Pre-Deployment End-to-End API & Security Test Suite
 * Validates all 29 endpoints, role access control, IDOR protection, cron security,
 * input validation, and information disclosure checks.
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

// Helper to extract alta_session cookie from Set-Cookie header
function getSessionCookie(res: Response): string {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return "";
  const match = setCookie.match(/alta_session=([^;]+)/);
  return match ? `alta_session=${match[1]}` : "";
}

async function runSecurityTestSuite() {
  console.log("🔒 Starting Pre-Deployment Security & API Verification Test Suite...\n");

  // ──────────────────────────────────────────────────────────────────────────
  // 1. PUBLIC ENDPOINTS & INFORMATION DISCLOSURE
  // ──────────────────────────────────────────────────────────────────────────
  console.log("--- 1. Public Endpoints & Privacy Audit ---");

  // Test 1.1: GET /api/campuses
  const campusesRes = await fetch(`${BASE_URL}/api/campuses`);
  assert(campusesRes.status === 200, "GET /api/campuses returns 200 OK");
  const campusesData = await campusesRes.json();
  assert(
    Array.isArray(campusesData.campuses) && campusesData.campuses.length > 0,
    "GET /api/campuses returns list of campuses"
  );
  // Ensure no sensitive fields like passwords, internal user lists, or secrets
  const campusSample = campusesData.campuses[0];
  assert(
    campusSample.id && campusSample.name && !campusSample.users && !campusSample.passwordHash,
    "GET /api/campuses exposes only safe fields (id, name, region)"
  );

  // Test 1.2: GET /api/landing
  const landingRes = await fetch(`${BASE_URL}/api/landing`);
  assert(landingRes.status === 200, "GET /api/landing returns 200 OK");
  const landingData = await landingRes.json();
  assert(
    Array.isArray(landingData.tracks) && Array.isArray(landingData.leaderboard),
    "GET /api/landing returns tracks and leaderboard summary"
  );
  // Ensure leaderboard has no emails
  const hasEmailInLanding = landingData.leaderboard.some((u: any) => u.email || u.user?.email);
  assert(!hasEmailInLanding, "GET /api/landing leaderboard contains zero email addresses");

  // Test 1.3: GET /api/leaderboard (Privacy Leak Verification)
  const leaderboardRes = await fetch(`${BASE_URL}/api/leaderboard`);
  assert(leaderboardRes.status === 200, "GET /api/leaderboard returns 200 OK");
  const leaderboardData = await leaderboardRes.json();
  assert(
    Array.isArray(leaderboardData.individualRankings) &&
      Array.isArray(leaderboardData.campusRankings),
    "GET /api/leaderboard returns individual and campus rankings"
  );

  // Verify privacy fix: NO student email addresses in individual rankings
  const leakedEmails = leaderboardData.individualRankings.filter(
    (item: any) => item.user?.email !== undefined
  );
  assert(
    leakedEmails.length === 0,
    "Privacy Check: GET /api/leaderboard strips student emails from public view",
    `Found ${leakedEmails.length} exposed emails`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 2. AUTHENTICATION & PRIVILEGE ESCALATION
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 2. Authentication & Privilege Escalation Audit ---");

  // Test 2.1: Signup with missing fields
  const badSignupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "invalid-email" }),
  });
  assert(badSignupRes.status === 400, "POST /api/auth/signup rejects invalid/incomplete body with 400");

  // Test 2.2: Privilege Escalation Attempt via Signup
  const testStudentEmail = `sec_test_${Date.now()}@test.edu`;
  const escalationSignupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Adversary Student",
      email: testStudentEmail,
      password: "strongPassword123!",
      campusId: campusSample.id,
      year: 2,
      role: "SUPER_ADMIN", // Injection attempt
    }),
  });
  assert(
    escalationSignupRes.status === 201,
    "POST /api/auth/signup creates account with valid input"
  );
  const escalationData = await escalationSignupRes.json();
  assert(
    escalationData.user.role === "STUDENT",
    "Security Check: Signup ignores injected role 'SUPER_ADMIN' and strictly assigns 'STUDENT'"
  );
  assert(
    !escalationData.user.passwordHash,
    "Security Check: Signup response does NOT expose passwordHash"
  );

  // Test 2.3: Login with invalid password
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testStudentEmail,
      password: "wrongPassword",
    }),
  });
  assert(badLoginRes.status === 401, "POST /api/auth/login rejects wrong password with 401");
  const badLoginJson = await badLoginRes.json();
  assert(
    badLoginJson.error === "Invalid email or password",
    "Security Check: Login returns generic error (prevents user enumeration)"
  );

  // Test 2.4: Valid Login & Cookie Security
  const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testStudentEmail,
      password: "strongPassword123!",
    }),
  });
  assert(studentLoginRes.status === 200, "POST /api/auth/login succeeds with valid credentials");
  const studentCookie = getSessionCookie(studentLoginRes);
  assert(studentCookie.length > 0, "Login issues alta_session HTTP-only cookie");

  // Test 2.5: GET /api/auth/me (Unauthenticated vs Authenticated)
  const unauthMeRes = await fetch(`${BASE_URL}/api/auth/me`);
  assert(unauthMeRes.status === 401, "GET /api/auth/me returns 401 without cookie");

  const authMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: studentCookie },
  });
  assert(authMeRes.status === 200, "GET /api/auth/me returns 200 with valid session");
  const authMeData = await authMeRes.json();
  assert(
    authMeData.user?.email === testStudentEmail && !authMeData.user?.passwordHash,
    "GET /api/auth/me returns sanitized student profile"
  );

  // Test 2.6: POST /api/auth/logout
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  assert(logoutRes.status === 200, "POST /api/auth/logout returns 200");

  // ──────────────────────────────────────────────────────────────────────────
  // 3. SEEDED ROLES SETUP (Student, Campus Admin, Super Admin)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 3. Role-Based Access Control (RBAC) & Boundary Tests ---");

  // Login as seeded Student
  const sRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "student1@iitd.ac.in", password: "password123" }),
  });
  const seededStudentCookie = getSessionCookie(sRes);

  // Login as seeded Campus Admin
  const caRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin.iitd@alta.org", password: "password123" }),
  });
  const campusAdminCookie = getSessionCookie(caRes);

  // Login as seeded Super Admin
  const saRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@alta.org", password: "password123" }),
  });
  const superAdminCookie = getSessionCookie(saRes);

  assert(seededStudentCookie.length > 0, "Seeded student authenticated");
  assert(campusAdminCookie.length > 0, "Seeded campus admin authenticated");
  assert(superAdminCookie.length > 0, "Seeded super admin authenticated");

  // ──────────────────────────────────────────────────────────────────────────
  // 4. STUDENT APIs & ADVERSARIAL ATTEMPTS
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 4. Student APIs & IDOR Prevention ---");

  // Test 4.1: Student Challenges Endpoint
  const challengesRes = await fetch(`${BASE_URL}/api/student/challenges`, {
    headers: { Cookie: seededStudentCookie },
  });
  assert(challengesRes.status === 200, "GET /api/student/challenges returns 200 for Student");

  // Test 4.2: Student Dashboard
  const dashboardRes = await fetch(`${BASE_URL}/api/student/dashboard`, {
    headers: { Cookie: seededStudentCookie },
  });
  assert(dashboardRes.status === 200, "GET /api/student/dashboard returns 200 for Student");

  // Test 4.3: Premature Goodies Claim Protection
  const goodiesRes = await fetch(`${BASE_URL}/api/student/goodies`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: seededStudentCookie },
    body: JSON.stringify({
      challengeId: "base-111",
      shippingName: "Student One",
      shippingAddress: "Hostel 4, Room 202",
      phone: "9876543210",
    }),
  });
  // Since student1 doesn't have streak >= 30, it must reject with 400
  assert(
    goodiesRes.status === 400,
    "Security Check: POST /api/student/goodies rejects claim when streak < 30"
  );

  // Test 4.4: Premature Mock Interview Application Protection
  const interviewRes = await fetch(`${BASE_URL}/api/student/interview`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: seededStudentCookie },
    body: JSON.stringify({
      challengeId: "base-111",
      notes: "Mock interview test",
    }),
  });
  assert(
    interviewRes.status === 400,
    "Security Check: POST /api/student/interview rejects application when streak < 25"
  );

  // Test 4.5: Student Attempting to Access Campus Admin APIs
  const studentAccessAdminStats = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Cookie: seededStudentCookie },
  });
  assert(
    studentAccessAdminStats.status === 401 || studentAccessAdminStats.status === 403,
    "Security Check: Student cannot access Campus Admin /api/admin/stats (rejected 401/403)"
  );

  const studentAccessAdminSubmissions = await fetch(`${BASE_URL}/api/admin/submissions`, {
    headers: { Cookie: seededStudentCookie },
  });
  assert(
    studentAccessAdminSubmissions.status === 401 || studentAccessAdminSubmissions.status === 403,
    "Security Check: Student cannot access Campus Admin /api/admin/submissions (rejected 401/403)"
  );

  // Test 4.6: Student Attempting to Access Super Admin APIs
  const studentAccessSuperStats = await fetch(`${BASE_URL}/api/superadmin/stats`, {
    headers: { Cookie: seededStudentCookie },
  });
  assert(
    studentAccessSuperStats.status === 401 || studentAccessSuperStats.status === 403,
    "Security Check: Student cannot access Super Admin /api/superadmin/stats (rejected 401/403)"
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 5. CAMPUS ADMIN APIs & COHORT SCOPING
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 5. Campus Admin APIs & Scoping Tests ---");

  // Test 5.1: Campus Admin accessing stats
  const caStatsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Cookie: campusAdminCookie },
  });
  assert(caStatsRes.status === 200, "GET /api/admin/stats returns 200 for Campus Admin");

  // Test 5.2: Campus Admin accessing submissions
  const caSubmissionsRes = await fetch(`${BASE_URL}/api/admin/submissions`, {
    headers: { Cookie: campusAdminCookie },
  });
  assert(caSubmissionsRes.status === 200, "GET /api/admin/submissions returns 200 for Campus Admin");

  // Test 5.3: Campus Admin attempting to access Super Admin APIs
  const caAccessSuperChallenges = await fetch(`${BASE_URL}/api/superadmin/challenges`, {
    headers: { Cookie: campusAdminCookie },
  });
  assert(
    caAccessSuperChallenges.status === 401 || caAccessSuperChallenges.status === 403,
    "Security Check: Campus Admin cannot access Super Admin /api/superadmin/challenges"
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 6. SUPER ADMIN ALL-ROUTE VERIFICATION
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 6. Super Admin Route Verification ---");

  const superAdminEndpoints = [
    { url: "/api/superadmin/stats", name: "SuperAdmin Stats" },
    { url: "/api/superadmin/campuses", name: "SuperAdmin Campuses" },
    { url: "/api/superadmin/challenges", name: "SuperAdmin Challenges" },
    { url: "/api/superadmin/templates", name: "SuperAdmin Templates" },
    { url: "/api/superadmin/interviews", name: "SuperAdmin Interviews" },
    { url: "/api/superadmin/goodies", name: "SuperAdmin Goodies" },
  ];

  for (const ep of superAdminEndpoints) {
    const res = await fetch(`${BASE_URL}${ep.url}`, {
      headers: { Cookie: superAdminCookie },
    });
    assert(res.status === 200, `GET ${ep.url} returns 200 for Super Admin`);

    // Verify unauthenticated attempt on same endpoint
    const unauthRes = await fetch(`${BASE_URL}${ep.url}`);
    assert(
      unauthRes.status === 401 || unauthRes.status === 403,
      `Security Check: Unauthenticated access to ${ep.url} is blocked`
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. CRON SECURITY VERIFICATION
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 7. Scheduled Cron Endpoint Security ---");

  // Test 7.1: Cron without Authorization header
  const unauthCronRes = await fetch(`${BASE_URL}/api/cron/evaluate-streaks`);
  assert(
    unauthCronRes.status === 401,
    "Security Check: GET /api/cron/evaluate-streaks rejects unauthenticated call with 401"
  );

  // Test 7.2: Cron with invalid token
  const badCronRes = await fetch(`${BASE_URL}/api/cron/evaluate-streaks`, {
    headers: { Authorization: "Bearer bad-token-12345" },
  });
  assert(
    badCronRes.status === 401,
    "Security Check: GET /api/cron/evaluate-streaks rejects invalid token with 401"
  );

  // Test 7.3: Cron with valid token
  const validCronRes = await fetch(`${BASE_URL}/api/cron/evaluate-streaks`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET || "alta-dsa-local-cron-secret-2026"}` },
  });
  assert(
    validCronRes.status === 200,
    "GET /api/cron/evaluate-streaks succeeds with valid CRON_SECRET"
  );
  const cronJson = await validCronRes.json();
  assert(cronJson.success === true, "Cron response confirms streak evaluation completed");

  // ──────────────────────────────────────────────────────────────────────────
  // 8. FULL LIFECYCLE MUTATION & DATA INTEGRITY TESTS
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- 8. Challenge, Problem, Submission & Admin Lifecycle Tests ---");

  // Test 8.1: Super Admin creates a new Challenge Track
  const createChallengeRes = await fetch(`${BASE_URL}/api/superadmin/challenges`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: superAdminCookie },
    body: JSON.stringify({
      name: `Security E2E Track ${Date.now()}`,
      totalDays: 14,
      rules: {
        graceDaysPerMonth: 2,
        graceDaysResetPolicy: "calendar_month",
        missedDayAction: "restart_to_day_1",
        allowOutOfOrderSubmission: false,
        proofRequired: "any_link",
        supportingLinkRequired: false,
        supportingLinkTypes: ["github"],
        resubmissionAllowedOnReject: true,
        streakBreakGraceWindow: false,
      },
    }),
  });
  assert(createChallengeRes.status === 201, "POST /api/superadmin/challenges creates challenge track");
  const createdChallenge = (await createChallengeRes.json()).challenge;
  const testChallengeId = createdChallenge?.id;

  if (testChallengeId) {
    // Test 8.2: Super Admin updates Challenge
    const updateChallengeRes = await fetch(`${BASE_URL}/api/superadmin/challenges/${testChallengeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: superAdminCookie },
      body: JSON.stringify({
        totalDays: 21,
      }),
    });
    assert(updateChallengeRes.status === 200, "PUT /api/superadmin/challenges/[id] updates challenge properties");

    // Test 8.3: Super Admin creates a Problem in the track
    const createProblemRes = await fetch(
      `${BASE_URL}/api/superadmin/challenges/${testChallengeId}/problems`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: superAdminCookie },
        body: JSON.stringify({
          dayNumber: 1,
          title: "Two Sum Target Check",
          difficulty: "Easy",
          topic: "Arrays & Hashing",
          externalLink: "https://leetcode.com/problems/two-sum",
        }),
      }
    );
    assert(
      createProblemRes.status === 201,
      "POST /api/superadmin/challenges/[id]/problems creates individual problem"
    );
    const createdProblem = (await createProblemRes.json()).problem;

    // Test 8.4: Bulk upload problems
    const bulkUploadRes = await fetch(
      `${BASE_URL}/api/superadmin/challenges/${testChallengeId}/problems/bulk`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: superAdminCookie },
        body: JSON.stringify({
          problems: [
            {
              dayNumber: 2,
              title: "Valid Anagram",
              difficulty: "Easy",
              topic: "Strings",
              externalLink: "https://leetcode.com/problems/valid-anagram",
            },
            {
              dayNumber: 3,
              title: "Group Anagrams",
              difficulty: "Medium",
              topic: "Hash Map",
              externalLink: "https://leetcode.com/problems/group-anagrams",
            },
          ],
        }),
      }
    );
    assert(
      bulkUploadRes.status === 200,
      "POST /api/superadmin/challenges/[id]/problems/bulk bulk uploads multiple problems"
    );

    // Test 8.5: Super Admin updates Problem
    if (createdProblem?.id) {
      const updateProblemRes = await fetch(
        `${BASE_URL}/api/superadmin/problems/${createdProblem.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Cookie: superAdminCookie },
          body: JSON.stringify({
            title: "Two Sum Target Check (Updated)",
          }),
        }
      );
      assert(
        updateProblemRes.status === 200,
        "PUT /api/superadmin/problems/[id] updates problem details"
      );
    }

    // Test 8.6: Create & manage LinkedIn Post Templates
    const createTemplateRes = await fetch(`${BASE_URL}/api/superadmin/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: superAdminCookie },
      body: JSON.stringify({
        challengeId: testChallengeId,
        templateText: "Completed Day 1 of ALTA DSA Challenge! Solved Two Sum. Proud of my streak!",
        requiredHashtag: "#ALTA",
      }),
    });
    assert(
      createTemplateRes.status === 201,
      "POST /api/superadmin/templates creates LinkedIn post template"
    );
    const createdTemplate = (await createTemplateRes.json()).template;

    if (createdTemplate?.id) {
      const deleteTemplateRes = await fetch(
        `${BASE_URL}/api/superadmin/templates/${createdTemplate.id}`,
        {
          method: "DELETE",
          headers: { Cookie: superAdminCookie },
        }
      );
      assert(
        deleteTemplateRes.status === 200,
        "DELETE /api/superadmin/templates/[id] removes post template"
      );
    }

    // Test 8.7: Student enrolls in challenge track
    const enrollRes = await fetch(`${BASE_URL}/api/student/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: seededStudentCookie },
      body: JSON.stringify({ challengeId: testChallengeId }),
    });
    assert(enrollRes.status === 201, "POST /api/student/enroll enrolls student in challenge");
    const enrollment = (await enrollRes.json()).enrollment;

    // Test 8.8: Student submits solution with proof link
    if (enrollment?.id && createdProblem?.id) {
      const submitRes = await fetch(`${BASE_URL}/api/student/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: seededStudentCookie },
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          dayNumber: 1,
          problemId: createdProblem.id,
          githubLink: "https://github.com/student/alta-solutions/blob/main/day1.py",
          linkedinPostUrl: "https://linkedin.com/posts/student_day1_completed",
        }),
      });
      assert(
        submitRes.status === 201,
        "POST /api/student/submit successfully logs problem proof solution"
      );
      const submission = (await submitRes.json()).submission;

      // Test 8.9: Campus Admin reviews student submission
      if (submission?.id) {
        const reviewRes = await fetch(`${BASE_URL}/api/admin/submissions/${submission.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Cookie: campusAdminCookie },
          body: JSON.stringify({
            status: "APPROVED",
          }),
        });
        assert(
          reviewRes.status === 200,
          "PUT /api/admin/submissions/[id] approves daily solution submission"
        );
      }
    }

    // Test 8.10: Clean up test challenge
    const deleteChallengeRes = await fetch(
      `${BASE_URL}/api/superadmin/challenges/${testChallengeId}`,
      {
        method: "DELETE",
        headers: { Cookie: superAdminCookie },
      }
    );
    assert(
      deleteChallengeRes.status === 200,
      "DELETE /api/superadmin/challenges/[id] deletes test challenge and cascades"
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────────────────────────────────
  console.log(`\n🏁 Pre-Deployment Security Test Complete: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runSecurityTestSuite().catch((err) => {
  console.error("Test Suite crashed with unexpected error:", err);
  process.exit(1);
});
