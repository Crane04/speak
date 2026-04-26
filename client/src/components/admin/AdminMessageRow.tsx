import { AdminMessage } from "../../types/message";
import { useAdmin } from "../../contexts/adminContext";
import MediaRenderer from "../MediaRenderer";
import Button from "../ui/Button";

const TYPE_ICON: Record<string, string> = {
  text: "T",
  image: "IMG",
  audio: "AUD",
  video: "VID",
  document: "DOC",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  rejected: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function AdminMessageRow({ msg }: { msg: AdminMessage }) {
  const { state, actions } = useAdmin();
  const expanded = state.expanded === msg.id;

  return (
    <div
      className="glass rounded-xl overflow-hidden transition-all"
      style={{
        borderColor: expanded
          ? "rgba(56,189,248,0.12)"
          : "rgba(255,255,255,0.04)",
      }}
    >
      <div
        className="flex items-start gap-4 px-4 py-3.5 cursor-pointer hover:bg-white/2 transition-colors"
        onClick={() => actions.toggleExpanded(msg.id)}
      >
        <div className="shrink-0 mt-0.5">
          <span className="text-[10px] font-display text-slate-500 uppercase tracking-widest px-2 py-1 border border-white/8 rounded-lg">
            {TYPE_ICON[msg.type] ?? msg.type}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-display text-slate-600 uppercase tracking-widest">
              {msg.type}
            </span>
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
            <p className="text-slate-600 text-sm italic">Media attachment</p>
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

        <div
          className="flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {msg.status === "pending" && (
            <>
              <Button
                onClick={() => void actions.action(msg.id, "approve")}
                disabled={state.actionLoading === msg.id + "approve"}
                variant="outline"
                size="sm"
                className="rounded-lg text-[11px] uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/25"
              >
                {state.actionLoading === msg.id + "approve" ? "…" : "Approve"}
              </Button>
              <Button
                onClick={() => void actions.action(msg.id, "reject")}
                disabled={state.actionLoading === msg.id + "reject"}
                variant="danger"
                size="sm"
                className="rounded-lg text-[11px] uppercase tracking-wider"
              >
                {state.actionLoading === msg.id + "reject" ? "…" : "Reject"}
              </Button>
            </>
          )}
          <Button
            onClick={() => void actions.action(msg.id, "delete")}
            disabled={state.actionLoading === msg.id + "delete"}
            variant="outline"
            size="sm"
            className="rounded-lg text-[11px] uppercase tracking-wider bg-white/4 text-slate-500 border-white/6 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/20"
          >
            {state.actionLoading === msg.id + "delete" ? "…" : "Del"}
          </Button>
          <span className="text-slate-700 ml-1 text-xs">
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {expanded && (
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
  );
}

