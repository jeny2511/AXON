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
import Dashboard from "../pages/Dashboard";
import MyPresence from "../pages/MyPresence";
import Profile from "../pages/Profile";
import Login from "../pages/Login";

function AppRoutes() {
  return (
    <Routes>

      {/* Login Route */}
      <Route path="/volunteer/login" element={<Login />} />

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
        <Route index element={<Dashboard />} />

        {/* Main Menu */}
        <Route path="events" element={<ManageEvents />} />
        <Route path="registrations" element={<Registrations />} />
        <Route path="feedback" element={<FeedbackForm />} />
        <Route path="gallery" element={<EventGallery />} />
        <Route path="reports" element={<Reports />} />
        <Route path="certificates" element={<Certificates />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="presence" element={<MyPresence />} />
        <Route path="learning" element={<LearningHub />} />
        <Route path="notifications" element={null} />

        {/* Bottom Menu */}
        <Route path="profile" element={<Profile />} />

      </Route>

    </Routes>
  );
}

export default AppRoutes;