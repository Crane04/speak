import { ChangeEvent, useMemo, useRef, useState } from "react";
import { useDropMessageForm } from "../../contexts/dropMessageContext";
import { getTypeOption } from "./typeOptions";

export default function FileSection() {
  const { state, actions } = useDropMessageForm();
  const option = useMemo(() => getTypeOption(state.type), [state.type]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (state.type === "text") return null;

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f) actions.setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0] ?? null;
    if (f) actions.setFile(f);
  };

  return (
    <div className="animate-fade-in">
      <input
        ref={fileRef}
        type="file"
        accept={option.accept}
        onChange={handleFileInput}
        className="hidden"
      />

      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`w-full border border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-sky-500/50 bg-sky-500/8"
            : state.file
              ? "border-sky-500/30 bg-sky-500/5"
              : "border-white/8 hover:border-white/15 hover:bg-white/3"
        }`}
      >
        {state.file ? (
          <div className="space-y-1">
            <p className="text-sky-200 text-base font-display truncate px-4">
              {state.file.name}
            </p>
            <p className="text-slate-500 text-sm font-display">
              {(state.file.size / 1024 / 1024).toFixed(1)} MB · Click to change
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-slate-500 text-lg font-display">drag media here</p>
            <p className="text-slate-600 text-sm font-display">{option.hint}</p>
          </div>
        )}
      </div>

      {state.submitState === "submitting" && (
        <div className="mt-3">
          <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-300 rounded-full"
              style={{ width: `${state.uploadProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-600 font-display mt-1 text-right">
            {state.uploadProgress}%
          </p>
        </div>
      )}
    </div>
  );
}

