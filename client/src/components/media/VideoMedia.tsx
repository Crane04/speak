export default function VideoMedia({
  url,
  mimeType,
}: {
  url: string;
  mimeType?: string;
}) {
  return (
    <div className="rounded-xl overflow-hidden bg-black border border-white/5">
      <video controls className="w-full max-h-72" preload="metadata">
        <source src={url} type={mimeType} />
        Your browser does not support video playback.
      </video>
    </div>
  );
}

