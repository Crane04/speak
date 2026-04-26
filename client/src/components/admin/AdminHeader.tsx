import { FilterStatus, useAdmin } from "../../contexts/adminContext";

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  rejected: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function AdminHeader() {
  const { state } = useAdmin();

  return (
    <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 className="font-display text-2xl text-white tracking-widest">
          SPEAK<span className="text-sky-400">/</span>ADMIN
        </h1>
        <p className="text-slate-600 text-xs mt-1 font-display tracking-widest">
          MODERATION DASHBOARD
        </p>
      </div>

      <div className="flex gap-3">
        {(["pending", "approved", "rejected"] as FilterStatus[]).map((s) => (
          <div
            key={s}
            className={`text-center px-3 py-1.5 rounded-lg border ${STATUS_COLORS[s] ?? ""}`}
          >
            <p className="text-base font-display leading-none">
              {state.counts[s] ?? "—"}
            </p>
            <p className="text-[9px] uppercase tracking-widest opacity-60 mt-0.5">
              {s}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

