import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import CommonLogin from "./pages/CommonLogin";
import ProtectedRoute from "./components/ProtectedRoute";
import { isLoggedIn, getCurrentUser } from "./services/authService";

// Student Module Pages
import StudentDashboard from "./student/pages/Dashboard";
import StudentProfile from "./student/pages/Profile";
import UpcomingEvents from "./student/pages/UpcomingEvents";
import MyEvents from "./student/pages/MyEvents";
import OngoingEvents from "./student/pages/OngoingEvents";
import EventDetails from "./student/pages/EventDetails";
import Certificates from "./student/pages/Certificates";
import Feedback from "./student/pages/Feedback";
import Gallery from "./student/pages/EventGallery";
import LearningHub from "./student/pages/LearningHub";
import AboutTCF from "./student/pages/AboutTCF";
import StudentNotifications from "./student/pages/Notifications";

// Volunteer Module Pages & Layout
import VolunteerLayout from "./volunteer/layouts/VolunteerLayout";
import VolunteerDashboard from "./volunteer/pages/Dashboard";
import ManageEvents from "./volunteer/pages/ManageEvents";
import VolunteerRegistrations from "./volunteer/pages/Registrations";
import VolunteerAttendanceSheet from "./volunteer/pages/AttendanceSheet";
import VolunteerFeedbackForm from "./volunteer/pages/FeedbackForm";
import VolunteerEventGallery from "./volunteer/pages/EventGallery";
import VolunteerReports from "./volunteer/pages/Reports";
import VolunteerCertificates from "./volunteer/pages/Certificates";
import VolunteerTasks from "./volunteer/pages/Tasks";
import VolunteerMyPresence from "./volunteer/pages/MyPresence";
import VolunteerLearningHub from "./volunteer/pages/LearningHub";
import VolunteerNotifications from "./volunteer/pages/Notifications";
import VolunteerProfile from "./volunteer/pages/Profile";

// Admin Module Pages & Layout
import AdminLayout from "./admin/layouts/AdminLayout";
import AdminDashboard from "./admin/pages/Dashboard";
import AdminEvents from "./admin/pages/Events";
import AdminVolunteers from "./admin/pages/Volunteers";
import AdminParticipants from "./admin/pages/Participants";
import AdminAttendance from "./admin/pages/Attendance";
import AdminAnalysis from "./admin/pages/Analysis";
import AdminFeedback from "./admin/pages/Feedback";
import AdminGallery from "./admin/pages/Gallery";
import AdminTaskProgress from "./admin/pages/TaskProgress";
import AdminReports from "./admin/pages/Reports";
import AdminProfile from "./admin/pages/Profile";

// Root Redirection Helper
function RootRedirect() {
  const authenticated = isLoggedIn();
  const user = getCurrentUser();

  if (!authenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "student") {
    return <Navigate to="/dashboard" replace />;
  }
  if (user.role === "volunteer") {
    return <Navigate to="/volunteer" replace />;
  }
  if (user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      {/* Root / Default Route */}
      <Route path="/" element={<RootRedirect />} />

      {/* Unified Common Authentication Entry Point */}
      <Route path="/login" element={<CommonLogin />} />

      {/* Backward-compatible redirect for old role login URLs */}
      <Route
        path="/volunteer/login"
        element={<Navigate to="/login?role=volunteer" replace />}
      />
      <Route
        path="/admin/login"
        element={<Navigate to="/login?role=admin" replace />}
      />

      {/* ========================================================= */}
      {/* STUDENT MODULE ROUTES (Protected - Student Role)          */}
      {/* ========================================================= */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upcoming-events"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <UpcomingEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ongoing-events"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <OngoingEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:eventId"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <EventDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/registered-events"
        element={<Navigate to="/my-events" replace />}
      />
      <Route
        path="/my-events"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <MyEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/certificates"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Certificates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedback"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Feedback />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedback/:eventId"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Feedback />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gallery"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Gallery />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learning-hub"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <LearningHub />
          </ProtectedRoute>
        }
      />
      <Route
        path="/about-tcf"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <AboutTCF />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentNotifications />
          </ProtectedRoute>
        }
      />

      {/* ========================================================= */}
      {/* VOLUNTEER MODULE ROUTES (Protected - Volunteer Role)       */}
      {/* ========================================================= */}
      {/* Standalone Attendance Sheet for Printing / Full Screen */}
      <Route
        path="/volunteer/attendance-sheet/:eventId"
        element={
          <ProtectedRoute allowedRoles={["volunteer"]}>
            <VolunteerAttendanceSheet />
          </ProtectedRoute>
        }
      />

      <Route
        path="/volunteer"
        element={
          <ProtectedRoute allowedRoles={["volunteer"]}>
            <VolunteerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<VolunteerDashboard />} />
        <Route path="events" element={<ManageEvents />} />
        <Route path="registrations" element={<VolunteerRegistrations />} />
        <Route path="feedback" element={<VolunteerFeedbackForm />} />
        <Route path="gallery" element={<VolunteerEventGallery />} />
        <Route path="reports" element={<VolunteerReports />} />
        <Route path="certificates" element={<VolunteerCertificates />} />
        <Route path="tasks" element={<VolunteerTasks />} />
        <Route path="presence" element={<VolunteerMyPresence />} />
        <Route path="learning" element={<VolunteerLearningHub />} />
        <Route path="notifications" element={<VolunteerNotifications />} />
        <Route path="profile" element={<VolunteerProfile />} />
      </Route>

      {/* ========================================================= */}
      {/* ADMIN MODULE ROUTES (Protected - Admin Role)              */}
      {/* ========================================================= */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="volunteers" element={<AdminVolunteers />} />
        <Route path="participants" element={<AdminParticipants />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="analysis" element={<AdminAnalysis />} />
        <Route path="feedback" element={<AdminFeedback />} />
        <Route path="gallery" element={<AdminGallery />} />
        <Route path="tasks" element={<AdminTaskProgress />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="add-volunteer" element={<Navigate to="/admin/volunteers" replace />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;