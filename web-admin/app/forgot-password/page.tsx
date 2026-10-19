"use client";

import { useState } from "react";
import {
  PasswordRequirements,
  PasswordStrengthMeter,
  PasswordMatchIndicator,
  passwordMeetsRequirements,
} from "@/components/PasswordRequirements";

type Step = "email" | "answer" | "done";

function MailIcon() {
  return (
    <svg viewBox="0 0 20 16" fill="none" className="h-4 w-5">
      <path
        d="M1.667 2.667c0-.737.597-1.334 1.333-1.334h14c.736 0 1.333.597 1.333 1.334v10.666c0 .737-.597 1.334-1.333 1.334H3c-.736 0-1.333-.597-1.333-1.334V2.667Z"
        stroke="#6b7280"
        strokeWidth="1.3"
      />
      <path
        d="m2 3 8 6 8-6"
        stroke="#6b7280"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
      <path d="M2 6h8M6 2l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-12 w-12">
      <circle cx="24" cy="24" r="22" fill="#98f6bb" fillOpacity="0.15" stroke="#98f6bb" strokeWidth="1.5" />
      <path d="M15 24.5l6 6 12-13" stroke="#98f6bb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [questions, setQuestions] = useState<{ question1: string; question2: string } | null>(null);
  const [questionIndex, setQuestionIndex] = useState<1 | 2>(1);
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/security-questions/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setQuestions(data);
    setQuestionIndex(1);
    setStep("answer");
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!passwordMeetsRequirements(newPassword)) {
      setError("Password does not meet all requirements below.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/security-questions/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, questionIndex, answer, newPassword }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setStep("done");
  }

  return (
    <div
      className="flex min-h-screen w-full items-stretch"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgb(248, 249, 250) 0%, rgb(248, 249, 250) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)",
      }}
    >
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#11183c] p-6">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "linear-gradient(119.86deg, rgb(17, 24, 60) 0%, rgb(10, 15, 37) 100%)",
          }}
        />
        <div className="relative flex w-full max-w-[448px] flex-col gap-6 px-8">
          <h1 className="text-[48px] font-bold leading-[60px] tracking-[-0.96px] text-white">
            Medical Pantry
          </h1>
          <p className="text-[18px] leading-[28px] text-[#7b81ab]">
            Logistics Portal for coordinating critical medical supplies and
            managing efficient delivery routes.
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-6">
          <span className="text-[14px] leading-[20px] text-[#7b81ab]">
            © 2026 Medical Pantry Logistics
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white p-6">
        <div className="w-full max-w-[448px] rounded-2xl border border-[#e1e3e4] bg-white p-[33px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          {step === "done" ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircleIcon />
              <h2 className="text-[24px] font-semibold leading-[32px] text-[#191c1d]">
                Password Updated
              </h2>
              <p className="text-[14px] leading-[20px] text-[#46464e]">
                Your password has been changed. You can now sign in with your new password.
              </p>
              <a href="/login" className="mt-2 text-[12px] font-semibold tracking-[0.6px] text-[#b9100b]">
                Back to Login →
              </a>
            </div>
          ) : step === "email" ? (
            <>
              <div className="flex flex-col gap-2">
                <h2 className="text-[24px] font-semibold leading-[32px] text-[#191c1d]">
                  Forgot Password
                </h2>
                <p className="text-[14px] leading-[20px] text-[#46464e]">
                  Enter your email and answer one of your security questions to reset your password.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="mt-6 flex flex-col gap-6 pb-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sarah.chen@medicalpantry.org"
                      className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] py-[15px] pl-[41px] pr-[13px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
                    />
                    <span className="absolute inset-y-0 left-3 flex items-center">
                      <MailIcon />
                    </span>
                  </div>
                </div>

                {error && <p className="-mt-3 text-[13px] leading-[18px] text-[#b9100b]">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#b9100b] px-4 py-3 text-[12px] font-semibold tracking-[0.6px] text-white disabled:opacity-60"
                >
                  {loading ? "Checking…" : "Continue"}
                  {!loading && <ArrowIcon />}
                </button>
              </form>

              <div className="border-t border-[#e1e3e4] pt-[25px] text-center text-[14px] text-[#46464e]">
                Remembered your password?{" "}
                <a href="/login" className="text-[12px] font-semibold tracking-[0.6px] text-[#b9100b]">
                  Log In →
                </a>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <h2 className="text-[24px] font-semibold leading-[32px] text-[#191c1d]">
                  Answer a Security Question
                </h2>
                <p className="text-[14px] leading-[20px] text-[#46464e]">
                  You only need to answer one of the two questions below.
                </p>
              </div>

              <form onSubmit={handleResetSubmit} className="mt-6 flex flex-col gap-5 pb-2">
                <div className="flex flex-col gap-3">
                  {questions && (
                    <>
                      <label className="flex items-start gap-3 rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] p-[13px]">
                        <input
                          type="radio"
                          name="questionChoice"
                          checked={questionIndex === 1}
                          onChange={() => setQuestionIndex(1)}
                          className="mt-1"
                        />
                        <span className="text-[14px] text-[#191c1d]">{questions.question1}</span>
                      </label>
                      <label className="flex items-start gap-3 rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] p-[13px]">
                        <input
                          type="radio"
                          name="questionChoice"
                          checked={questionIndex === 2}
                          onChange={() => setQuestionIndex(2)}
                          className="mt-1"
                        />
                        <span className="text-[14px] text-[#191c1d]">{questions.question2}</span>
                      </label>
                    </>
                  )}
                  <input
                    type="text"
                    required
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Your answer"
                    className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] px-[13px] py-[15px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="newPassword" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] px-[13px] py-[15px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
                  />
                  <PasswordStrengthMeter password={newPassword} />
                  <PasswordRequirements password={newPassword} />
                </div>

                <div className="flex flex-col gap-2 pb-1">
                  <label htmlFor="confirmPassword" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] px-[13px] py-[15px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
                  />
                  <PasswordMatchIndicator password={newPassword} confirmPassword={confirmPassword} />
                </div>

                {error && <p className="text-[13px] leading-[18px] text-[#b9100b]">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#b9100b] px-4 py-3 text-[12px] font-semibold tracking-[0.6px] text-white disabled:opacity-60"
                >
                  {loading ? "Updating…" : "Reset Password"}
                  {!loading && <ArrowIcon />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
