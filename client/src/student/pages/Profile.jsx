import { useState, useEffect } from "react";
import StudentLayout from "../layouts/StudentLayout";
import {
  isLoggedIn,
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
} from "../../services/authService";
import "./Profile.css";

function Profile() {
  const [student, setStudent] = useState(() => getCurrentUser());
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text: string }
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [formData, setFormData] = useState(() => ({
    fullName: student?.fullName || student?.name || "",
    email: student?.email || "",
    phone: student?.phoneNumber || student?.phone || "",
  }));

  const loadProfile = async () => {
    try {
      if (isLoggedIn()) {
        const user = await getUserProfile();
        setStudent(user);
        setFormData({
          fullName: user.fullName || user.name || "",
          email: user.email || "",
          phone: user.phoneNumber || user.phone || "",
        });
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  useEffect(() => {
    loadProfile();

    const handleAuthChange = () => {
      setAuthenticated(isLoggedIn());
      loadProfile();
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

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      setMessage({ type: "error", text: "Full name is required." });
      return;
    }

    setLoading(true);
    try {
      const updated = await updateUserProfile({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
      });
      setStudent(updated);
      setIsEditing(false);
      setMessage({ type: "success", text: "Profile details updated successfully!" });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (student) {
      setFormData({
        fullName: student.fullName || student.name || "",
        email: student.email || "",
        phone: student.phoneNumber || student.phone || "",
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

  const handlePasswordUpdate = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setMessage({ type: "error", text: "Please fill all password fields." });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    try {
      await changeUserPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      setMessage({ type: "success", text: "Account password updated successfully!" });
      setTimeout(() => setMessage(null), 4000);

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswordForm(false);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to change password." });
    }
  };

  const handleGuestLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginInput.trim()) {
      setMessage({ type: "error", text: "Please enter your Enrollment Number or Email." });
      return;
    }

    try {
      await loginStudent(loginInput, "demo123");
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
          View and manage your student academic information.
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
        {student ? (
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
                <p>{student.enrollmentNumber || student.enrollmentNo || student.studentId || "N/A"}</p>
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
                  <p>{student.email || "N/A"}</p>
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
                  <p>{student.phoneNumber || student.phone || "Not provided"}</p>
                )}
              </div>

              <div className="profile-field">
                <span>Department</span>
                <p>{student.department || student.branch || "N/A"}</p>
              </div>

              <div className="profile-field">
                <span>Academic Year & Semester</span>
                <p>
                  {student.currentYear || student.year ? `${student.currentYear || student.year} Year` : "N/A"}
                  {student.semester ? ` (Semester ${student.semester})` : ""}
                </p>
              </div>

              <div className="profile-field">
                <span>Batch</span>
                <p>
                  {student.batch
                    ? typeof student.batch === "object"
                      ? `${student.batch.startYear || ""}-${student.batch.endYear || ""}`
                      : String(student.batch)
                    : "N/A"}
                </p>
              </div>

              <div className="profile-field">
                <span>Student ID</span>
                <p>{student._id || student.id || student.studentId || "N/A"}</p>
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
