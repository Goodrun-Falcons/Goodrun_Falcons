"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { AddressInput } from "@/components/AddressInput";
import { geocodeAddress, type Coordinates } from "@/lib/geocode";

type Urgency = "low" | "medium" | "high";

const URGENCY_OPTIONS: { value: Urgency; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function NewRequestPage() {
  const router = useRouter();

  const [itemType, setItemType] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("medium");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<Coordinates | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be signed in to submit a request.");
        return;
      }

      const pickup = pickupCoords ?? (await geocodeAddress(pickupAddress));
      const dropoff = dropoffAddress
        ? dropoffCoords ?? (await geocodeAddress(dropoffAddress))
        : null;

      const { error: insertError } = await supabase.from("items").insert({
        organisation_id: user.id,
        item_type: itemType,
        quantity,
        description: description || null,
        urgency,
        pickup_location: `POINT(${pickup.lng} ${pickup.lat})`,
        dropoff_location: dropoff ? `POINT(${dropoff.lng} ${dropoff.lat})` : null,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push("/org/requests");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

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

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-[640px] flex-col gap-5 rounded-lg border border-[#eaecf0] bg-white/95 p-[25px] shadow-sm"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="itemType" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
            Item Type
          </label>
          <input
            id="itemType"
            type="text"
            required
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            placeholder="e.g. First aid kits"
            className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] px-[13px] py-[15px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="quantity" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            required
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] px-[13px] py-[15px] text-[16px] text-[#191c1d] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
            Description <span className="font-normal text-[#6b7280]">(optional)</span>
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Any extra detail volunteers should know"
            className="w-full resize-none rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] px-[13px] py-[15px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">Urgency</span>
          <div className="flex gap-2">
            {URGENCY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setUrgency(option.value)}
                className={
                  urgency === option.value
                    ? "flex-1 rounded-lg bg-[#11183c] px-4 py-3 text-[12px] font-semibold text-white"
                    : "flex-1 rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] px-4 py-3 text-[12px] font-medium text-[#46464e]"
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <AddressInput
          id="pickupAddress"
          label="Pickup Address"
          value={pickupAddress}
          onChange={setPickupAddress}
          onSelectCoordinates={setPickupCoords}
          required
        />

        <AddressInput
          id="dropoffAddress"
          label="Dropoff Address (optional)"
          value={dropoffAddress}
          onChange={setDropoffAddress}
          onSelectCoordinates={setDropoffCoords}
        />

        {error && <p className="text-[13px] leading-[18px] text-[#b9100b]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#b9100b] px-4 py-3 text-[12px] font-semibold tracking-[0.6px] text-white disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
