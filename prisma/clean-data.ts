import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanData() {
  console.log("🧹 Starting Complete Database Cleanup of Mock / Fake Data...\n");

  try {
    // 1. Delete all student submissions
    const deletedSubmissions = await prisma.submission.deleteMany({});
    console.log(`✅ Deleted ${deletedSubmissions.count} fake submissions`);

    // 2. Delete all goodies claims
    const deletedClaims = await prisma.goodiesClaim.deleteMany({});
    console.log(`✅ Deleted ${deletedClaims.count} goodies claims`);

    // 3. Delete all interview applications
    const deletedInterviews = await prisma.interviewApplication.deleteMany({});
    console.log(`✅ Deleted ${deletedInterviews.count} interview applications`);

    // 4. Delete all student enrollments
    const deletedEnrollments = await prisma.enrollment.deleteMany({});
    console.log(`✅ Deleted ${deletedEnrollments.count} enrollments`);

    // 5. Delete all audit logs
    const deletedLogs = await prisma.auditLog.deleteMany({});
    console.log(`✅ Deleted ${deletedLogs.count} audit logs`);

    // 6. Delete all students
    const deletedStudents = await prisma.user.deleteMany({
      where: { role: "STUDENT" },
    });
    console.log(`✅ Deleted ${deletedStudents.count} fake student accounts`);

    // 7. Delete non-standard test challenges (keep only base-111 and apex-151)
    const testChallenges = await prisma.challenge.findMany({
      where: {
        slug: {
          notIn: ["base-111", "apex-151"],
        },
      },
    });

    for (const challenge of testChallenges) {
      // delete problems for this challenge
      await prisma.problem.deleteMany({
        where: { challengeId: challenge.id },
      });
      // delete templates
      await prisma.linkedInPostTemplate.deleteMany({
        where: { challengeId: challenge.id },
      });
      // delete challenge
      await prisma.challenge.delete({
        where: { id: challenge.id },
      });
      console.log(`✅ Removed test challenge: ${challenge.name} (${challenge.slug})`);
    }

    // 8. Clean up temporary test campus admins
    const deletedTempAdmins = await prisma.user.deleteMany({
      where: {
        role: "CAMPUS_ADMIN",
        OR: [
          { email: { contains: "testcampus.edu" } },
          { email: { contains: "lifecycle.admin" } },
          { email: { contains: "student2@" } },
        ],
      },
    });
    if (deletedTempAdmins.count > 0) {
      console.log(`✅ Cleaned up ${deletedTempAdmins.count} temporary test campus admin accounts`);
    }

    // 9. Check remaining counts
    const remainingUsers = await prisma.user.count();
    const remainingStudents = await prisma.user.count({ where: { role: "STUDENT" } });
    const remainingAdmins = await prisma.user.count({ where: { role: "CAMPUS_ADMIN" } });
    const remainingSuperAdmins = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    const remainingCampuses = await prisma.campus.count();
    const remainingChallenges = await prisma.challenge.count();

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Database Successfully Purged & Ready for Real Data!");
    console.log(`- Campuses: ${remainingCampuses}`);
    console.log(`- Official Challenges: ${remainingChallenges} (BASE 111 & APEX 151)`);
    console.log(`- Super Admins: ${remainingSuperAdmins}`);
    console.log(`- Campus Admins: ${remainingAdmins}`);
    console.log(`- Students: ${remainingStudents} (Clean 0)`);
    console.log(`- Submissions: 0 (Clean)`);
    console.log(`- Enrollments: 0 (Clean)`);
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanData();
