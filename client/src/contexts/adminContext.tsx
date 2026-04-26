import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { AdminMessage } from "../types/message";
import {
  approveMessage,
  deleteAdminMessage,
  fetchAllAdminMessages,
  rejectMessage,
} from "../api/messages";

export type FilterStatus = "pending" | "approved" | "rejected" | "all";

type AdminState = {
  secret: string;
  authed: boolean;
  authError: string | null;

  filter: FilterStatus;
  loading: boolean;
  messages: AdminMessage[];
  counts: Record<string, number>;

  expanded: string | null;
  actionLoading: string | null;
};

type Action =
  | { type: "SET_SECRET"; value: string }
  | { type: "SET_AUTHED"; value: boolean }
  | { type: "SET_AUTH_ERROR"; value: string | null }
  | { type: "SET_FILTER"; value: FilterStatus }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_MESSAGES"; value: AdminMessage[] }
  | { type: "SET_COUNTS"; value: Record<string, number> }
  | { type: "SET_EXPANDED"; value: string | null }
  | { type: "SET_ACTION_LOADING"; value: string | null };

const initialState: AdminState = {
  secret: "",
  authed: false,
  authError: null,
  filter: "pending",
  loading: false,
  messages: [],
  counts: {},
  expanded: null,
  actionLoading: null,
};

function reducer(state: AdminState, action: Action): AdminState {
  switch (action.type) {
    case "SET_SECRET":
      return { ...state, secret: action.value };
    case "SET_AUTHED":
      return { ...state, authed: action.value };
    case "SET_AUTH_ERROR":
      return { ...state, authError: action.value };
    case "SET_FILTER":
      return { ...state, filter: action.value };
    case "SET_LOADING":
      return { ...state, loading: action.value };
    case "SET_MESSAGES":
      return { ...state, messages: action.value };
    case "SET_COUNTS":
      return { ...state, counts: action.value };
    case "SET_EXPANDED":
      return { ...state, expanded: action.value };
    case "SET_ACTION_LOADING":
      return { ...state, actionLoading: action.value };
    default:
      return state;
  }
}

type AdminActions = {
  setSecret: (v: string) => void;
  authenticate: () => Promise<void>;
  setFilter: (v: FilterStatus) => void;
  refresh: () => Promise<void>;
  toggleExpanded: (id: string) => void;
  action: (id: string, action: "approve" | "reject" | "delete") => Promise<void>;
};

type AdminContextValue = { state: AdminState; actions: AdminActions };

const AdminContext = createContext<AdminContextValue | null>(null);

async function loadMessages(secret: string, filter: FilterStatus) {
  const status = filter === "all" ? undefined : filter;
  return fetchAllAdminMessages(secret, status);
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setSecret = useCallback((v: string) => {
    dispatch({ type: "SET_SECRET", value: v });
  }, []);

  const refresh = useCallback(async () => {
    if (!state.secret.trim()) return;
    dispatch({ type: "SET_LOADING", value: true });
    try {
      const data = await loadMessages(state.secret, state.filter);
      dispatch({ type: "SET_MESSAGES", value: data });
      dispatch({ type: "SET_AUTHED", value: true });
      dispatch({ type: "SET_AUTH_ERROR", value: null });
    } catch {
      dispatch({ type: "SET_AUTH_ERROR", value: "Authentication failed or server error." });
      dispatch({ type: "SET_AUTHED", value: false });
    } finally {
      dispatch({ type: "SET_LOADING", value: false });
    }
  }, [state.filter, state.secret]);

  const loadCounts = useCallback(async () => {
    if (!state.secret.trim()) return;
    const statuses: FilterStatus[] = ["pending", "approved", "rejected"];
    const results: Record<string, number> = {};
    await Promise.all(
      statuses.map(async (s) => {
        try {
          const data = await fetchAllAdminMessages(state.secret, s);
          results[s] = data.length;
        } catch {
          results[s] = 0;
        }
      }),
    );
    dispatch({ type: "SET_COUNTS", value: results });
  }, [state.secret]);

  const authenticate = useCallback(async () => {
    if (!state.secret.trim()) return;
    await Promise.all([refresh(), loadCounts()]);
  }, [loadCounts, refresh, state.secret]);

  const setFilter = useCallback((v: FilterStatus) => {
    dispatch({ type: "SET_FILTER", value: v });
  }, []);

  const toggleExpanded = useCallback((id: string) => {
    dispatch({ type: "SET_EXPANDED", value: state.expanded === id ? null : id });
  }, [state.expanded]);

  const action = useCallback(
    async (id: string, act: "approve" | "reject" | "delete") => {
      const key = id + act;
      dispatch({ type: "SET_ACTION_LOADING", value: key });
      try {
        if (act === "approve") await approveMessage(id, state.secret);
        else if (act === "reject") await rejectMessage(id, state.secret);
        else await deleteAdminMessage(id, state.secret);

        dispatch({
          type: "SET_MESSAGES",
          value: state.messages.filter((m) => m.id !== id),
        });
        dispatch({
          type: "SET_EXPANDED",
          value: state.expanded === id ? null : state.expanded,
        });

        dispatch({
          type: "SET_COUNTS",
          value: (() => {
            const next = { ...state.counts };
            if (act === "approve") {
              next.pending = Math.max(0, (next.pending ?? 0) - 1);
              next.approved = (next.approved ?? 0) + 1;
            } else if (act === "reject") {
              next.pending = Math.max(0, (next.pending ?? 0) - 1);
              next.rejected = (next.rejected ?? 0) + 1;
            } else {
              const msg = state.messages.find((m) => m.id === id);
              if (msg?.status) next[msg.status] = Math.max(0, (next[msg.status] ?? 0) - 1);
            }
            return next;
          })(),
        });
      } catch {
        // noop (could add toast later)
      } finally {
        dispatch({ type: "SET_ACTION_LOADING", value: null });
      }
    },
    [state.counts, state.expanded, state.messages, state.secret],
  );

  useEffect(() => {
    if (!state.authed || !state.secret) return;
    void refresh();
  }, [refresh, state.authed, state.secret, state.filter]);

  const actions = useMemo<AdminActions>(
    () => ({
      setSecret,
      authenticate,
      setFilter,
      refresh,
      toggleExpanded,
      action,
    }),
    [action, authenticate, refresh, setFilter, setSecret, toggleExpanded],
  );

  const value = useMemo<AdminContextValue>(() => ({ state, actions }), [actions, state]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}

