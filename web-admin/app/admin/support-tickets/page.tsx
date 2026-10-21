"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatTicketNumber } from "@/lib/tickets";

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketStatus = "open" | "in_progress" | "resolved";

interface Ticket {
  id: string;
  ticket_number: number;
  subject: string;
  message: string;
  status: TicketStatus;
  created_at: string;
  organisations: { name: string } | null;
  volunteers: { full_name: string | null } | null;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: "org" | "admin";
  sender_id: string;
  message: string;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Tickets come from an organisation or a volunteer.
function ticketOwner(ticket: Pick<Ticket, "organisations" | "volunteers">): string {
  if (ticket.organisations) return ticket.organisations.name;
  if (ticket.volunteers) return `${ticket.volunteers.full_name ?? "Volunteer"} (volunteer)`;
  return "Unknown";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
}

function formatShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }) +
    " • " +
    d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="7" stroke="#6b7280" strokeWidth="1.5" />
      <path d="M14 14l4 4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M14 2L1 7l5 2.5L14 2ZM14 2L9 15l-2.5-5L14 2Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TicketStatus, { dot: string; bg: string; text: string; label: string }> = {
  open: {
    dot: "bg-[#b9100b]",
    bg: "bg-[rgba(185,16,11,0.1)]",
    text: "text-[#b9100b]",
    label: "Open",
  },
  in_progress: {
    dot: "bg-[#f57c00]",
    bg: "bg-[rgba(245,124,0,0.1)]",
    text: "text-[#f57c00]",
    label: "In Progress",
  },
  resolved: {
    dot: "bg-[#2e7d32]",
    bg: "bg-[rgba(46,125,50,0.1)]",
    text: "text-[#2e7d32]",
    label: "Resolved",
  },
};

function StatusBadge({ status }: { status: TicketStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1 ${c.bg}`}>
      <span className={`size-1.5 rounded-full ${c.dot}`} />
      <span className={`text-[11px] font-bold leading-[16.5px] ${c.text}`}>{c.label}</span>
    </span>
  );
}

// ─── Ticket list item ─────────────────────────────────────────────────────────

function TicketListItem({
  ticket,
  selected,
  onClick,
}: {
  ticket: Ticket;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-1.5 rounded-[4px] px-4 py-3 text-left transition-colors"
      style={{
        background: selected ? "rgba(17,24,60,0.06)" : "transparent",
        border: selected ? "1px solid #C7C5CF" : "1px solid transparent",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] font-semibold text-[#1b1b22]">
          <span className="pr-1.5 text-[11px] text-[#5c403b]">{formatTicketNumber(ticket.ticket_number)}</span>
          {ticket.subject}
        </span>
        <StatusBadge status={ticket.status} />
      </div>
      <span className="text-[12px] text-[#5c403b]">
        {ticketOwner(ticket)}
      </span>
      <span className="text-[11px] text-[#9ca3af]">{formatShort(ticket.created_at)}</span>
    </button>
  );
}

// ─── Thread message bubble ────────────────────────────────────────────────────

function MessageBubble({
  message,
  senderType,
}: {
  message: TicketMessage | { sender_type: "org" | "admin"; message: string; created_at: string; id: string };
  senderType: "org" | "admin";
}) {
  const isAdmin = senderType === "admin";
  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isAdmin
            ? "rounded-tr-sm bg-[#11183C] text-white"
            : "rounded-tl-sm bg-[#F5F2FC] text-[#1b1b22]"
        }`}
        style={{ border: isAdmin ? "none" : "1px solid #E5BDB7" }}
      >
        <p className="text-[13px] leading-relaxed">{message.message}</p>
        <p
          className={`mt-1 text-[10px] ${isAdmin ? "text-[rgba(255,255,255,0.6)]" : "text-[#9ca3af]"}`}
        >
          {formatDate(message.created_at)}
        </p>
      </div>
    </div>
  );
}

// ─── Opening message bubble (from support_tickets.message) ───────────────────

function OpeningMessage({ ticket }: { ticket: Ticket }) {
  return (
    <div className="flex justify-start">
      <div
        className="max-w-[70%] rounded-2xl rounded-tl-sm px-4 py-3"
        style={{ background: "#F5F2FC", border: "1px solid #E5BDB7" }}
      >
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-[#5c403b]">
          Initial Message
        </p>
        <p className="text-[13px] leading-relaxed text-[#1b1b22]">{ticket.message}</p>
        <p className="mt-1 text-[10px] text-[#9ca3af]">{formatDate(ticket.created_at)}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("all");
  const [adminId, setAdminId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load admin user id once
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setAdminId(user.id);
    });
  }, []);

  const loadTickets = useCallback(async () => {
    const { data } = await supabase
      .from("support_tickets")
      .select("id, ticket_number, subject, message, status, created_at, organisations(name), volunteers(full_name)")
      .order("created_at", { ascending: false });

    if (data) setTickets(data as unknown as Ticket[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Load messages when a ticket is selected
  useEffect(() => {
    if (!selectedTicket) {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);

    supabase
      .from("support_ticket_messages")
      .select("id, ticket_id, sender_type, sender_id, message, created_at")
      .eq("ticket_id", selectedTicket.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as TicketMessage[]);
        setMessagesLoading(false);
      });

    // Realtime subscription on this ticket's messages
    const channel = supabase
      .channel(`ticket-messages-${selectedTicket.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_ticket_messages",
          filter: `ticket_id=eq.${selectedTicket.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            const incoming = payload.new as TicketMessage;
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket]);

  // Scroll to bottom when messages load or new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendReply() {
    if (!reply.trim() || !selectedTicket || !adminId) return;
    setSending(true);
    const { error } = await supabase.from("support_ticket_messages").insert({
      ticket_id: selectedTicket.id,
      sender_type: "admin",
      sender_id: adminId,
      message: reply.trim(),
    });

    if (error) {
      alert("Failed to send reply: " + error.message);
    } else {
      setReply("");
    }
    setSending(false);
  }

  async function handleStatusChange(newStatus: TicketStatus) {
    if (!selectedTicket) return;
    setStatusSaving(true);

    const { error } = await supabase
      .from("support_tickets")
      .update({ status: newStatus })
      .eq("id", selectedTicket.id);

    if (error) {
      alert("Failed to update status: " + error.message);
    } else {
      const updated = { ...selectedTicket, status: newStatus };
      setSelectedTicket(updated);
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? updated : t))
      );
    }
    setStatusSaving(false);
  }

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !searchLower ||
      t.subject.toLowerCase().includes(searchLower) ||
      formatTicketNumber(t.ticket_number).toLowerCase().includes(searchLower) ||
      ticketOwner(t).toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  const canReply = selectedTicket?.status !== "resolved";

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left panel: ticket list ── */}
      <div
        className="flex w-[320px] shrink-0 flex-col overflow-hidden"
        style={{ borderRight: "1px solid #E5BDB7" }}
      >
        {/* List header */}
        <div className="flex flex-col gap-3 p-4" style={{ borderBottom: "1px solid #E5BDB7" }}>
          <h2 className="text-[20px] font-bold text-[#1b1b22]">Support Tickets</h2>

          {/* Search */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject or org…"
              className="h-9 w-full rounded-[4px] border border-[#e5bdb7] bg-[#fbf8ff] pl-8 pr-3 text-[12px] text-[#1b1b22] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#11183c]"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "open", "in_progress", "resolved"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className="rounded-[2px] px-2.5 py-1 text-[11px] font-semibold transition-colors"
                style={{
                  background: filterStatus === s ? "#11183C" : "rgba(17,24,60,0.06)",
                  color: filterStatus === s ? "white" : "#5c403b",
                }}
              >
                {s === "all" ? "All" : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <p className="py-8 text-center text-[13px] text-[#5c403b]">Loading…</p>
          ) : filteredTickets.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#5c403b]">No tickets found</p>
          ) : (
            filteredTickets.map((ticket) => (
              <TicketListItem
                key={ticket.id}
                ticket={ticket}
                selected={selectedTicket?.id === ticket.id}
                onClick={() => setSelectedTicket(ticket)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right panel: thread view ── */}
      {selectedTicket ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Thread header */}
          <div
            className="flex shrink-0 items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid #E5BDB7", background: "#F5F2FC" }}
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-[16px] font-semibold text-[#1b1b22]">
                <span className="pr-2 text-[12px] text-[#5c403b]">{formatTicketNumber(selectedTicket.ticket_number)}</span>
                {selectedTicket.subject}
              </h3>
              <span className="text-[12px] text-[#5c403b]">
                {ticketOwner(selectedTicket)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={selectedTicket.status} />
              <select
                value={selectedTicket.status}
                disabled={statusSaving}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                className="h-9 rounded-[4px] border border-[#e5bdb7] bg-white px-3 text-[12px] font-medium text-[#1b1b22] focus:outline-none focus:ring-1 focus:ring-[#11183c] disabled:opacity-50"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {messagesLoading ? (
              <p className="py-8 text-center text-[13px] text-[#5c403b]">Loading thread…</p>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Opening message from support_tickets.message */}
                <OpeningMessage ticket={selectedTicket} />

                {/* Thread replies */}
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    senderType={msg.sender_type}
                  />
                ))}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Reply input */}
          <div
            className="shrink-0 px-6 py-4"
            style={{ borderTop: "1px solid #E5BDB7", background: "#F8F9FA" }}
          >
            {canReply ? (
              <div className="flex items-end gap-3">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder="Type your reply… (Enter to send, Shift+Enter for new line)"
                  rows={3}
                  className="flex-1 resize-none rounded-lg px-3 py-2.5 text-[13px] leading-relaxed text-[#1b1b22] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
                  style={{ border: "1px solid #E5BDB7", background: "#FBF8FF" }}
                />
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={sending || !reply.trim()}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#11183C] transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  <SendIcon />
                </button>
              </div>
            ) : (
              <p className="text-center text-[13px] text-[#9ca3af]">
                This ticket is resolved. Reopen it to reply.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="8" width="40" height="32" rx="3" stroke="#C7C5CF" strokeWidth="1.5" />
              <path d="M12 18h24M12 26h16" stroke="#C7C5CF" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-[14px] font-medium text-[#5c403b]">Select a ticket to view the thread</p>
          </div>
        </div>
      )}
    </div>
  );
}
