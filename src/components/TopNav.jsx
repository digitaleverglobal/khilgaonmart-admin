import { useEffect, useRef, useState } from "react";
import {
  Menu,
  Maximize2,
  Minimize2,
  Bell,
  LogOut,
  ChevronDown,
  User,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getLogo, getSiteName } from "../utils/siteBranding";
import { assetUrl } from "../utils/assetUrl";
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
  notificationService,
} from "../services/notificationService";

const SITE_URL = import.meta.env.VITE_SITE_URL || "/";
const TUTORIAL_URL = import.meta.env.VITE_TUTORIAL_URL || "";

function notificationId(notification) {
  return (
    notification?.Id ??
    notification?.ID ??
    notification?.id ??
    notification?._id ??
    notification?.notificationId
  );
}

function sameNotification(left, right) {
  if (left === right) return true;
  const leftId = notificationId(left);
  const rightId =
    typeof right === "object" ? notificationId(right) : (right ?? null);
  return leftId !== undefined && String(leftId) === String(rightId);
}

function toOptionalCount(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const count = Number(value);
  return Number.isFinite(count) ? count : undefined;
}

function isNotificationRead(notification) {
  const value = notification?.isRead;
  return value === true || value === 1 || value === "1" || value === "true";
}

function unreadCountFromResponse(response) {
  return toOptionalCount(response?.data?.unreadCount ?? response?.data?.count);
}

export default function TopNav({
  siteSettings,
  onQuickNavigate,
  onNotificationNavigate,
  onMenuClick,
}) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const readRequestsRef = useRef(new Map());
  const [isFullscreen, setIsFullscreen] = useState(
    Boolean(document.fullscreenElement),
  );
  const userId = user?.Id;
  const logo = getLogo(siteSettings);
  const siteName = getSiteName(siteSettings);

  const displayName = user
    ? [user.FirstName, user.LastName].filter(Boolean).join(" ") || user.Email
    : "Admin";

  const roleBadge = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "";

  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    const refreshUnreadCount = async () => {
      try {
        const response = await notificationService.getUnreadCount();
        if (active) setUnreadCount(Number(response.data?.count || 0));
      } catch {
        /* the next notification refresh will retry */
      }
    };
    const loadNotifications = async () => {
      try {
        const [listResponse, countResponse] = await Promise.all([
          notificationService.getAll({ page: 1, limit: 20 }),
          notificationService.getUnreadCount(),
        ]);
        if (!active) return;
        setNotifications(listResponse.data || []);
        setUnreadCount(Number(countResponse.data?.count || 0));
      } catch {
        // Socket reconnection or the next dropdown open will retry.
      } finally {
        if (active) setNotificationsLoading(false);
      }
    };

    void loadNotifications();
    const socket = connectNotificationSocket();
    const handleNew = (notification) => {
      setNotifications((previous) =>
        [
          notification,
          ...previous.filter((item) => !sameNotification(item, notification)),
        ].slice(0, 20),
      );
      void refreshUnreadCount();
    };
    const handleReady = () => {
      void loadNotifications();
    };
    const handleRead = ({ id, unreadCount: count }) => {
      setNotifications((previous) =>
        previous.map((item) =>
          sameNotification(item, id)
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item,
        ),
      );
      setUnreadCount((previous) => toOptionalCount(count) ?? previous);
    };
    const handleReadAll = () => {
      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    };
    const handleDeleted = ({ id, unreadCount: count }) => {
      setNotifications((previous) =>
        previous.filter((item) => !sameNotification(item, id)),
      );
      setUnreadCount(Number(count || 0));
    };
    socket?.on("notification:new", handleNew);
    socket?.on("notification:ready", handleReady);
    socket?.on("notification:read", handleRead);
    socket?.on("notification:read-all", handleReadAll);
    socket?.on("notification:deleted", handleDeleted);

    return () => {
      active = false;
      socket?.off("notification:new", handleNew);
      socket?.off("notification:ready", handleReady);
      socket?.off("notification:read", handleRead);
      socket?.off("notification:read-all", handleReadAll);
      socket?.off("notification:deleted", handleDeleted);
      disconnectNotificationSocket();
    };
  }, [userId]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      disconnectNotificationSocket();
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        window.alert("এই browser fullscreen mode support করে না।");
      }
    } catch (error) {
      window.alert(error.message || "Fullscreen mode চালু করা যায়নি।");
    }
  }

  async function openNotification(notification) {
    try {
      await markNotificationRead(notification);
    } catch {
      await refreshUnreadCountFromServer();
      return;
    }
    setNotificationOpen(false);
    if (notification.url) {
      const handled = onNotificationNavigate?.(notification.url);
      if (!handled) window.location.assign(notification.url);
    }
  }

  async function refreshUnreadCountFromServer() {
    const response = await notificationService.getUnreadCount();
    const count = toOptionalCount(response.data?.count);
    if (count !== undefined) setUnreadCount(count);
    return count;
  }

  function markNotificationRead(notification) {
    const id = notificationId(notification);
    const requestKey = id ? String(id) : "";
    const existingRequest = requestKey
      ? readRequestsRef.current.get(requestKey)
      : null;
    if (existingRequest) return existingRequest;

    const wasUnread = !isNotificationRead(notification);
    setNotifications((previous) =>
      previous.map((item) =>
        sameNotification(item, notification)
          ? {
              ...item,
              isRead: true,
              readAt: item.readAt || new Date().toISOString(),
            }
          : item,
      ),
    );
    if (wasUnread) {
      setUnreadCount((previous) => Math.max(0, previous - 1));
    }

    if (!id) return Promise.resolve();

    const request = notificationService
      .markAsRead(id)
      .then((response) => {
        const serverUnreadCount = unreadCountFromResponse(response);
        if (serverUnreadCount !== undefined) setUnreadCount(serverUnreadCount);
        return response;
      })
      .catch(async (error) => {
        await refreshUnreadCountFromServer().catch(() => undefined);
        throw error;
      })
      .finally(() => {
        readRequestsRef.current.delete(requestKey);
      });

    readRequestsRef.current.set(requestKey, request);
    return request;
  }

  async function markAllRead() {
    try {
      const response = await notificationService.markAllAsRead();
      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        })),
      );
      setUnreadCount(unreadCountFromResponse(response) ?? 0);
    } catch {
      /* leave current state unchanged */
    }
  }

  async function deleteNotification(event, id) {
    event.stopPropagation();
    const target = notifications.find((item) => sameNotification(item, id));
    try {
      const response = await notificationService.delete(id);
      setNotifications((previous) =>
        previous.filter((item) => !sameNotification(item, id)),
      );
      if (response.data?.unreadCount !== undefined) {
        setUnreadCount(Number(response.data.unreadCount || 0));
      } else if (target && !isNotificationRead(target)) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch {
      /* leave current state unchanged */
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 px-3 py-2 sticky top-0 z-10 shadow-sm sm:px-4">
      {/* Left */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-1 hover:bg-gray-100 rounded md:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={20} className="text-gray-600" />
        </button>

        {(logo || siteName) && (
          <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-gray-200">
            {logo && (
              <img
                src={logo}
                alt={siteName || "Logo"}
                className="h-9 w-auto max-w-[150px] object-contain"
              />
            )}
            {!logo && siteName && (
              <span className="text-sm font-bold text-gray-800 max-w-[120px] truncate">
                {siteName}
              </span>
            )}
          </div>
        )}

        <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          <NavBtn
            color="bg-[#F17A23]"
            label="Visit Site"
            onClick={() =>
              window.open(SITE_URL, "_blank", "noopener,noreferrer")
            }
          />
          <NavBtn
            color="bg-[#0B3A4D]"
            label="Landing Page"
            onClick={() => onQuickNavigate?.("landing")}
          />
          <NavBtn
            color="bg-[#E25F12]"
            label="Visitors"
            onClick={() => onQuickNavigate?.("visitors")}
          />
          <NavBtn
            color="bg-[#156B8C]"
            label="POS"
            onClick={() => onQuickNavigate?.("pos")}
          />
          <NavBtn
            color="bg-[#1AACE6]"
            label="Expense"
            onClick={() => onQuickNavigate?.("expense")}
          />
          <NavBtn
            color="bg-[#156B8C]"
            label="Full Tutorial"
            onClick={() =>
              TUTORIAL_URL
                ? window.open(TUTORIAL_URL, "_blank", "noopener,noreferrer")
                : onQuickNavigate?.("tutorial")
            }
          />
          <NavBtn
            color="bg-[#22A55B]"
            label="Create Order"
            onClick={() => onQuickNavigate?.("create_order")}
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1 hover:bg-gray-100 rounded"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 size={18} className="text-gray-500" />
          ) : (
            <Maximize2 size={18} className="text-gray-500" />
          )}
        </button>
        <div className="relative">
          <button
            onClick={() => {
              setNotificationOpen((value) => !value);
              setDropdownOpen(false);
            }}
            className="relative p-1 hover:bg-gray-100 rounded"
            aria-label="Notifications"
          >
            <Bell size={18} className="text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setNotificationOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-2 w-[360px] max-w-[90vw] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      Notifications
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {unreadCount} unread
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[420px] overflow-y-auto">
                  {notificationsLoading ? (
                    <p className="px-4 py-10 text-center text-xs text-gray-400">
                      Loading notifications...
                    </p>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <Bell size={24} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-xs text-gray-400">
                        No notifications yet
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const read = isNotificationRead(notification);
                      return (
                        <div
                          key={notificationId(notification)}
                          role="button"
                          tabIndex={0}
                          onPointerDown={(event) => {
                            if (event.button === 0) {
                              void markNotificationRead(notification).catch(
                                () => undefined,
                              );
                            }
                          }}
                          onMouseDown={(event) => {
                            if (event.button === 0) {
                              void markNotificationRead(notification).catch(
                                () => undefined,
                              );
                            }
                          }}
                          onTouchStart={() => {
                            void markNotificationRead(notification).catch(
                              () => undefined,
                            );
                          }}
                          onClick={() => openNotification(notification)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openNotification(notification);
                            }
                          }}
                          className={`group flex w-full cursor-pointer border-b border-gray-50 transition hover:bg-gray-50 ${read ? "bg-white" : "bg-blue-50/70"}`}
                        >
                          <div className="flex min-w-0 flex-1 gap-3 px-4 py-3 text-left">
                            <span
                              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${read ? "bg-gray-200" : notification.priority === "high" ? "bg-red-500" : "bg-blue-500"}`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-bold text-gray-800">
                                {notification.title}
                              </span>
                              <span className="mt-0.5 line-clamp-2 block text-[11px] leading-4 text-gray-500">
                                {notification.message}
                              </span>
                              <span className="mt-1 block text-[10px] text-gray-400">
                                {formatNotificationTime(
                                  notification.createdAt,
                                )}
                              </span>
                            </span>
                          </div>
                          <button
                            type="button"
                            aria-label="Delete notification"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) =>
                              deleteNotification(
                                event,
                                notificationId(notification),
                              )
                            }
                            className="mr-3 mt-3 hidden self-start text-gray-300 hover:text-red-500 group-hover:block"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-100 transition"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0B3A4D] via-[#F17A23] to-[#F8CB2E] flex items-center justify-center shrink-0">
              {user?.image ? (
                <img
                  src={assetUrl(user.image)}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User size={15} className="text-white" />
              )}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-xs font-semibold text-gray-800 max-w-[100px] truncate">
                {displayName}
              </span>
              {roleBadge && (
                <span className="text-[10px] text-orange-500 font-medium">
                  {roleBadge}
                </span>
              )}
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.Email}
                  </p>
                  {roleBadge && (
                    <span className="inline-block mt-1 text-[10px] font-medium bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                      {roleBadge}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                >
                  <LogOut size={14} />
                  {loggingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavBtn({ color, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${color} text-white text-xs font-medium px-3 py-1.5 rounded-full hover:opacity-90 transition`}
    >
      {label}
    </button>
  );
}

function formatNotificationTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}
