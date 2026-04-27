import { useEffect, useMemo, useRef, useState } from "react";
import { useDropMessageForm } from "../../contexts/dropMessageContext";
import Button from "../ui/Button";

const MAX_SECONDS = 30;
const MIME_TYPE_OPTIONS = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
];

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  return MIME_TYPE_OPTIONS.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function formatSeconds(seconds: number) {
  return `0:${seconds.toString().padStart(2, "0")}`;
}

export default function VoiceNoteSection() {
  const { state, actions } = useDropMessageForm();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mimeType = useMemo(getSupportedMimeType, []);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!state.file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setElapsedSeconds(0);
      return;
    }

    const url = URL.createObjectURL(state.file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [state.file]);

  if (state.type !== "audio") return null;

  const stopRecording = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = async () => {
    actions.clearError();

    if (!mimeType) {
      actions.setError("Voice recording is not supported in this browser.");
      return;
    }

    try {
      actions.setFile(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType });

      chunksRef.current = [];
      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      setElapsedSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const extension = mimeType.includes("ogg")
          ? "ogg"
          : mimeType.includes("mp4")
            ? "m4a"
            : "webm";
        const file = new File([blob], `voice-note.${extension}`, {
          type: mimeType.split(";")[0],
        });

        actions.setFile(file);
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((current) => {
          const next = current + 1;
          if (next >= MAX_SECONDS) stopRecording();
          return Math.min(next, MAX_SECONDS);
        });
      }, 1000);
    } catch {
      actions.setError("Microphone access is needed to record a voice note.");
    }
  };

  const resetRecording = () => {
    stopRecording();
    actions.setFile(null);
    setElapsedSeconds(0);
  };

  return (
    <div className="animate-fade-in rounded-2xl border border-white/8 bg-white/2 p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-base text-slate-300">Voice note</p>
          <p className="font-display text-sm text-slate-600">
            {isRecording ? "Recording..." : "Record up to 30 seconds"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-display text-sm tabular-nums text-slate-500">
            {formatSeconds(elapsedSeconds)} / 0:30
          </span>
          {isRecording ? (
            <Button variant="danger" onClick={stopRecording}>
              Stop
            </Button>
          ) : (
            <Button variant="primary" onClick={startRecording}>
              {state.file ? "Record again" : "Record"}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all ${
            isRecording ? "bg-red-400" : "bg-sky-500"
          }`}
          style={{ width: `${(elapsedSeconds / MAX_SECONDS) * 100}%` }}
        />
      </div>

      {previewUrl && !isRecording && (
        <div className="mt-5 space-y-3">
          <audio controls className="w-full accent-sky-400" src={previewUrl}>
            Your browser does not support audio playback.
          </audio>
          <Button variant="ghost" size="sm" onClick={resetRecording}>
            Remove voice note
          </Button>
        </div>
      )}

      {state.submitState === "submitting" && (
        <div className="mt-3">
          <div className="h-0.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-300"
              style={{ width: `${state.uploadProgress}%` }}
            />
          </div>
          <p className="font-display mt-1 text-right text-[11px] text-slate-600">
            {state.uploadProgress}%
          </p>
        </div>
      )}
    </div>
  );
}
