import { useDropMessageForm } from "../../contexts/dropMessageContext";
import { getTypeOption } from "./typeOptions";

export default function TextSection() {
  const { state, actions } = useDropMessageForm();
  const option = getTypeOption(state.type);

  if (state.type !== "text") return null;

  return (
    <div className="animate-fade-in">
      <textarea
        value={state.text}
        onChange={(e) => actions.setText(e.target.value)}
        rows={6}
        maxLength={2000}
        placeholder="What’s on your mind?"
        className="w-full bg-black/30 border border-white/8 rounded-2xl px-5 py-5 text-base text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/35 focus:bg-black/35 resize-none transition-all font-body leading-relaxed"
      />
      <div className="flex justify-between mt-1.5">
        <span className="text-[12px] text-slate-600 font-display">
          {option.hint}
        </span>
        <span
          className={`text-[11px] font-display transition-colors ${
            state.text.length > 1800 ? "text-orange-400" : "text-slate-700"
          }`}
        >
          {state.text.length} / 2000
        </span>
      </div>
    </div>
  );
}

