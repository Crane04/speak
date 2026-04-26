import { useState } from "react";
import { MessageType } from "../types/message";

interface MediaRendererProps {
  url: string;
  mimeType?: string;
  type: MessageType;
}

export default function MediaRenderer({ url, mimeType, type }: MediaRendererProps) {
  const [loaded, setLoaded] = useState(false);

  if (type === "image") {
    return (
      <div className="relative rounded-xl overflow-hidden bg-white/5 min-h-[120px]">
        {!loaded && (
          <div className="shimmer absolute inset-0 rounded-xl" />
        )}
        <img
          src={url}
          alt="Message media"
          className={`w-full rounded-xl object-contain max-h-80 transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLoaded(true)}
          loading="lazy"
        />
      </div>
    );
  }

  if (type === "audio") {
    return (
      <div className="bg-white/5 border border-white/5 rounded-xl p-4">
        <p className="text-[10px] font-display text-slate-600 uppercase tracking-widest mb-3">
          Audio message
        </p>
        <audio controls className="w-full accent-sky-400" preload="metadata">
          <source src={url} type={mimeType} />
          Your browser does not support audio playback.
        </audio>
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="rounded-xl overflow-hidden bg-black border border-white/5">
        <video
          controls
          className="w-full max-h-72"
          preload="metadata"
        >
          <source src={url} type={mimeType} />
          Your browser does not support video playback.
        </video>
      </div>
    );
  }

  if (type === "document") {
    const isPdf = mimeType === "application/pdf";
    return (
      <div className="bg-white/5 border border-white/5 rounded-xl p-4">
        <p className="text-[10px] font-display text-slate-600 uppercase tracking-widest mb-3">
          Document
        </p>
        {isPdf ? (
          <iframe
            src={url}
            title="Document viewer"
            className="w-full h-64 rounded-lg border border-white/8"
          />
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-yellow-300 hover:text-yellow-200 transition-colors text-sm font-display"
          >
            <span>📄</span>
            <span>Open document ↗</span>
          </a>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sky-400 hover:text-sky-300 text-sm underline underline-offset-2"
    >
      View attached file ↗
    </a>
  );
}
