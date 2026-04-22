/**
 * Shape mirrors LinkedIn's older "jobs-unified-top-card" variant still served
 * to some cohorts. Copy is synthesized — no real job text.
 */
export const LINKEDIN_LEGACY_FIXTURE = /* html */ `
<!doctype html>
<html>
  <body>
    <div class="jobs-search__job-details--container">
      <div class="jobs-unified-top-card">
        <h1 class="t-24 jobs-unified-top-card__job-title">Staff Platform Engineer</h1>
        <div class="jobs-unified-top-card__company-name">
          <a href="/company/initech/">Initech</a>
        </div>
        <div class="jobs-unified-top-card__primary-description">
          <span>Initech</span>
          <span class="jobs-unified-top-card__bullet">Austin, TX</span>
          <span>·</span>
          <span>Hybrid</span>
        </div>
      </div>
      <div class="jobs-description__content">
        <div class="jobs-description-content__text">
          <p>Initech seeks a Staff Platform Engineer to own developer tooling.</p>
          <ul>
            <li>8+ years of experience shipping platforms</li>
            <li>Deep Kubernetes and AWS knowledge</li>
            <li>Experience with TypeScript services preferred</li>
          </ul>
          <p>This is a hybrid role in Austin with 2 days on-site.</p>
        </div>
      </div>
    </div>
  </body>
</html>
`;

/**
 * Same shell, but the description hasn't loaded yet. The extractor must
 * report `missing-description` rather than returning a half-built JobData.
 */
export const LINKEDIN_PENDING_FIXTURE = /* html */ `
<!doctype html>
<html>
  <body>
    <div class="jobs-search__job-details--container">
      <div class="jobs-unified-top-card">
        <h1 class="t-24">Loading role…</h1>
        <div class="jobs-unified-top-card__company-name">Acme Corp</div>
        <div class="jobs-unified-top-card__primary-description">Acme Corp · · 3 days ago</div>
      </div>
      <div class="jobs-description__content">
        <div class="jobs-description-content__text"></div>
      </div>
    </div>
  </body>
</html>
`;
