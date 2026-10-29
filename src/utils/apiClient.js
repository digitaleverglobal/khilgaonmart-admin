const BASE = import.meta.env.VITE_API_URL || "/api/v1";

const STORAGE_KEYS = {
  access: "holydeen_access",
  refresh: "holydeen_refresh",
};

export const USER_STORAGE_KEYS = {
  current: "holydeen_user",
};

function mergeStoredUser(data = {}) {
  const user = data.user;
  const menuPermissions = data.menuPermissions;
  if (!user && !Array.isArray(menuPermissions)) return;

  try {
    const current = JSON.parse(localStorage.getItem(USER_STORAGE_KEYS.current) || "null");
    const baseUser = user || current;
    if (!baseUser) return;
    const nextUser = Array.isArray(menuPermissions)
      ? { ...baseUser, menuPermissions }
      : { ...baseUser };
    localStorage.setItem(USER_STORAGE_KEYS.current, JSON.stringify(nextUser));
    window.dispatchEvent(new CustomEvent("auth:user-updated", { detail: nextUser }));
  } catch {
    // Ignore storage failures.
  }
}

export function getAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.access);
}

export function getRefreshToken() {
  return localStorage.getItem(STORAGE_KEYS.refresh);
}

export function setTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(STORAGE_KEYS.access, accessToken);
  if (refreshToken) localStorage.setItem(STORAGE_KEYS.refresh, refreshToken);
}

export function clearTokens() {
  [
    STORAGE_KEYS.access,
    STORAGE_KEYS.refresh,
    USER_STORAGE_KEYS.current,
  ].forEach((key) => localStorage.removeItem(key));
}

export function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return Date.now() >= decoded.exp * 1000;
}

// Empty or non-JSON bodies (proxy/gateway hiccups) must not surface as
// "Unexpected end of JSON input".
async function readJson(res) {
  return res.json().catch(() => ({ message: res.statusText || "Request failed" }));
}

// Refresh the access token using the stored refresh token
async function doRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetchWithRetry(
    `${BASE}/user/refresh-token`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    },
    true,
  );

  if (!res.ok) {
    clearTokens();
    throw new Error("Session expired. Please login again.");
  }

  const json = await readJson(res);
  if (!json.data?.accessToken) throw new Error("Could not refresh session. Please try again.");
  const newAccess = json.data?.accessToken;
  const newRefresh = json.data?.refreshToken;
  setTokens(newAccess, newRefresh);
  mergeStoredUser(json.data);
  return newAccess;
}

// Singleton refresh promise to prevent parallel refresh calls
let refreshPromise = null;

const NETWORK_RETRY_DELAYS = [400, 1200];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isNetworkError(error) {
  return (
    error instanceof TypeError ||
    /failed to fetch|network|load failed/i.test(error?.message || "")
  );
}

async function fetchWithRetry(url, init, retryNetworkErrors) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await fetch(url, init);
    } catch (error) {
      const delay = NETWORK_RETRY_DELAYS[attempt];
      if (!retryNetworkErrors || !delay || !isNetworkError(error)) throw error;
      await wait(delay);
    }
  }
}

async function getValidToken() {
  const token = getAccessToken();
  if (!token) return null;
  if (!isTokenExpired(token)) return token;

  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiRequest(path, options = {}) {
  const token = await getValidToken();
  const method = (options.method || "GET").toUpperCase();
  const retryNetworkErrors = method === "GET";
  // Don't set Content-Type for FormData — browser sets it with boundary automatically
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetchWithRetry(
    `${BASE}${path}`,
    {
      credentials: "include",
      cache: "no-store",
      ...options,
      headers,
    },
    retryNetworkErrors,
  );

  if (res.status === 401) {
    // Token might have just expired between the check and the request
    try {
      const freshToken = await doRefresh();
      const retryRes = await fetchWithRetry(
        `${BASE}${path}`,
        {
          credentials: "include",
          cache: "no-store",
          ...options,
          headers: { ...headers, Authorization: `Bearer ${freshToken}` },
        },
        retryNetworkErrors,
      );
      if (!retryRes.ok) {
        const err = await readJson(retryRes);
        throw new Error(err.message || "Request failed");
      }
      return readJson(retryRes);
    } catch {
      clearTokens();
      window.dispatchEvent(new Event("auth:logout"));
      throw new Error("Session expired. Please login again.");
    }
  }

  const json = await readJson(res);
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json;
}

export async function pingApi() {
  const res = await fetchWithRetry(
    `${BASE}/health`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
    true,
  );
  return res.ok;
}

export function buildQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.append(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}
