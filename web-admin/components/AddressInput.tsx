"use client";

import { useEffect, useRef, useState } from "react";
import { suggestAddresses, type AddressSuggestion, type Coordinates } from "@/lib/geocode";

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
  onSelectCoordinates?: (coords: Coordinates | null) => void;
  required?: boolean;
  placeholder?: string;
};

export function AddressInput({
  id,
  label,
  value,
  onChange,
  onSelectCoordinates,
  required,
  placeholder = "123 Collins Street, Melbourne VIC",
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(newValue: string) {
    onChange(newValue);
    onSelectCoordinates?.(null);
    setHighlightedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (newValue.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      const results = await suggestAddresses(newValue, controller.signal).catch(() => []);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    }, 300);
  }

  function selectSuggestion(suggestion: AddressSuggestion) {
    onChange(suggestion.fullAddress);
    onSelectCoordinates?.(suggestion.coordinates);
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
        {label}
      </label>
      <div ref={containerRef} className="relative">
        <input
          id={id}
          type="text"
          required={required}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
          className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] py-[15px] pl-[41px] pr-[13px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
        />
        <span className="absolute inset-y-0 left-3 flex items-center">
          <MapPinIcon />
        </span>

        {isOpen && suggestions.length > 0 && (
          <ul
            id={`${id}-listbox`}
            role="listbox"
            className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded-lg border border-[#e1e3e4] bg-white shadow-sm"
          >
            {suggestions.map((suggestion, i) => (
              <li
                key={suggestion.id}
                role="option"
                aria-selected={i === highlightedIndex}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setHighlightedIndex(i)}
                className={
                  i === highlightedIndex
                    ? "cursor-pointer px-[13px] py-2.5 text-[14px] text-[#191c1d] bg-[#f3f4f5]"
                    : "cursor-pointer px-[13px] py-2.5 text-[14px] text-[#191c1d]"
                }
              >
                {suggestion.fullAddress}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
