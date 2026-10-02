import { useState, useEffect } from "react";
import "./Notifications.css";
import StudentLayout from "../layouts/StudentLayout";
import NotificationCard from "../components/NotificationCard/NotificationCard";
import EmptyState from "../components/EmptyState/EmptyState";
import {
  getActiveStudentId,
  getStudentNotifications,
  fetchStudentNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/studentService";

function Notifications() {
  const studentId = getActiveStudentId();
  const [notificationList, setNotificationList] = useState(() =>
    getStudentNotifications(studentId)
  );

  useEffect(() => {
    fetchStudentNotifications().then((list) => {
      if (Array.isArray(list)) setNotificationList(list);
    });

    const handleSync = () => {
      setNotificationList(getStudentNotifications(studentId));
    };
    window.addEventListener("axon-notifications-change", handleSync);
    return () => window.removeEventListener("axon-notifications-change", handleSync);
  }, [studentId]);

  const handleMarkAsRead = (notificationId) => {
    markNotificationRead(notificationId);
    setNotificationList((currentNotifications) =>
      currentNotifications.map((notification) =>
        (notification.notificationId === notificationId || notification._id === notificationId || notification.id === notificationId)
          ? { ...notification, isRead: true, read: true }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsRead();
    setNotificationList((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        isRead: true,
        read: true,
      }))
    );
  };

  const unreadCount = notificationList.filter((n) => !n.isRead && !n.read).length;

  return (
    <StudentLayout>
      <div className="notifications-page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Notifications</h1>
            <p className="page-subtitle" style={{ margin: "4px 0 0" }}>
              Stay updated with your event activities, announcements, and certifications.
            </p>
          </div>

          {unreadCount > 0 && (
            <div className="notification-actions">
              <button onClick={handleMarkAllAsRead} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontWeight: "500", fontSize: "13px" }}>
                Mark all as read ({unreadCount})
              </button>
            </div>
          )}
        </div>

        <div className="notifications-list">
          {notificationList.length > 0 ? (
            notificationList.map((notification) => (
              <NotificationCard
                key={notification.notificationId}
                title={notification.title}
                message={notification.message}
                type={notification.type}
                isRead={notification.isRead}
                onClick={() =>
                  handleMarkAsRead(notification.notificationId)
                }
              />
            ))
          ) : (
            <EmptyState
              title="No Notifications"
              message="You have no notifications at this time."
            />
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

export default Notifications;