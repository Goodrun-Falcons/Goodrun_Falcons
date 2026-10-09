"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AddressInput } from "@/components/AddressInput";
import type { Coordinates } from "@/lib/geocode";
import {
  PasswordRequirements,
  PasswordStrengthMeter,
  PasswordMatchIndicator,
  passwordMeetsRequirements,
} from "@/components/PasswordRequirements";

type OrgProfile = {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  verified: boolean;
};

export default function OrgSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressCoords, setAddressCoords] = useState<Coordinates | null>(null);
  const [verified, setVerified] = useState(false);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("organisations")
        .select("name, email, phone, address, verified")
        .eq("id", user.id)
        .maybeSingle<OrgProfile>();

      if (data) {
        setOrgId(user.id);
        setName(data.name);
        setEmail(data.email);
        setPhone(data.phone ?? "");
        setAddress(data.address ?? "");
        setVerified(data.verified);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;

    setProfileError(null);
    setProfileSaved(false);
    setProfileSaving(true);

    const { error } = await supabase
      .from("organisations")
      .update({
        name,
        phone: phone || null,
        address: address || null,
        ...(addressCoords
          ? { location: `POINT(${addressCoords.lng} ${addressCoords.lat})` }
          : {}),
      })
      .eq("id", orgId);

    setProfileSaving(false);

    if (error) {
      setProfileError(error.message);
      return;
    }
    setProfileSaved(true);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (!passwordMeetsRequirements(newPassword)) {
      setPasswordError("Password does not meet all requirements below.");
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);

    if (error) {
      setPasswordError(error.message);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSaved(true);
  }

  if (loading) {
    return <div className="p-6 text-[#46464e]">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-[32px] font-semibold leading-[40px] tracking-[-0.32px] text-[#191c1d]">
            Settings
          </h2>
          {verified && (
            <span className="flex items-center gap-1 rounded-full bg-[#d8f6e3] px-2.5 py-1 text-[11px] font-semibold uppercase text-[#0f5132]">
              Verified
            </span>
          )}
        </div>
        <p className="text-[16px] text-[#46464e]">
          Manage your organisation profile and account security.
        </p>
      </div>

      <form
        onSubmit={handleProfileSubmit}
        className="flex w-full max-w-[560px] flex-col gap-5 rounded-lg border border-[#eaecf0] bg-white/95 p-[25px] shadow-sm"
      >
        <h3 className="text-[16px] font-semibold text-[#191c1d]">Organisation Profile</h3>

        <div className="flex flex-col gap-2">
          <label htmlFor="orgName" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
            Organisation Name
          </label>
          <input
            id="orgName"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] px-[13px] py-[15px] text-[16px] text-[#191c1d] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="orgEmail" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
            Email Address
          </label>
          <input
            id="orgEmail"
            type="email"
            disabled
            value={email}
            className="w-full rounded-lg border border-[#e1e3e4] bg-[#eaecee] px-[13px] py-[15px] text-[16px] text-[#6b7280]"
          />
          <p className="text-[12px] text-[#6b7280]">
            Need this changed, or anything else we can&apos;t self-serve?{" "}
            <a href="/org/support" className="font-semibold text-[#b9100b]">
              Contact Support →
            </a>
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="orgPhone" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
            Phone Number
          </label>
          <input
            id="orgPhone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(03) 9000 0000"
            className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] px-[13px] py-[15px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
          />
        </div>

        <AddressInput
          id="orgAddress"
          label="Organisation Address"
          value={address}
          onChange={(value) => {
            setAddress(value);
            setAddressCoords(null);
          }}
          onSelectCoordinates={setAddressCoords}
        />

        {profileError && <p className="text-[13px] text-[#b9100b]">{profileError}</p>}
        {profileSaved && <p className="text-[13px] text-[#0f5132]">Profile updated.</p>}

        <button
          type="submit"
          disabled={profileSaving}
          className="w-fit rounded-lg bg-[#b9100b] px-6 py-3 text-[12px] font-semibold tracking-[0.6px] text-white disabled:opacity-60"
        >
          {profileSaving ? "Saving…" : "Save Changes"}
        </button>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="flex w-full max-w-[560px] flex-col gap-5 rounded-lg border border-[#eaecf0] bg-white/95 p-[25px] shadow-sm"
      >
        <h3 className="text-[16px] font-semibold text-[#191c1d]">Change Password</h3>

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

        <div className="flex flex-col gap-2">
          <label htmlFor="confirmNewPassword" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
            Confirm New Password
          </label>
          <input
            id="confirmNewPassword"
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

        {passwordError && <p className="text-[13px] text-[#b9100b]">{passwordError}</p>}
        {passwordSaved && <p className="text-[13px] text-[#0f5132]">Password updated.</p>}

        <button
          type="submit"
          disabled={passwordSaving}
          className="w-fit rounded-lg bg-[#11183c] px-6 py-3 text-[12px] font-semibold tracking-[0.6px] text-white disabled:opacity-60"
        >
          {passwordSaving ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}
