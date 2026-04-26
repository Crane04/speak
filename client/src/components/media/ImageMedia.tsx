import { useState } from "react";

export default function ImageMedia({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative rounded-xl overflow-hidden bg-white/5 min-h-[120px]">
      {!loaded && <div className="shimmer absolute inset-0 rounded-xl" />}
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

