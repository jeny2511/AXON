import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
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
import ProtectedRoute from "../components/ProtectedRoute";

function StudentRoutes() {
  return (
    <Routes>
      {/* Default public page */}
      <Route path="/" element={<Navigate to="/dashboard" />} />

      {/* Public / Guest Accessible Pages */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/upcoming-events" element={<UpcomingEvents />} />
      <Route path="/events/:eventId" element={<EventDetails />} />
      <Route path="/ongoing-events" element={<OngoingEvents />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/learning-hub" element={<LearningHub />} />
      <Route path="/about-tcf" element={<AboutTCF />} />

      {/* Protected Student-Only Pages */}
      <Route
        path="/registered-events"
        element={
          <ProtectedRoute>
            <RegisteredEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-events"
        element={
          <ProtectedRoute>
            <MyEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/certificates"
        element={
          <ProtectedRoute>
            <Certificates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedback"
        element={
          <ProtectedRoute>
            <Feedback />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedback/:eventId"
        element={
          <ProtectedRoute>
            <Feedback />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />

      {/* Catch-all fallback */}
      {/* <Route path="*" element={<Navigate to="/dashboard" />} /> */}
    </Routes>
  );
}

export default StudentRoutes;