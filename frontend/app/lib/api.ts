"use client";

export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function getToken() {
  try { return localStorage.getItem("token") ?? ""; } catch { return ""; }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

/** Appel API authentifié. Redirige vers la connexion si le jeton est invalide. */
export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body = init.body;
  if (init.json !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(init.json); }
  const res = await fetch(`${API}${path}`, { ...init, headers, body });
  if (res.status === 401 && typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
    localStorage.removeItem("token");
    window.location.href = "/admin/login";
    throw new ApiError(401, "Session expirée");
  }
  if (!res.ok) {
    let msg = res.statusText;
    try { const d = await res.json(); msg = Array.isArray(d.message) ? d.message.join(", ") : d.message ?? msg; } catch {}
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function formatDate(d: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", opts);
}

export function daysLeft(d: string | null | undefined) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

export function euros(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
}
