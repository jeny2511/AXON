import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import UpcomingEvents from "../pages/UpcomingEvents";
import RegisteredEvents from "../pages/RegisteredEvents";
import MyEvents from "../pages/MyEvents";
import OngoingEvents from "../pages/OngoingEvents";
import EventDetails from "../pages/EventDetails";
import Certificates from "../pages/Certificates";
import Feedback from "../pages/Feedback";
import Gallery from "../pages/EventGallery";
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
      <Route path="/events/:eventId" element={<EventDetails />} />
      <Route path="/registered-events" element={<RegisteredEvents />} />
      <Route path="/my-events" element={<MyEvents />} />
      <Route path="/ongoing-events" element={<OngoingEvents />} />
      <Route path="/certificates" element={<Certificates />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/feedback/:eventId" element={<Feedback />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/learning-hub" element={<LearningHub />} />
      <Route path="/about-tcf" element={<AboutTCF />} />
      <Route path="/notifications" element={<Notifications />} />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default StudentRoutes;