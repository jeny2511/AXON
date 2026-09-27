import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import UpcomingEvents from "../pages/UpcomingEvents";
import RegisteredEvents from "../pages/RegisteredEvents";
import MyEvents from "../pages/MyEvents";
import OngoingEvents from "../pages/OngoingEvents";
import Gallery from "../pages/Gallery";
import LearningHub from "../pages/LearningHub";
import AboutTCF from "../pages/AboutTCF";
import Notifications from "../pages/Notifications";

function StudentRoutes() {
  return (
    <Routes>

      {/* Default page */}
      <Route path="/" element={<Navigate to="/dashboard" />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/upcoming-events" element={<UpcomingEvents />} />
      <Route path="/registered-events" element={<RegisteredEvents />} />
      <Route path="/my-events" element={<MyEvents />} />
      <Route path="/ongoing-events" element={<OngoingEvents />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/learning-hub" element={<LearningHub />} />
      <Route path="/about-tcf" element={<AboutTCF />} />
      <Route path="/notifications" element={<Notifications />} />

    </Routes>
  );
}

export default StudentRoutes;