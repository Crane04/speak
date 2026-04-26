import { useAdmin } from "../../contexts/adminContext";
import AdminMessageRow from "./AdminMessageRow";

export default function AdminMessageList() {
  const { state } = useAdmin();

  if (state.loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="shimmer h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (state.messages.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-5xl mb-4 opacity-20">◌</p>
        <p className="font-display text-sm text-slate-700 tracking-widest">
          No {state.filter === "all" ? "" : state.filter} messages.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 animate-fade-in">
      {state.messages.map((msg) => (
        <AdminMessageRow key={msg.id} msg={msg} />
      ))}
    </div>
  );
}

