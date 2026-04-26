import Button from "../ui/Button";
import { FileIcon } from "../icons";

export default function DocumentMedia({
  url,
  mimeType,
}: {
  url: string;
  mimeType?: string;
}) {
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
        <Button
          variant="link"
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          className="inline-flex items-center gap-2 text-yellow-300 hover:text-yellow-200 text-sm"
        >
          <FileIcon />
          <span>Open document ↗</span>
        </Button>
      )}
    </div>
  );
}

