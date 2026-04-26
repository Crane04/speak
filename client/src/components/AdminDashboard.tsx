import { useState, useEffect, useCallback } from "react";
import { AdminMessage } from "../types/message";
import {
  fetchAllAdminMessages,
  approveMessage,
  rejectMessage,
  deleteAdminMessage,
} from "../api/messages";
import MediaRenderer from "./MediaRenderer";

type FilterStatus = "pending" | "approved" | "rejected" | "all";

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  rejected: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function AdminDashboard() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const loadMessages = useCallback(
    async (filterStatus: FilterStatus, adminSecret: string) => {
      setLoading(true);
      try {
        const status = filterStatus === "all" ? undefined : filterStatus;
        const data = await fetchAllAdminMessages(adminSecret, status);
        setMessages(data);
        setAuthed(true);
        setAuthError(null);
      } catch {
        setAuthError("Authentication failed or server error.");
        setAuthed(false);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load counts for all statuses on auth
  const loadCounts = useCallback(async (adminSecret: string) => {
    const statuses: FilterStatus[] = ["pending", "approved", "rejected"];
    const results: Record<string, number> = {};
    await Promise.all(
      statuses.map(async (s) => {
        try {
          const data = await fetchAllAdminMessages(adminSecret, s);
          results[s] = data.length;
        } catch {
          results[s] = 0;
        }
      })
    );
    setCounts(results);
  }, []);

  const handleAuth = () => {
    if (!secret.trim()) return;
    loadMessages(filter, secret);
    loadCounts(secret);
  };

  useEffect(() => {
    if (authed && secret) {
      loadMessages(filter, secret);
    }
  }, [filter]);

  const handleAction = async (
    id: string,
    action: "approve" | "reject" | "delete"
  ) => {
    setActionLoading(id + action);
    try {
      if (action === "approve") await approveMessage(id, secret);
      else if (action === "reject") await rejectMessage(id, secret);
      else await deleteAdminMessage(id, secret);

      setMessages((prev) => prev.filter((m) => m.id !== id));
      setExpanded((prev) => (prev === id ? null : prev));

      // Update counts
      setCounts((prev) => {
        const next = { ...prev };
        if (action === "approve") {
          next.pending = Math.max(0, (next.pending ?? 0) - 1);
          next.approved = (next.approved ?? 0) + 1;
        } else if (action === "reject") {
          next.pending = Math.max(0, (next.pending ?? 0) - 1);
          next.rejected = (next.rejected ?? 0) + 1;
        } else {
          const msg = messages.find((m) => m.id === id);
          if (msg?.status) {
            next[msg.status] = Math.max(0, (next[msg.status] ?? 0) - 1);
          }
        }
        return next;
      });
    } catch {
      // Could show a toast here
    } finally {
      setActionLoading(null);
    }
  };

  // ── Auth gate ──
  if (!authed) {
    return (
      <div
        className="flex items-center justify-center min-h-screen px-4"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(14,165,233,0.04) 0%, transparent 70%)" }}
      >
        <div className="glass rounded-2xl p-8 w-full max-w-sm animate-fade-in">
          <div className="mb-6">
            <h1 className="font-display text-xl text-white tracking-widest">
              SPEAK<span className="text-sky-400">/</span>ADMIN
            </h1>
            <p className="text-slate-600 text-xs mt-1.5 font-display tracking-wider">
              MODERATION DASHBOARD
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              placeholder="Enter admin secret…"
              className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-sky-500/40 transition-all font-display tracking-wide"
            />

            {authError && (
              <p className="text-red-400 text-xs font-display">{authError}</p>
            )}

            <button
              onClick={handleAuth}
              className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-display text-xs tracking-[0.15em] uppercase transition-all"
            >
              Authenticate
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard ──
  const FILTERS: { value: FilterStatus; label: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "all", label: "All" },
  ];

  return (
    <div
      className="min-h-screen scrollable"
      style={{ background: "#030712", overflowY: "auto" }}
    >
      <div className="max-w-4xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl text-white tracking-widest">
              SPEAK<span className="text-sky-400">/</span>ADMIN
            </h1>
            <p className="text-slate-600 text-xs mt-1 font-display tracking-widest">
              MODERATION DASHBOARD
            </p>
          </div>

          {/* Counts */}
          <div className="flex gap-3">
            {(["pending", "approved", "rejected"] as FilterStatus[]).map((s) => (
              <div
                key={s}
                className={`text-center px-3 py-1.5 rounded-lg border ${
                  STATUS_COLORS[s] ?? ""
                }`}
              >
                <p className="text-base font-display leading-none">
                  {counts[s] ?? "—"}
                </p>
                <p className="text-[9px] uppercase tracking-widest opacity-60 mt-0.5">
                  {s}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/5 pb-4">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display uppercase tracking-widest transition-all ${
                filter === f.value
                  ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                  : "text-slate-600 hover:text-slate-400 border border-transparent"
              }`}
            >
              {f.label}
            </button>
          ))}

          <button
            onClick={() => loadMessages(filter, secret)}
            disabled={loading}
            className="ml-auto text-slate-600 hover:text-slate-400 text-xs font-display tracking-widest transition-colors disabled:opacity-40"
          >
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shimmer h-20 rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && messages.length === 0 && (
          <div className="text-center py-24">
            <p className="text-5xl mb-4 opacity-20">◌</p>
            <p className="font-display text-sm text-slate-700 tracking-widest">
              No {filter === "all" ? "" : filter} messages.
            </p>
          </div>
        )}

        {/* Message list */}
        {!loading && (
          <div className="space-y-2 animate-fade-in">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="glass rounded-xl overflow-hidden transition-all"
                style={{
                  borderColor:
                    expanded === msg.id
                      ? "rgba(56,189,248,0.12)"
                      : "rgba(255,255,255,0.04)",
                }}
              >
                {/* Row */}
                <div
                  className="flex items-start gap-4 px-4 py-3.5 cursor-pointer hover:bg-white/2 transition-colors"
                  onClick={() =>
                    setExpanded(expanded === msg.id ? null : msg.id)
                  }
                >
                  {/* Type badge */}
                  <div className="shrink-0 mt-0.5">
                    <span className="text-lg leading-none">
                      {msg.type === "text"
                        ? "📝"
                        : msg.type === "image"
                        ? "🖼"
                        : msg.type === "audio"
                        ? "🎵"
                        : msg.type === "video"
                        ? "🎬"
                        : "📄"}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-display text-slate-600 uppercase tracking-widest">
                        {msg.type}
                      </span>
                      {/* Status badge */}
                      <span
                        className={`text-[9px] font-display uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                          STATUS_COLORS[msg.status] ?? ""
                        }`}
                      >
                        {msg.status}
                      </span>
                      {msg.reportCount > 0 && (
                        <span className="text-[9px] font-display text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                          {msg.reportCount} report{msg.reportCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {msg.text && (
                      <p className="text-slate-300 text-sm line-clamp-2 leading-snug">
                        {msg.text}
                      </p>
                    )}
                    {!msg.text && msg.fileUrl && (
                      <p className="text-slate-600 text-sm italic">
                        Media attachment
                      </p>
                    )}

                    <p className="text-[11px] text-slate-700 mt-1 font-display">
                      {msg.lat.toFixed(4)}°,&nbsp;{msg.lng.toFixed(4)}° ·{" "}
                      {new Date(msg.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {msg.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleAction(msg.id, "approve")}
                          disabled={actionLoading === msg.id + "approve"}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-display uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all disabled:opacity-40"
                        >
                          {actionLoading === msg.id + "approve" ? "…" : "Approve"}
                        </button>
                        <button
                          onClick={() => handleAction(msg.id, "reject")}
                          disabled={actionLoading === msg.id + "reject"}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-display uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-40"
                        >
                          {actionLoading === msg.id + "reject" ? "…" : "Reject"}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleAction(msg.id, "delete")}
                      disabled={actionLoading === msg.id + "delete"}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-display uppercase tracking-wider bg-white/4 text-slate-600 border border-white/6 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all disabled:opacity-40"
                    >
                      {actionLoading === msg.id + "delete" ? "…" : "Del"}
                    </button>
                    <span className="text-slate-700 ml-1 text-xs">
                      {expanded === msg.id ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Expanded preview */}
                {expanded === msg.id && (
                  <div className="px-4 pb-4 border-t border-white/5 animate-fade-in">
                    <div className="pt-4">
                      {msg.fileUrl && (
                        <MediaRenderer
                          url={msg.fileUrl}
                          mimeType={msg.fileMimeType}
                          type={msg.type}
                        />
                      )}
                      {msg.text && msg.type === "text" && (
                        <div className="bg-white/3 rounded-xl p-4">
                          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-body">
                            {msg.text}
                          </p>
                        </div>
                      )}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-display text-slate-600">
                        <div>
                          <span className="text-slate-700">ID</span>
                          <p className="text-slate-500 truncate">{msg.id}</p>
                        </div>
                        <div>
                          <span className="text-slate-700">Coordinates</span>
                          <p className="text-slate-500">
                            {msg.lat.toFixed(6)}, {msg.lng.toFixed(6)}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-700">Submitted</span>
                          <p className="text-slate-500">
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-700">Reports</span>
                          <p className="text-slate-500">{msg.reportCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
