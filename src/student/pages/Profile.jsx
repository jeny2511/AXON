import { useState } from "react";
import StudentLayout from "../layouts/StudentLayout";
import {
  getActiveStudentId,
  getStudentProfile,
  updateStudentProfile,
} from "../services/studentService";
import "./Profile.css";

function Profile() {
  const [studentId] = useState(() => getActiveStudentId());
  const [student, setStudent] = useState(() => getStudentProfile(studentId));
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text: string }

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

  return (
    <StudentLayout>
      <div className="profile-page">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">View and manage your student academic information.</p>

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

        {student && (
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
        )}
      </div>
    </StudentLayout>
  );
}

export default Profile;
