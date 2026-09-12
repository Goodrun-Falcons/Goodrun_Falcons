"use client";

const RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
  { label: "One special character", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

export function passwordMeetsRequirements(password: string): boolean {
  return RULES.every((rule) => rule.test(password));
}

function CheckIcon({ met }: { met: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0">
      <circle cx="8" cy="8" r="7" fill={met ? "#98f6bb" : "transparent"} stroke={met ? "#98f6bb" : "#c1c4c6"} strokeWidth="1.3" />
      {met && <path d="M4.5 8.2 6.8 10.5 11.5 5.5" stroke="#11183c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

export function PasswordRequirements({ password }: { password: string }) {
  if (!password) return null;
  return (
    <ul className="flex flex-col gap-1.5">
      {RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li key={rule.label} className="flex items-center gap-2 text-[12px]">
            <CheckIcon met={met} />
            <span className={met ? "text-[#191c1d]" : "text-[#6b7280]"}>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

function getStrength(password: string): { label: string; color: string; score: number } {
  const metCount = RULES.filter((rule) => rule.test(password)).length;
  if (password.length === 0) return { label: "", color: "transparent", score: 0 };
  if (metCount <= 2) return { label: "Weak", color: "#b9100b", score: 1 };
  if (metCount <= 4) return { label: "Medium", color: "#d97706", score: 2 };
  return { label: "Strong", color: "#16a34a", score: 3 };
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { label, color, score } = getStrength(password);
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full"
            style={{ backgroundColor: i <= score ? color : "#e1e3e4" }}
          />
        ))}
      </div>
      <span className="text-[12px] font-medium" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

export function PasswordMatchIndicator({ password, confirmPassword }: { password: string; confirmPassword: string }) {
  if (!confirmPassword) return null;
  const matches = password === confirmPassword;
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <CheckIcon met={matches} />
      <span className={matches ? "text-[#191c1d]" : "text-[#b9100b]"}>
        {matches ? "Passwords match" : "Passwords do not match"}
      </span>
    </div>
  );
}
