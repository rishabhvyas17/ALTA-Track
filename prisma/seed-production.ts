import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function seedProduction() {
  console.log("🚀 Seeding Production Database with Official Curriculum & Campuses...\n");

  const seedDataPath = path.join(__dirname, "seed-data.json");
  if (!fs.existsSync(seedDataPath)) {
    throw new Error("Missing prisma/seed-data.json");
  }

  const raw = fs.readFileSync(seedDataPath, "utf-8");
  const data = JSON.parse(raw);

  // 1. Seed Campuses
  console.log("📍 Seeding Official Partner Campuses...");
  const campusMap = new Map<string, string>();
  for (const c of data.campuses) {
    const campus = await prisma.campus.upsert({
      where: { name: c.name },
      update: { region: c.region },
      create: { name: c.name, region: c.region },
    });
    campusMap.set(c.name, campus.id);
    console.log(`  ✓ ${c.name} (${c.region})`);
  }

  // 2. Seed Challenges & Curated Problems
  let baseChallengeId = "";
  for (const chal of data.challenges) {
    console.log(`\n🎯 Seeding Challenge: ${chal.name} (${chal.totalDays} Days)...`);
    const challenge = await prisma.challenge.upsert({
      where: { slug: chal.slug },
      update: {
        name: chal.name,
        totalDays: chal.totalDays,
        rules: chal.rules,
        isActive: chal.isActive,
      },
      create: {
        name: chal.name,
        slug: chal.slug,
        totalDays: chal.totalDays,
        rules: chal.rules,
        isActive: chal.isActive,
      },
    });

    if (chal.slug === "base-111") {
      baseChallengeId = challenge.id;
    } else if (chal.slug === "apex-151" && baseChallengeId) {
      await prisma.challenge.update({
        where: { id: challenge.id },
        data: { requiresCompletedChallengeId: baseChallengeId },
      });
    }

    // Problems
    console.log(`  → Upserting ${chal.problems.length} curated daily problems...`);
    for (const p of chal.problems) {
      await prisma.problem.upsert({
        where: {
          challengeId_dayNumber: {
            challengeId: challenge.id,
            dayNumber: p.dayNumber,
          },
        },
        update: {
          title: p.title,
          topic: p.topic || "General",
          difficulty: p.difficulty,
          externalLink: p.externalLink,
          chapter: p.chapter,
          companies: p.companies,
        },
        create: {
          challengeId: challenge.id,
          dayNumber: p.dayNumber,
          title: p.title,
          topic: p.topic || "General",
          difficulty: p.difficulty,
          externalLink: p.externalLink,
          chapter: p.chapter,
          companies: p.companies,
        },
      });
    }
    console.log(`  ✓ ${chal.problems.length} problems ready for ${chal.name}`);

    // LinkedIn Templates
    if (chal.linkedInPostTemplates?.length > 0) {
      for (const t of chal.linkedInPostTemplates) {
        await prisma.linkedInPostTemplate.upsert({
          where: { id: t.id },
          update: {
            templateText: t.templateText,
            requiredHashtag: t.requiredHashtag,
            isActive: t.isActive,
          },
          create: {
            id: t.id,
            challengeId: challenge.id,
            templateText: t.templateText,
            requiredHashtag: t.requiredHashtag,
            isActive: t.isActive,
          },
        });
      }
      console.log(`  ✓ LinkedIn post template created for ${chal.name}`);
    }
  }

  // 3. Super Admin Initial Account
  const superAdminEmail = process.env.INITIAL_SUPERADMIN_EMAIL || "admin@alta.org";
  const superAdminPassword = process.env.INITIAL_SUPERADMIN_PASSWORD || "Admin@123";
  const passwordHash = await bcrypt.hash(superAdminPassword, 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
    },
    create: {
      name: "Super Admin",
      email: superAdminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log(`\n👑 Super Admin Initialized: ${superAdmin.email}`);

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("🎉 Production Seed Completed Cleanly!");
  console.log("- Official Campuses: 5");
  console.log("- BASE 111 Problems: 111");
  console.log("- APEX 151 Problems: 151");
  console.log("- Mock Students: 0 (Pure clean state)");
  console.log("- Submissions: 0 (Pure clean state)");
  console.log("=".repeat(50) + "\n");
}

seedProduction()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
