import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDropMessageForm } from "../../contexts/dropMessageContext";
import { LuCheck } from "react-icons/lu";

export default function SuccessState() {
  const navigate = useNavigate();
  const { state } = useDropMessageForm();

  useEffect(() => {
    if (state.submitState !== "success") return;
    const t = window.setTimeout(() => navigate("/"), 3000);
    return () => window.clearTimeout(t);
  }, [navigate, state.submitState]);

  if (state.submitState !== "success") return null;

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-14 animate-fade-in">
      <div className="w-14 h-14 rounded-full border border-sky-500/40 flex items-center justify-center">
        <LuCheck className="text-sky-400" size={28} />
      </div>
      <div className="text-center">
        <h2 className="font-display text-lg text-sky-400 mb-1">
          Message dropped.
        </h2>
        <p className="text-slate-500 text-sm">
          It will appear on the globe once approved.
        </p>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-sky-500/50 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-slate-700 text-xs font-display">Returning to globe...</p>
    </div>
  );
}

