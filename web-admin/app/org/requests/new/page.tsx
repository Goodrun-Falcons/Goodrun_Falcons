"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { AddressInput } from "@/components/AddressInput";
import { geocodeAddress, type Coordinates } from "@/lib/geocode";
import { TAG_OPTIONS, type Tag } from "@/lib/tags";

type Urgency = "low" | "medium" | "high";

type ItemRow = {
  itemType: string;
  quantity: number;
};

const URGENCY_OPTIONS: { value: Urgency; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function emptyItemRow(): ItemRow {
  return { itemType: "", quantity: 1 };
}

export default function NewRequestPage() {
  const router = useRouter();

  const [items, setItems] = useState<ItemRow[]>([emptyItemRow()]);
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("medium");
  const [tag, setTag] = useState<Tag | "">("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<Coordinates | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItemRow()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

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

      const { data: request, error: insertError } = await supabase
        .from("requests")
        .insert({
          organisation_id: user.id,
          description: description || null,
          urgency,
          tag: tag || null,
          pickup_address: pickupAddress.trim(),
          dropoff_address: dropoffAddress.trim() || null,
          pickup_location: `POINT(${pickup.lng} ${pickup.lat})`,
          dropoff_location: dropoff ? `POINT(${dropoff.lng} ${dropoff.lat})` : null,
        })
        .select()
        .single();

      if (insertError || !request) {
        setError(insertError?.message ?? "Something went wrong. Please try again.");
        return;
      }

      const { error: itemsError } = await supabase.from("request_items").insert(
        items.map((row) => ({
          request_id: request.id,
          item_type: row.itemType,
          quantity: row.quantity,
        }))
      );

      if (itemsError) {
        await supabase.from("requests").delete().eq("id", request.id);
        setError(itemsError.message);
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
        <div className="flex flex-col gap-4">
          <span className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">Items</span>
          {items.map((row, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex flex-1 flex-col gap-2">
                <label htmlFor={`itemType-${index}`} className="sr-only">
                  Item Type
                </label>
                <input
                  id={`itemType-${index}`}
                  type="text"
                  required
                  value={row.itemType}
                  onChange={(e) => updateItem(index, { itemType: e.target.value })}
                  placeholder="e.g. First aid kits"
                  className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] px-[13px] py-[15px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
                />
              </div>
              <div className="flex w-24 flex-col gap-2">
                <label htmlFor={`quantity-${index}`} className="sr-only">
                  Quantity
                </label>
                <input
                  id={`quantity-${index}`}
                  type="number"
                  required
                  min={1}
                  value={row.quantity}
                  onChange={(e) =>
                    updateItem(index, { quantity: Math.max(1, Number(e.target.value)) })
                  }
                  className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] px-[13px] py-[15px] text-[16px] text-[#191c1d] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
                aria-label="Remove item"
                className="flex items-center justify-center rounded-lg px-3 text-[20px] text-[#6b7280] transition-colors hover:bg-[#f3f4f5] hover:text-[#b9100b] disabled:cursor-not-allowed disabled:opacity-30"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="w-fit text-[12px] font-semibold text-[#b9100b]"
          >
            + Add another item
          </button>
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
          <label htmlFor="tag" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
            Team Tag
          </label>
          <select
            id="tag"
            required
            value={tag}
            onChange={(e) => setTag(e.target.value as Tag)}
            className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] px-[13px] py-[15px] text-[16px] text-[#191c1d] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
          >
            <option value="" disabled>
              Select a team
            </option>
            {TAG_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
