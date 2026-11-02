"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthFrame, authField } from "@/components/auth/AuthFrame";
import { signIn } from "@/lib/account-api";
import { useFinShield } from "@/context/FinShieldContext";

export default function SignInPage() {
  const router = useRouter();
  const { hydrateFromAccount } = useFinShield();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const account = await signIn({ email, password });
      hydrateFromAccount(account);
      router.push(account.profile.onboarded ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthFrame
      title="Welcome back."
      subtitle="Sign in to the ledger you already started."
      alternate={{ href: "/signup", label: "Create account" }}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-[13px] text-muted">
          Email
          <input
            className={authField}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="block text-[13px] text-muted">
          Password
          <input
            className={authField}
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <p className="text-[13px] text-glow">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-full bg-ink text-[15px] font-medium text-white disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-[13px] text-muted">
          New here?{" "}
          <Link href="/signup" className="font-medium text-ink">
            Create an account
          </Link>
        </p>
      </form>
    </AuthFrame>
  );
}
