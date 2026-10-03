import { useState, useEffect } from "react";
import {
  Shield,
  Eye,
  EyeOff,
  Pencil,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { users as mockUsers } from "../../mockData/users";

function Profile() {
  // Find default admin or fallback from localStorage
  const defaultAdmin = mockUsers.find((u) => u.role === "admin") || {
    id: "AD001",
    role: "admin",
    fullName: "Ishika Patel",
    email: "ishika@vgec.ac.in",
    phone: "9876543230",
    profilePhoto: "/assets/images/profile/ishika.jpg",
    password: "admin@123",
  };

  const [admin, setAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem("axon_admin_profile");
      if (stored) return JSON.parse(stored);
      const authUser = localStorage.getItem("axon_auth_user");
      if (authUser) {
        const parsed = JSON.parse(authUser);
        if (parsed.role === "admin") {
          return {
            ...defaultAdmin,
            ...parsed,
            password: parsed.password || defaultAdmin.password || "admin@123",
          };
        }
      }
    } catch {}
    return defaultAdmin;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form Data for editable fields: Full Name, Phone Number
  const [formData, setFormData] = useState({
    fullName: admin.fullName || "",
    phone: admin.phone || admin.phoneNumber || "",
  });

  useEffect(() => {
    setFormData({
      fullName: admin.fullName || "",
      phone: admin.phone || admin.phoneNumber || "",
    });
  }, [admin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.fullName.trim()) {
      setNotification({
        type: "error",
        message: "Full Name is required.",
      });
      return;
    }

    const updated = {
      ...admin,
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
    };

    setAdmin(updated);
    try {
      localStorage.setItem("axon_admin_profile", JSON.stringify(updated));
      const authUser = localStorage.getItem("axon_auth_user");
      if (authUser) {
        const parsed = JSON.parse(authUser);
        if (parsed.role === "admin") {
          localStorage.setItem(
            "axon_auth_user",
            JSON.stringify({ ...parsed, ...updated })
          );
        }
      }
      window.dispatchEvent(new Event("axon-profile-change"));
    } catch {}

    setIsEditing(false);
    setNotification({
      type: "success",
      message: "Profile updated successfully!",
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const adminPassword = admin.password || "admin@123";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#24154f] tracking-tight">
              Admin Profile
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-[#7040d0] border border-purple-200">
              <Shield size={12} />
              Admin
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            View and manage administrator profile details.
          </p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-[#7040d0] hover:bg-[#5b32af] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Pencil size={14} />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  fullName: admin.fullName || "",
                  phone: admin.phone || admin.phoneNumber || "",
                });
                setIsEditing(false);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleProfileSave}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-[#7040d0] hover:bg-[#5b32af] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Save size={14} />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-xl text-xs font-semibold border animate-in fade-in duration-200 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 2. Main Profile Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        {/* User Hero Row */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#24154f] to-[#7040d0] flex items-center justify-center text-white font-bold text-2xl shadow-sm border-2 border-white shrink-0 overflow-hidden">
            {admin.profilePhoto && !admin.profilePhoto.includes("default") ? (
              <img
                src={admin.profilePhoto}
                alt={admin.fullName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span>
                {admin.fullName
                  ? admin.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                  : "AD"}
              </span>
            )}
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-lg font-bold text-gray-900">
              {admin.fullName}
            </h2>
            <p className="text-xs text-gray-500">{admin.email}</p>
          </div>
        </div>

        {/* Form Fields: Only Full Name, Email ID (view only), Password (view only), Phone Number */}
        <form onSubmit={handleProfileSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* 1. Full Name (Editable) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  disabled={!isEditing}
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className={`w-full h-10 px-3.5 rounded-xl text-xs transition-all ${
                    isEditing
                      ? "bg-white border border-gray-200 text-gray-900 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none shadow-2xs"
                      : "bg-gray-50 border border-gray-200 text-gray-700 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>

            {/* 2. Email ID (View Only) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Email ID <span className="text-[10px] text-gray-400 font-normal">(View Only)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={admin.email || ""}
                  className="w-full h-10 px-3.5 rounded-xl text-xs bg-gray-50 border border-gray-200 text-gray-700 select-all cursor-default"
                />
              </div>
            </div>

            {/* 3. Password (View Only) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Password <span className="text-[10px] text-gray-400 font-normal">(View Only)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  disabled
                  value={adminPassword}
                  className="w-full h-10 pl-3.5 pr-10 rounded-xl text-xs bg-gray-50 border border-gray-200 text-gray-700 font-mono select-all cursor-default"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? "Hide password" : "View password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-lg transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* 4. Phone Number (Editable) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  disabled={!isEditing}
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className={`w-full h-10 px-3.5 rounded-xl text-xs transition-all ${
                    isEditing
                      ? "bg-white border border-gray-200 text-gray-900 focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none shadow-2xs"
                      : "bg-gray-50 border border-gray-200 text-gray-700 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;
