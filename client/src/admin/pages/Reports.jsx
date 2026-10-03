import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock3,
  Download,
  Eye,
  FileText,
  Filter,
  Search,
  X,
  RefreshCw,
} from "lucide-react";
import { reportService } from "../../services/reportService";
import { getAssetUrl } from "../../utils/urlUtils";

const statusClass = {
  "Pending Review": "pending",
  Approved: "approved",
  "Revision Requested": "revision",
};

function Reports() {
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportService.getReports();
      const rawReports = res.data || [];

      const mapped = rawReports.map((report) => {
        const id = report._id || report.id;
        const eventName = report.eventId?.name || report.eventName || "Event Report";
        const evIdStr = (report.eventId?._id || report.eventId || "")?.toString();
        const fileName = report.reportUrl ? report.reportUrl.split("/").pop() : "Report.pdf";
        const submittedBy = report.uploadedBy?.fullName || report.uploadedBy?.name || "Volunteer";
        const submittedOn = report.uploadedAt
          ? new Date(report.uploadedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Recent";
        const uiStatus =
          report.status === "approved"
            ? "Approved"
            : report.status === "rejected" || report.status === "resubmitted"
            ? "Revision Requested"
            : "Pending Review";

        return {
          id,
          rawStatus: report.status || "pending",
          status: uiStatus,
          eventName,
          eventId: evIdStr,
          fileName,
          reportUrl: report.reportUrl,
          submittedBy,
          submittedOn,
          updated: report.updatedAt
            ? new Date(report.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Just now",
        };
      });

      setReportsList(mapped);
    } catch (err) {
      console.error("Failed to load reports from API:", err);
      setReportsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reportsList.filter((report) => {
      const matchesSearch =
        !query ||
        report.eventName.toLowerCase().includes(query) ||
        report.submittedBy.toLowerCase().includes(query) ||
        report.eventId.toLowerCase().includes(query) ||
        report.fileName.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || report.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reportsList, search, statusFilter]);

  const pendingCount = reportsList.filter(
    (report) => report.status === "Pending Review"
  ).length;

  const approvedCount = reportsList.filter(
    (report) => report.status === "Approved"
  ).length;

  const revisionCount = reportsList.filter(
    (report) => report.status === "Revision Requested"
  ).length;

  const updateStatus = async (id, newUiStatus) => {
    const apiStatus =
      newUiStatus === "Approved"
        ? "approved"
        : newUiStatus === "Revision Requested"
        ? "rejected"
        : "pending";

    try {
      await reportService.updateReportStatus(id, apiStatus);
      await fetchReports();
      if (selectedReport && selectedReport.id === id) {
        setSelectedReport(null);
      }
    } catch (err) {
      alert(err.message || "Failed to update report status.");
    }
  };

  const handleDownload = (report) => {
    if (!report?.reportUrl) {
      alert("No report file URL available.");
      return;
    }
    const fullUrl = getAssetUrl(report.reportUrl);
    window.open(fullUrl, "_blank");
  };

  return (
    <main className="dashboard reports-page">
      <div className="page-heading reports-heading">
        <div>
          <h2>Reports</h2>
          <p>
            Review event reports submitted by volunteers and manage their
            approval status.
          </p>
        </div>
      </div>

      <section className="report-stat-grid">
        <div className="report-stat-card">
          <div className="report-stat-icon total">
            <FileText size={18} />
          </div>
          <div>
            <span>Total Reports</span>
            <strong>{reportsList.length}</strong>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-icon pending">
            <Clock3 size={18} />
          </div>
          <div>
            <span>Pending Review</span>
            <strong>{pendingCount}</strong>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-icon approved">
            <Check size={18} />
          </div>
          <div>
            <span>Approved</span>
            <strong>{approvedCount}</strong>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-icon revision">
            <X size={18} />
          </div>
          <div>
            <span>Revision Requested</span>
            <strong>{revisionCount}</strong>
          </div>
        </div>
      </section>

      <section className="reports-panel">
        <div className="reports-panel-header">
          <div>
            <h3>Submitted Reports</h3>
            <p>PDF reports received from volunteers for completed events.</p>
          </div>

          <span className="report-count-badge">
            {filteredReports.length} Reports
          </span>
        </div>

        <div className="reports-toolbar">
          <div className="reports-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search event, volunteer or report..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="report-filter">
            <Filter size={14} />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Revision Requested">
                Revision Requested
              </option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
            <p>Loading submitted reports...</p>
          </div>
        ) : (
          <div className="reports-list">
            {filteredReports.map((report) => (
              <article className="report-row" key={report.id}>
                <div className="report-file-icon">
                  <FileText size={20} />
                  <span>PDF</span>
                </div>

                <div className="report-main">
                  <div className="report-title-line">
                    <h4>{report.eventName}</h4>
                    {report.eventId && <span className="report-event-id">{report.eventId}</span>}
                  </div>

                  <p className="report-file-name">{report.fileName}</p>

                  <div className="report-meta">
                    <span>
                      <strong>Submitted by:</strong> {report.submittedBy}
                    </span>
                    <span>
                      <strong>Date:</strong> {report.submittedOn}
                    </span>
                  </div>
                </div>

                <div className="report-status-wrap">
                  <span
                    className={`report-status ${
                      statusClass[report.status] || ""
                    }`}
                  >
                    <span className="report-status-dot" />
                    {report.status}
                  </span>
                  <small>Updated {report.updated}</small>
                </div>

                <div className="report-actions">
                  <button
                    type="button"
                    className="report-icon-button"
                    title="View report"
                    onClick={() => setSelectedReport(report)}
                  >
                    <Eye size={15} />
                  </button>

                  <button
                    type="button"
                    className="report-icon-button"
                    title="Download / Open file"
                    onClick={() => handleDownload(report)}
                  >
                    <Download size={15} />
                  </button>

                  {report.status !== "Approved" && (
                    <button
                      type="button"
                      className="report-approve-button"
                      onClick={() => updateStatus(report.id, "Approved")}
                    >
                      <Check size={14} />
                      Approve
                    </button>
                  )}
                </div>
              </article>
            ))}

            {filteredReports.length === 0 && (
              <div className="reports-empty">
                <FileText size={30} />
                <h4>No reports found</h4>
                <p>No volunteer reports have been submitted yet, or none match the filter.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {selectedReport && (
        <div
          className="report-modal-overlay"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="report-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="report-modal-header">
              <div>
                <span className="modal-pdf-label">EVENT REPORT</span>
                <h3>{selectedReport.eventName}</h3>
                <p>{selectedReport.fileName}</p>
              </div>

              <button
                type="button"
                className="report-modal-close"
                onClick={() => setSelectedReport(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="report-preview" style={{ padding: "2rem", textAlign: "center" }}>
              <FileText size={46} style={{ margin: "0 auto 0.75rem", color: "#6366f1" }} />
              <h4>{selectedReport.fileName}</h4>
              <p style={{ color: "#64748b", margin: "0.5rem 0 1rem" }}>
                Submitted by <strong>{selectedReport.submittedBy}</strong> on {selectedReport.submittedOn}
              </p>
              <button
                type="button"
                className="primary-button"
                onClick={() => handleDownload(selectedReport)}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Download size={15} />
                Open / Download File
              </button>
            </div>

            <div className="report-modal-footer">
              <button
                type="button"
                className="revision-button"
                onClick={() => updateStatus(selectedReport.id, "Revision Requested")}
              >
                Request Revision
              </button>

              <button
                type="button"
                className="report-approve-button large"
                onClick={() => updateStatus(selectedReport.id, "Approved")}
              >
                <Check size={15} />
                Approve Report
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Reports;
