import { useAdmin } from "../../contexts/adminContext";
import Button from "../ui/Button";

export default function AdminAuth() {
  const { state, actions } = useAdmin();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
      <div className="glass rounded-2xl p-8 w-full max-w-sm animate-fade-in">
        <div className="mb-6">
          <h1 className="font-display text-xl text-white tracking-widest">
            wandr<span className="text-sky-400">/</span>ADMIN
          </h1>
          <p className="text-slate-600 text-xs mt-1.5 font-display tracking-wider">
            MODERATION DASHBOARD
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="password"
            value={state.secret}
            onChange={(e) => actions.setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void actions.authenticate()}
            placeholder="Enter admin secret…"
            className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-sky-500/40 transition-all font-display tracking-wide"
          />

          {state.authError && (
            <p className="text-red-400 text-xs font-display">{state.authError}</p>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={() => void actions.authenticate()}
            className="w-full text-white text-xs tracking-[0.15em] uppercase"
          >
            Authenticate
          </Button>
        </div>
      </div>
    </div>
  );
}

