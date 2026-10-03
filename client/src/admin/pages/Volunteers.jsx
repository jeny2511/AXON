import { useEffect, useState } from "react";
import {
  Edit,
  Trash2,
  Users,
  UserPlus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminService } from "../../services/adminService";

function Volunteers() {
  const navigate = useNavigate();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadVolunteers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({ role: "volunteer" });
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setVolunteers(list.filter((u) => u.role === "volunteer"));
      setError(null);
    } catch (err) {
      console.error("Failed to load volunteers:", err);
      setError(err.message || "Failed to load volunteers from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVolunteers();
  }, []);

  const handleEdit = (id) => {
    navigate(`/admin/add-volunteer?edit=${encodeURIComponent(id)}`);
  };

  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await adminService.deleteUser(id);
      setVolunteers((prev) => prev.filter((v) => (v._id || v.id) !== id));
    } catch (err) {
      alert(err.message || "Failed to delete volunteer.");
    }
  };

  const handleToggleStatus = async (volunteer) => {
    const newStatus = volunteer.accountStatus === "active" ? "suspended" : "active";
    try {
      await adminService.updateUserStatus(volunteer._id || volunteer.id, newStatus);
      setVolunteers((prev) =>
        prev.map((v) =>
          (v._id || v.id) === (volunteer._id || volunteer.id)
            ? { ...v, accountStatus: newStatus }
            : v
        )
      );
    } catch (err) {
      alert(err.message || "Failed to update status.");
    }
  };

  return (
    <main className="dashboard">
      <div className="page-heading">
        <div>
          <h2>Volunteer Management</h2>
          <p>View and manage all volunteers</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/admin/add-volunteer")}
        >
          <UserPlus size={16} />
          Add Volunteer
        </button>
      </div>

      <div className="volunteer-count">
        <Users size={18} />
        <span>
          <strong>{volunteers.length}</strong> Volunteers
        </span>
      </div>

      {error && (
        <div style={{ color: "#ef4444", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
          <p>Loading volunteers...</p>
        </div>
      ) : volunteers.length === 0 ? (
        <div className="volunteer-empty-state">
          <Users size={36} />
          <h3>No volunteers found</h3>
          <p>Add a volunteer to get started.</p>

          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/admin/add-volunteer")}
          >
            <UserPlus size={16} />
            Add Volunteer
          </button>
        </div>
      ) : (
        <section className="volunteer-grid">
          {volunteers.map((volunteer) => {
            const vId = volunteer._id || volunteer.id;
            const isVolunteerActive = volunteer.accountStatus === "active";

            return (
              <div className="volunteer-card" key={vId}>
                <div className="volunteer-image">
                  <img
                    src={
                      volunteer.profilePhoto ||
                      "/assets/images/profile/default.jpg"
                    }
                    alt={volunteer.fullName}
                  />
                </div>

                <div className="volunteer-details">
                  <h3>{volunteer.fullName}</h3>

                  <p>
                    <strong>ID / Enroll:</strong>{" "}
                    {volunteer.enrollmentNumber || vId}
                  </p>

                  <p>
                    <strong>Email:</strong> {volunteer.email}
                  </p>

                  <p>
                    <strong>Branch:</strong>{" "}
                    {volunteer.department}
                  </p>

                  <p>
                    <strong>Semester:</strong>{" "}
                    {volunteer.semester || volunteer.year || "N/A"}
                  </p>

                  <p>
                    <strong>Phone:</strong>{" "}
                    {volunteer.phoneNumber || volunteer.phone || "N/A"}
                  </p>

                  {volunteer.committeePosition && (
                    <p>
                      <strong>Committee:</strong>{" "}
                      {volunteer.committeePosition?.name ||
                        volunteer.committeePosition?.title ||
                        volunteer.committee ||
                        "Core Team"}
                    </p>
                  )}
                </div>

                <div className="volunteer-status-row">
                  <div
                    className="volunteer-status"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleToggleStatus(volunteer)}
                    title="Click to toggle status"
                  >
                    <span
                      className={`status-dot ${
                        isVolunteerActive ? "active" : "inactive"
                      }`}
                    ></span>
                    {isVolunteerActive ? "Active" : "Suspended"}
                  </div>

                  <div className="volunteer-actions">
                    <button
                      type="button"
                      className="volunteer-delete-button"
                      onClick={() => handleDelete(vId, volunteer.fullName)}
                      title="Delete volunteer"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}

export default Volunteers;
