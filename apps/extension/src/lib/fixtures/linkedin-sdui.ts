/**
 * Obfuscated hashed classes + semantic hooks (aria / data-sdui / data-testid)
 * akin to LinkedIn's SDUI job detail shell as surfaced in DevTools probes.
 */
export const LINKEDIN_SDUI_JOB_FIXTURE = /* html */ `
<!doctype html>
<html>
  <body>
    <main id="workspace" tabindex="0" class="_628b803d">
      <div class="e6d97275 fc2ed07b">
        <aside class="_62c5656c"></aside>
        <div class="detail _883b96c8">
          <h1 class="d5431a5b">Software Engineer II</h1>
          <div aria-label="Company, Honeywell." class="fd5063f9">
            <figure class="_44da00e4"></figure>
            <p class="d5431a5b">
              <a href="https://www.linkedin.com/company/honeywell/life/">Honeywell</a>
            </p>
          </div>
          <div class="cbd4d72a">
            <p class="d5431a5b">
              <span class="e7898b3a">Bengaluru, Karnataka, India</span>
              <span class="_40375f0d"> </span>
              ·
              <span class="_40375f0d"> </span>
              <span class="e7898b3a">1 week ago</span>
            </p>
          </div>
        </div>
      </div>
      <div
        data-sdui-component="com.linkedin.sdui.generated.jobseeker.dsl.impl.aboutTheJob"
      >
        <div class="_2969a2c6" data-display-contents="true">
          <p class="d5431a5b">
            <span data-testid="expandable-text-box">
              <strong>About Us</strong>
              Honeywell helps organizations solve complex challenges in automation, building
              technologies, aerospace, safety, productivity, supply chain analytics, AI, quantum
              computing, sensing, robotics, augmented reality and other industrial markets.
              This paragraph is synthesized for deterministic fixture extraction length.
              We require sixty characters minimum for downstream schema validation reliably.
              Additional duties include collaborating with globally distributed engineers across
              time zones daily.
            </span>
          </p>
        </div>
      </div>
      <div
        class="_7cb87c78"
        componentkey="JobDetails_AboutTheCompany_4405618041"
      >
        <div data-testid="expandable-text-box">
          Company supplemental blurb belongs here for edge cases during fixture testing only.
          This duplicate block mirrors optional LinkedIn sibling sections occasionally present.
          We keep eighty plus characters here to satisfy minimum description length fallback order.
          Honeywell Aerospace and Performance Materials businesses continue worldwide operations.
        </div>
      </div>
    </main>
  </body>
</html>
`;
