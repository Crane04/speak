import { useNavigate } from "react-router-dom";
import DropMessageForm from "../components/DropMessageForm";

export default function Drop() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen scrollable"
      style={{
        background:
          "radial-gradient(ellipse at 50% -10%, rgba(14,165,233,0.06) 0%, #030712 55%)",
        overflowY: "auto",
      }}
    >
      <div className="max-w-lg mx-auto px-5 py-10">
        {/* Nav */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-slate-600 hover:text-sky-400 text-xs font-display tracking-widest uppercase transition-colors mb-10"
        >
          ← Globe
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[10px] font-display text-sky-400/60 tracking-[0.2em] uppercase">
              Anonymous Drop
            </span>
          </div>
          <h1 className="font-display text-3xl text-white tracking-widest mb-2">
            DROP A MESSAGE
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed font-body">
            Leave a text, image, audio, video, or document pinned to any
            location on Earth. Your identity is never recorded.
          </p>
        </div>

        {/* Form card */}
        <div
          className="glass rounded-2xl p-6"
          style={{ border: "1px solid rgba(56,189,248,0.07)" }}
        >
          <DropMessageForm />
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-slate-800 mt-7 font-display tracking-widest leading-relaxed">
          MESSAGES ARE REVIEWED BEFORE GOING LIVE
          <br />
          NO ACCOUNT REQUIRED · IP NOT STORED
        </p>
      </div>
    </div>
  );
}
