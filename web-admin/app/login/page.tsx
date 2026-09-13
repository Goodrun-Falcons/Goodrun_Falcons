"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

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

function LockIcon() {
  return (
    <svg viewBox="0 0 16 21" fill="none" className="h-[21px] w-4">
      <rect x="1" y="8.5" width="14" height="11" rx="1.5" stroke="#6b7280" strokeWidth="1.3" />
      <path d="M4 8.5V5.5a4 4 0 0 1 8 0v3" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 22 15" fill="none" className="h-[15px] w-[22px]">
      <path
        d="M1 7.5S4.818 1 11 1s10 6.5 10 6.5-3.818 6.5-10 6.5S1 7.5 1 7.5Z"
        stroke="#6b7280"
        strokeWidth="1.3"
      />
      <circle cx="11" cy="7.5" r="3" stroke="#6b7280" strokeWidth="1.3" />
    </svg>
  ) : (
    <svg viewBox="0 0 22 15" fill="none" className="h-[15px] w-[22px]">
      <path
        d="M1 7.5S4.818 1 11 1s10 6.5 10 6.5-3.818 6.5-10 6.5S1 7.5 1 7.5Z"
        stroke="#6b7280"
        strokeWidth="1.3"
      />
      <path d="M2 1l18 13" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round" />
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

function ShieldIcon() {
  return (
    <svg viewBox="0 0 21 27" fill="none" className="h-[27px] w-[21px]">
      <path
        d="M10.5 1 20 5v8c0 7-4.2 11-9.5 13C5.2 24 1 20 1 13V5l9.5-4Z"
        fill="#98f6bb"
        fillOpacity="0.15"
        stroke="#98f6bb"
        strokeWidth="1.3"
      />
      <path d="M6.5 13.5 9 16l5.5-6" stroke="#98f6bb" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type LoginMode = "organisation" | "admin";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("organisation");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAdmin = mode === "admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    if (isAdmin) {
      const { data: admin } = await supabase
        .from("admins")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!admin) {
        await supabase.auth.signOut();
        setError("This account is not authorized as an admin.");
        setLoading(false);
        return;
      }

      router.push("/admin/dashboard");
      return;
    }

    const { data: org } = await supabase
      .from("organisations")
      .select("verified")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!org?.verified) {
      await supabase.auth.signOut();
      setError(
        "Your account is pending verification. An admin will review your details and contact you soon."
      );
      setLoading(false);
      return;
    }

    router.push("/org/dashboard");
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
          <div className="flex w-full flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-[25px] backdrop-blur-[2px]">
            <div className="flex items-center gap-4">
              <ShieldIcon />
              <h3 className="text-[20px] font-semibold leading-[28px] text-white">
                Secure Access
              </h3>
            </div>
            <p className="text-[14px] leading-[20px] text-[#7b81ab]">
              Authorized personnel only. Ensure you are connected to a secure
              network before authenticating.
            </p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-6">
          <span className="text-[14px] leading-[20px] text-[#7b81ab]">
            © 2026 Medical Pantry Logistics
          </span>
          <span className="flex items-center gap-2 text-[14px] leading-[20px] text-[#7b81ab]">
            <span className="size-2 rounded-full bg-[#98f6bb]" />
            System Operational
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white p-6">
        <div className="w-full max-w-[448px] rounded-2xl border border-[#e1e3e4] bg-white p-[33px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-2">
            <h2 className="text-[24px] font-semibold leading-[32px] text-[#191c1d]">
              {isAdmin ? "Admin Login" : "Organization Login"}
            </h2>
            <p className="text-[14px] leading-[20px] text-[#46464e]">
              Please enter your credentials to access the portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6 pb-6">
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

            <div className="flex flex-col gap-2 pb-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
                  Password
                </label>
                <a href="/forgot-password" className="text-[11px] font-medium text-[#11183c]">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] py-[15px] pl-[41px] pr-[41px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
                />
                <span className="absolute inset-y-0 left-3 flex items-center">
                  <LockIcon />
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {error && (
              <p className="-mt-3 text-[13px] leading-[18px] text-[#b9100b]">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#b9100b] px-4 py-3 text-[12px] font-semibold tracking-[0.6px] text-white disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"}
              {!loading && <ArrowIcon />}
            </button>
          </form>

          <div className="border-t border-[#e1e3e4] pt-[25px] text-center text-[14px] text-[#46464e]">
            {isAdmin ? "Not an admin? " : "Are you an Admin? "}
            <button
              type="button"
              onClick={() => setMode(isAdmin ? "organisation" : "admin")}
              className="text-[12px] font-semibold tracking-[0.6px] text-[#b9100b]"
            >
              {isAdmin ? "Organization Login →" : "Admin Login →"}
            </button>
          </div>

          {!isAdmin && (
            <p className="mt-4 text-center text-[14px] text-[#46464e]">
              New organisation?{" "}
              <a href="/signup" className="text-[12px] font-semibold tracking-[0.6px] text-[#b9100b]">
                Register →
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
