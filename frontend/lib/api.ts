const RAW = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";
const API_URL = RAW.replace(/\/$/, ""); // retire le slash final si présent

export async function fetchAPI(path: string) {
  const url = `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("API ERROR", res.status, url, text);
    throw new Error(`Erreur API ${res.status}`);
  }
  return res.json();
}

export function mediaUrl(path?: string) {
    if (!path) return undefined;
    const base = API_URL.replace(/\/api$/, ""); // http://localhost:1337
    return path.startsWith("http") ? path : `${base}${path}`;
  }

export function formatPrice(cents?: number) {
  if (typeof cents !== "number") return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}
