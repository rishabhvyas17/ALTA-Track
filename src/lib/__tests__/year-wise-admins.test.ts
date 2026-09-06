import { prisma } from "../prisma";

// Mock/test the scoping rules implemented in admin submissions and stats
function canAdminReviewSubmission(
  admin: { role: string; campusId: string | null; year: number | null },
  student: { campusId: string | null; year: number }
): { allowed: boolean; reason?: string } {
  if (admin.role === "SUPER_ADMIN") {
    return { allowed: true };
  }

  if (admin.role !== "CAMPUS_ADMIN") {
    return { allowed: false, reason: "Insufficient permissions" };
  }

  if (!admin.campusId || admin.campusId !== student.campusId) {
    return { allowed: false, reason: "Cannot review submissions from another campus" };
  }

  if (admin.year !== null && admin.year !== undefined && admin.year !== student.year) {
    return {
      allowed: false,
      reason: `Assigned as Year ${admin.year} Campus Coordinator; cannot review Year ${student.year} students`,
    };
  }

  return { allowed: true };
}

function buildSubmissionsQueryWhere(admin: {
  role: string;
  campusId: string | null;
  year: number | null;
}) {
  if (admin.role === "SUPER_ADMIN") {
    return {};
  }
  return {
    user: {
      campusId: admin.campusId,
      ...(admin.year ? { year: admin.year } : {}),
    },
  };
}

async function runYearWiseAdminTests() {
  console.log("🧪 Running Year-Wise Campus Admin Logic Unit Tests...\n");
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

  const campusAlpha = "campus-alpha-id";
  const campusBeta = "campus-beta-id";

  const adminYear2 = {
    id: "admin-y2",
    role: "CAMPUS_ADMIN",
    campusId: campusAlpha,
    year: 2,
  };

  const adminAllYears = {
    id: "admin-all",
    role: "CAMPUS_ADMIN",
    campusId: campusAlpha,
    year: null,
  };

  const studentYear2 = { campusId: campusAlpha, year: 2 };
  const studentYear3 = { campusId: campusAlpha, year: 3 };
  const studentYear1 = { campusId: campusAlpha, year: 1 };
  const studentOtherCampusY2 = { campusId: campusBeta, year: 2 };

  // Test 1: Year 2 Admin review authorization for Year 2 student
  const r1 = canAdminReviewSubmission(adminYear2, studentYear2);
  assert(r1.allowed === true, "Year 2 Campus Admin CAN review Year 2 student");

  // Test 2: Year 2 Admin review authorization for Year 3 student
  const r2 = canAdminReviewSubmission(adminYear2, studentYear3);
  assert(r2.allowed === false, "Year 2 Campus Admin CANNOT review Year 3 student (rejected)");

  // Test 3: Year 2 Admin review authorization for Year 1 student
  const r3 = canAdminReviewSubmission(adminYear2, studentYear1);
  assert(r3.allowed === false, "Year 2 Campus Admin CANNOT review Year 1 student (rejected)");

  // Test 4: Year 2 Admin review authorization for student from different campus
  const r4 = canAdminReviewSubmission(adminYear2, studentOtherCampusY2);
  assert(r4.allowed === false, "Campus Admin CANNOT review students from different campus even if same year");

  // Test 5: All Years Admin review authorization across all years on campus
  const r5_y1 = canAdminReviewSubmission(adminAllYears, studentYear1);
  const r5_y2 = canAdminReviewSubmission(adminAllYears, studentYear2);
  const r5_y3 = canAdminReviewSubmission(adminAllYears, studentYear3);
  assert(
    r5_y1.allowed && r5_y2.allowed && r5_y3.allowed,
    "All-Years Campus Admin CAN review Year 1, 2, and 3 students on their campus"
  );

  // Test 6: Query filter for Year 2 Admin scopes user.year = 2
  const qY2 = buildSubmissionsQueryWhere(adminYear2);
  assert(
    "user" in qY2 && qY2.user?.campusId === campusAlpha && qY2.user?.year === 2,
    "Submissions query for Year 2 admin strictly scopes { campusId, year: 2 }"
  );

  // Test 7: Query filter for All-Years Admin does NOT constrain year
  const qAll = buildSubmissionsQueryWhere(adminAllYears);
  assert(
    "user" in qAll && qAll.user?.campusId === campusAlpha && (qAll.user as any)?.year === undefined,
    "Submissions query for All-Years admin scopes campusId without restricting year"
  );

  // Test 8: Super Admin bypasses campus and year constraints
  const superAdmin = { role: "SUPER_ADMIN", campusId: null, year: null };
  const rSuper = canAdminReviewSubmission(superAdmin, studentOtherCampusY2);
  assert(rSuper.allowed === true, "SUPER_ADMIN can review any student across any campus and year");

  console.log(`\n🎉 Test Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runYearWiseAdminTests();
