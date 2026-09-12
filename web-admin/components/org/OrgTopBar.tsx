"use client";

function BellIcon() {
  return (
    <svg viewBox="0 0 16 20" fill="none" className="h-5 w-4">
      <path
        d="M8 1a5 5 0 0 0-5 5v3.4c0 .6-.2 1.2-.6 1.7L1 13.5c-.6.8 0 2 1 2h12c1 0 1.6-1.2 1-2l-1.4-2.4a2.7 2.7 0 0 1-.6-1.7V6a5 5 0 0 0-5-5Z"
        stroke="#191c1d"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M6 17.5a2 2 0 0 0 4 0" stroke="#191c1d" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path
        d="M8.3 2.2h3.4l.4 2a6.4 6.4 0 0 1 1.5.9l1.9-.7 1.7 3-1.5 1.3a6.5 6.5 0 0 1 0 1.7l1.5 1.3-1.7 3-1.9-.7a6.4 6.4 0 0 1-1.5.9l-.4 2H8.3l-.4-2a6.4 6.4 0 0 1-1.5-.9l-1.9.7-1.7-3 1.5-1.3a6.5 6.5 0 0 1 0-1.7L2.8 7.7l1.7-3 1.9.7a6.4 6.4 0 0 1 1.5-.9l.4-2Z"
        stroke="#191c1d"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.5" stroke="#191c1d" strokeWidth="1.3" />
    </svg>
  );
}

export function OrgTopBar({ orgName }: { orgName: string }) {
  return (
    <div className="flex h-[72px] w-full items-center justify-between border-b border-[#c7c5cf] bg-[#f8f9fa] px-6">
      <h1 className="text-[24px] font-bold leading-[32px] text-black">Medical Pantry</h1>
      <div className="flex items-center gap-6">
        <div className="relative">
          <BellIcon />
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[#b9100b]" />
        </div>
        <SettingsIcon />
        <div className="flex size-8 items-center justify-center rounded-full bg-[#bec4f1] text-[12px] font-semibold text-[#11183c]">
          {orgName.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
}
