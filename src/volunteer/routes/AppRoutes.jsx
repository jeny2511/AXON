import { Routes, Route, Navigate } from "react-router-dom";
import VolunteerLayout from "../layouts/VolunteerLayout";
import Dashboard from "../pages/Dashboard";
import ManageEvents from "../pages/ManageEvents";

function AppRoutes() {
  return (
    <Routes>
      {/* Root URL */}
      <Route
        path="/"
        element={<Navigate to="/volunteer" replace />}
      />

      {/* Direct path support */}
      <Route
        path="/events"
        element={<Navigate to="/volunteer/events" replace />}
      />

      {/* Volunteer Module */}
      <Route path="/volunteer" element={<VolunteerLayout />}>
        {/* Dashboard */}
        <Route index element={<Dashboard />} />

        {/* Events */}
        <Route path="events" element={<ManageEvents />} />

        {/* Other pages */}
        <Route path="volunteers" element={<Dashboard />} />
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