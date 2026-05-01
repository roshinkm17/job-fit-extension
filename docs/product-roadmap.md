# RoleGauge Product Development Roadmap

## Product Direction

RoleGauge should evolve from a LinkedIn job-fit extension into a job-search command center: score jobs, save them, understand fit, prepare outreach, track applications, and improve the user's search over time.

The positioning should stay simple: RoleGauge helps job seekers stop guessing which jobs are worth applying to.

Use ethical conversion tactics: strong copy, clear pain framing, social proof, urgency around wasted applications, frictionless onboarding, and measurable outcomes. Avoid deceptive dark patterns, fake scarcity, fake testimonials, or anything that could create review, trust, or legal risk.

## Phase 1: Marketing Site Foundation

Build a public marketing site in `apps/marketing` using Astro + Tailwind + shadcn-style components.

Key goals:

- Fast static pages with excellent SEO.
- Strong landing page explaining the problem: job search is noisy, applications are time-consuming, and candidates do not know where they truly fit.
- Clear product story: score jobs, understand gaps, save jobs, prepare referrals, track applications.
- Public pages: home, features, pricing placeholder, privacy, terms, changelog/blog.
- SEO basics: sitemap, robots.txt, OpenGraph/Twitter metadata, JSON-LD SoftwareApplication schema.
- Conversion sections: hero, before/after workflow, demo mockups, extension CTA, email capture/waitlist, FAQ.

Design direction:

- Design-heavy SaaS landing page with strong visual mockups.
- Show the browser extension widget inside a job page mock.
- Show the app dashboard with saved jobs, fit scores, and pipeline statuses.
- Use concise copy, large type, clean motion, and strong contrast.

## Phase 2: Product Model Redesign

Expand the data model from simple preferences to a flexible candidate profile.

Candidate profile fields:

- Role families: engineering, design, product, marketing, sales, data, operations, customer success, finance, HR.
- Target seniority and career track.
- Skills, tools, industries, company stages, company size, work mode, location constraints.
- Compensation range, visa needs, notice period, availability.
- Career goals: learning, leadership, stability, startup growth, brand, mission, flexibility.
- Deal breakers and strong preferences.

Implementation scope:

- Update shared Zod schemas in `packages/shared`.
- Add Supabase migrations for profile/preferences changes.
- Update backend prompt inputs.
- Update web app profile forms.
- Preserve current user preferences through migration where practical.

## Phase 3: Match Score V2

Turn the current single score into a detailed decision assistant.

Score breakdown:

- Overall fit.
- Skills fit.
- Seniority fit.
- Location/work-mode fit.
- Career-growth fit.
- Deal-breaker risk.
- Application effort estimate.

User-facing output:

- Why this job fits.
- Why it may not fit.
- Missing skills or unclear requirements.
- Questions to ask recruiter.
- Suggested application strategy: apply now, save for later, skip, or investigate.

Backend work:

- Expand `POST /analyze` response schema.
- Add stronger response validation.
- Improve prompt structure for non-engineering roles.
- Add tests for role-family-specific analysis.

## Phase 4: Saved Jobs

Add the first true product loop: save jobs from LinkedIn and manage them in the web app.

Features:

- Save job from extension.
- Store job URL, title, company, location, description snapshot, score, analysis, and saved timestamp.
- Dashboard list with filters by company, score, status, role family, and work mode.
- Job detail page with analysis, notes, and original JD snapshot.

Statuses:

- Saved.
- Planning to apply.
- Applied.
- Interviewing.
- Offer.
- Rejected.
- Archived.

## Phase 5: Application Tracker

Build a lightweight job-search CRM.

Features:

- Kanban board by job status.
- Timeline per job.
- Notes and reminders.
- Follow-up dates.
- Resume version used.
- Contact/recruiter notes.
- Outcome tracking.

Differentiator:

- Show insights over time: best-fit roles, common gaps, companies with strongest matches, conversion by source/status.

## Phase 6: Resume-Aware Assistant

Add resume/context so RoleGauge can help users apply better, not just score jobs.

Features:

- Upload or paste resume text.
- Extract candidate summary, skills, experience, and achievements.
- Compare resume to job description.
- Suggest missing keywords.
- Generate tailored resume bullet suggestions.
- Generate short cover letter or recruiter note.

Privacy considerations:

- Make resume upload explicit.
- Clearly disclose how resume content is used.
- Avoid storing raw resume unless necessary; if stored, provide deletion controls.

## Phase 7: Referral Helper

Add referral and networking workflows.

MVP-safe version:

- Let users manually add contacts for a company.
- Let users paste a LinkedIn profile/contact context.
- Generate referral messages based on resume, job description, and relationship type.
- Generate follow-up versions.

Avoid risky automation:

- Do not scrape LinkedIn connections automatically unless legal/platform risk is reviewed.
- Do not auto-send messages.

Message types:

- Warm referral ask.
- Cold employee outreach.
- Recruiter DM.
- Follow-up after no response.
- Thank-you note.

## Phase 8: Extension V2

Make the extension the capture layer for the product.

Extension features:

- Check match score.
- Save job.
- Show saved/applied status inline.
- Add quick note.
- Open job in dashboard.
- Detect duplicate saved jobs.
- Show top 3 reasons to apply or skip.

Quality goals:

- Robust LinkedIn selectors.
- Better error states.
- Fast loading.
- Minimal permissions.

## Phase 9: Monetization and Growth

Prepare the product for real users.

Free tier:

- Limited job scores per month.
- Saved jobs limit.
- Basic tracker.

Paid tier ideas:

- Unlimited scoring.
- Resume-aware analysis.
- Referral message generation.
- Advanced job insights.
- Application reminders.
- Export job tracker.

Growth tactics:

- SEO pages targeting job-search pain points.
- Blog templates: "How to decide if a job is worth applying to", "How to ask for a referral", role-specific job-fit guides.
- Shareable score screenshots.
- Waitlist/email capture before full release.
- In-product prompts after successful score: save job, create referral message, track application.
- Lightweight onboarding checklist.
- Testimonials only when real.

## Phase 10: Launch Readiness

Before a public launch:

- Public marketing site live.
- Privacy policy and terms updated.
- Production analytics added with privacy-friendly defaults.
- Error monitoring added.
- Supabase RLS reviewed.
- Chrome extension listing updated.
- Demo video and screenshots created.
- Seed examples for non-engineering roles.

## Suggested Build Order

1. Astro marketing site.
2. Expanded candidate profile.
3. Match Score V2.
4. Saved jobs.
5. Application tracker.
6. Resume-aware analysis.
7. Referral helper.
8. Extension V2 polish.
9. Monetization experiments.
10. Launch assets and SEO content.

## Success Metrics

- Visitor to sign-up conversion.
- Sign-up to first preference save.
- First LinkedIn score completed.
- Jobs saved per user.
- Applications tracked per user.
- Referral messages generated.
- Weekly active users.
- Chrome Web Store install to active-user conversion.

## Technical Shape

Recommended monorepo apps:

- `apps/marketing`: Astro static marketing site.
- `apps/web`: authenticated React app dashboard.
- `apps/extension`: Plasmo Chrome extension.
- `apps/backend`: Fastify API.
- `packages/shared`: schemas/types.
- `packages/llm`: provider adapters and prompt contracts.

Marketing should be mostly static. The product app should remain React/Vite for authenticated workflows unless there is a strong reason to migrate later.
