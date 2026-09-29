import { useState } from "react";
import StudentLayout from "../layouts/StudentLayout";
import { getStudentProfile } from "../services/studentService";
import "./Profile.css";

function Profile() {
  const studentId = "ST001";
  const student = getStudentProfile(studentId);

  const [isEditing, setIsEditing] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [formData, setFormData] = useState({
    fullName: student?.fullName || "",
    email: student?.email || "",
    phone: student?.phone || "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  const handlePasswordUpdate = () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      alert("Please fill all password fields.");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert("New password must be at least 8 characters.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    alert("Password updated successfully.");

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
        <p className="page-subtitle">View your student information.</p>

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
                  <span>{student.fullName.charAt(0)}</span>
                )}
              </div>

              <div>
                <h2>{student.fullName}</h2>
                <p>{student.department} Department</p>
              </div>
            </div>

            <div className="profile-details">
              <div className="profile-field">
                <span>Name</span>

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
                <span>Email</span>

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
                <span>Phone</span>

                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                ) : (
                  <p>{student.phone}</p>
                )}
              </div>

              <div className="profile-field">
                <span>Department</span>
                <p>{student.department}</p>
              </div>

              <div className="profile-field">
                <span>Year</span>
                <p>{student.year}</p>
              </div>

              <div className="profile-field">
                <span>Semester</span>
                <p>{student.semester}</p>
              </div>

              <div className="profile-actions">
                {isEditing ? (
                  <>
                    <button className="save-button" onClick={handleSave}>
                      Save Changes
                    </button>

                    <button
                      className="cancel-button"
                      onClick={() => setIsEditing(false)}
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
                    <p>Update your account password.</p>
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
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>

                    <div className="password-field">
                      <label>New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>

                    <div className="password-field">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
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
