import { useState, useEffect } from "react";
import StudentLayout from "../layouts/StudentLayout";
import {
  getActiveStudentId,
  getStudentProfile,
  updateStudentProfile,
} from "../services/studentService";
import {
  isLoggedIn,
  loginStudent,
  signupStudent,
} from "../services/authService";
import "./Profile.css";

function Profile() {
  const [authenticated, setAuthenticated] = useState(() => isLoggedIn());
  const [studentId, setStudentId] = useState(() => getActiveStudentId());
  const [student, setStudent] = useState(() => getStudentProfile(studentId));
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text: string }

  // Guest auth tabs
  const [authTab, setAuthTab] = useState("login"); // "login" | "signup"
  const [loginInput, setLoginInput] = useState("");
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    email: "",
    department: "IT",
    year: 3,
    semester: 5,
    enrollmentNo: "",
    phone: "",
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [formData, setFormData] = useState(() => ({
    fullName: student?.fullName || "",
    email: student?.email || "",
    phone: student?.phone || "",
  }));

  const studentsList = mockUsers.filter((u) => u.role === "student");

  useEffect(() => {
    const handleAuthChange = () => {
      const isAuth = isLoggedIn();
      const currentId = getActiveStudentId();
      setAuthenticated(isAuth);
      setStudentId(currentId);
      const profile = getStudentProfile(currentId);
      setStudent(profile);
      if (profile) {
        setFormData({
          fullName: profile.fullName || "",
          email: profile.email || "",
          phone: profile.phone || "",
        });
      }
    };

    window.addEventListener("axon-auth-change", handleAuthChange);
    return () => window.removeEventListener("axon-auth-change", handleAuthChange);
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    if (!formData.fullName.trim() || !formData.email.trim()) {
      setMessage({ type: "error", text: "Name and email are required fields." });
      return;
    }

    const updated = updateStudentProfile(studentId, {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
    });

    setStudent(updated);
    setIsEditing(false);
    setMessage({ type: "success", text: "Profile details updated successfully!" });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleCancelEdit = () => {
    if (student) {
      setFormData({
        fullName: student.fullName || "",
        email: student.email || "",
        phone: student.phone || "",
      });
    }
    setIsEditing(false);
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordUpdate = () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setMessage({ type: "error", text: "Please fill all password fields." });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    setMessage({ type: "success", text: "Account password updated successfully!" });
    setTimeout(() => setMessage(null), 4000);

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setShowPasswordForm(false);
  };

  const handleGuestLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginInput.trim()) {
      setMessage({ type: "error", text: "Please enter your Student ID or Email." });
      return;
    }

    try {
      loginStudent(loginInput);
      setMessage({ type: "success", text: "Logged in successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to log in." });
    }
  };

  const handleGuestQuickLogin = (id) => {
    try {
      loginStudent(id);
      setMessage({ type: "success", text: "Logged in successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to log in." });
    }
  };

  const handleGuestSignupSubmit = (e) => {
    e.preventDefault();
    if (!signupForm.fullName.trim() || !signupForm.email.trim()) {
      setMessage({ type: "error", text: "Full name and email are required." });
      return;
    }

    try {
      signupStudent(signupForm);
      setMessage({ type: "success", text: "Account created and logged in successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to sign up." });
    }
  };

  return (
    <StudentLayout>
      <div className="profile-page">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">
          {authenticated
            ? "View and manage your student academic information."
            : "Sign in with your student account to view and manage your profile."}
        </p>

        {message && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "18px",
              fontSize: "14px",
              fontWeight: "500",
              backgroundColor: message.type === "success" ? "#e6f9f0" : "#feebee",
              color: message.type === "success" ? "#00875a" : "#de350b",
              border: `1px solid ${message.type === "success" ? "#abf5d1" : "#ffbdad"}`,
            }}
          >
            {message.text}
          </div>
        )}

        {!authenticated ? (
          /* Guest Mode Profile View: Login & Signup options */
          <div className="auth-card" style={{ maxWidth: "560px", margin: "0 auto" }}>
            <div className="auth-header">
              <h2>Student Authentication</h2>
              <p>You are currently browsing as a Guest. Log in or register below:</p>
            </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab-btn ${authTab === "login" ? "active" : ""}`}
                onClick={() => setAuthTab("login")}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${authTab === "signup" ? "active" : ""}`}
                onClick={() => setAuthTab("signup")}
              >
                Register Account
              </button>
            </div>

            {authTab === "login" ? (
              <form className="auth-form" onSubmit={handleGuestLoginSubmit}>
                <div className="form-field">
                  <label htmlFor="loginInput">Student ID or Email</label>
                  <input
                    id="loginInput"
                    type="text"
                    placeholder="e.g. ST001 or jeny@vgec.ac.in"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="loginPass">Password</label>
                  <input
                    id="loginPass"
                    type="password"
                    placeholder="Enter password"
                    defaultValue="••••••••"
                  />
                </div>

                <button type="submit" className="auth-submit-btn">
                  Log In to Student Portal
                </button>

                <div className="quick-login-section">
                  <p>Quick Demo Student Accounts:</p>
                  <div className="quick-chips">
                    {studentsList.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        className="quick-chip"
                        onClick={() => handleGuestQuickLogin(st.id)}
                      >
                        {st.fullName} ({st.id})
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleGuestSignupSubmit}>
                <div className="form-field">
                  <label htmlFor="guestFullName">Full Name *</label>
                  <input
                    id="guestFullName"
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={signupForm.fullName}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, fullName: e.target.value })
                    }
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="guestEmail">College Email *</label>
                  <input
                    id="guestEmail"
                    type="email"
                    placeholder="e.g. rahul@vgec.ac.in"
                    value={signupForm.email}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, email: e.target.value })
                    }
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-field">
                    <label htmlFor="guestDept">Department</label>
                    <select
                      id="guestDept"
                      value={signupForm.department}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, department: e.target.value })
                      }
                    >
                      <option value="IT">IT</option>
                      <option value="CE">CE</option>
                      <option value="EC">EC</option>
                      <option value="ICT">ICT</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="guestYear">Year</label>
                    <select
                      id="guestYear"
                      value={signupForm.year}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, year: Number(e.target.value) })
                      }
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="auth-submit-btn">
                  Complete Registration & Sign In
                </button>
              </form>
            )}
          </div>
        ) : student ? (
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-image">
                {student.profilePhoto ? (
                  <img
                    src={student.profilePhoto}
                    alt={student.fullName}
                    onError={(event) => {
                      event.target.style.display = "none";
                    }}
                  />
                ) : (
                  <span>{student.fullName ? student.fullName.charAt(0) : "S"}</span>
                )}
              </div>

              <div>
                <h2>{student.fullName}</h2>
                <p>{student.department} Department • {student.year}</p>
              </div>
            </div>

            <div className="profile-details">
              <div className="profile-field">
                <span>Full Name</span>
                {isEditing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                ) : (
                  <p>{student.fullName}</p>
                )}
              </div>

              <div className="profile-field">
                <span>Enrollment No. (Read-Only)</span>
                <p>{student.enrollmentNo || student.studentId || "N/A"}</p>
              </div>

              <div className="profile-field">
                <span>Email Address</span>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                ) : (
                  <p>{student.email}</p>
                )}
              </div>

              <div className="profile-field">
                <span>Phone Number</span>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                ) : (
                  <p>{student.phone || "Not provided"}</p>
                )}
              </div>

              <div className="profile-field">
                <span>Department</span>
                <p>{student.department}</p>
              </div>

              <div className="profile-field">
                <span>Academic Year & Semester</span>
                <p>{student.year} (Semester {student.semester})</p>
              </div>

              <div className="profile-field">
                <span>Batch</span>
                <p>{student.batch || "2023-2027"}</p>
              </div>

              <div className="profile-field">
                <span>Student ID</span>
                <p>{student.studentId || student.id}</p>
              </div>

              <div className="profile-actions">
                {isEditing ? (
                  <>
                    <button className="save-button" onClick={handleSave}>
                      Save Changes
                    </button>
                    <button
                      className="cancel-button"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="edit-button"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="password-section">
                <div className="password-header">
                  <div>
                    <h2>Change Password</h2>
                    <p>Update your account login password.</p>
                  </div>

                  <button
                    className="password-toggle"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                  >
                    {showPasswordForm ? "Cancel" : "Change Password"}
                  </button>
                </div>

                {showPasswordForm && (
                  <div className="password-form">
                    <div className="password-field">
                      <label>Current Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        placeholder="Enter current password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>

                    <div className="password-field">
                      <label>New Password (min. 8 characters)</label>
                      <input
                        type="password"
                        name="newPassword"
                        placeholder="Enter new password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>

                    <div className="password-field">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Re-enter new password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>

                    <button
                      className="update-password-button"
                      onClick={handlePasswordUpdate}
                    >
                      Update Password
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </StudentLayout>
  );
}

export default Profile;
