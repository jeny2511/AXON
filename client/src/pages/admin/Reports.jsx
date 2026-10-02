import { useMemo, useState } from "react";
import {
  Check,
  Clock3,
  Download,
  Eye,
  FileText,
  Filter,
  Search,
  X,
} from "lucide-react";

const demoReports = [
  {
    id: "RP001",
    eventId: "EV001",
    eventName: "Capture The Flag 2027",
    submittedBy: "Preyas Shah",
    submittedOn: "29 Sep 2026",
    fileName: "capture-the-flag-2027-report.pdf",
    fileSize: "2.4 MB",
    status: "Pending Review",
    updated: "2 days ago",
  },
  {
    id: "RP002",
    eventId: "EV002",
    eventName: "Bug Bounty Bootcamp",
    submittedBy: "Dhruvi Patel",
    submittedOn: "27 Sep 2026",
    fileName: "bug-bounty-bootcamp-report.pdf",
    fileSize: "1.8 MB",
    status: "Approved",
    updated: "4 days ago",
  },
  {
    id: "RP003",
    eventId: "EV003",
    eventName: "Linux & Kali Hands-on Workshop",
    submittedBy: "Yash Mehta",
    submittedOn: "25 Sep 2026",
    fileName: "linux-kali-workshop-report.pdf",
    fileSize: "3.1 MB",
    status: "Revision Requested",
    updated: "6 days ago",
  },
  {
    id: "RP004",
    eventId: "EV004",
    eventName: "Smart India Hackathon Internal Round",
    submittedBy: "Preyas Shah",
    submittedOn: "20 Sep 2026",
    fileName: "sih-internal-round-report.pdf",
    fileSize: "4.2 MB",
    status: "Approved",
    updated: "12 days ago",
  },
  {
    id: "RP005",
    eventId: "EV005",
    eventName: "Phishing Awareness Session",
    submittedBy: "Dhruvi Patel",
    submittedOn: "18 Sep 2026",
    fileName: "phishing-awareness-report.pdf",
    fileSize: "1.5 MB",
    status: "Pending Review",
    updated: "14 days ago",
  },
];

const statusClass = {
  "Pending Review": "pending",
  Approved: "approved",
  "Revision Requested": "revision",
};

function Reports() {
  const [reports, setReports] = useState(demoReports);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedReport, setSelectedReport] = useState(null);

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports.filter((report) => {
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
  }, [reports, search, statusFilter]);

  const pendingCount = reports.filter(
    (report) => report.status === "Pending Review"
  ).length;

  const approvedCount = reports.filter(
    (report) => report.status === "Approved"
  ).length;

  const revisionCount = reports.filter(
    (report) => report.status === "Revision Requested"
  ).length;

  const updateStatus = (id, status) => {
    setReports((current) =>
      current.map((report) =>
        report.id === id
          ? { ...report, status, updated: "Just now" }
          : report
      )
    );

    setSelectedReport((current) =>
      current?.id === id
        ? { ...current, status, updated: "Just now" }
        : current
    );
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
            <strong>{reports.length}</strong>
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
                  <span className="report-event-id">{report.eventId}</span>
                </div>

                <p className="report-file-name">{report.fileName}</p>

                <div className="report-meta">
                  <span>
                    <strong>Submitted by:</strong> {report.submittedBy}
                  </span>
                  <span>
                    <strong>Date:</strong> {report.submittedOn}
                  </span>
                  <span>{report.fileSize}</span>
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
                  title="Download PDF"
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
              <p>Try changing your search or status filter.</p>
            </div>
          )}
        </div>
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
                <span className="modal-pdf-label">PDF REPORT</span>
                <h3>{selectedReport.eventName}</h3>
                <p>
                  {selectedReport.fileName} · {selectedReport.fileSize}
                </p>
              </div>

              <button
                type="button"
                className="report-modal-close"
                onClick={() => setSelectedReport(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="report-preview">
              <FileText size={46} />
              <h4>PDF Preview</h4>
              <p>
                The actual volunteer-submitted PDF will appear here after the
                report upload API is connected.
              </p>
              <span>Submitted by {selectedReport.submittedBy}</span>
            </div>

            <div className="report-modal-footer">
              <button
                type="button"
                className="revision-button"
                onClick={() =>
                  updateStatus(
                    selectedReport.id,
                    "Revision Requested"
                  )
                }
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
