"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthFrame, authField } from "@/components/auth/AuthFrame";
import { signUp } from "@/lib/account-api";
import { useFinShield } from "@/context/FinShieldContext";

export default function SignUpPage() {
  const router = useRouter();
  const { hydrateFromAccount } = useFinShield();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const account = await signUp({ name, email, password });
      hydrateFromAccount(account);
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account");
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthFrame
      title="Create your account."
      subtitle="A name, an email, and a password. The rest of your money picture comes next."
      alternate={{ href: "/signin", label: "Sign in" }}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-[13px] text-muted">
          Full name
          <input
            className={authField}
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <p className="text-[12px] text-mist">At least 8 characters. Stored as a hash, never as plain text.</p>
        {error ? <p className="text-[13px] text-glow">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-full bg-ink text-[15px] font-medium text-white disabled:opacity-60"
        >
          {pending ? "Creating…" : "Continue"}
        </button>
        <p className="text-center text-[13px] text-muted">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-ink">
            Sign in
          </Link>
        </p>
      </form>
    </AuthFrame>
  );
}
