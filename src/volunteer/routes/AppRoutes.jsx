import { Navigate, Route, Routes } from "react-router-dom";
import VolunteerLayout from "../layouts/VolunteerLayout";
import FeedbackForm from "../pages/FeedbackForm";
import Certificates from "../pages/Certificates";
import LearningHub from "../pages/LearningHub";
import Reports from "../pages/Reports";
import Tasks from "../pages/Tasks";
import EventGallery from "../pages/EventGallery";
import ManageEvents from "../pages/ManageEvents";
import Registrations from "../pages/Registrations";
import AttendanceSheet from "../pages/AttendanceSheet";

function AppRoutes() {
  return (
    <Routes>

      {/* Root */}
      <Route
        path="/"
        element={<Navigate to="/volunteer" replace />}
      />

      {/* Standalone Attendance Sheet for New Tab / Printing with Full Functionality */}
      <Route
        path="/volunteer/attendance-sheet/:eventId"
        element={<AttendanceSheet />}
      />

      {/* Volunteer Module */}
      <Route
        path="/volunteer"
        element={<VolunteerLayout />}
      >

        {/* Dashboard */}
        <Route index element={null} />

        {/* Main Menu */}
        <Route path="events" element={<ManageEvents />} />
        <Route path="registrations" element={<Registrations />} />
        <Route path="feedback" element={<FeedbackForm />} />
        <Route path="gallery" element={<EventGallery />} />
        <Route path="reports" element={<Reports />} />
        <Route path="certificates" element={<Certificates />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="presence" element={null} />
        <Route path="learning" element={<LearningHub />} />
        <Route path="notifications" element={null} />

        {/* Bottom Menu */}
        <Route path="profile" element={null} />

      </Route>

    </Routes>
  );
}

export default AppRoutes;