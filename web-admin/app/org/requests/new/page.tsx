"use client";

import { RequestForm } from "@/components/org/RequestForm";

export default function NewRequestPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-[32px] font-semibold leading-[40px] tracking-[-0.32px] text-[#191c1d]">
          New Request
        </h2>
        <p className="text-[16px] text-[#46464e]">
          Submit a new delivery request for your organisation.
        </p>
      </div>

      <RequestForm />
    </div>
  );
}
