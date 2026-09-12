"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AddressInput } from "@/components/AddressInput";

function MailIcon() {
  return (
    <svg viewBox="0 0 20 16" fill="none" className="h-4 w-5">
      <path
        d="M1.667 2.667c0-.737.597-1.334 1.333-1.334h14c.736 0 1.333.597 1.333 1.334v10.666c0 .737-.597 1.334-1.333 1.334H3c-.736 0-1.333-.597-1.333-1.334V2.667Z"
        stroke="#6b7280"
        strokeWidth="1.3"
      />
      <path d="m2 3 8 6 8-6" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
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

function BuildingIcon() {
  return (
    <svg viewBox="0 0 18 20" fill="none" className="h-5 w-[18px]">
      <rect x="1" y="1" width="16" height="18" rx="1" stroke="#6b7280" strokeWidth="1.3" />
      <path d="M4.5 4.5h2M4.5 8h2M4.5 11.5h2M11.5 4.5h2M11.5 8h2M11.5 11.5h2M7.5 19v-4h3v4" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
      <path
        d="M3.4 1.5H5.6L6.9 4.7l-1.6 1.3a9.5 9.5 0 0 0 4.7 4.7l1.3-1.6 3.2 1.3v2.2c0 .7-.6 1.3-1.3 1.3C7.5 13.5 1.5 7.5 1.5 2.3c0-.7.6-1.3 1.3-1.3Z"
        stroke="#6b7280"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
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

export default function SignupPage() {
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("signup_requests").insert({
      auth_user_id: data.user.id,
      name: orgName,
      email,
      phone: phone || null,
      address: address || null,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSubmitted(true);
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
            backgroundImage: "linear-gradient(119.86deg, rgb(17, 24, 60) 0%, rgb(10, 15, 37) 100%)",
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
            <h3 className="text-[20px] font-semibold leading-[28px] text-white">
              Join as an Organisation
            </h3>
            <p className="text-[14px] leading-[20px] text-[#7b81ab]">
              After you submit your details, our team will review and verify
              your organisation before you can sign in.
            </p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-6">
          <span className="text-[14px] leading-[20px] text-[#7b81ab]">
            © 2026 Medical Pantry Logistics
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white p-6">
        <div className="w-full max-w-[448px] rounded-2xl border border-[#e1e3e4] bg-white p-[33px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          {submitted ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircleIcon />
              <h2 className="text-[24px] font-semibold leading-[32px] text-[#191c1d]">
                Request Submitted
              </h2>
              <p className="text-[14px] leading-[20px] text-[#46464e]">
                Your details have been sent to an admin. A representative will
                contact you soon to verify your organisation before your
                account is activated.
              </p>
              <a
                href="/login"
                className="mt-2 text-[12px] font-semibold tracking-[0.6px] text-[#b9100b]"
              >
                Back to Login →
              </a>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <h2 className="text-[24px] font-semibold leading-[32px] text-[#191c1d]">
                  Organisation Signup
                </h2>
                <p className="text-[14px] leading-[20px] text-[#46464e]">
                  Tell us about your organisation to request access to the portal.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5 pb-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="orgName" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
                    Organisation Name
                  </label>
                  <div className="relative">
                    <input
                      id="orgName"
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Medical Pantry"
                      className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] py-[15px] pl-[41px] pr-[13px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
                    />
                    <span className="absolute inset-y-0 left-3 flex items-center">
                      <BuildingIcon />
                    </span>
                  </div>
                </div>

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

                <div className="flex flex-col gap-2">
                  <label htmlFor="phone" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(03) 9000 0000"
                      className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] py-[15px] pl-[41px] pr-[13px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
                    />
                    <span className="absolute inset-y-0 left-3 flex items-center">
                      <PhoneIcon />
                    </span>
                  </div>
                </div>

                <AddressInput
                  id="address"
                  label="Organisation Address"
                  value={address}
                  onChange={setAddress}
                />

                <div className="flex flex-col gap-2">
                  <label htmlFor="password" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
                    Password
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
                </div>

                <div className="flex flex-col gap-2 pb-1">
                  <label htmlFor="confirmPassword" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
                    Confirm Password
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
                </div>

                {error && (
                  <p className="text-[13px] leading-[18px] text-[#b9100b]">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#b9100b] px-4 py-3 text-[12px] font-semibold tracking-[0.6px] text-white disabled:opacity-60"
                >
                  {loading ? "Submitting…" : "Request Access"}
                </button>
              </form>

              <div className="border-t border-[#e1e3e4] pt-[25px] text-center text-[14px] text-[#46464e]">
                Already verified?{" "}
                <a href="/login" className="text-[12px] font-semibold tracking-[0.6px] text-[#b9100b]">
                  Log In →
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
