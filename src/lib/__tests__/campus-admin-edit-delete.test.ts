import { prisma } from "../prisma";
import { hashPassword, verifyPassword } from "../auth";

async function runCampusAdminEditDeleteTests() {
  console.log("🧪 Starting Campus Admin Edit & Delete Integration Tests...\n");
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

  try {
    // 1. Setup a dedicated test campus
    const uniqueSuffix = Date.now();
    await prisma.user.deleteMany({
      where: { email: { contains: "lifecycle.admin" } },
    });
    await prisma.campus.deleteMany({
      where: { name: { contains: "Test Institute of Technology - Admin Lifecycle" } },
    });

    const testCampus = await prisma.campus.create({
      data: {
        name: `Test Institute of Technology - Admin Lifecycle ${uniqueSuffix}`,
        region: "Test Region",
      },
    });
    assert(!!testCampus.id, "Test campus created successfully");

    // 2. Create a campus admin initially assigned to Year 1
    const initialPassword = "initialPassword123";
    const passwordHash = await hashPassword(initialPassword);
    const testAdmin = await prisma.user.create({
      data: {
        email: "lifecycle.admin@testcampus.edu",
        name: "Prof. Lifecycle Admin",
        passwordHash,
        role: "CAMPUS_ADMIN",
        campusId: testCampus.id,
        year: 1,
      },
    });
    assert(testAdmin.role === "CAMPUS_ADMIN", "Admin created with CAMPUS_ADMIN role");
    assert(testAdmin.year === 1, "Admin initially assigned to Year 1 cohort");

    // 3. Simulate EDIT: Change name, change year cohort to Year 3, reset password
    const newPassword = "newSecurePassword456";
    const newPasswordHash = await hashPassword(newPassword);

    const updatedAdmin = await prisma.user.update({
      where: { id: testAdmin.id },
      data: {
        name: "Prof. Lifecycle Admin (Promoted to Y3)",
        year: 3,
        passwordHash: newPasswordHash,
      },
    });

    assert(
      updatedAdmin.name === "Prof. Lifecycle Admin (Promoted to Y3)",
      "Admin name updated to new name"
    );
    assert(updatedAdmin.year === 3, "Admin year cohort successfully changed to Year 3");

    const isOldPwValid = await verifyPassword(initialPassword, updatedAdmin.passwordHash);
    const isNewPwValid = await verifyPassword(newPassword, updatedAdmin.passwordHash);
    assert(!isOldPwValid, "Old password rejected after update");
    assert(isNewPwValid, "New password authenticated successfully");

    // 4. Simulate EDIT: Switch from Year 3 to ALL YEARS (year = null)
    const allYearsAdmin = await prisma.user.update({
      where: { id: testAdmin.id },
      data: {
        year: null,
      },
    });
    assert(allYearsAdmin.year === null, "Admin cohort updated to All Years (null)");

    // 5. Test Foreign Key Resilience: Create a student and a reviewed submission
    const testStudent = await prisma.user.create({
      data: {
        email: `student.lifecycle.${uniqueSuffix}@testcampus.edu`,
        name: "Test Student Lifecycle",
        passwordHash,
        role: "STUDENT",
        campusId: testCampus.id,
        year: 2,
      },
    });

    const activeChallenge = await prisma.challenge.findFirst({
      where: { isActive: true },
    });

    let testSubmission: any = null;
    let testEnrollment: any = null;
    if (activeChallenge) {
      testEnrollment = await prisma.enrollment.create({
        data: {
          userId: testStudent.id,
          challengeId: activeChallenge.id,
          currentDay: 1,
          streakCount: 1,
          longestStreak: 1,
        },
      });

      const testProblem = await prisma.problem.findFirst({
        where: { challengeId: activeChallenge.id, dayNumber: 1 },
      });

      if (!testProblem) throw new Error("No problem found for day 1");

      testSubmission = await prisma.submission.create({
        data: {
          enrollmentId: testEnrollment.id,
          problemId: testProblem.id,
          dayNumber: 1,
          linkedinPostUrl: "https://linkedin.com/feed/update/urn:li:activity:9999999999",
          status: "APPROVED",
          reviewedById: testAdmin.id,
          reviewedAt: new Date(),
        },
      });
      assert(testSubmission.reviewedById === testAdmin.id, "Submission reviewed by test admin");
    }

    // 6. DELETE Admin using the exact transaction logic implemented in the DELETE API route
    await prisma.$transaction([
      prisma.submission.updateMany({
        where: { reviewedById: testAdmin.id },
        data: { reviewedById: null },
      }),
      prisma.interviewApplication.updateMany({
        where: { interviewerId: testAdmin.id },
        data: { interviewerId: null },
      }),
      prisma.auditLog.deleteMany({
        where: { actorId: testAdmin.id },
      }),
      prisma.user.delete({
        where: { id: testAdmin.id },
      }),
    ]);

    // 7. Verify admin deletion and foreign key integrity
    const deletedAdminCheck = await prisma.user.findUnique({
      where: { id: testAdmin.id },
    });
    assert(deletedAdminCheck === null, "Admin user deleted cleanly from database");

    if (testSubmission) {
      const updatedSubmission = await prisma.submission.findUnique({
        where: { id: testSubmission.id },
      });
      assert(
        updatedSubmission?.reviewedById === null,
        "Submission reviewedById safely set to null without data corruption"
      );
      assert(
        updatedSubmission?.status === "APPROVED",
        "Submission approved status preserved after admin removal"
      );
    }

    // 8. Clean up test student, submission, enrollment, and campus
    if (testSubmission) {
      await prisma.submission.delete({ where: { id: testSubmission.id } });
    }
    if (testEnrollment) {
      await prisma.enrollment.delete({ where: { id: testEnrollment.id } });
    }
    await prisma.user.delete({ where: { id: testStudent.id } });
    await prisma.campus.delete({ where: { id: testCampus.id } });
    console.log("🧹 Test cleanup completed successfully.");

  } catch (error) {
    console.error("❌ Exception during test:", error);
    failed++;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runCampusAdminEditDeleteTests()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
