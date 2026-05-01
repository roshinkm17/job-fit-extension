/**
 * Shape mirrors LinkedIn's "job-details-jobs-unified-top-card" experiment
 * (two-pane detail view) as of 2025-Q2. Copy is synthesized — no real job text.
 */
export const LINKEDIN_MODERN_FIXTURE = /* html */ `
<!doctype html>
<html>
  <body>
    <main class="jobs-details__main-content">
      <div class="job-details-jobs-unified-top-card__container--two-pane">
        <div class="job-details-jobs-unified-top-card__job-title">
          <h1>Senior Backend Engineer</h1>
        </div>
        <div class="job-details-jobs-unified-top-card__company-name">
          <a href="/company/acme/">Acme Corp</a>
        </div>
        <div class="job-details-jobs-unified-top-card__primary-description-container">
          <span>San Francisco, CA · 3 days ago · 200 applicants</span>
        </div>
      </div>
      <section class="jobs-description__content">
        <article class="jobs-description__container">
          <div id="job-details">
            <p>We are hiring a Senior Backend Engineer to work on high-scale services.</p>
            <p>You will own <strong>Node.js</strong>, TypeScript, and Postgres systems.</p>
            <ul>
              <li>6+ years of production experience</li>
              <li>Comfortable with on-call rotations</li>
              <li>Remote-first, US time zones</li>
            </ul>
          </div>
        </article>
      </section>
    </main>
  </body>
</html>
`;

/**
 * Variant without the `--two-pane` breakpoint suffix (still common in experiments).
 */
export const LINKEDIN_MODERN_CONTAINER_ONLY_FIXTURE = /* html */ `
<!doctype html>
<html>
  <body>
    <main class="jobs-details__main-content">
      <div class="job-details-jobs-unified-top-card__container scoped-job-card__container--a1">
        <div class="job-details-jobs-unified-top-card__job-title">
          <h1>Senior Backend Engineer</h1>
        </div>
        <div class="job-details-jobs-unified-top-card__company-name">
          <a href="/company/acme/">Acme Corp</a>
        </div>
      </div>
      <section class="jobs-description__content">
        <article class="jobs-description__container">
          <div id="job-details">
            <p>We are hiring a Senior Backend Engineer to work on high-scale services.</p>
            <p>You will own Node.js and TypeScript across distributed systems daily.</p>
          </div>
        </article>
      </section>
    </main>
  </body>
</html>
`;
