type Level = { label: string; bg: string; text: string; dot: string };

// High reads "Urgent" in lists; Medium/Low are muted so the red stays meaningful.
const LEVELS: Record<string, Level> = {
  high: { label: "Urgent", bg: "#ffdad6", text: "#93000a", dot: "#b9100b" },
  medium: { label: "Medium", bg: "#fdecc8", text: "#7a4b00", dot: "#d98a00" },
  low: { label: "Low", bg: "#e7e8e9", text: "#46464e", dot: "#8a8f98" },
};

// "pill" is the org-side look, "tag" the compact admin-table look.
export function UrgencyBadge({
  urgency,
  size = "pill",
}: Readonly<{ urgency: string; size?: "pill" | "tag" }>) {
  const level = LEVELS[urgency];
  if (!level) return null;

  const shape =
    size === "tag"
      ? "rounded-sm px-1.5 py-0.5 text-[10px] font-bold tracking-[0.05em]"
      : "rounded-full px-2 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex w-fit items-center gap-1 uppercase ${shape}`}
      style={{ background: level.bg, color: level.text }}
    >
      <span className="size-1.5 rounded-full" style={{ background: level.dot }} />
      {level.label}
    </span>
  );
}
