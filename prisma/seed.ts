import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_RULES = {
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

async function main() {
  console.log("🌱 Seeding database...\n");

  // ─── Campuses ───────────────────────────────────────────────────────────
  const campuses = await Promise.all([
    prisma.campus.upsert({
      where: { name: "SAGE University" },
      update: {},
      create: { name: "SAGE University", region: "Indore, Madhya Pradesh" },
    }),
    prisma.campus.upsert({
      where: { name: "ADYPU" },
      update: {},
      create: { name: "ADYPU", region: "Pune, Maharashtra" },
    }),
    prisma.campus.upsert({
      where: { name: "IITM" },
      update: {},
      create: { name: "IITM", region: "Delhi NCR" },
    }),
    prisma.campus.upsert({
      where: { name: "VGU" },
      update: {},
      create: { name: "VGU", region: "Jaipur, Rajasthan" },
    }),
    prisma.campus.upsert({
      where: { name: "DRK Institute" },
      update: {},
      create: { name: "DRK Institute", region: "Hyderabad, Telangana" },
    }),
  ]);

  console.log(`✅ Created ${campuses.length} campuses`);

  // ─── Challenges ─────────────────────────────────────────────────────────
  const baseChallenge = await prisma.challenge.upsert({
    where: { slug: "base-111" },
    update: {},
    create: {
      name: "BASE 111",
      slug: "base-111",
      totalDays: 111,
      rules: DEFAULT_RULES,
      isActive: true,
    },
  });

  const apexChallenge = await prisma.challenge.upsert({
    where: { slug: "apex-151" },
    update: {},
    create: {
      name: "APEX 151",
      slug: "apex-151",
      totalDays: 151,
      rules: DEFAULT_RULES,
      requiresCompletedChallengeId: baseChallenge.id,
      isActive: true,
    },
  });

  console.log(`✅ Created 2 challenges: BASE 111, APEX 151`);

  // ─── Problems (10 sample problems per challenge) ────────────────────────

  const baseProblems = [
    { dayNumber: 1, title: "Two Sum", topic: "Arrays", difficulty: "Easy", externalLink: "https://leetcode.com/problems/two-sum/" },
    { dayNumber: 2, title: "Reverse String", topic: "Strings", difficulty: "Easy", externalLink: "https://leetcode.com/problems/reverse-string/" },
    { dayNumber: 3, title: "FizzBuzz", topic: "Loops", difficulty: "Easy", externalLink: "https://leetcode.com/problems/fizz-buzz/" },
    { dayNumber: 4, title: "Palindrome Number", topic: "Math", difficulty: "Easy", externalLink: "https://leetcode.com/problems/palindrome-number/" },
    { dayNumber: 5, title: "Roman to Integer", topic: "Strings", difficulty: "Easy", externalLink: "https://leetcode.com/problems/roman-to-integer/" },
    { dayNumber: 6, title: "Valid Parentheses", topic: "Stacks", difficulty: "Easy", externalLink: "https://leetcode.com/problems/valid-parentheses/" },
    { dayNumber: 7, title: "Merge Two Sorted Lists", topic: "Linked Lists", difficulty: "Easy", externalLink: "https://leetcode.com/problems/merge-two-sorted-lists/" },
    { dayNumber: 8, title: "Best Time to Buy and Sell Stock", topic: "Arrays", difficulty: "Easy", externalLink: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" },
    { dayNumber: 9, title: "Maximum Subarray", topic: "Arrays", difficulty: "Medium", externalLink: "https://leetcode.com/problems/maximum-subarray/" },
    { dayNumber: 10, title: "Binary Search", topic: "Searching", difficulty: "Easy", externalLink: "https://leetcode.com/problems/binary-search/" },
  ];

  const apexProblems = [
    { dayNumber: 1, title: "Container With Most Water", topic: "Arrays", difficulty: "Medium", externalLink: "https://leetcode.com/problems/container-with-most-water/" },
    { dayNumber: 2, title: "3Sum", topic: "Arrays", difficulty: "Medium", externalLink: "https://leetcode.com/problems/3sum/" },
    { dayNumber: 3, title: "Longest Substring Without Repeating Characters", topic: "Sliding Window", difficulty: "Medium", externalLink: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
    { dayNumber: 4, title: "Longest Palindromic Substring", topic: "Dynamic Programming", difficulty: "Medium", externalLink: "https://leetcode.com/problems/longest-palindromic-substring/" },
    { dayNumber: 5, title: "Merge Intervals", topic: "Intervals", difficulty: "Medium", externalLink: "https://leetcode.com/problems/merge-intervals/" },
    { dayNumber: 6, title: "Group Anagrams", topic: "Hash Maps", difficulty: "Medium", externalLink: "https://leetcode.com/problems/group-anagrams/" },
    { dayNumber: 7, title: "Course Schedule", topic: "Graphs", difficulty: "Medium", externalLink: "https://leetcode.com/problems/course-schedule/" },
    { dayNumber: 8, title: "Number of Islands", topic: "Graphs", difficulty: "Medium", externalLink: "https://leetcode.com/problems/number-of-islands/" },
    { dayNumber: 9, title: "Word Break", topic: "Dynamic Programming", difficulty: "Medium", externalLink: "https://leetcode.com/problems/word-break/" },
    { dayNumber: 10, title: "LRU Cache", topic: "Design", difficulty: "Medium", externalLink: "https://leetcode.com/problems/lru-cache/" },
  ];

  for (const problem of baseProblems) {
    await prisma.problem.upsert({
      where: {
        challengeId_dayNumber: {
          challengeId: baseChallenge.id,
          dayNumber: problem.dayNumber,
        },
      },
      update: {},
      create: { ...problem, challengeId: baseChallenge.id },
    });
  }

  for (const problem of apexProblems) {
    await prisma.problem.upsert({
      where: {
        challengeId_dayNumber: {
          challengeId: apexChallenge.id,
          dayNumber: problem.dayNumber,
        },
      },
      update: {},
      create: { ...problem, challengeId: apexChallenge.id },
    });
  }

  console.log(`✅ Created ${baseProblems.length + apexProblems.length} problems`);

  // ─── Users ──────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 12);

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@alta.org" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@alta.org",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  // Campus Admins for partner campuses
  const campusAdmin1 = await prisma.user.upsert({
    where: { email: "admin.sage@alta.org" },
    update: {},
    create: {
      name: "Prof. Rahul Sharma",
      email: "admin.sage@alta.org",
      passwordHash,
      role: "CAMPUS_ADMIN",
      campusId: campuses[0].id, // SAGE University
    },
  });

  const campusAdmin2 = await prisma.user.upsert({
    where: { email: "admin.adypu@alta.org" },
    update: {},
    create: {
      name: "Dr. Priya Kulkarni",
      email: "admin.adypu@alta.org",
      passwordHash,
      role: "CAMPUS_ADMIN",
      campusId: campuses[1].id, // ADYPU
    },
  });

  // Students across official campuses
  const students = await Promise.all([
    prisma.user.upsert({
      where: { email: "student1@iitd.ac.in" },
      update: { campusId: campuses[0].id, year: 2 },
      create: {
        name: "Arjun Patel",
        email: "student1@iitd.ac.in",
        passwordHash,
        role: "STUDENT",
        campusId: campuses[0].id, // SAGE University
        year: 2,
      },
    }),
    prisma.user.upsert({
      where: { email: "student2@nitt.ac.in" },
      update: { campusId: campuses[1].id, year: 1 },
      create: {
        name: "Sneha Kulkarni",
        email: "student2@nitt.ac.in",
        passwordHash,
        role: "STUDENT",
        campusId: campuses[1].id, // ADYPU
        year: 1,
      },
    }),
    prisma.user.upsert({
      where: { email: "student3@bits.ac.in" },
      update: { campusId: campuses[2].id, year: 3 },
      create: {
        name: "Vikram Malhotra",
        email: "student3@bits.ac.in",
        passwordHash,
        role: "STUDENT",
        campusId: campuses[2].id, // IITM
        year: 3,
      },
    }),
    prisma.user.upsert({
      where: { email: "ananya.vgu@alta.org" },
      update: { campusId: campuses[3].id, year: 4 },
      create: {
        name: "Ananya Sharma",
        email: "ananya.vgu@alta.org",
        passwordHash,
        role: "STUDENT",
        campusId: campuses[3].id, // VGU
        year: 4,
      },
    }),
    prisma.user.upsert({
      where: { email: "karthik.drk@alta.org" },
      update: { campusId: campuses[4].id, year: 3 },
      create: {
        name: "Karthik Varma",
        email: "karthik.drk@alta.org",
        passwordHash,
        role: "STUDENT",
        campusId: campuses[4].id, // DRK Institute
        year: 3,
      },
    }),
  ]);

  console.log(`✅ Created ${3 + students.length} users across the 5 partner campuses`);

  // ─── LinkedIn Post Templates ────────────────────────────────────────────
  await prisma.linkedInPostTemplate.upsert({
    where: { id: "template-base-default" },
    update: {},
    create: {
      id: "template-base-default",
      challengeId: baseChallenge.id,
      templateText:
        "🚀 Day {day_number}/111 of the ALTA BASE 111 Challenge!\n\nToday I solved: {problem_title}\nTopic: {topic}\nDifficulty: {difficulty}\n\nKey learnings:\n• [Your key takeaway here]\n\n#ALTABASE111 #DSA #CodingChallenge #LeetCode",
      requiredHashtag: "#ALTABASE111",
      isActive: true,
    },
  });

  await prisma.linkedInPostTemplate.upsert({
    where: { id: "template-apex-default" },
    update: {},
    create: {
      id: "template-apex-default",
      challengeId: apexChallenge.id,
      templateText:
        "🔥 Day {day_number}/151 of the ALTA APEX 151 Challenge!\n\nToday I solved: {problem_title}\nTopic: {topic}\nDifficulty: {difficulty}\n\nApproach:\n• [Your approach here]\n\nTime Complexity: O(?)\nSpace Complexity: O(?)\n\n#ALTAAPEX151 #DSA #CodingChallenge #LeetCode",
      requiredHashtag: "#ALTAAPEX151",
      isActive: true,
    },
  });

  console.log(`✅ Created 2 LinkedIn post templates`);

  // ─── Summary ────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(50));
  console.log("🎉 Seed complete! Demo accounts:\n");
  console.log("Super Admin:   admin@alta.org / password123");
  console.log("Campus Admin:  admin.iitd@alta.org / password123");
  console.log("Campus Admin:  admin.nitt@alta.org / password123");
  console.log("Student:       student1@iitd.ac.in / password123");
  console.log("Student:       student2@nitt.ac.in / password123");
  console.log("Student:       student3@bits.ac.in / password123");
  console.log("─".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
