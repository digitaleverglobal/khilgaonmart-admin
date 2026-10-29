import { imageUrl } from "./assetUrl";

export function isNumericKeyMap(value) {
  if (!value || Array.isArray(value) || typeof value !== "object") return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => /^\d+$/.test(key));
}

export function normalizeSettingData(value, depth = 0) {
  if (!value || depth > 5) return {};

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      return normalizeSettingData(JSON.parse(trimmed), depth + 1);
    } catch {
      return {};
    }
  }

  if (isNumericKeyMap(value)) {
    const text = Object.keys(value)
      .sort((a, b) => Number(a) - Number(b))
      .map((key) => value[key])
      .join("");
    return normalizeSettingData(text, depth + 1);
  }

  if (Array.isArray(value) || typeof value !== "object") return {};
  return value;
}

export function assetSrc(value) {
  if (!value) return "";
  return imageUrl(value);
}

export function getLogo(settings) {
  const data = normalizeSettingData(settings);
  return assetSrc(data.logoFile || data.whiteLogo || data.darkLogo);
}

export function getFavicon(settings) {
  const data = normalizeSettingData(settings);
  return assetSrc(data.faviconFile || data.faviconLogo);
}

export function getSiteName(settings) {
  const data = normalizeSettingData(settings);
  return data.name || "";
}

export function applyDocumentFavicon(value) {
  if (!value || typeof document === "undefined") return;
  const href = assetSrc(value);
  const link =
    document.querySelector("link[rel~='icon']") ||
    document.createElement("link");
  link.rel = "icon";
  link.href = href;
  document.head.appendChild(link);
}

export function applyDocumentTitle(name) {
  if (!name || typeof document === "undefined") return;
  document.title = name;
}
