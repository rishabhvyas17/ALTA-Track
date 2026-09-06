import { PrismaClient, Role, EnrollmentStatus, SubmissionStatus, GoodiesStatus, InterviewStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FIRST_NAMES = [
  "Aarav", "Aditi", "Akash", "Ananya", "Aryan", "Bhavya", "Chetan", "Dev", "Divya", "Esha",
  "Farhan", "Gaurav", "Harsh", "Isha", "Ishaan", "Jay", "Kabir", "Kavya", "Kunal", "Meera",
  "Mohit", "Neha", "Nikhil", "Pooja", "Pranav", "Priya", "Rahul", "Rhea", "Rohan", "Roshni",
  "Sachin", "Sameer", "Sanya", "Shivani", "Siddharth", "Sneha", "Tanvi", "Tarun", "Utkarsh", "Varun",
  "Vikram", "Yash", "Zoya", "Manish", "Karthik", "Abhishek", "Deepak", "Swati", "Tanya", "Aditya"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Patel", "Mehta", "Joshi", "Iyer", "Nair", "Reddy", "Rao",
  "Kumar", "Singh", "Das", "Banerjee", "Chatterjee", "Mishra", "Pandey", "Chauhan", "Bhatia", "Kapoor",
  "Malhotra", "Saxena", "Choudhury", "Bose", "Ghosh", "Deshmukh", "Kulkarni", "Patil", "Pawar", "Shinde",
  "Bhardwaj", "Agarwal", "Jain", "Bansal", "Garg", "Goyal", "Tripathi", "Dubey", "Tiwari", "Shukla"
];

async function seed200Students() {
  console.log("🚀 Seeding 200 Students with RealisticDSA Challenge Progress...\n");

  const startTime = Date.now();

  // 1. Fetch campuses and BASE 111 challenge
  const campuses = await prisma.campus.findMany({
    orderBy: { name: "asc" },
  });

  if (campuses.length === 0) {
    throw new Error("No campuses found! Run prisma/seed.ts first.");
  }

  const baseChallenge = await prisma.challenge.findFirst({
    where: { slug: "base-111" },
    include: {
      problems: {
        orderBy: { dayNumber: "asc" },
      },
    },
  });

  if (!baseChallenge || baseChallenge.problems.length === 0) {
    throw new Error("BASE 111 challenge with problems not found!");
  }

  console.log(`📍 Found ${campuses.length} Campuses: ${campuses.map(c => c.name).join(", ")}`);
  console.log(`🎯 Target Challenge: ${baseChallenge.name} with ${baseChallenge.problems.length} problems\n`);

  // 2. Pre-hash password once for rapid bulk creation
  const passwordHash = await bcrypt.hash("password123", 10);

  // 3. Generate 200 Students
  let createdCount = 0;
  const problemsByDay = new Map(baseChallenge.problems.map(p => [p.dayNumber, p]));

  for (let i = 1; i <= 200; i++) {
    const firstName = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor((i - 1) / FIRST_NAMES.length) % LAST_NAMES.length];
    const name = `${firstName} ${lastName} (${i})`;
    const email = `student${i}.dsa@alta.edu`;
    const campus = campuses[(i - 1) % campuses.length];
    const year = ((i - 1) % 4) + 1; // Exactly 50 students in Year 1, 50 in Year 2, 50 in Year 3, 50 in Year 4

    // Upsert student user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        campusId: campus.id,
        year,
      },
      create: {
        name,
        email,
        passwordHash,
        role: "STUDENT",
        campusId: campus.id,
        year,
      },
    });

    // Determine realistic streak & progress
    // Distribution:
    // 15% top streakers (streak 25 - 45)
    // 35% solid performers (streak 12 - 24)
    // 35% early/mid cohort (streak 5 - 11)
    // 15% newcomers (streak 1 - 4)
    let streakCount: number;
    const tierRand = (i * 17) % 100;
    if (tierRand < 15) {
      streakCount = 25 + ((i * 7) % 20); // 25 to 44
    } else if (tierRand < 50) {
      streakCount = 12 + ((i * 5) % 13); // 12 to 24
    } else if (tierRand < 85) {
      streakCount = 5 + ((i * 3) % 7); // 5 to 11
    } else {
      streakCount = 1 + ((i * 2) % 4); // 1 to 4
    }

    const currentDay = streakCount + 1;

    // Upsert enrollment
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_challengeId: {
          userId: user.id,
          challengeId: baseChallenge.id,
        },
      },
      update: {
        streakCount,
        longestStreak: streakCount,
        currentDay,
        status: "ACTIVE",
        graceDaysUsedThisMonth: (i % 3 === 0) ? 1 : 0,
      },
      create: {
        userId: user.id,
        challengeId: baseChallenge.id,
        streakCount,
        longestStreak: streakCount,
        currentDay,
        status: "ACTIVE",
        graceDaysUsedThisMonth: (i % 3 === 0) ? 1 : 0,
        graceDaysResetAt: new Date(),
      },
    });

    // Create submissions for solved days (1 to streakCount)
    // Avoid re-creating if already exists
    for (let day = 1; day <= Math.min(streakCount, 45); day++) {
      const problem = problemsByDay.get(day);
      if (!problem) continue;

      const subDate = new Date();
      subDate.setDate(subDate.getDate() - (streakCount - day));

      // 90% APPROVED, 5% PENDING, 5% REJECTED
      let status: SubmissionStatus = "APPROVED";
      if (day === streakCount && i % 4 === 0) {
        status = "PENDING";
      } else if (day === streakCount - 1 && i % 15 === 0) {
        status = "REJECTED";
      }

      await prisma.submission.upsert({
        where: {
          enrollmentId_dayNumber: {
            enrollmentId: enrollment.id,
            dayNumber: day,
          },
        },
        update: {
          status,
        },
        create: {
          enrollmentId: enrollment.id,
          dayNumber: day,
          problemId: problem.id,
          status,
          submittedAt: subDate,
          reviewedAt: status === "APPROVED" ? subDate : null,
          linkedinPostUrl: `https://www.linkedin.com/posts/student${i}-day${day}-alta-dsa-solves`,
          githubLink: `https://github.com/student${i}/alta-dsa-track/blob/main/solutions/day${day}.py`,
          supportingLink: problem.externalLink,
        },
      });
    }

    // Goodies claims for eligible students (streak >= 30)
    if (streakCount >= 30) {
      const existingClaim = await prisma.goodiesClaim.findFirst({
        where: {
          userId: user.id,
          challengeId: baseChallenge.id,
        },
      });

      if (!existingClaim) {
        await prisma.goodiesClaim.create({
          data: {
            userId: user.id,
            challengeId: baseChallenge.id,
            shippingName: user.name,
            shippingAddress: `Room ${100 + (i % 400)}, Student Residence Hall, Campus Hostel`,
            phone: `98765${String(10000 + i).slice(0, 5)}`,
            status: i % 2 === 0 ? "CLAIMED" : "SHIPPED",
            claimedAt: new Date(Date.now() - 86400000 * 3),
          },
        });
      }
    }

    // Mock interview applications for students with streak >= 25
    if (streakCount >= 25) {
      const existingInterview = await prisma.interviewApplication.findFirst({
        where: {
          userId: user.id,
          challengeId: baseChallenge.id,
        },
      });

      if (!existingInterview) {
        await prisma.interviewApplication.create({
          data: {
            userId: user.id,
            challengeId: baseChallenge.id,
            notes: `Candidate has solved ${streakCount} consecutive problems. High algorithmic proficiency.`,
            status: i % 3 === 0 ? "SCHEDULED" : i % 3 === 1 ? "PASSED" : "QUEUED",
            scheduledAt: i % 3 === 0 ? new Date(Date.now() + 86400000 * 2) : null,
          },
        });
      }
    }

    createdCount++;
    if (createdCount % 25 === 0) {
      console.log(`  Processed ${createdCount} / 200 students...`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 Successfully Seeded & Enrolled 200 Students in ${elapsed}s!`);
}

seed200Students()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
