import { MessageType } from "../../types/message";
import { useDropMessageForm } from "../../contexts/dropMessageContext";
import { ImageIcon, MicIcon, TypeIcon } from "../icons";
import { TYPE_OPTIONS } from "./typeOptions";
import Button from "../ui/Button";
import { cn } from "../ui/cn";

function TypeTabIcon({ type }: { type: MessageType }) {
  switch (type) {
    case "text":
      return <TypeIcon />;
    case "image":
      return <ImageIcon />;
    case "audio":
      return <MicIcon />;
    default:
      return <TypeIcon />;
  }
}

export default function TypeTabs() {
  const { state, actions } = useDropMessageForm();

  return (
    <div className="flex gap-2 flex-wrap rounded-2xl p-2 border border-white/6 bg-white/2">
      {TYPE_OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant="ghost"
          size="md"
          onClick={() => actions.setType(opt.value)}
          className={cn(
            "flex items-center gap-2 rounded-2xl text-sm transition-all border",
            state.type === opt.value
              ? "bg-sky-500/15 border-sky-500/35 text-sky-200"
              : "border-transparent text-slate-400 hover:bg-white/2 hover:text-slate-200",
          )}
        >
          <span className="opacity-80">
            <TypeTabIcon type={opt.value} />
          </span>
          <span className="tracking-wide">{opt.label}</span>
        </Button>
      ))}
    </div>
  );
}
