import { BrowserRouter, Routes, Route } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";

import Dashboard from "./pages/admin/Dashboard";
import Events from "./pages/admin/Events";
import Volunteers from "./pages/admin/Volunteers";
import Participants from "./pages/admin/Participants";
import Attendance from "./pages/admin/Attendance";
import Analysis from "./pages/admin/Analysis";
import Feedback from "./pages/admin/Feedback";
import Gallery from "./pages/admin/Gallery";
import TaskProgress from "./pages/admin/TaskProgress";
import Reports from "./pages/admin/Reports";
import AddVolunteer from "./pages/admin/AddVolunteer";
import Profile from "./pages/admin/Profile";

function App() {
  return (
    <BrowserRouter>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/volunteers" element={<Volunteers />} />
          <Route path="/participants" element={<Participants />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/tasks" element={<TaskProgress />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/add-volunteer" element={<AddVolunteer />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </AdminLayout>
    </BrowserRouter>
  );
}

export default App;
