import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { submitMessage } from "../api/messages";
import { fetchIpLocation } from "../lib/ipLocation";
import { MessageType } from "../types/message";

export type SubmitState = "idle" | "submitting" | "success" | "error";

export type DropFormState = {
  type: MessageType;
  text: string;
  file: File | null;
  lat: string;
  lng: string;
  ipLocLoading: boolean;
  uploadProgress: number;
  submitState: SubmitState;
  errorMsg: string | null;
};

type Action =
  | { type: "SET_TYPE"; value: MessageType }
  | { type: "SET_TEXT"; value: string }
  | { type: "SET_FILE"; value: File | null }
  | { type: "SET_LAT"; value: string }
  | { type: "SET_LNG"; value: string }
  | { type: "SET_IP_LOC_LOADING"; value: boolean }
  | { type: "SET_UPLOAD_PROGRESS"; value: number }
  | { type: "SET_SUBMIT_STATE"; value: SubmitState }
  | { type: "SET_ERROR"; value: string | null }
  | { type: "RESET_ERROR" };

const initialState: DropFormState = {
  type: "text",
  text: "",
  file: null,
  lat: "",
  lng: "",
  ipLocLoading: false,
  uploadProgress: 0,
  submitState: "idle",
  errorMsg: null,
};

function reducer(state: DropFormState, action: Action): DropFormState {
  switch (action.type) {
    case "SET_TYPE":
      return { ...state, type: action.value, file: null, errorMsg: null };
    case "SET_TEXT":
      return { ...state, text: action.value };
    case "SET_FILE":
      return { ...state, file: action.value, uploadProgress: 0, errorMsg: null };
    case "SET_LAT":
      return { ...state, lat: action.value };
    case "SET_LNG":
      return { ...state, lng: action.value };
    case "SET_IP_LOC_LOADING":
      return { ...state, ipLocLoading: action.value };
    case "SET_UPLOAD_PROGRESS":
      return { ...state, uploadProgress: action.value };
    case "SET_SUBMIT_STATE":
      return { ...state, submitState: action.value };
    case "SET_ERROR":
      return { ...state, errorMsg: action.value };
    case "RESET_ERROR":
      return { ...state, errorMsg: null };
    default:
      return state;
  }
}

type DropFormActions = {
  setType: (t: MessageType) => void;
  setText: (t: string) => void;
  setFile: (f: File | null) => void;
  setLat: (v: string) => void;
  setLng: (v: string) => void;
  autoFillFromIp: () => Promise<void>;
  submit: () => Promise<void>;
  clearError: () => void;
};

type DropFormContextValue = {
  state: DropFormState;
  actions: DropFormActions;
};

const DropFormContext = createContext<DropFormContextValue | null>(null);

function validate(state: DropFormState): string | null {
  const latNum = parseFloat(state.lat);
  const lngNum = parseFloat(state.lng);
  if (!state.lat || !state.lng || Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return "Please provide a valid location.";
  }
  if (latNum < -90 || latNum > 90) return "Latitude must be between -90 and 90.";
  if (lngNum < -180 || lngNum > 180) return "Longitude must be between -180 and 180.";
  if (state.type === "text" && state.text.trim().length === 0) {
    return "Message text cannot be empty.";
  }
  if (state.type === "text" && state.text.trim().length > 2000) {
    return "Message cannot exceed 2000 characters.";
  }
  if (state.type !== "text" && !state.file) return `Please attach a ${state.type} file.`;
  return null;
}

export function DropMessageProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const ipAutofillTriedRef = useRef(false);
  const progressIntervalRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current != null) {
        window.clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const setType = useCallback((t: MessageType) => {
    dispatch({ type: "SET_TYPE", value: t });
  }, []);

  const setText = useCallback((t: string) => {
    dispatch({ type: "SET_TEXT", value: t });
  }, []);

  const setFile = useCallback((f: File | null) => {
    dispatch({ type: "SET_FILE", value: f });
  }, []);

  const setLat = useCallback((v: string) => {
    dispatch({ type: "SET_LAT", value: v });
  }, []);

  const setLng = useCallback((v: string) => {
    dispatch({ type: "SET_LNG", value: v });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "RESET_ERROR" });
  }, []);

  const autoFillFromIp = useCallback(async () => {
    if (state.ipLocLoading) return;
    dispatch({ type: "SET_IP_LOC_LOADING", value: true });
    dispatch({ type: "RESET_ERROR" });

    try {
      const result = await fetchIpLocation({ timeoutMs: 7000 });
      if (!result.ok) {
        dispatch({ type: "SET_ERROR", value: result.error });
        return;
      }
      dispatch({ type: "SET_LAT", value: result.lat.toFixed(6) });
      dispatch({ type: "SET_LNG", value: result.lng.toFixed(6) });
    } finally {
      dispatch({ type: "SET_IP_LOC_LOADING", value: false });
    }
  }, [state.ipLocLoading]);

  useEffect(() => {
    if (ipAutofillTriedRef.current) return;
    if (state.lat || state.lng) return;
    ipAutofillTriedRef.current = true;
    void autoFillFromIp();
  }, [autoFillFromIp, state.lat, state.lng]);

  const submit = useCallback(async () => {
    const validationError = validate(state);
    if (validationError) {
      dispatch({ type: "SET_ERROR", value: validationError });
      return;
    }

    dispatch({ type: "RESET_ERROR" });
    dispatch({ type: "SET_SUBMIT_STATE", value: "submitting" });
    dispatch({ type: "SET_UPLOAD_PROGRESS", value: 0 });
    progressRef.current = 0;

    const formData = new FormData();
    formData.append("type", state.type);
    formData.append("lat", state.lat);
    formData.append("lng", state.lng);
    if (state.type === "text") {
      formData.append("text", state.text.trim());
    } else if (state.file) {
      formData.append("file", state.file);
    }

    if (progressIntervalRef.current != null) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    progressIntervalRef.current = window.setInterval(() => {
      progressRef.current = Math.min(80, progressRef.current + 8);
      dispatch({
        type: "SET_UPLOAD_PROGRESS",
        value: progressRef.current,
      });
    }, 200);

    try {
      await submitMessage(formData);
      if (progressIntervalRef.current != null) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      dispatch({ type: "SET_UPLOAD_PROGRESS", value: 100 });
      dispatch({ type: "SET_SUBMIT_STATE", value: "success" });
    } catch (err) {
      if (progressIntervalRef.current != null) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      dispatch({
        type: "SET_ERROR",
        value:
          err instanceof Error
            ? err.message
            : "Submission failed. Please try again.",
      });
      dispatch({ type: "SET_SUBMIT_STATE", value: "error" });
    }
  }, [state]);

  const actions = useMemo<DropFormActions>(
    () => ({
      setType,
      setText,
      setFile,
      setLat,
      setLng,
      autoFillFromIp,
      submit,
      clearError,
    }),
    [autoFillFromIp, clearError, setFile, setLat, setLng, setText, setType, submit],
  );

  const value = useMemo<DropFormContextValue>(
    () => ({ state, actions }),
    [actions, state],
  );

  return <DropFormContext.Provider value={value}>{children}</DropFormContext.Provider>;
}

export function useDropMessageForm() {
  const ctx = useContext(DropFormContext);
  if (!ctx) throw new Error("useDropMessageForm must be used within DropMessageProvider");
  return ctx;
}
