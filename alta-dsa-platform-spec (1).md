# ALTA DSA Challenge Platform — Build Specification

## 0. Context for the coding agent

Build a full-stack web application that replaces manual spreadsheet tracking for two DSA challenge programs run across 10+ college campuses:

- **ALTA APEX 151** — 151-day DSA challenge (Arrays through Segment Trees), open to all students.
- **ALTA BASE 111** — 111-day beginner challenge (variables/loops through intro DSA), for 1st-year students. Completing it unlocks eligibility for APEX 151.

Students solve one problem a day, submit proof (LeetCode/GFG link or screenshot) plus a LinkedIn post link, and build a streak. Campus admins verify submissions. On completing a full sheet, students apply for a verification interview; passing unlocks goodies. Super admins manage everything across all campuses.

Please plan the work as a checklist/task list, build incrementally (schema → auth → student flow → admin flow → super admin flow → leaderboards → polish), write tests for the business logic described in section 4, and use the browser tool to visually verify each role's flow before moving to the next phase.

---

## 1. Recommended tech stack — $0 to run

Design decision driving this: **the LinkedIn post is the proof.** No screenshots are uploaded or stored anywhere in this system — the required daily LinkedIn post (showing the solved problem) *is* the evidence, and LinkedIn hosts that image for free, permanently, as part of the post. Campus admins verify by opening the post link directly. This also removes the entire "is this LeetCode link even viewable" problem — LeetCode submission pages are often private unless a student explicitly generates a shareable link, whereas a public LinkedIn post is guaranteed viewable. Net effect: **no object storage, no image compression pipeline, no thumbnails, no storage cost at all.** This is what makes a genuine $0 stack realistic even at 150,000+ submissions.

- **Framework**: Next.js 14+ (App Router, TypeScript) — one codebase serving the student app and both admin panels via role-gated routes.
- **Hosting**: Vercel **Hobby (free)** tier. Free tier caveat to know: Vercel's Hobby plan terms are meant for personal/non-commercial projects — a college tech club's free student tool is normally fine, but if that ever becomes a concern, Cloudflare Pages' free tier (also generous, no such restriction) is a drop-in-ish alternative with slightly more setup work for Next.js.
- **Database**: PostgreSQL via **Supabase free tier** (500MB DB storage, 5GB bandwidth/month) accessed through Prisma. Since nothing but text/URLs is stored, 500MB is enormous headroom — even 150,000 submission rows at a few hundred bytes each is only tens of MB.
- **Auth**: Supabase Auth (included free) — email/password, optional Google OAuth.
- **Scheduled job** (daily grace-day/streak check): Vercel Cron on the Hobby tier supports one daily-scheduled invocation per cron entry, which is exactly what this needs — no paid job scheduler required.
- **Transactional email** (signup verification, rejection notices): Resend's free tier (3,000 emails/month) is plenty at this scale; Supabase's built-in email works too but is rate-limited on free tier.
- **Styling**: Tailwind CSS + shadcn/ui components.
- **Charts**: Recharts, for admin statistics dashboards.
- **Testing**: Vitest/Jest for business logic (streak, grace day, leaderboard math), Playwright for key end-to-end flows.

Use this stack unless a clearly better-supported alternative exists within the same "single deployable Next.js app + managed free Postgres, no object storage" shape.

---

## 2. User roles

| Role | Scope |
|---|---|
| `student` | Own account and submissions only |
| `campus_admin` | All students and submissions within their assigned campus only |
| `super_admin` | Everything, across all campuses |

A user can hold exactly one role. Campus admins are created by a super admin (not self-signup) and assigned to exactly one campus.

---

## 3. Data model

```
User
  id, name, email, password_hash, role (student|campus_admin|campus_admin_admin*|super_admin)
  campus_id (nullable for super_admin), year (1st/2nd/3rd/4th, nullable for admins)
  created_at

Campus
  id, name, region

Challenge
  id, name ("APEX 151" | "BASE 111"), slug, total_days
  rules (jsonb — see section 4, "Configurable rules engine")
  requires_completed_challenge_id (nullable FK to Challenge — e.g. APEX requires BASE)
  is_active (bool)
  created_by, created_at, updated_at

Problem
  id, challenge_id (FK), day_number (unique per challenge), title, topic, difficulty, external_link
  order within challenge must be gapless 1..total_days

Enrollment
  id, user_id (FK), challenge_id (FK)
  start_date, current_day (int, starts at 1)
  streak_count, longest_streak
  grace_days_used_this_month, grace_days_reset_at (date)
  restart_count
  status: active | broken | completed
  completed_at (nullable)
  UNIQUE(user_id, challenge_id) — a student has one enrollment per challenge, but restart_count tracks retries

Submission
  id, enrollment_id (FK), day_number, problem_id (FK)
  linkedin_post_url (required — this is the proof)
  supporting_link (optional — LeetCode/GFG solution or shareable submission link, plain URL, no storage cost)
  github_link (optional — link to the solution's code/commit/repo, plain URL, no storage cost)
  status: pending | approved | rejected
  reviewed_by (nullable FK to User), reviewed_at, rejection_reason (nullable)
  submitted_at
  UNIQUE(enrollment_id, day_number) — one submission per day, resubmission overwrites while status = rejected

InterviewApplication
  id, user_id, challenge_id, applied_at
  status: queued | scheduled | passed | failed
  scheduled_at (nullable), interviewer_id (nullable FK to User), notes (nullable)

GoodiesClaim
  id, user_id, challenge_id, status: eligible | claimed | shipped
  shipping_name, shipping_address, phone, claimed_at

LinkedInPostTemplate
  id, challenge_id, template_text, required_hashtag, is_active

AuditLog (optional but recommended)
  id, actor_id, action, target_type, target_id, metadata (json), created_at
```

*Note: keep the role enum to exactly `student | campus_admin | super_admin` — the placeholder above was a typo-guard, not a fourth role.*

---

## 4. Configurable rules engine

The whole point of this section: **rules must be editable by a super admin without a code change or redeploy, and the rule text students see must be generated from the exact same values the system enforces — never a separately-written description that can drift out of sync.**

**Design**
- Each `Challenge.rules` is a single JSON object validated against a fixed schema (use Zod). Example shape:

```json
{
  "graceDaysPerMonth": 1,
  "graceDaysResetPolicy": "calendar_month",
  "missedDayAction": "restart_to_day_1",
  "allowOutOfOrderSubmission": false,
  "proofRequired": "linkedin_post",
  "supportingLinkRequired": false,
  "supportingLinkTypes": ["leetcode_gfg", "github"],
  "resubmissionAllowedOnReject": true,
  "streakBreakGraceWindow": false
}
```
- Store this as `jsonb` in Postgres. On every server-side check in section 5 (grace days, missed-day handling, submission requirements), read from `enrollment.challenge.rules` — never hardcode `1` grace day or `restart_to_day_1` anywhere in the business logic code. Business logic functions should take the rules object as a parameter, e.g. `evaluateMissedDay(enrollment, rules)`.
- Changing a rule applies going forward only — do not retroactively recompute a student's past streak history when a super admin edits grace days mid-challenge. Store the rules snapshot that was active at `Enrollment.start_date` alongside the live challenge rules if you want strict fairness across cohorts; a simpler v1 can just apply the current rules to everyone live, with a note in the admin UI that changes affect all active students immediately.
- Super admin UI: a form (not raw JSON editing) with labeled fields — number input for grace days, dropdown for missed-day action, toggles for the rest — that writes into the JSON under the hood. Never ask a non-technical admin to hand-edit JSON.

**Student-facing rules display**
- Build one shared function/component, e.g. `renderRulesAsPlainText(rules, challenge)`, that turns the JSON into a short bullet list in plain language — this is the single source of truth for both the admin's "here's what you're setting" preview and the student's "here's what applies to you" page. For the default example above it should render roughly as:
  - "Solve and submit one problem per day, in order."
  - "You get 1 grace day per month — miss more than that and your streak restarts from Day 1."
  - "Post your solution to LinkedIn and submit that post's link — that's your proof. A LeetCode/GFG link and a GitHub link to your code are both optional and helpful, but the LinkedIn post is what gets verified."
- Show this on: the onboarding/challenge-selection screen (before they commit), a persistent "Rules" link in the student nav, and inline on the submission page as a collapsed "remember the rules" reminder.
- Also show the student's *personal, live* numbers next to the static rules — "You have used 0 of 1 grace days this month," "Current streak: 12 days" — so the abstract rule and their concrete situation are on the same screen.

---

## 5. Business logic (write unit tests for all of this)

**Streak & grace days** (all thresholds below come from `challenge.rules`, never hardcoded)
- A student can submit for `current_day` only, in order, unless `rules.allowOutOfOrderSubmission` is true — no skipping ahead, no batch-submitting past days.
- On approval of day N: `current_day += 1`, `streak_count += 1`, `longest_streak = max(longest_streak, streak_count)`.
- If a calendar day passes with no submission:
  - If `grace_days_used_this_month < rules.graceDaysPerMonth`: increment `grace_days_used_this_month`, streak is preserved, `current_day` does not advance for the missed day (they simply submit today's problem next).
  - Else, act according to `rules.missedDayAction` (e.g. `restart_to_day_1`, or a future gentler option like `pause_streak_only`): the default `restart_to_day_1` sets `status = 'broken'`, `current_day` resets to 1, `streak_count` resets to 0, `restart_count += 1`. Submission history is kept for stats, not deleted, regardless of which action is configured.
- `grace_days_used_this_month` resets to 0 according to `rules.graceDaysResetPolicy` (default: start of each calendar month, tracked via `grace_days_reset_at`).
- Run this check via a daily scheduled job (cron/Vercel Cron), not on-request only — a student who doesn't open the app on a missed day must still be marked correctly the next time anyone views their record.
- Write this as a pure function `evaluateMissedDay(enrollment, rules, today) → nextEnrollmentState` so it's directly unit-testable against different rule configs without touching the database.

**Submission**
- Requires `linkedin_post_url` — this is mandatory and is the sole proof reviewed by admins. `supporting_link` (LeetCode/GFG) and `github_link` (code/commit/repo) are both optional and shown to the admin as helpful extras, never required, unless a super admin flips `rules.supportingLinkRequired` to true for a given challenge (in which case at least one of the two must be filled).
- Validate the LinkedIn URL is a real `linkedin.com` URL (format check only — do not attempt to scrape or verify post content server-side; that's the campus admin's manual job, done by opening the link).
- New submissions start `status = pending`.
- A `rejected` submission for the current day can be resubmitted; a new submission overwrites the rejected one for that day (don't accumulate duplicate rows).
- Nothing about this flow requires storing or serving an image anywhere in the system — the campus admin's review UI is just "open this link, check it matches the template and shows today's problem, approve or reject."

**Verification (campus admin)**
- Campus admins see a queue filtered to `campus_id = their campus AND status = pending`, oldest first.
- Approve → triggers the streak logic above. Reject → requires a `rejection_reason`, notifies the student, day does not advance.
- Campus admins cannot see or act on submissions from other campuses (enforce at the query/authorization layer, not just hidden in the UI).

**Leaderboards**
- Compute from approved submissions only. Three views, all filterable by challenge (APEX/BASE):
  - **Overall** — all students, ranked by (in order) completed days, then current streak, then earliest completion date as tiebreaker.
  - **Campus-wise** — same ranking, grouped/filtered by campus; also show an aggregate campus score (e.g. sum or average of member progress) for a campus-vs-campus view.
  - **Year-wise** — same ranking, filtered by year.
- Cache/recompute leaderboards on a short interval (e.g. every few minutes) rather than live-querying on every page load if the student count per campus grows large — flag this as a perf consideration but a live query is fine for an initial version.

**Completion → interview → goodies**
- When `current_day > total_days` (i.e. the last day was approved), set enrollment `status = completed`, `completed_at = now()`.
- Completing BASE 111 sets an eligibility flag that unlocks enrollment in APEX 151 (`requires_completed_challenge_id` check).
- On completion, show an "Apply for interview" action to the student — creates an `InterviewApplication` with `status = queued`.
- Super admin queue shows all queued applications across campuses; scheduling sets `status = scheduled` with a date/time and interviewer; after the interview the admin marks `passed` or `failed`.
- `passed` unlocks a "Claim goodies" action for the student, creating a `GoodiesClaim` with `status = eligible`; student fills shipping details, which the admin can then progress to `claimed` → `shipped`.

**LinkedIn post templates**
- Super admin can create/edit a required post format per challenge (e.g. required hashtag, suggested caption text). Show this template to students on the submission screen so they know what to post. Campus admins use it as their checklist when verifying — this is guidance for the human reviewer, not something the system parses automatically.

---

## 6. Feature list by role

### Student
- Sign up (name, email, password, campus, year) → email verification optional but recommended
- Choose a challenge (APEX 151 / BASE 111, respecting the completion prerequisite) — rules for that challenge shown plainly before they commit
- Dedicated "Rules" page: plain-language rules generated from the live config (section 4), plus their own current numbers (grace days used/remaining, streak, restart count)
- Dashboard: current day, streak flame, grace days remaining this month, GitHub-style contribution heatmap of submission history
- Daily submission form: shows today's problem (title/topic/difficulty/link), LinkedIn post URL field (required), optional LeetCode/GFG link and optional GitHub link fields, shows the required post template/hashtag so they know what to post
- View own submission history with statuses (pending/approved/rejected + rejection reason)
- View all three leaderboards (overall, campus-wise, year-wise), can see own rank highlighted
- On completion: apply for interview, track application status, claim goodies once passed

### Campus admin
- Login scoped to their campus
- Verification queue: pending submissions for their campus, showing the LinkedIn post link and any optional supporting/GitHub links, one-click approve/reject with reason
- Campus dashboard: active students, completion rate, average streak, broken-streak count, recent activity
- View campus leaderboard

### Super admin
- Full CRUD on Challenges (create/edit/archive/delete, set total days, grace days/month)
- Full CRUD on Problems within a challenge (add/edit/reorder/delete days)
- Manage LinkedIn post templates per challenge
- Manage campuses and assign/create campus admin accounts
- Org-wide statistics dashboard: enrollments, completions, drop-off/restart rates, per-campus comparison charts, per-year comparison charts
- View and act on every submission across every campus (superset of campus admin's queue)
- Interview application queue: schedule, assign interviewer, record pass/fail
- Goodies claim management: view eligible/claimed/shipped, update shipping status
- Audit log view (who approved/rejected/edited what, if implemented)

---

## 7. Key pages/routes (App Router suggestion)

```
/                          marketing/landing + login/signup
/onboarding                campus + year + challenge selection (first login)
/rules                     plain-language rules for the student's active challenge
/dashboard                 student home
/dashboard/submit          today's submission form
/dashboard/history         past submissions
/leaderboard               overall / campus / year tabs
/dashboard/interview        interview application status
/dashboard/goodies          goodies claim form/status

/admin                      campus admin home (redirect by role)
/admin/queue                 verification queue
/admin/stats                 campus stats

/superadmin                  super admin home
/superadmin/challenges        CRUD challenges + problems
/superadmin/campuses           manage campuses & admins
/superadmin/templates            LinkedIn post templates
/superadmin/stats                  org-wide statistics
/superadmin/interviews               interview queue & scheduling
/superadmin/goodies                    goodies fulfillment
/superadmin/submissions                  global submission view
```

Role-based middleware should redirect users to their correct home and block cross-role/cross-campus access at the route level, not just hide nav links.

---

## 8. Non-functional requirements

- Mobile-responsive throughout — most students will use this on a phone.
- All list views (queues, leaderboards, stats) must be paginated — do not assume small data volumes; design for 10+ campuses × hundreds of students each.
- Authorization checks belong in the API/server layer, not just the UI — a campus admin must be structurally unable to fetch another campus's data via a crafted request.
- Seed script for local development: a few campuses, a couple of challenges with a handful of problems each, and demo users for all three roles, so the agent (and future developers) can log in and test each flow immediately.

---

## 9. Scale: 1,000+ students, free-tier limits

Because no images are ever uploaded or stored (section 1), the "150 images per student" concern mostly disappears — a LinkedIn post costs nothing to record, it's just a URL string. What's left to manage at 1,000+ students is keeping everything else inside free-tier ceilings:

**Database (Supabase free: 500MB storage, 5GB bandwidth/month)**
- At ~150,000 submission rows (URLs + metadata only, no binary data), total table size lands in the tens of MB — comfortably within the 500MB cap with huge room to grow.
- Bandwidth is the more relevant limit: keep API responses lean (paginate everything, never return full submission history in one payload) so 1,000 daily-active students don't approach the 5GB/month ceiling. This is a standard "paginate + select only needed columns" practice, not a special accommodation.
- Index `Submission` on `(enrollment_id, day_number)` and on whatever the verification queue filters by (`status`, campus via join) — the queue and leaderboard are the two hottest queries.

**Hosting (Vercel Hobby free tier)**
- 100GB bandwidth/month and generous serverless function invocation limits on Hobby are far more than a text-only app for ~1,000 users needs. The daily cron job is a single lightweight invocation.
- If usage ever does approach a free-tier ceiling (unlikely at this scale but worth knowing), the next step is Vercel Pro (~$20/month) — not a rebuild, just a plan upgrade.

**Precompute, don't live-aggregate**
- Compute leaderboard rankings on the scheduled daily job rather than aggregating rows on every page load once there's real data volume — cheap either way here, but it's good practice and avoids ever needing to think about it again as things grow.

**Admin review load**
- Since verification is "click a LinkedIn link and look at it," the queue UI itself is lightweight (a list of links + metadata, no media rendering) — this also means campus admins can review from any device without waiting on image loads.

Net result: with the LinkedIn-post-only proof model, this application should run entirely on free tiers indefinitely at this scale, with the only realistic future cost being a Vercel Pro upgrade if bandwidth ever becomes a genuine constraint — and even that's optional, not required.

---

## 10. Suggested build phases

1. Schema (Prisma) + auth + role-based routing skeleton, including `Challenge.rules` jsonb + Zod schema
2. Super admin: challenge/problem CRUD with the rules form (section 4) — needed before anything else can be tested end to end
3. Student flow: signup → enroll → rules page → daily submission (LinkedIn post link + optional supporting link — no upload pipeline needed)
4. Campus admin: verification queue (link-based list, opens LinkedIn post in new tab) + campus stats
5. Streak/grace-day/restart scheduled job (reading from `rules`, unit-tested against multiple configs) + leaderboard computation
6. Interview application + goodies claim flow
7. Super admin statistics dashboard + LinkedIn templates + audit log
8. Polish: mobile responsiveness pass, empty states, error states, seed data (~1,000 fake students helps catch pagination/perf issues early), README with setup instructions
