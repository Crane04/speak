import { MessageType } from "../types/message";
import AudioMedia from "./media/AudioMedia";
import ExternalLinkMedia from "./media/ExternalLinkMedia";
import ImageMedia from "./media/ImageMedia";

interface MediaRendererProps {
  url: string;
  mimeType?: string;
  type: MessageType;
}

export default function MediaRenderer({ url, mimeType, type }: MediaRendererProps) {
  if (type === "image") return <ImageMedia url={url} />;

  if (type === "audio") return <AudioMedia url={url} mimeType={mimeType} />;

  return <ExternalLinkMedia url={url} />;
}
