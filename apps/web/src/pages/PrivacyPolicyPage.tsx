import { ArrowLeftIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const UPDATED_AT = "May 1, 2026";

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-svh bg-background px-6 py-10 text-foreground">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Button asChild variant="ghost" className="w-fit px-0">
          <a href="/">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to RoleGauge
          </a>
        </Button>

        <Card>
          <CardHeader className="gap-2">
            <p className="text-sm font-medium text-muted-foreground">RoleGauge</p>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: {UPDATED_AT}</p>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-8 pt-6 leading-7">
            <Section title="Overview">
              <p>
                RoleGauge helps you compare LinkedIn job posts against your saved career
                preferences. This policy explains what data the RoleGauge web app and Chrome
                extension collect, how that data is used, and the choices you have.
              </p>
            </Section>

            <Section title="Data We Collect">
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Account information:</strong> your email address and user identifier when
                  you create or sign in to a RoleGauge account through Supabase Auth.
                </li>
                <li>
                  <strong>Authentication information:</strong> session tokens used to keep you
                  signed in. The Chrome extension stores its session in{" "}
                  <code>chrome.storage.local</code>.
                </li>
                <li>
                  <strong>Saved preferences:</strong> the job preferences you enter, such as work
                  mode, skills, deal breakers, and related preference fields.
                </li>
                <li>
                  <strong>Website content you choose to analyze:</strong> when you click “Check
                  match score” on a supported LinkedIn job page, RoleGauge reads the job title,
                  company, location, and job description needed to create the fit score.
                </li>
              </ul>
            </Section>

            <Section title="How We Use Data">
              <p>
                We use this data only to authenticate your account, save your preferences, and
                generate personalized job fit analysis. The extension does not collect your browsing
                history, keystrokes, mouse movement, health information, financial information, or
                personal communications.
              </p>
            </Section>

            <Section title="Sharing and Service Providers">
              <p>
                We do not sell user data. RoleGauge may send necessary data to service providers
                that operate the product, including Supabase for authentication and preference
                storage, the RoleGauge backend for analysis requests, and the configured language
                model provider used to generate the job fit result. These providers are used only to
                deliver RoleGauge’s job matching functionality.
              </p>
            </Section>

            <Section title="Storage and Retention">
              <p>
                Your saved preferences remain in the RoleGauge database until you update or delete
                them, or request account deletion. Job page content is sent for analysis when you
                click the scoring button and is not stored by RoleGauge as part of your saved
                profile.
              </p>
            </Section>

            <Section title="Your Choices">
              <ul className="list-disc space-y-2 pl-5">
                <li>You can update your saved job preferences in the RoleGauge web app.</li>
                <li>You can sign out from the web app or extension popup.</li>
                <li>
                  You can request account or data deletion using the support contact listed on the
                  Chrome Web Store listing.
                </li>
              </ul>
            </Section>

            <Section title="Chrome Extension Permissions">
              <p>
                RoleGauge requests access to LinkedIn job pages so it can read the job content you
                choose to score. It requests storage permission so the extension can keep your
                sign-in session available to the content script and popup.
              </p>
            </Section>

            <Section title="Changes to This Policy">
              <p>
                We may update this policy as RoleGauge changes. The “Last updated” date above will
                reflect the latest version.
              </p>
            </Section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="text-sm text-muted-foreground">{children}</div>
    </section>
  );
}
