"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthFrame, authField } from "@/components/auth/AuthFrame";
import { saveOnboarding } from "@/lib/account-api";
import { readSession } from "@/lib/session";
import { useFinShield } from "@/context/FinShieldContext";

const STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const { hydrateFromAccount } = useFinShield();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [income, setIncome] = useState("");
  const [housing, setHousing] = useState("");
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [alerts, setAlerts] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const session = readSession();
    if (!session) {
      router.replace("/signup");
      return;
    }
    setName(session.name);
  }, [router]);

  const titles = [
    "What should we call you?",
    "What lands in your account each month?",
    "What do you already owe for housing?",
    "What are you saving toward?",
    "Should we flag unusual spending?",
  ];
  const subtitles = [
    "This is the name on your ledger.",
    "Take-home pay, before this month's spending.",
    "Rent or an EMI. Leave it at zero if you have neither.",
    "Optional. You can add more goals later.",
    "Alerts stay on this device and compare new entries with your own history.",
  ];

  const finish = async () => {
    setPending(true);
    setError("");
    try {
      const account = await saveOnboarding({
        name: name.trim(),
        city: city.trim(),
        monthlyIncome: Number(income) || 0,
        housingCost: Number(housing) || 0,
        goalName: goalName.trim(),
        goalTarget: Number(goalTarget) || 0,
        alerts,
      });
      hydrateFromAccount({
        ...account,
        user: { ...account.user, name: name.trim() || account.user.name },
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your answers");
    } finally {
      setPending(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (step === 0 && name.trim().length < 2) {
      setError("Enter the name you want on the account");
      return;
    }
    if (step === 1 && income !== "" && Number(income) < 0) {
      setError("Income cannot be negative");
      return;
    }
    if (step === 2 && housing !== "" && Number(housing) < 0) {
      setError("That amount cannot be negative");
      return;
    }
    if (step === 3) {
      const hasName = goalName.trim().length > 0;
      const target = Number(goalTarget) || 0;
      if (hasName !== target > 0) {
        setError("Add both a goal name and a target, or leave both empty");
        return;
      }
    }
    if (step < STEPS - 1) {
      setStep((current) => current + 1);
      return;
    }
    void finish();
  };

  return (
    <AuthFrame
      title={titles[step]}
      subtitle={subtitles[step]}
      step={step + 1}
      steps={STEPS}
      alternate={{ href: "/signin", label: "Sign in" }}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {step === 0 && (
          <>
            <label className="block text-[13px] text-muted">
              Name
              <input className={authField} required value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="block text-[13px] text-muted">
              City
              <input
                className={authField}
                value={city}
                placeholder="Bengaluru"
                onChange={(event) => setCity(event.target.value)}
              />
            </label>
          </>
        )}
        {step === 1 && (
          <label className="block text-[13px] text-muted">
            Monthly take-home (₹)
            <input
              className={authField}
              inputMode="decimal"
              value={income}
              onChange={(event) => setIncome(event.target.value)}
            />
          </label>
        )}
        {step === 2 && (
          <label className="block text-[13px] text-muted">
            Monthly rent or EMI (₹)
            <input
              className={authField}
              inputMode="decimal"
              value={housing}
              onChange={(event) => setHousing(event.target.value)}
            />
          </label>
        )}
        {step === 3 && (
          <>
            <label className="block text-[13px] text-muted">
              Goal
              <input
                className={authField}
                value={goalName}
                placeholder="Emergency fund"
                onChange={(event) => setGoalName(event.target.value)}
              />
            </label>
            <label className="block text-[13px] text-muted">
              Target amount (₹)
              <input
                className={authField}
                inputMode="decimal"
                value={goalTarget}
                onChange={(event) => setGoalTarget(event.target.value)}
              />
            </label>
          </>
        )}
        {step === 4 && (
          <button
            type="button"
            aria-pressed={alerts}
            onClick={() => setAlerts((current) => !current)}
            className="flex w-full items-center justify-between rounded-2xl border border-haze bg-white px-4 py-4 text-left"
          >
            <span>
              <span className="block text-[15px] text-ink">Spending alerts</span>
              <span className="mt-1 block text-[13px] text-muted">
                Flag a new expense when it is far from your usual spending.
              </span>
            </span>
            <span className={`rounded-full px-3 py-1 text-[12px] font-medium ${alerts ? "bg-ink text-white" : "bg-haze text-muted"}`}>
              {alerts ? "On" : "Off"}
            </span>
          </button>
        )}
        {error ? <p className="text-[13px] text-glow">{error}</p> : null}
        <div className="flex gap-3 pt-2">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((current) => current - 1)}
              className="h-12 flex-1 rounded-full border border-haze text-[15px] font-medium text-ink"
            >
              Back
            </button>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="h-12 flex-1 rounded-full bg-ink text-[15px] font-medium text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : step === STEPS - 1 ? "Open my ledger" : "Continue"}
          </button>
        </div>
      </form>
    </AuthFrame>
  );
}
