import mongoose, { Document, Schema } from "mongoose";
import { MessageType, MessageStatus } from "../types/message";

export interface IMessage extends Document {
  type: MessageType;
  text?: string;
  fileUrl?: string;
  fileMimeType?: string;
  lat: number;
  lng: number;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  status: MessageStatus;
  reportCount: number;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    type: {
      type: String,
      enum: ["text", "image", "audio"],
      required: true,
    },
    text: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
    },
    fileMimeType: {
      type: String,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

MessageSchema.index({ location: "2dsphere" });

export const MessageModel = mongoose.model<IMessage>("Message", MessageSchema);
