import { LogOutIcon } from "lucide-react";
import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { SignInCard } from "@/features/auth/SignInCard";
import { PreferencesForm } from "@/features/preferences/PreferencesForm";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";

export function App() {
  if (window.location.pathname === "/privacy") {
    return <PrivacyPolicyPage />;
  }

  return (
    <AuthProvider>
      <AppShell />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

function AppShell() {
  const { status, signOut } = useAuth();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col">
            <a href="/" className="text-base font-semibold text-foreground no-underline">
              RoleGauge
            </a>
            <span className="text-xs text-muted-foreground">
              See how well LinkedIn job posts match your saved preferences.
            </span>
          </div>
          {status === "signed-in" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => void signOut()}
            >
              <LogOutIcon data-icon="inline-start" />
              Sign out
            </Button>
          ) : null}
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="mx-auto flex w-full max-w-2xl justify-center">
          {status === "loading" ? (
            <LoadingState />
          ) : status === "signed-in" ? (
            <PreferencesForm />
          ) : (
            <SignInCard />
          )}
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl justify-center">
          <a
            href="/privacy"
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-2 text-muted-foreground">
      <div className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      <span className="text-sm">Loading your session...</span>
    </div>
  );
}
