import { useEffect, useState } from "react";
import {
  Camera,
  Edit3,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  Lock,
  Save,
  X,
  UserRound,
} from "lucide-react";

import { users } from "../../mockData";

const STORAGE_KEY = "axonAdminProfile";

function Profile() {
  const [admin, setAdmin] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedAdmin = localStorage.getItem(STORAGE_KEY);

    if (storedAdmin) {
      const parsedAdmin = JSON.parse(storedAdmin);
      setAdmin(parsedAdmin);
      setFormData(parsedAdmin);
      return;
    }

    const defaultAdmin = users.find(
      (user) => user.role === "admin"
    );

    if (defaultAdmin) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(defaultAdmin)
      );

      setAdmin(defaultAdmin);
      setFormData(defaultAdmin);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setFormData((current) => ({
        ...current,
        profilePhoto: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleEdit = () => {
    setFormData(admin);
    setMessage("");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(admin);
    setMessage("");
    setIsEditing(false);
    setShowPassword(false);
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (
      !formData.fullName?.trim() ||
      !formData.email?.trim() ||
      !formData.phone?.trim() ||
      !formData.department
    ) {
      alert("Please fill all required fields.");
      return;
    }

    const updatedAdmin = {
      ...admin,
      ...formData,
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedAdmin)
    );

    setAdmin(updatedAdmin);
    setFormData(updatedAdmin);
    setIsEditing(false);
    setShowPassword(false);
    setMessage("Profile updated successfully.");

    setTimeout(() => {
      setMessage("");
    }, 2500);
  };

  if (!admin) {
    return (
      <main className="dashboard">
        <div className="profile-loading">
          Loading profile...
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard profile-page">
      <div className="page-heading">
        <div>
          <h2>Admin Profile</h2>
          <p>
            View and manage your administrator account.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            className="primary-button"
            onClick={handleEdit}
          >
            <Edit3 size={16} />
            Edit Profile
          </button>
        )}
      </div>

      {message && (
        <div className="profile-success-message">
          <span>✓</span>
          {message}
        </div>
      )}

      <section className="profile-overview-card">
        <div className="profile-main">
          <div className="profile-large-avatar">
            {admin.profilePhoto ? (
              <img
                src={admin.profilePhoto}
                alt={admin.fullName}
              />
            ) : (
              <UserRound size={42} />
            )}

            {isEditing && (
              <label
                className="profile-camera-button"
                title="Change profile photo"
              >
                <Camera size={15} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
              </label>
            )}
          </div>

          <div className="profile-main-info">
            <div className="profile-name-row">
              <h3>{admin.fullName}</h3>

              <span className="profile-admin-badge">
                <ShieldCheck size={13} />
                Administrator
              </span>
            </div>

            <p className="profile-designation">
              {admin.designation || "Administrator"}
            </p>

            <div className="profile-id">
              Admin ID: <strong>{admin.id}</strong>
            </div>
          </div>
        </div>

        <div className="profile-status">
          <span className="profile-status-dot"></span>
          Active
        </div>
      </section>

      {isEditing ? (
        <form
          className="profile-edit-form"
          onSubmit={handleSave}
        >
          <section className="profile-section-card">
            <div className="profile-section-header">
              <div className="profile-section-icon">
                <UserRound size={18} />
              </div>

              <div>
                <h3>Personal Information</h3>
                <p>
                  Update your basic account information.
                </p>
              </div>
            </div>

            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label>Full Name *</label>
                <input
                  name="fullName"
                  type="text"
                  value={formData.fullName || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="profile-form-group">
                <label>Email *</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="profile-form-group">
                <label>Phone *</label>
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="profile-form-group">
                <label>Department *</label>
                <select
                  name="department"
                  value={formData.department || ""}
                  onChange={handleChange}
                >
                  <option value="">Select Department</option>
                  <option value="IT">IT</option>
                  <option value="CE">CE</option>
                  <option value="ICT">ICT</option>
                  <option value="EC">EC</option>
                </select>
              </div>

              <div className="profile-form-group">
                <label>Designation</label>
                <input
                  name="designation"
                  type="text"
                  value={formData.designation || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="profile-form-group">
                <label>Committee</label>
                <input
                  name="committee"
                  type="text"
                  value={formData.committee || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <section className="profile-section-card">
            <div className="profile-section-header">
              <div className="profile-section-icon">
                <Lock size={18} />
              </div>

              <div>
                <h3>Account Security</h3>
                <p>
                  Update the demo account password.
                </p>
              </div>
            </div>

            <div className="profile-security-row">
              <div className="profile-form-group">
                <label>Password</label>

                <div className="profile-password-wrapper">
                  <input
                    name="password"
                    type={
                      showPassword ? "text" : "password"
                    }
                    value={formData.password || ""}
                    onChange={handleChange}
                    placeholder="Enter password"
                  />

                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="profile-form-actions">
            <button
              type="button"
              className="profile-cancel-button"
              onClick={handleCancel}
            >
              <X size={16} />
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <>
          <section className="profile-section-card">
            <div className="profile-section-header">
              <div className="profile-section-icon">
                <UserRound size={18} />
              </div>

              <div>
                <h3>Personal Information</h3>
                <p>Your administrator account details.</p>
              </div>
            </div>

            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">
                  <Mail size={15} />
                  Email
                </span>
                <strong>{admin.email || "—"}</strong>
              </div>

              <div className="profile-info-item">
                <span className="profile-info-label">
                  <Phone size={15} />
                  Phone
                </span>
                <strong>{admin.phone || "—"}</strong>
              </div>

              <div className="profile-info-item">
                <span className="profile-info-label">
                  <Building2 size={15} />
                  Department
                </span>
                <strong>{admin.department || "—"}</strong>
              </div>

              <div className="profile-info-item">
                <span className="profile-info-label">
                  <ShieldCheck size={15} />
                  Designation
                </span>
                <strong>
                  {admin.designation || "—"}
                </strong>
              </div>

              <div className="profile-info-item">
                <span className="profile-info-label">
                  Committee
                </span>
                <strong>
                  {admin.committee || "—"}
                </strong>
              </div>
            </div>
          </section>

          <section className="profile-section-card">
            <div className="profile-section-header">
              <div className="profile-section-icon">
                <ShieldCheck size={18} />
              </div>

              <div>
                <h3>Account Information</h3>
                <p>Administrator access details.</p>
              </div>
            </div>

            <div className="profile-account-grid">
              <div>
                <span>Account ID</span>
                <strong>{admin.id}</strong>
              </div>

              <div>
                <span>Role</span>
                <strong>Administrator</strong>
              </div>

              <div>
                <span>Department</span>
                <strong>
                  {admin.department || "—"}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong className="profile-active-text">
                  Active
                </strong>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default Profile;
