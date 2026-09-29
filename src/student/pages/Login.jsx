import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";
import { loginStudent, signupStudent } from "../services/authService";
import { users as mockUsers } from "../../mockData/users";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const [activeTab, setActiveTab] = useState("login"); // "login" | "signup"
  const [error, setError] = useState("");

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    department: "IT",
    year: 3,
    semester: 5,
    enrollmentNo: "",
    phone: "",
  });

  const studentsList = mockUsers.filter((u) => u.role === "student");

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setError("Please enter your Student ID, Email, or Enrollment Number.");
      return;
    }

    try {
      loginStudent(loginIdentifier, loginPassword);
      navigate(redirectPath);
    } catch (err) {
      setError(err.message || "Failed to log in.");
    }
  };

  const handleQuickLogin = (studentId) => {
    try {
      loginStudent(studentId);
      navigate(redirectPath);
    } catch (err) {
      setError(err.message || "Failed to log in.");
    }
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    if (!signupData.fullName.trim() || !signupData.email.trim()) {
      setError("Full name and email are required.");
      return;
    }

    try {
      signupStudent(signupData);
      navigate(redirectPath);
    } catch (err) {
      setError(err.message || "Failed to create account.");
    }
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  return (
    <StudentLayout>
      <div className="login-page-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Student Portal Access</h2>
            <p>Sign in to your account or create a new student registration.</p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === "login" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("login");
                setError("");
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === "signup" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("signup");
                setError("");
              }}
            >
              Register Account
            </button>
          </div>

          {error && <div className="auth-error-banner">{error}</div>}

          {activeTab === "login" ? (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <div className="form-field">
                <label htmlFor="loginIdentifier">Student ID, Email or Enrollment No.</label>
                <input
                  id="loginIdentifier"
                  type="text"
                  placeholder="e.g. ST001 or jeny@vgec.ac.in"
                  value={loginIdentifier}
                  onChange={(e) => {
                    setLoginIdentifier(e.target.value);
                    setError("");
                  }}
                />
              </div>

              <div className="form-field">
                <label htmlFor="loginPassword">Password</label>
                <input
                  id="loginPassword"
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="auth-submit-btn">
                Log In to AXON
              </button>

              {/* Quick 1-Click Demo Accounts for viva/testing */}
              <div className="quick-login-section">
                <p>Quick Demo Student Accounts:</p>
                <div className="quick-chips">
                  {studentsList.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      className="quick-chip"
                      onClick={() => handleQuickLogin(st.id)}
                    >
                      {st.fullName} ({st.id})
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignupSubmit}>
              <div className="form-field">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={signupData.fullName}
                  onChange={handleSignupChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="email">College Email *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="e.g. rahul@vgec.ac.in"
                  value={signupData.email}
                  onChange={handleSignupChange}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-field">
                  <label htmlFor="department">Department</label>
                  <select
                    id="department"
                    name="department"
                    value={signupData.department}
                    onChange={handleSignupChange}
                  >
                    <option value="IT">IT</option>
                    <option value="CE">CE</option>
                    <option value="EC">EC</option>
                    <option value="ICT">ICT</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Electrical">Electrical</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="year">Academic Year</label>
                  <select
                    id="year"
                    name="year"
                    value={signupData.year}
                    onChange={handleSignupChange}
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-field">
                  <label htmlFor="enrollmentNo">Enrollment No.</label>
                  <input
                    id="enrollmentNo"
                    name="enrollmentNo"
                    type="text"
                    placeholder="220130107..."
                    value={signupData.enrollmentNo}
                    onChange={handleSignupChange}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={signupData.phone}
                    onChange={handleSignupChange}
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn">
                Complete Registration & Log In
              </button>
            </form>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

export default Login;
