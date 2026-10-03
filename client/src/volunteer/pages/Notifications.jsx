import { useState, useMemo } from "react";
import {
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Info,
  AlertCircle,
  FileCheck,
  Award,
  Filter,
} from "lucide-react";
import { getAuthUser } from "../../services/authService";

function Notifications() {
  const currentVolunteer = getAuthUser();
  const volunteerId = currentVolunteer?.id || currentVolunteer?.userId || "VL001";

  const [notificationsList, setNotificationsList] = useState(() => {
    const saved = localStorage.getItem(`axon_notifications_${volunteerId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [filter, setFilter] = useState("all");

  const saveNotifications = (newList) => {
    setNotificationsList(newList);
    localStorage.setItem(
      `axon_notifications_${volunteerId}`,
      JSON.stringify(newList)
    );
  };

  const markAsRead = (notificationId) => {
    const updated = notificationsList.map((n) =>
      n.notificationId === notificationId ? { ...n, isRead: true } : n
    );
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notificationsList.map((n) => ({ ...n, isRead: true }));
    saveNotifications(updated);
  };

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notificationsList.filter((n) => !n.isRead);
    }
    if (filter === "read") {
      return notificationsList.filter((n) => n.isRead);
    }
    return notificationsList;
  }, [notificationsList, filter]);

  const unreadCount = notificationsList.filter((n) => !n.isRead).length;

  const getIcon = (type) => {
    switch (type) {
      case "deadline":
      case "reminder":
        return <Clock className="text-amber-500" size={18} />;
      case "attendance":
      case "task":
        return <CheckCircle className="text-emerald-500" size={18} />;
      case "report":
      case "certificate":
        return <Award className="text-purple-600" size={18} />;
      case "alert":
        return <AlertCircle className="text-rose-500" size={18} />;
      case "registration":
        return <FileCheck className="text-blue-500" size={18} />;
      default:
        return <Info className="text-indigo-500" size={18} />;
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Stay updated with event assignments, approvals, and reminders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-100"
            >
              <CheckCircle size={15} />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
            filter === "all"
              ? "bg-[#211653] text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          All ({notificationsList.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
            filter === "unread"
              ? "bg-[#211653] text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter("read")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
            filter === "read"
              ? "bg-[#211653] text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Read ({notificationsList.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <Bell className="mx-auto text-gray-300" size={36} />
            <h3 className="mt-3 text-sm font-semibold text-gray-700">
              No notifications found
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              You're all caught up with your updates.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.notificationId}
              onClick={() => markAsRead(notif.notificationId)}
              className={`group flex items-start gap-4 rounded-xl border p-4 transition cursor-pointer ${
                notif.isRead
                  ? "border-gray-200 bg-white hover:border-gray-300"
                  : "border-purple-200 bg-purple-50/40 hover:bg-purple-50/70"
              }`}
            >
              <div className="mt-0.5 rounded-lg bg-white p-2 shadow-xs border border-gray-100">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {notif.title}
                  </h4>
                  <span className="text-[11px] text-gray-400 shrink-0">
                    {formatTimestamp(notif.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                  {notif.message}
                </p>
                {notif.eventId && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                    <Calendar size={11} />
                    Event ID: {notif.eventId}
                  </div>
                )}
              </div>

              {!notif.isRead && (
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#7040d0] shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;
