import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { SignInCard } from "@/features/auth/SignInCard";
import { PreferencesForm } from "@/features/preferences/PreferencesForm";

export function App() {
  return (
    <AuthProvider>
      <AppShell />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

function AppShell() {
  const { status } = useAuth();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex flex-col">
            <span className="text-base font-semibold">Job Fit</span>
            <span className="text-xs text-muted-foreground">
              LinkedIn job match scoring, powered by your preferences.
            </span>
          </div>
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
