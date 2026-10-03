import { useState } from "react";
import {
  Upload,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminService } from "../../services/adminService";

function AddVolunteer() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Information Technology");
  const [semester, setSemester] = useState("6");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName.trim() || !enrollmentNo.trim() || !email.trim() || !password.trim()) {
      setError("Please fill all required fields (Full Name, Enrollment No, Email, Password).");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      await adminService.createVolunteer({
        fullName: fullName.trim(),
        enrollmentNumber: enrollmentNo.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        phoneNumber: phone.trim() || "9876543210",
        department: department.trim(),
        semester: Number(semester) || 6,
        password: password.trim(),
        profilePhoto: profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
      });

      setSuccess("Volunteer account created successfully!");
      setTimeout(() => {
        navigate("/admin/volunteers");
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to create volunteer account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dashboard">
      <div className="page-heading">
        <div>
          <h2>Add New Volunteer</h2>
          <p>Create a verified volunteer account with administrative privileges</p>
        </div>
      </div>

      <section className="volunteer-form-card" style={{ background: "#ffffff", padding: "2rem", borderRadius: "0.75rem", maxWidth: "800px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {error && (
          <div style={{ color: "#ef4444", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ color: "#16a34a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#334155" }}>Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Parth Patel"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", background: "#ffffff", color: "#0f172a" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#334155" }}>Enrollment Number *</label>
              <input
                type="text"
                placeholder="e.g. 210170116050"
                value={enrollmentNo}
                onChange={(e) => setEnrollmentNo(e.target.value)}
                required
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", background: "#ffffff", color: "#0f172a" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#334155" }}>Email Address *</label>
              <input
                type="email"
                placeholder="e.g. volunteer@axon.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", background: "#ffffff", color: "#0f172a" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#334155" }}>Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", background: "#ffffff", color: "#0f172a" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#334155" }}>Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", background: "#ffffff", color: "#0f172a" }}
              >
                <option value="Information Technology">Information Technology</option>
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Chemical Engineering">Chemical Engineering</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#334155" }}>Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", background: "#ffffff", color: "#0f172a" }}
              >
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500, color: "#334155" }}>Initial Password *</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Set initial password for volunteer"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: "100%", padding: "0.6rem 2.5rem 0.6rem 0.8rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", background: "#ffffff", color: "#0f172a" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => navigate("/admin/volunteers")}
              style={{ padding: "0.6rem 1.25rem", borderRadius: "0.375rem", border: "1px solid #d1d5db", background: "#f8fafc", color: "#334155", cursor: "pointer", fontWeight: 500 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="primary-button"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <UserPlus size={16} />
              {loading ? "Creating..." : "Create Volunteer"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default AddVolunteer;
