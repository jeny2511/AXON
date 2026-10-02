import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser, isLoggedIn } from "../services/authService";

export function ProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation();
  const authenticated = isLoggedIn();
  const user = getCurrentUser();

  // If not logged in, redirect immediately to the Common Login page
  if (!authenticated || !user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  // If role is restricted and user's role is not authorized, redirect to their home dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === "student") {
      return <Navigate to="/dashboard" replace />;
    }
    if (user.role === "volunteer") {
      return <Navigate to="/volunteer" replace />;
    }
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
