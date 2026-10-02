import { Route, Routes, Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../pages/Dashboard";
import Events from "../pages/Events";
import Volunteers from "../pages/Volunteers";
import Participants from "../pages/Participants";
import Attendance from "../pages/Attendance";
import Analysis from "../pages/Analysis";
import Feedback from "../pages/Feedback";
import Gallery from "../pages/Gallery";
import TaskProgress from "../pages/TaskProgress";
import Reports from "../pages/Reports";
import Profile from "../pages/Profile";

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="events" element={<Events />} />
        <Route path="volunteers" element={<Volunteers />} />
        <Route path="participants" element={<Participants />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="analysis" element={<Analysis />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="tasks" element={<TaskProgress />} />
        <Route path="reports" element={<Reports />} />
        <Route path="add-volunteer" element={<Navigate to="/admin/volunteers" replace />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default AdminRoutes;
