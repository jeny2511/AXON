import StudentLayout from "../layouts/StudentLayout";
import NotificationCard from "../components/NotificationCard/NotificationCard";
import { getStudentNotifications } from "../services/studentService";
import "./Notifications.css";

function Notifications() {
  const studentId = "ST001";
  const notifications = getStudentNotifications(studentId);

  return (
    <StudentLayout>

      <div className="notifications-page">

        <h1 className="page-title">Notifications</h1>

        <p className="page-subtitle">
          Stay updated with your event activities and important announcements.
        </p>

        <div className="notifications-list">

          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationCard
                key={notification.notificationId}
                title={notification.title}
                message={notification.message}
                type={notification.type}
                isRead={notification.isRead}
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