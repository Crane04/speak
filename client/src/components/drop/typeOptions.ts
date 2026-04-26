import { MessageType } from "../../types/message";

export type TypeOption = {
  value: MessageType;
  label: string;
  accept: string;
  hint: string;
};

export const TYPE_OPTIONS: TypeOption[] = [
  {
    value: "text",
    label: "Text",
    accept: "",
    hint: "Write up to 2000 characters",
  },
  {
    value: "image",
    label: "Image",
    accept: "image/*",
    hint: "JPG, PNG, GIF, WebP · max 50MB",
  },
  {
    value: "audio",
    label: "Audio",
    accept: "audio/*",
    hint: "MP3, WAV, OGG · max 50MB",
  },
  {
    value: "video",
    label: "Video",
    accept: "video/*",
    hint: "MP4, WebM · max 50MB",
  },
  {
    value: "document",
    label: "Doc",
    accept: ".pdf,.doc,.docx,.txt,application/pdf",
    hint: "PDF, DOCX, TXT · max 50MB",
  },
];

export function getTypeOption(type: MessageType) {
  return TYPE_OPTIONS.find((o) => o.value === type) ?? TYPE_OPTIONS[0];
}

