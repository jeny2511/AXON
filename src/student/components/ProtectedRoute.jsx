import { useNavigate, useLocation } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";
import { isLoggedIn } from "../services/authService";

function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const authenticated = isLoggedIn();

  if (authenticated) {
    return children;
  }

  const handleLoginRedirect = () => {
    navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
  };

  const handleReturnToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <StudentLayout>
      <div style={{ maxWidth: "600px", margin: "40px auto", padding: "0 16px" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e8e7ee",
            padding: "36px 28px",
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(33, 22, 80, 0.04)",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#f0ebfa",
              color: "#6a3bc5",
              fontSize: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            🔒
          </div>

          <h2
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#1f1f29",
              margin: "0 0 10px",
            }}
          >
            Please login to continue
          </h2>

          <p
            style={{
              fontSize: "14px",
              color: "#737383",
              lineHeight: "1.6",
              margin: "0 0 28px",
            }}
          >
            This feature requires a student login. Sign in with your student
            account to access your personalized event registrations,
            attendance passes, feedback, and verified certificates.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={handleLoginRedirect}
              style={{
                padding: "12px 24px",
                background: "#6a3bc5",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#5830a8")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#6a3bc5")}
            >
              Login to Continue
            </button>

            <button
              onClick={handleReturnToDashboard}
              style={{
                padding: "12px 24px",
                background: "#f0f0f3",
                color: "#4f4e5a",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#e8e7ee")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#f0f0f3")}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

export default ProtectedRoute;
