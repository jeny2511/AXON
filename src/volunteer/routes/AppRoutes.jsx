import { Navigate, Route, Routes } from "react-router-dom";
import VolunteerLayout from "../layouts/VolunteerLayout";
import FeedbackForm from "../pages/FeedbackForm";
import Certificates from "../pages/Certificates";
import LearningHub from "../pages/LearningHub";
import Reports from "../pages/Reports";
import Tasks from "../pages/Tasks";
import EventGallery from "../pages/EventGallery";

function AppRoutes() {
  return (
    <Routes>

      {/* Root */}
      <Route
        path="/"
        element={<Navigate to="/volunteer" replace />}
      />

      {/* Volunteer Module */}
      <Route
        path="/volunteer"
        element={<VolunteerLayout />}
      >

        {/* Dashboard */}
        <Route index element={null} />

        {/* Main Menu */}
        <Route path="events" element={null} />
        <Route path="registrations" element={null} />
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