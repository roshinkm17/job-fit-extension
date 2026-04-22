import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export interface AuthState {
  readonly status: "loading" | "signed-out" | "signed-in";
  readonly session: Session | null;
  readonly user: User | null;
}

export interface AuthContextValue extends AuthState {
  readonly supabase: SupabaseClient;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<{ needsEmailConfirm: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [state, setState] = useState<AuthState>({
    status: "loading",
    session: null,
    user: null,
  });

  useEffect(() => {
    let unsubscribed = false;

    supabase.auth.getSession().then(({ data }) => {
      if (unsubscribed) return;
      setState(buildState(data.session));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(buildState(session));
    });

    return () => {
      unsubscribed = true;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      supabase,
      async signInWithPassword(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
      },
      async signUpWithPassword(email, password) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw new Error(error.message);
        return { needsEmailConfirm: !data.session };
      },
      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
      },
    }),
    [state, supabase],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function buildState(session: Session | null): AuthState {
  if (!session) return { status: "signed-out", session: null, user: null };
  return { status: "signed-in", session, user: session.user };
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
