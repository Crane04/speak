import { useState, useEffect, useCallback, useRef } from "react";
import GlobeView from "../components/GlobeView";
import MessageModal from "../components/MessageModal";
import { MessagePin, MessageType } from "../types/message";
import { fetchPins } from "../api/messages";
import AppShell from "../components/AppShell";

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
    <AppShell mainScrollable={false}>
      <div className="relative w-full h-full overflow-hidden" style={{ background: "#030712" }}>
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
              <h1 className="font-display text-5xl tracking-[0.05em] text-white">
                Speak
              </h1>
              <p className="text-slate-700 text-sm font-display tracking-wide">
                anonymous · everywhere
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

        {/* Pin count — top right */}
        {!loading && pins.length > 0 && (
          <div className="absolute top-5 right-5 z-10 pointer-events-none animate-fade-in">
            <div
              className="glass flex items-center gap-2 rounded-full px-3.5 py-1.5"
              style={{ border: "1px solid rgba(56,189,248,0.12)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-[12px] font-display text-slate-300 tracking-wide">
                {pins.length.toLocaleString()} message{pins.length !== 1 ? "s" : ""}
              </span>
            </div>
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
                  <span className="text-[11px] text-slate-500 font-display tracking-wide">
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
            <p className="text-[11px] text-slate-600 font-display tracking-wide">
              click a pin to read
            </p>
          </div>
        )}

        {/* Message Modal */}
        {selectedId && <MessageModal messageId={selectedId} onClose={handleClose} />}
      </div>
    </AppShell>
  );
}
