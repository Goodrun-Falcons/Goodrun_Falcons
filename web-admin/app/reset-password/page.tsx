"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  PasswordRequirements,
  PasswordStrengthMeter,
  PasswordMatchIndicator,
  passwordMeetsRequirements,
} from "@/components/PasswordRequirements";

function LockIcon() {
  return (
    <svg viewBox="0 0 16 21" fill="none" className="h-[21px] w-4">
      <rect x="1" y="8.5" width="14" height="11" rx="1.5" stroke="#6b7280" strokeWidth="1.3" />
      <path d="M4 8.5V5.5a4 4 0 0 1 8 0v3" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round" />
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!passwordMeetsRequirements(password)) {
      setError("Password does not meet all requirements below.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
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
          {done ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircleIcon />
              <h2 className="text-[24px] font-semibold leading-[32px] text-[#191c1d]">
                Password Updated
              </h2>
              <p className="text-[14px] leading-[20px] text-[#46464e]">
                Your password has been changed. You can now sign in with your
                new password.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="mt-2 text-[12px] font-semibold tracking-[0.6px] text-[#b9100b]"
              >
                Back to Login →
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <h2 className="text-[24px] font-semibold leading-[32px] text-[#191c1d]">
                  Reset Password
                </h2>
                <p className="text-[14px] leading-[20px] text-[#46464e]">
                  Choose a new password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5 pb-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="password" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] py-[15px] pl-[41px] pr-[13px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
                    />
                    <span className="absolute inset-y-0 left-3 flex items-center">
                      <LockIcon />
                    </span>
                  </div>
                  <PasswordStrengthMeter password={password} />
                  <PasswordRequirements password={password} />
                </div>

                <div className="flex flex-col gap-2 pb-1">
                  <label htmlFor="confirmPassword" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] py-[15px] pl-[41px] pr-[13px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
                    />
                    <span className="absolute inset-y-0 left-3 flex items-center">
                      <LockIcon />
                    </span>
                  </div>
                  <PasswordMatchIndicator password={password} confirmPassword={confirmPassword} />
                </div>

                {error && (
                  <p className="text-[13px] leading-[18px] text-[#b9100b]">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#b9100b] px-4 py-3 text-[12px] font-semibold tracking-[0.6px] text-white disabled:opacity-60"
                >
                  {loading ? "Updating…" : "Update Password"}
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
