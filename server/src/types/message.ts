export type MessageType = "text" | "image" | "audio";

export type MessageStatus = "pending" | "approved" | "rejected";

export interface MessagePin {
  id: string;
  lat: number;
  lng: number;
  type: MessageType;
}

export interface Message {
  id: string;
  type: MessageType;
  text?: string;
  fileUrl?: string;
  fileMimeType?: string;
  lat: number;
  lng: number;
  status: MessageStatus;
  reportCount: number;
  createdAt: string;
}
