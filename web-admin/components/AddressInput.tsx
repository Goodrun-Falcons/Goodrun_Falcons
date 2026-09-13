"use client";

function MapPinIcon() {
  return (
    <svg viewBox="0 0 16 20" fill="none" className="h-5 w-4">
      <path
        d="M8 19S1.5 12.5 1.5 8a6.5 6.5 0 0 1 13 0C14.5 12.5 8 19 8 19Z"
        stroke="#6b7280"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2.25" stroke="#6b7280" strokeWidth="1.3" />
    </svg>
  );
}

type AddressInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
};

/**
 * Plain text address input for now. Swap the <input> below for Mapbox's
 * SearchBox/geocoding autocomplete when that's wired up — the
 * value/onChange contract stays the same, so no caller needs to change.
 */
export function AddressInput({
  id,
  label,
  value,
  onChange,
  required,
  placeholder = "123 Collins Street, Melbourne VIC",
}: AddressInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] py-[15px] pl-[41px] pr-[13px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
        />
        <span className="absolute inset-y-0 left-3 flex items-center">
          <MapPinIcon />
        </span>
      </div>
    </div>
  );
}
