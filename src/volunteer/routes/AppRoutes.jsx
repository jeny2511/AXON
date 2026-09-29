import { Routes, Route, Navigate } from "react-router-dom";
import VolunteerLayout from "../layouts/VolunteerLayout";
import Dashboard from "../pages/Dashboard";

function AppRoutes() {
  return (
    <Routes>
      {/* Root URL */}
      <Route
        path="/"
        element={<Navigate to="/volunteer" replace />}
      />

      {/* Volunteer Module */}
      <Route path="/volunteer" element={<VolunteerLayout />}>

        {/* Dashboard */}
        <Route index element={<Dashboard />} />

        {/* Other pages - content will be added later */}
        <Route path="events" element={null} />
        <Route path="registrations" element={null} />
        <Route path="feedback" element={null} />
        <Route path="gallery" element={null} />
        <Route path="reports" element={null} />
        <Route path="certificates" element={null} />
        <Route path="tasks" element={null} />
        <Route path="presence" element={null} />
        <Route path="learning" element={null} />
        <Route path="notifications" element={null} />
        <Route path="profile" element={null} />

      </Route>
    </Routes>
  );
}

export default AppRoutes;