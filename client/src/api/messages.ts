import { Message, MessagePin, AdminMessage } from "../types/message";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// --- Public API ---

export const fetchPins = async (): Promise<MessagePin[]> => {
  const res = await fetch(`${BASE_URL}/api/messages/pins`);
  if (!res.ok) throw new Error("Failed to fetch pins");
  return res.json();
};

export const fetchMessage = async (id: string): Promise<Message> => {
  const res = await fetch(`${BASE_URL}/api/messages/${id}`);
  if (!res.ok) throw new Error("Failed to fetch message");
  return res.json();
};

export const submitMessage = async (formData: FormData): Promise<{ id: string; status: string; message: string }> => {
  const res = await fetch(`${BASE_URL}/api/messages`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to submit message");
  return data;
};

export const reportMessage = async (id: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/api/messages/${id}/report`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to report message");
};

// --- Admin API ---

const adminHeaders = (secret: string) => ({
  "x-admin-secret": secret,
});

export const fetchPendingMessages = async (secret: string): Promise<AdminMessage[]> => {
  const res = await fetch(`${BASE_URL}/api/admin/messages/pending`, {
    headers: adminHeaders(secret),
  });
  if (!res.ok) throw new Error("Unauthorized or failed to fetch");
  return res.json();
};

export const fetchAllAdminMessages = async (
  secret: string,
  status?: string
): Promise<AdminMessage[]> => {
  const url = status
    ? `${BASE_URL}/api/admin/messages?status=${status}`
    : `${BASE_URL}/api/admin/messages`;
  const res = await fetch(url, { headers: adminHeaders(secret) });
  if (!res.ok) throw new Error("Unauthorized or failed to fetch");
  return res.json();
};

export const approveMessage = async (id: string, secret: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/api/admin/messages/${id}/approve`, {
    method: "PATCH",
    headers: adminHeaders(secret),
  });
  if (!res.ok) throw new Error("Failed to approve");
};

export const rejectMessage = async (id: string, secret: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/api/admin/messages/${id}/reject`, {
    method: "PATCH",
    headers: adminHeaders(secret),
  });
  if (!res.ok) throw new Error("Failed to reject");
};

export const deleteAdminMessage = async (id: string, secret: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/api/admin/messages/${id}`, {
    method: "DELETE",
    headers: adminHeaders(secret),
  });
  if (!res.ok) throw new Error("Failed to delete");
};
