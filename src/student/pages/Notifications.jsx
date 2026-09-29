import { useState } from "react";
import "./Notifications.css";
import StudentLayout from "../layouts/StudentLayout";
import NotificationCard from "../components/NotificationCard/NotificationCard";
import { getStudentNotifications } from "../services/studentService";

function Notifications() {
  const studentId = "ST001";
  const notifications = getStudentNotifications(studentId);

  const [notificationList, setNotificationList] =
    useState(notifications);

  const handleMarkAsRead = (notificationId) => {
    setNotificationList((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.notificationId === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotificationList((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        isRead: true,
      }))
    );
  };

  return (
    <StudentLayout>
      <div className="notifications-page">

        <h1 className="page-title">Notifications</h1>

        <p className="page-subtitle">
          Stay updated with your event activities and important announcements.
        </p>

        <div className="notification-actions">
          <button onClick={handleMarkAllAsRead}>
            Mark all as read
          </button>
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
            <p>No notifications available.</p>
          )}

        </div>

      </div>
    </StudentLayout>
  );
}

export default Notifications;