"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatTicketNumber } from "@/lib/tickets";
import type { Database } from "../../../../supabase/types";

type Ticket = Database["public"]["Tables"]["support_tickets"]["Row"];
type TicketMessage = Database["public"]["Tables"]["support_ticket_messages"]["Row"];

function PhoneIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
      <path
        d="M3.4 1.5H5.6L6.9 4.7l-1.6 1.3a9.5 9.5 0 0 0 4.7 4.7l1.3-1.6 3.2 1.3v2.2c0 .7-.6 1.3-1.3 1.3C7.5 13.5 1.5 7.5 1.5 2.3c0-.7.6-1.3 1.3-1.3Z"
        stroke="#6b7280"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 16" fill="none" className="h-4 w-5">
      <path
        d="M1.667 2.667c0-.737.597-1.334 1.333-1.334h14c.736 0 1.333.597 1.333 1.334v10.666c0 .737-.597 1.334-1.333 1.334H3c-.736 0-1.333-.597-1.333-1.334V2.667Z"
        stroke="#6b7280"
        strokeWidth="1.3"
      />
      <path d="m2 3 8 6 8-6" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
      <path d="M2 2l12 12M14 2 2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    open: { bg: "#e7e8e9", text: "#46464e", label: "Open" },
    in_progress: { bg: "#dd3022", text: "#ffffff", label: "In Progress" },
    resolved: { bg: "#d8f6e3", text: "#0f5132", label: "Resolved" },
  };
  const cfg = map[status] ?? map.open;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[11px] uppercase"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  async function fetchTickets(userId: string): Promise<Ticket[]> {
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("organisation_id", userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  }

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setTickets(await fetchTickets(user.id));
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be signed in to submit a ticket.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("support_tickets").insert({
      organisation_id: user.id,
      subject,
      message,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSubject("");
    setMessage("");
    setTickets(await fetchTickets(user.id));
  }

  async function fetchMessages(ticketId: string): Promise<TicketMessage[]> {
    const { data } = await supabase
      .from("support_ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    return data ?? [];
  }

  async function openTicket(ticket: Ticket) {
    setSelectedTicket(ticket);
    setReplyText("");
    setReplyError(null);
    setMessagesLoading(true);
    setMessages(await fetchMessages(ticket.id));
    setMessagesLoading(false);
  }

  function closeTicket() {
    setSelectedTicket(null);
    setMessages([]);
    setReplyText("");
    setReplyError(null);
  }

  useEffect(() => {
    if (!selectedTicket) return;

    const channel = supabase
      .channel(`ticket-messages-${selectedTicket.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_ticket_messages", filter: `ticket_id=eq.${selectedTicket.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as TicketMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket]);

  async function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket) return;
    setReplyError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setReplyError("You must be signed in to reply.");
      return;
    }

    setReplySending(true);
    const { error: replyInsertError } = await supabase.from("support_ticket_messages").insert({
      ticket_id: selectedTicket.id,
      sender_type: "org",
      sender_id: user.id,
      message: replyText,
    });
    setReplySending(false);

    if (replyInsertError) {
      setReplyError(replyInsertError.message);
      return;
    }

    setReplyText("");
    setMessages(await fetchMessages(selectedTicket.id));
  }

  const isResolved = selectedTicket?.status === "resolved";

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-[32px] font-semibold leading-[40px] tracking-[-0.32px] text-[#191c1d]">
          Support
        </h2>
        <p className="text-[16px] text-[#46464e]">
          Get in touch with the Medical Pantry team or check on a request you&apos;ve already sent.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-lg border border-[#eaecf0] bg-white/95 p-[25px] shadow-sm">
          <h3 className="text-[16px] font-semibold text-[#191c1d]">Contact Us</h3>
          <a href="tel:+61390000000" className="flex items-center gap-3 text-[14px] text-[#46464e]">
            <PhoneIcon />
            (03) 9000 0000
          </a>
          <a href="mailto:support@medicalpantry.org" className="flex items-center gap-3 text-[14px] text-[#46464e]">
            <MailIcon />
            support@medicalpantry.org
          </a>
          <p className="pt-2 text-[12px] text-[#6b7280]">
            Mon–Fri, 9am–5pm AEST. For anything urgent, submitting a ticket
            below reaches the team fastest.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-[#eaecf0] bg-white/95 p-[25px] shadow-sm md:col-span-2">
          <h3 className="text-[16px] font-semibold text-[#191c1d]">Submit a Ticket</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="subject" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Delayed pickup for request #a1b2c3"
                className="w-full rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] px-[13px] py-[15px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="message" className="text-[12px] font-semibold tracking-[0.6px] text-[#191c1d]">
                Message
              </label>
              <textarea
                id="message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's going on"
                className="w-full resize-none rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] px-[13px] py-[15px] text-[16px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
              />
            </div>
            {error && <p className="text-[13px] leading-[18px] text-[#b9100b]">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-fit items-center justify-center gap-2 rounded-lg bg-[#b9100b] px-6 py-3 text-[12px] font-semibold tracking-[0.6px] text-white disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Ticket"}
            </button>
          </form>
        </div>
      </div>

      <div className="flex w-full flex-col items-start rounded-lg border border-[#eaecf0] bg-white/95 p-[25px] shadow-sm">
        <h3 className="pb-6 text-[20px] font-semibold text-[#191c1d]">Your Tickets</h3>
        {loading ? (
          <p className="text-[14px] text-[#46464e]">Loading…</p>
        ) : tickets.length === 0 ? (
          <p className="text-[14px] text-[#46464e]">You haven&apos;t submitted any tickets yet.</p>
        ) : (
          <div className="flex w-full flex-col gap-4">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => openTicket(ticket)}
                className="flex flex-col gap-1 rounded-lg border border-[#c7c5cf] bg-[#f8f9fa] p-[17px] text-left transition hover:border-[#11183c]"
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-[16px] font-semibold text-[#191c1d]"><span className="pr-2 text-[12px] font-semibold text-[#6b7280]">{formatTicketNumber(ticket.ticket_number)}</span>
                    {ticket.subject}</h4>
                  {statusBadge(ticket.status)}
                </div>
                <p className="line-clamp-2 text-[14px] text-[#46464e]">{ticket.message}</p>
                <span className="pt-1 text-[12px] text-[#6b7280]">
                  Submitted {new Date(ticket.created_at).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="flex max-h-[85vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex shrink-0 items-start justify-between border-b border-[#eaecf0] px-6 py-5">
              <div className="flex flex-col gap-1">
                <h3 className="text-[18px] font-semibold text-[#191c1d]">
                  <span className="pr-2 text-[13px] text-[#6b7280]">{formatTicketNumber(selectedTicket.ticket_number)}</span>
                  {selectedTicket.subject}
                </h3>
                <div className="flex items-center gap-2">
                  {statusBadge(selectedTicket.status)}
                  <span className="text-[12px] text-[#6b7280]">
                    Submitted {new Date(selectedTicket.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeTicket}
                aria-label="Close"
                className="flex size-7 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#f3f4f5] hover:text-[#191c1d]"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 self-start rounded-lg rounded-tl-none bg-[#f3f4f5] px-4 py-3 text-[14px] text-[#191c1d]">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#6b7280]">You</span>
                  <p>{selectedTicket.message}</p>
                </div>

                {messagesLoading ? (
                  <p className="text-[13px] text-[#6b7280]">Loading replies…</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={
                        msg.sender_type === "admin"
                          ? "flex flex-col gap-1 self-start rounded-lg rounded-tl-none bg-[#e8eaf6] px-4 py-3 text-[14px] text-[#191c1d]"
                          : "flex flex-col gap-1 self-end rounded-lg rounded-tr-none bg-[#11183c] px-4 py-3 text-[14px] text-white"
                      }
                    >
                      <span
                        className={
                          msg.sender_type === "admin"
                            ? "text-[11px] font-semibold uppercase tracking-[0.5px] text-[#46464e]"
                            : "text-[11px] font-semibold uppercase tracking-[0.5px] text-[#bec4f1]"
                        }
                      >
                        {msg.sender_type === "admin" ? "Medical Pantry Team" : "You"}
                      </span>
                      <p>{msg.message}</p>
                      <span
                        className={
                          msg.sender_type === "admin"
                            ? "text-[11px] text-[#6b7280]"
                            : "text-[11px] text-[#bec4f1]"
                        }
                      >
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-[#eaecf0] px-6 py-4">
              {isResolved ? (
                <p className="rounded-lg bg-[#f3f4f5] px-4 py-3 text-center text-[13px] text-[#6b7280]">
                  This ticket is resolved. Submit a new ticket if you need further help.
                </p>
              ) : (
                <form onSubmit={handleReplySubmit} className="flex flex-col gap-2">
                  <textarea
                    required
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply…"
                    className="w-full resize-none rounded-lg border border-[#e1e3e4] bg-[#f3f4f5] px-[13px] py-[11px] text-[14px] text-[#191c1d] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#11183c]"
                  />
                  {replyError && <p className="text-[13px] text-[#b9100b]">{replyError}</p>}
                  <button
                    type="submit"
                    disabled={replySending}
                    className="flex w-fit items-center justify-center gap-2 self-end rounded-lg bg-[#b9100b] px-5 py-2.5 text-[12px] font-semibold tracking-[0.6px] text-white disabled:opacity-60"
                  >
                    {replySending ? "Sending…" : "Send Reply"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
