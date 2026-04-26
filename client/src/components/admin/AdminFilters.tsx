import { FilterStatus, useAdmin } from "../../contexts/adminContext";
import Button from "../ui/Button";
import { cn } from "../ui/cn";

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

export default function AdminFilters() {
  const { state, actions } = useAdmin();

  return (
    <div className="flex gap-2 mb-6 border-b border-white/5 pb-4">
      {FILTERS.map((f) => (
        <Button
          key={f.value}
          onClick={() => actions.setFilter(f.value)}
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-lg text-xs uppercase tracking-widest border",
            state.filter === f.value
              ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
              : "text-slate-600 hover:text-slate-400 border-transparent",
          )}
        >
          {f.label}
        </Button>
      ))}

      <Button
        onClick={() => void actions.refresh()}
        disabled={state.loading}
        variant="link"
        className="ml-auto text-slate-600 hover:text-slate-400 text-xs tracking-widest"
      >
        {state.loading ? "Loading…" : "↻ Refresh"}
      </Button>
    </div>
  );
}

