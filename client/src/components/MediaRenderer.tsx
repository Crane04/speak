import { MessageType } from "../types/message";
import AudioMedia from "./media/AudioMedia";
import DocumentMedia from "./media/DocumentMedia";
import ExternalLinkMedia from "./media/ExternalLinkMedia";
import ImageMedia from "./media/ImageMedia";
import VideoMedia from "./media/VideoMedia";

interface MediaRendererProps {
  url: string;
  mimeType?: string;
  type: MessageType;
}

export default function MediaRenderer({ url, mimeType, type }: MediaRendererProps) {
  if (type === "image") return <ImageMedia url={url} />;

  if (type === "audio") return <AudioMedia url={url} mimeType={mimeType} />;

  if (type === "video") return <VideoMedia url={url} mimeType={mimeType} />;

  if (type === "document") return <DocumentMedia url={url} mimeType={mimeType} />;

  return <ExternalLinkMedia url={url} />;
}
