import { useState, useRef, ChangeEvent, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MessageType } from "../types/message";
import { submitMessage } from "../api/messages";

interface TypeOption {
  value: MessageType;
  label: string;
  emoji: string;
  accept: string;
  hint: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  { value: "text", label: "Text", emoji: "📝", accept: "", hint: "Write up to 2000 characters" },
  { value: "image", label: "Image", emoji: "🖼", accept: "image/*", hint: "JPG, PNG, GIF, WebP · max 50MB" },
  { value: "audio", label: "Audio", emoji: "🎵", accept: "audio/*", hint: "MP3, WAV, OGG · max 50MB" },
  { value: "video", label: "Video", emoji: "🎬", accept: "video/*", hint: "MP4, WebM · max 50MB" },
  {
    value: "document",
    label: "Doc",
    emoji: "📄",
    accept: ".pdf,.doc,.docx,.txt,application/pdf",
    hint: "PDF, DOCX, TXT · max 50MB",
  },
];

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function DropMessageForm() {
  const navigate = useNavigate();
  const [type, setType] = useState<MessageType>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentTypeOption = TYPE_OPTIONS.find((o) => o.value === type)!;

  const handleTypeChange = (newType: MessageType) => {
    setType(newType);
    setFile(null);
    setErrorMsg(null);
  };

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation not supported by your browser.");
      return;
    }
    setLocLoading(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocLoading(false);
      },
      () => {
        setErrorMsg("Could not detect location. Please enter manually.");
        setLocLoading(false);
      },
      { timeout: 8000 }
    );
  }, []);

  const handleFileChange = (f: File) => {
    setFile(f);
    setUploadProgress(0);
    setErrorMsg(null);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileChange(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileChange(f);
  };

  const validate = (): string | null => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!lat || !lng || isNaN(latNum) || isNaN(lngNum)) return "Please provide a valid location.";
    if (latNum < -90 || latNum > 90) return "Latitude must be between -90 and 90.";
    if (lngNum < -180 || lngNum > 180) return "Longitude must be between -180 and 180.";
    if (type === "text" && text.trim().length === 0) return "Message text cannot be empty.";
    if (type === "text" && text.trim().length > 2000) return "Message cannot exceed 2000 characters.";
    if (type !== "text" && !file) return `Please attach a ${type} file.`;
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setErrorMsg(null);
    setSubmitState("submitting");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("type", type);
    formData.append("lat", lat);
    formData.append("lng", lng);
    if (type === "text") {
      formData.append("text", text.trim());
    } else if (file) {
      formData.append("file", file);
    }

    // Simulate upload progress for UX
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => (p < 80 ? p + 8 : p));
    }, 200);

    try {
      await submitMessage(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setSubmitState("success");
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      clearInterval(progressInterval);
      setErrorMsg(err instanceof Error ? err.message : "Submission failed. Please try again.");
      setSubmitState("error");
    }
  };

  if (submitState === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-14 animate-fade-in">
        <div className="w-14 h-14 rounded-full border border-sky-500/40 flex items-center justify-center">
          <span className="text-sky-400 text-2xl">✓</span>
        </div>
        <div className="text-center">
          <h2 className="font-display text-lg text-sky-400 mb-1">Message dropped.</h2>
          <p className="text-slate-500 text-sm">It will appear on the globe once approved.</p>
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

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Type selector */}
      <div>
        <label className="block text-[10px] font-display text-slate-600 uppercase tracking-[0.15em] mb-3">
          Message Type
        </label>
        <div className="flex gap-2 flex-wrap">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleTypeChange(opt.value)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm transition-all border ${
                type === opt.value
                  ? "bg-sky-500/15 border-sky-500/40 text-sky-300"
                  : "border-white/6 text-slate-500 hover:border-white/12 hover:text-slate-300 bg-white/2"
              }`}
            >
              <span className="text-base leading-none">{opt.emoji}</span>
              <span className="font-display text-xs tracking-wide">{opt.label}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-700 mt-2">{currentTypeOption.hint}</p>
      </div>

      {/* Text input */}
      {type === "text" && (
        <div className="animate-fade-in">
          <label className="block text-[10px] font-display text-slate-600 uppercase tracking-[0.15em] mb-2">
            Your Message
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            maxLength={2000}
            placeholder="Say something to the world…"
            className="w-full bg-white/3 border border-white/7 rounded-xl px-4 py-3.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-sky-500/40 focus:bg-white/5 resize-none transition-all font-body leading-relaxed"
          />
          <div className="flex justify-between mt-1.5">
            <span />
            <span
              className={`text-[11px] font-display transition-colors ${
                text.length > 1800 ? "text-orange-400" : "text-slate-700"
              }`}
            >
              {text.length} / 2000
            </span>
          </div>
        </div>
      )}

      {/* File upload */}
      {type !== "text" && (
        <div className="animate-fade-in">
          <label className="block text-[10px] font-display text-slate-600 uppercase tracking-[0.15em] mb-2">
            Attach {type.charAt(0).toUpperCase() + type.slice(1)}
          </label>
          <input
            ref={fileRef}
            type="file"
            accept={currentTypeOption.accept}
            onChange={handleFileInput}
            className="hidden"
          />
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`w-full border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-sky-500/50 bg-sky-500/8"
                : file
                ? "border-sky-500/30 bg-sky-500/5"
                : "border-white/8 hover:border-white/15 hover:bg-white/3"
            }`}
          >
            {file ? (
              <div className="space-y-1">
                <p className="text-sky-400 text-sm font-display truncate px-4">{file.name}</p>
                <p className="text-slate-600 text-xs">
                  {(file.size / 1024 / 1024).toFixed(1)} MB · Click to change
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-3xl opacity-40">{currentTypeOption.emoji}</p>
                <p className="text-slate-600 text-sm">
                  Click to upload or drag & drop
                </p>
                <p className="text-slate-700 text-xs">{currentTypeOption.hint}</p>
              </div>
            )}
          </div>

          {/* Upload progress bar */}
          {submitState === "submitting" && (
            <div className="mt-3">
              <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-600 font-display mt-1 text-right">
                {uploadProgress}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Location */}
      <div>
        <label className="block text-[10px] font-display text-slate-600 uppercase tracking-[0.15em] mb-3">
          Location
        </label>

        <button
          onClick={getLocation}
          disabled={locLoading}
          className={`w-full py-2.5 rounded-xl border text-sm transition-all mb-3 font-display tracking-wide ${
            locLoading
              ? "border-white/5 text-slate-600 cursor-not-allowed"
              : lat && lng
              ? "border-sky-500/30 text-sky-400 bg-sky-500/5 hover:bg-sky-500/10"
              : "border-white/8 text-slate-400 hover:border-white/15 hover:text-sky-400"
          }`}
        >
          {locLoading
            ? "Detecting location…"
            : lat && lng
            ? "📍 Location detected · Click to update"
            : "📍 Detect my location"}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-slate-700 mb-1.5 font-display tracking-wide">
              Latitude
            </label>
            <input
              type="number"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="e.g. 40.7128"
              min={-90}
              max={90}
              step="any"
              className="w-full bg-white/3 border border-white/7 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-sky-500/40 transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-700 mb-1.5 font-display tracking-wide">
              Longitude
            </label>
            <input
              type="number"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="e.g. -74.0060"
              min={-180}
              max={180}
              step="any"
              className="w-full bg-white/3 border border-white/7 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-sky-500/40 transition-all"
            />
          </div>
        </div>

        {lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng)) && (
          <p className="text-[11px] text-sky-400/50 mt-2 font-display">
            ◉ {parseFloat(lat).toFixed(4)}°N, {parseFloat(lng).toFixed(4)}°E
          </p>
        )}
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 animate-fade-in">
          <p className="text-sm text-red-400">{errorMsg}</p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitState === "submitting"}
        className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-display text-sm tracking-[0.12em] uppercase transition-all"
      >
        {submitState === "submitting" ? (
          <span className="flex items-center justify-center gap-2">
            <span>Dropping</span>
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block w-1 h-1 rounded-full bg-white/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </span>
          </span>
        ) : (
          "Drop Message"
        )}
      </button>
    </div>
  );
}
