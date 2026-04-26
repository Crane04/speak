import { useDropMessageForm } from "../../contexts/dropMessageContext";
import Button from "../ui/Button";

export default function ErrorBanner() {
  const { state, actions } = useDropMessageForm();
  if (!state.errorMsg) return null;

  return (
    <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 animate-fade-in">
      <p className="text-sm text-red-300 font-display">{state.errorMsg}</p>
      <div className="mt-2 flex items-center gap-4">
        <Button
          variant="link"
          onClick={actions.clearError}
          className="text-slate-300 hover:text-slate-100"
        >
          Dismiss
        </Button>
        <Button
          variant="link"
          onClick={actions.autoFillFromIp}
        >
          Retry location
        </Button>
      </div>
    </div>
  );
}
