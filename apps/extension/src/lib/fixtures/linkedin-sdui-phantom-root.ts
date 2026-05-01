/**
 * LinkedIn sometimes keeps an empty legacy detail shell *before* `main#workspace`
 * in document order. Extraction must not stop at the phantom root.
 */
export const LINKEDIN_SDUI_PHANTOM_LEGACY_ROOT_FIXTURE = /* html */ `
<!doctype html>
<html>
  <body>
    <div class="jobs-details__main-content"></div>
    <main id="workspace" class="_628b803d">
      <div class="detail _883b96c8">
        <h1 class="d5431a5b">Staff Software Engineer</h1>
        <div aria-label="Company, Commonwealth Bank." class="fd5063f9">
          <p class="d5431a5b">
            <a href="https://www.linkedin.com/company/commbank/">Commonwealth Bank</a>
          </p>
        </div>
        <div class="cbd4d72a">
          <p class="d5431a5b">
            <span class="e7898b3a">Bengaluru East, Karnataka, India</span>
            <span> · </span>
            <span class="e7898b3a">1 week ago</span>
          </p>
        </div>
      </div>
      <div data-sdui-component="com.linkedin.sdui.generated.jobseeker.dsl.impl.aboutTheJob">
        <span data-testid="expandable-text-box">
          We are hiring a Staff Software Engineer for distributed systems and platform work.
          You will collaborate with teams across regions and own critical services end to end.
          Strong experience with cloud infrastructure and reliability practices is required.
          This paragraph is long enough to satisfy minimum description length in tests reliably.
        </span>
      </div>
    </main>
  </body>
</html>
`;
