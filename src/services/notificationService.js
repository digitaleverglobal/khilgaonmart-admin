import { io } from "socket.io-client";
import { apiRequest, buildQuery, getAccessToken } from "../utils/apiClient";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";
const SOCKET_BASE =
  import.meta.env.VITE_SOCKET_URL ||
  (/^https?:\/\//i.test(API_BASE)
    ? API_BASE.replace(/\/api\/v1\/?$/, "")
    : window.location.origin);

export const notificationService = {
  getAll: (params = {}) => apiRequest(`/notifications${buildQuery(params)}`),
  getUnreadCount: () => apiRequest("/notifications/unread-count"),
  markAsRead: async (id) => {
    try {
      return await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
    } catch {
      return apiRequest(`/notifications/${id}/read`, { method: "POST" });
    }
  },
  markAllAsRead: () =>
    apiRequest("/notifications/read-all", { method: "PATCH" }),
  delete: (id) => apiRequest(`/notifications/${id}`, { method: "DELETE" }),
};

let notificationSocket = null;

export function connectNotificationSocket() {
  const token = getAccessToken();
  if (!token) return null;
  const auth = (callback) => callback({ token: getAccessToken() });
  if (!notificationSocket) {
    notificationSocket = io(SOCKET_BASE, {
      auth,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
  } else {
    notificationSocket.auth = auth;
    if (!notificationSocket.connected) notificationSocket.connect();
  }
  return notificationSocket;
}

export function disconnectNotificationSocket() {
  notificationSocket?.disconnect();
  notificationSocket = null;
}
