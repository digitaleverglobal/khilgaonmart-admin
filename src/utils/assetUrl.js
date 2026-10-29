const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

export function backendBaseUrl() {
  return /^https?:\/\//i.test(API_BASE)
    ? API_BASE.replace(/\/api\/v1\/?$/, "")
    : "";
}

export function assetUrl(value) {
  if (!value) return "";
  const src = String(value).trim();
  if (!src) return "";
  if (/^(https?:)?\/\//i.test(src) || src.startsWith("data:")) return src;
  if (src.startsWith("/")) {
    return backendBaseUrl() ? `${backendBaseUrl()}${src}` : src;
  }
  return `${backendBaseUrl()}/${src.replace(/^\/+/, "")}`;
}

export function imageUrl(value) {
  if (!value) return "";
  const src = String(value).trim();
  if (!src) return "";
  if (/^(https?:)?\/\//i.test(src) || src.startsWith("data:")) return src;
  if (src.startsWith("/")) {
    return backendBaseUrl() ? `${backendBaseUrl()}${src}` : src;
  }
  const clean = src.replace(/^\/+/, "");
  return clean.startsWith("images/")
    ? `${backendBaseUrl()}/${clean}`
    : `${backendBaseUrl()}/images/${clean}`;
}
