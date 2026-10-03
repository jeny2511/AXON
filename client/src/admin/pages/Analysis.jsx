import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  MessageSquareText,
  Users,
  Award,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { adminService } from "../../services/adminService";

function Analysis() {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const res = await adminService.getSystemAnalysis();
        setAnalysisData(res.data || {});
        setError(null);
      } catch (err) {
        console.error("Failed to load system analysis:", err);
        setError(err.message || "Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, []);

  const totalStudents = analysisData?.totalStudents || 0;
  const totalVolunteers = analysisData?.totalVolunteers || 0;
  const totalRegistrations = analysisData?.totalRegistrations || 0;
  const totalEvents = analysisData?.totalEvents || 0;
  const totalAttendance = analysisData?.totalAttendance || 0;
  const averageParticipation = analysisData?.overallAttendanceRate || 0;
  const totalFeedback = analysisData?.totalFeedback || 0;
  const totalCertificates = analysisData?.totalCertificates || 0;
  const events = analysisData?.eventsPerformance || [];

  return (
    <main className="dashboard analysis-page">
      {/* PAGE HEADER */}
      <div className="page-heading analysis-heading">
        <div>
          <h2>Analytics & Insights</h2>
          <p>Live operational and participation metrics from system database</p>
        </div>
      </div>

      {error && (
        <div style={{ color: "#ef4444", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
          <p>Calculating live system analytics...</p>
        </div>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <section className="analysis-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div className="analysis-stat-card">
              <div className="analysis-stat-icon">
                <Users size={20} />
              </div>
              <div>
                <span>Total Students</span>
                <strong>{totalStudents}</strong>
              </div>
            </div>

            <div className="analysis-stat-card">
              <div className="analysis-stat-icon">
                <Users size={20} />
              </div>
              <div>
                <span>Total Volunteers</span>
                <strong>{totalVolunteers}</strong>
              </div>
            </div>

            <div className="analysis-stat-card">
              <div className="analysis-stat-icon">
                <CalendarDays size={20} />
              </div>
              <div>
                <span>Total Events</span>
                <strong>{totalEvents}</strong>
              </div>
            </div>

            <div className="analysis-stat-card">
              <div className="analysis-stat-icon">
                <TrendingUp size={20} />
              </div>
              <div>
                <span>Total Registrations</span>
                <strong>{totalRegistrations}</strong>
              </div>
            </div>

            <div className="analysis-stat-card">
              <div className="analysis-stat-icon">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span>Total Attendances</span>
                <strong>{totalAttendance}</strong>
              </div>
            </div>

            <div className="analysis-stat-card">
              <div className="analysis-stat-icon">
                <BarChart3 size={20} />
              </div>
              <div>
                <span>Turnout Rate</span>
                <strong>{averageParticipation}%</strong>
              </div>
            </div>

            <div className="analysis-stat-card">
              <div className="analysis-stat-icon">
                <MessageSquareText size={20} />
              </div>
              <div>
                <span>Student Feedback</span>
                <strong>{totalFeedback}</strong>
              </div>
            </div>

            <div className="analysis-stat-card">
              <div className="analysis-stat-icon">
                <Award size={20} />
              </div>
              <div>
                <span>Certificates Issued</span>
                <strong>{totalCertificates}</strong>
              </div>
            </div>
          </section>

          {/* EVENTS BREAKDOWN */}
          <section className="analysis-panel" style={{ marginTop: "1.5rem", background: "#ffffff", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", color: "#0f172a" }}>Event Performance Overview</h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem" }}>Live breakdown across all created events</p>
              </div>
              <BarChart3 size={20} style={{ color: "#7040d0" }} />
            </div>

            {events.length === 0 ? (
              <p style={{ color: "#64748b", textAlign: "center", padding: "1.5rem" }}>No events found for analytics.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", background: "#f8fafc" }}>
                      <th style={{ padding: "0.75rem 0.5rem" }}>Event Name</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>Category</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>Capacity</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>Registrations</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>Attendees</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>Turnout</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => {
                      const capacity = ev.participantsLimit || 100;
                      const regs = ev.registeredCount || 0;
                      const att = ev.attendedCount || 0;
                      const turnoutPct = regs > 0 ? Math.round((att / regs) * 100) : 0;

                      return (
                        <tr key={ev._id || ev.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600, color: "#0f172a" }}>{ev.name}</td>
                          <td style={{ padding: "0.75rem 0.5rem", color: "#7040d0", fontWeight: 500 }}>{ev.category || "General"}</td>
                          <td style={{ padding: "0.75rem 0.5rem", color: "#64748b" }}>{capacity}</td>
                          <td style={{ padding: "0.75rem 0.5rem", color: "#334155", fontWeight: 500 }}>{regs}</td>
                          <td style={{ padding: "0.75rem 0.5rem", color: "#16a34a", fontWeight: 600 }}>{att}</td>
                          <td style={{ padding: "0.75rem 0.5rem", color: "#d97706", fontWeight: 700 }}>{turnoutPct}%</td>
                          <td style={{ padding: "0.75rem 0.5rem" }}>
                            <span style={{
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "capitalize",
                              background: ev.status === "completed" ? "#dcfce7" : "#eff6ff",
                              color: ev.status === "completed" ? "#15803d" : "#1d4ed8",
                            }}>
                              {ev.status || "published"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default Analysis;
