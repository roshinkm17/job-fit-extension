import { LogInIcon, UserPlusIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Mode = "sign-in" | "sign-up";

export function SignInCard() {
  const { signInWithPassword, signUpWithPassword } = useAuth();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (mode === "sign-in") {
        await signInWithPassword(email, password);
        toast.success("Signed in.");
      } else {
        const { needsEmailConfirm } = await signUpWithPassword(email, password);
        toast.success(
          needsEmailConfirm
            ? "Account created. Check your inbox to confirm your email."
            : "Account created.",
        );
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "sign-in" ? "Welcome back" : "Create your account"}</CardTitle>
        <CardDescription>
          {mode === "sign-in"
            ? "Sign in to set the preferences used by RoleGauge to score jobs on LinkedIn."
            : "Your preferences are private to you and guarded by Supabase RLS."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="sign-in-form" onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <FieldDescription>
                Minimum 8 characters. Stored hashed by Supabase Auth.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <Button
          type="submit"
          form="sign-in-form"
          className="w-full"
          disabled={submitting || email.length === 0 || password.length < 8}
        >
          {mode === "sign-in" ? (
            <LogInIcon data-icon="inline-start" />
          ) : (
            <UserPlusIcon data-icon="inline-start" />
          )}
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setMode((prev) => (prev === "sign-in" ? "sign-up" : "sign-in"))}
        >
          {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </Button>
      </CardFooter>
    </Card>
  );
}
