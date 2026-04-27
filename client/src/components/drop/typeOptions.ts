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
    label: "Voice note",
    accept: "",
    hint: "Voice note · max 30 seconds",
  },
];

export function getTypeOption(type: MessageType) {
  return TYPE_OPTIONS.find((o) => o.value === type) ?? TYPE_OPTIONS[0];
}
