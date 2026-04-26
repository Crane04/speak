import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import GlobeView from "../components/GlobeView";
import MessageModal from "../components/MessageModal";
import { MessagePin, MessageType } from "../types/message";
import { fetchPins } from "../api/messages";

const TYPE_COLORS: Record<MessageType, string> = {
  text: "#e2e8f0",
  image: "#7dd3fc",
  audio: "#86efac",
  video: "#f9a8d4",
  document: "#fde68a",
};

const LEGEND: { type: MessageType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "image", label: "Image" },
  { type: "audio", label: "Audio" },
  { type: "video", label: "Video" },
  { type: "document", label: "Doc" },
];

export default function Home() {
  const navigate = useNavigate();
  const [pins, setPins] = useState<MessagePin[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadPins = useCallback(async () => {
    try {
      const data = await fetchPins();
      setPins(data);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPins();
    // Refresh pins every 60 seconds
    intervalRef.current = setInterval(loadPins, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadPins]);

  const handlePinClick = useCallback((pin: MessagePin) => {
    setSelectedId(pin.id);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#030712" }}>

      {/* Radial glow behind globe */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(14,165,233,0.04) 0%, transparent 65%)",
        }}
      />

      {/* Globe */}
      {!loading && (
        <div className="animate-fade-in">
          <GlobeView
            pins={pins}
            selectedId={selectedId}
            onPinClick={handlePinClick}
          />
        </div>
      )}

      {/* Loading screen */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10">
          <div className="text-center space-y-2">
            <h1 className="font-display text-5xl tracking-[0.25em] text-white">
              SPEAK
            </h1>
            <p className="text-slate-700 text-xs font-display tracking-[0.3em]">
              ANONYMOUS · EVERYWHERE
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-sky-500 animate-bounce"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
          {loadError && (
            <p className="text-red-400/60 text-xs font-display">
              Failed to load. Retrying…
            </p>
          )}
        </div>
      )}

      {/* Brand — top left */}
      {!loading && (
        <div className="absolute top-5 left-6 z-10 pointer-events-none select-none animate-fade-in">
          <h1 className="font-display text-lg tracking-[0.3em] text-white">
            SPEAK
          </h1>
          <p className="text-[10px] text-slate-700 font-display tracking-[0.2em] mt-0.5">
            ANONYMOUS · GLOBAL
          </p>
        </div>
      )}

      {/* Pin count — top right */}
      {!loading && pins.length > 0 && (
        <div className="absolute top-5 right-5 z-10 pointer-events-none animate-fade-in">
          <div
            className="glass flex items-center gap-2 rounded-full px-3.5 py-1.5"
            style={{ border: "1px solid rgba(56,189,248,0.12)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"
            />
            <span className="text-[11px] font-display text-slate-400 tracking-wider">
              {pins.length.toLocaleString()} message{pins.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {/* Drop button — bottom center */}
      {!loading && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-fade-in">
          <button
            onClick={() => navigate("/drop")}
            className="flex items-center gap-2.5 glass px-7 py-3.5 rounded-full font-display text-xs text-sky-400 hover:text-sky-300 tracking-[0.15em] uppercase transition-all group"
            style={{ border: "1px solid rgba(56,189,248,0.25)" }}
          >
            <span
              className="w-5 h-5 rounded-full border border-sky-500/40 flex items-center justify-center text-base leading-none group-hover:border-sky-400/60 transition-colors"
            >
              +
            </span>
            Drop a Message
          </button>
        </div>
      )}

      {/* Legend — bottom right */}
      {!loading && (
        <div className="absolute bottom-8 right-5 z-10 animate-fade-in">
          <div className="glass rounded-xl p-3 space-y-1.5">
            {LEGEND.map((item) => (
              <div key={item.type} className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: TYPE_COLORS[item.type] }}
                />
                <span className="text-[10px] text-slate-600 font-display tracking-wider">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hint — bottom left */}
      {!loading && pins.length > 0 && !selectedId && (
        <div className="absolute bottom-8 left-5 z-10 pointer-events-none animate-fade-in">
          <p className="text-[10px] text-slate-700 font-display tracking-widest">
            CLICK A PIN TO READ
          </p>
        </div>
      )}

      {/* Message Modal */}
      {selectedId && (
        <MessageModal messageId={selectedId} onClose={handleClose} />
      )}
    </div>
  );
}
