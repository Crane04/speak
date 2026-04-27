export default function AudioMedia({
  url,
  mimeType,
}: {
  url: string;
  mimeType?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-xl p-4">
      <p className="text-[10px] font-display text-slate-600 uppercase tracking-widest mb-3">
        Voice note
      </p>
      <audio controls className="w-full accent-sky-400" preload="metadata">
        <source src={url} type={mimeType} />
        Your browser does not support audio playback.
      </audio>
    </div>
  );
}
