import { useEffect, useState, useCallback } from "react";
import { Message } from "../types/message";
import { fetchMessage, reportMessage } from "../api/messages";
import { reverseGeocode, type ReverseGeocodeResult } from "../api/geo";
import MediaRenderer from "./MediaRenderer";
import Button from "./ui/Button";
import { MapPinIcon } from "./icons";

interface MessageModalProps {
  messageId: string;
  onClose: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  text: "#e2e8f0",
  image: "#7dd3fc",
  audio: "#86efac",
  video: "#f9a8d4",
  document: "#fde68a",
};

export default function MessageModal({ messageId, onClose }: MessageModalProps) {
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [place, setPlace] = useState<ReverseGeocodeResult | null>(null);
  const [placeLoading, setPlaceLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMessage(null);
    setReported(false);
    setPlace(null);

    fetchMessage(messageId)
      .then(setMessage)
      .catch(() => setError("This message could not be loaded."))
      .finally(() => setLoading(false));
  }, [messageId]);

  useEffect(() => {
    if (!message) return;

    const controller = new AbortController();
    let active = true;
    setPlaceLoading(true);
    reverseGeocode(message.lat, message.lng, { signal: controller.signal })
      .then((data) => {
        if (!active) return;
        setPlace(data);
      })
      .catch(() => {
        // If reverse geocode fails, we still show coordinates.
        if (!active) return;
        setPlace(null);
      })
      .finally(() => {
        if (!active) return;
        setPlaceLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [message]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleReport = useCallback(async () => {
    if (reported || reporting || !message) return;
    setReporting(true);
    try {
      await reportMessage(message.id);
      setReported(true);
    } catch {
      // silent fail
    } finally {
      setReporting(false);
    }
  }, [message, reported, reporting]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const accentColor = message ? (TYPE_COLORS[message.type] ?? "#7dd3fc") : "#7dd3fc";
  const coordsLabel = message
    ? `${message.lat.toFixed(3)}°,\u00A0${message.lng.toFixed(3)}°`
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="glass rounded-2xl w-full max-w-lg overflow-hidden animate-slide-up"
        style={{ border: `1px solid ${accentColor}18` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: accentColor }}
            />
            <span
              className="font-display text-[10px] tracking-[0.15em] uppercase"
              style={{ color: accentColor }}
            >
              {message?.type ?? "message"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 px-0 py-0 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 text-lg leading-none"
          >
            ×
          </Button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[65vh] scrollable">
          {loading && (
            <div className="space-y-3 py-4">
              <div className="shimmer h-3.5 rounded-lg w-3/4" />
              <div className="shimmer h-3.5 rounded-lg w-full" />
              <div className="shimmer h-3.5 rounded-lg w-5/6" />
              <div className="shimmer h-3.5 rounded-lg w-2/3" />
            </div>
          )}

          {error && (
            <div className="py-8 text-center">
              <p className="text-slate-500 text-sm">{error}</p>
            </div>
          )}

          {!loading && message && (
            <div className="space-y-4 animate-fade-in">
              {message.text && (
                <p className="text-slate-200 text-[15px] leading-relaxed whitespace-pre-wrap font-body">
                  {message.text}
                </p>
              )}
              {message.fileUrl && (
                <MediaRenderer
                  url={message.fileUrl}
                  mimeType={message.fileMimeType}
                  type={message.type}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && message && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
            <div className="text-[11px] font-display text-slate-600 space-x-2">
              <span>{formatDate(message.createdAt)}</span>
              <span>·</span>
              <span
                className="inline-flex items-center gap-1.5"
                title={coordsLabel || undefined}
              >
                <MapPinIcon size={13} className="text-slate-600" />
                <span className="truncate max-w-[220px]">
                  {placeLoading ? "locating…" : place?.display ?? coordsLabel}
                </span>
              </span>
            </div>
            <Button
              variant="link"
              onClick={handleReport}
              disabled={reported || reporting}
              className="text-[11px] text-slate-500 hover:text-red-300"
            >
              {reported ? "reported" : reporting ? "..." : "report"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
