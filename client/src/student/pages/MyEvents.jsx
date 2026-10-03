import { useState, useEffect } from "react";
import "./pages.css";
import "./MyEvents.css";

import StudentLayout from "../layouts/StudentLayout";
import EventCard from "../components/EventCard/EventCard";
import EmptyState from "../components/EmptyState/EmptyState";
import CertificateView from "../components/CertificateView";

import {
  fetchMyRegistrationsApi,
  fetchMyAttendanceApi,
  fetchMyFeedbackApi,
  fetchMyCertificatesApi,
  submitFeedbackApi,
  cancelRegistrationApi,
  getActiveStudentId,
  getStudentProfile,
  getStudentRegistrations,
  getEventById,
  getStudentAttendanceForEvent,
  getStudentCertificateForEvent,
  hasSubmittedFeedback,
  submitStudentFeedback,
} from "../services/studentService";
import { getAttendanceWindowInfo } from "../utils/eventLifecycle";

function MyEvents() {
  const studentId = getActiveStudentId();
  const student = getStudentProfile(studentId) || {
    id: studentId,
    fullName: "Student",
    enrollmentNo: "220130107054",
  };

  const [myEvents, setMyEvents] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [myCertificates, setMyCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMyEvents = async () => {
    try {
      setLoading(true);
      const [regs, attendances, fbs, certs] = await Promise.allSettled([
        fetchMyRegistrationsApi(),
        fetchMyAttendanceApi(),
        fetchMyFeedbackApi(),
        fetchMyCertificatesApi(),
      ]);

      const regsData = regs.status === "fulfilled" ? (regs.value || []) : [];
      const attsData = attendances.status === "fulfilled" ? (attendances.value || []) : [];
      const fbsData = fbs.status === "fulfilled" ? (fbs.value || []) : [];
      const certsData = certs.status === "fulfilled" ? (certs.value || []) : [];

      setMyAttendance(attsData);
      setMyFeedbacks(fbsData);
      setMyCertificates(certsData);

      const mapped = regsData
        .filter((r) => {
          const ev = r.event || {};
          const eventId = ev._id || ev.id || r.eventId;
          const matchingAtt = attsData.find(
            (a) => (a.eventId?._id || a.eventId?.id || a.eventId) === eventId
          );
          // Only show events where student is verified present
          return matchingAtt && matchingAtt.status === "present";
        })
        .map((r) => {
          const ev = r.event || {};
          const eventId = ev._id || ev.id || r.eventId;
          const matchingAtt = attsData.find(
            (a) => (a.eventId?._id || a.eventId?.id || a.eventId) === eventId
          );
          const matchingFb = fbsData.find(
            (f) => (f.eventId?._id || f.eventId?.id || f.eventId) === eventId
          );
          const matchingCert = certsData.find(
            (c) => (c.eventId?._id || c.eventId?.id || c.eventId) === eventId
          );

          return {
            ...ev,
            id: eventId,
            _id: eventId,
            registrationId: r.id || r._id,
            registrationStatus: r.status,
            qrCode: r.qrToken || r.qrCode,
            qrToken: r.qrToken || r.qrCode,
            attendanceStatus: "present",
            attendanceRecord: matchingAtt,
            feedbackDone: Boolean(matchingFb),
            certificate: matchingCert || null,
          };
        });
      setMyEvents(mapped);
    } catch (err) {
      console.warn("Failed to load my events:", err.message);
      setMyEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyEvents();
  }, [studentId]);

  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [selectedFeedbackEvent, setSelectedFeedbackEvent] = useState(null);
  const [selectedQREvent, setSelectedQREvent] = useState(null);

  const [feedbackData, setFeedbackData] = useState({
    overallRating: "",
    contentRating: "",
    speakerRating: "",
    comment: "",
    wouldRecommend: false,
  });

  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  // Open Certificate for specific event
  const handleCertificate = (event) => {
    const cert = event.certificate || getStudentCertificateForEvent(student.id, event.id);
    if (cert) {
      setSelectedCertificate({
        ...cert,
        eventName: event.name,
        studentName: cert.studentName || student.fullName,
        enrollmentNo: cert.enrollmentNumber || student.enrollmentNo,
      });
    }
  };

  // Open QR Token Modal
  const handleViewQR = (event) => {
    setSelectedQREvent(event);
  };

  // Cancel Event Registration
  const handleCancelRegistration = async (registrationId) => {
    if (window.confirm("Are you sure you want to cancel this event registration?")) {
      try {
        await cancelRegistrationApi(registrationId);
        loadMyEvents();
      } catch (err) {
        alert(err.message || "Failed to cancel registration.");
      }
    }
  };

  // Open Feedback Modal for specific event
  const handleFeedback = (event) => {
    const attStatus = event.attendanceStatus || (getStudentAttendanceForEvent(student.id, event.id)?.status) || "pending";
    if (attStatus !== "present") {
      alert("Feedback is only available after your attendance is marked as Present.");
      return;
    }

    setSelectedFeedbackEvent(event);
    const alreadyDone = event.feedbackDone || hasSubmittedFeedback(student.id, event.id);
    setFeedbackSubmitted(alreadyDone);
    setFeedbackError("");

    setFeedbackData({
      overallRating: "",
      contentRating: "",
      speakerRating: "",
      comment: "",
      wouldRecommend: false,
    });
  };

  const handleFeedbackChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFeedbackData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFeedbackError("");
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();

    if (
      !feedbackData.overallRating ||
      !feedbackData.contentRating ||
      !feedbackData.speakerRating
    ) {
      setFeedbackError("Please complete all required rating fields.");
      return;
    }

    try {
      await submitFeedbackApi({
        eventId: selectedFeedbackEvent.id || selectedFeedbackEvent._id,
        overallRating: Number(feedbackData.overallRating),
        contentRating: Number(feedbackData.contentRating),
        speakerRating: Number(feedbackData.speakerRating),
        organizationRating: 5,
        comment: feedbackData.comment || "",
        wouldRecommend: Boolean(feedbackData.wouldRecommend),
      });

      setFeedbackError("");
      setFeedbackSubmitted(true);
      loadMyEvents();
    } catch (err) {
      setFeedbackError(err.message || "Failed to submit feedback.");
    }
  };

  const closeFeedback = () => {
    setSelectedFeedbackEvent(null);
    setFeedbackSubmitted(false);
    setFeedbackError("");
  };

  return (
    <StudentLayout>
      <div className="my-events-page">
        <div className="page-container">
          <h1 className="page-title">My Events</h1>
          <p className="page-subtitle">
            View your registrations, attendance QR, feedback, and earned certificates.
          </p>
        </div>

        {myEvents.length > 0 ? (
          <div className="my-events-grid">
            {myEvents.map((event) => {
              const attendanceStatus = event.attendanceStatus || (getStudentAttendanceForEvent(student.id, event.id)?.status) || "pending";
              const cert = event.certificate || getStudentCertificateForEvent(student.id, event.id);
              const isPresent = attendanceStatus === "present";
              const feedbackDone = Boolean(event.feedbackDone || hasSubmittedFeedback(student.id, event.id));

              return (
                <div className="my-event-wrapper" key={event.id || event.registrationId}>
                  <EventCard
                    title={event.name}
                    poster={event.poster}
                    date={event.eventDate}
                    time={`${event.startTime} - ${event.endTime}`}
                    venue={event.venue}
                    description={event.description}
                    status={event.status}
                    buttonText="View Event Details"
                  />

                  {/* Attendance Context */}
                  <div className="my-event-status">
                    <span>Attendance:</span>
                    <strong
                      className={
                        attendanceStatus === "present"
                          ? "attendance-present"
                          : attendanceStatus === "absent"
                          ? "attendance-absent"
                          : "attendance-pending"
                      }
                      style={{
                        color:
                          attendanceStatus === "present"
                            ? "#16a34a"
                            : attendanceStatus === "absent"
                            ? "#dc2626"
                            : "#d97706",
                      }}
                    >
                      {attendanceStatus === "present"
                        ? "Present ✓"
                        : attendanceStatus === "absent"
                        ? "Absent"
                        : "Pending Scan"}
                    </strong>
                  </div>

                  {/* Actions Grid */}
                  <div className="my-event-extra-actions">
                    {(() => {
                      const windowInfo = getAttendanceWindowInfo(event);
                      if (isPresent) {
                        return (
                          <button
                            type="button"
                            className="qr-btn"
                            style={{
                              background: "#16a34a",
                              color: "#ffffff",
                              padding: "9px 14px",
                              borderRadius: "8px",
                              border: "none",
                              fontWeight: "600",
                              fontSize: "13px",
                              cursor: "pointer",
                            }}
                            onClick={() => handleViewQR(event)}
                          >
                            Pass Verified ✓
                          </button>
                        );
                      }
                      if (windowInfo.isBefore) {
                        return (
                          <button
                            type="button"
                            className="qr-btn"
                            style={{
                              background: "#fef3c7",
                              color: "#92400e",
                              border: "1px solid #fde68a",
                              padding: "9px 14px",
                              borderRadius: "8px",
                              fontWeight: "600",
                              fontSize: "13px",
                              cursor: "pointer",
                            }}
                            title={`Attendance window opens: ${windowInfo.openTime ? windowInfo.openTime.toLocaleString() : "TBA"}`}
                            onClick={() => handleViewQR(event)}
                          >
                            Window Pending ⏳
                          </button>
                        );
                      }
                      if (windowInfo.isAfter) {
                        return (
                          <button
                            type="button"
                            className="qr-btn"
                            style={{
                              background: "#fee2e2",
                              color: "#b91c1c",
                              border: "1px solid #fecaca",
                              padding: "9px 14px",
                              borderRadius: "8px",
                              fontWeight: "600",
                              fontSize: "13px",
                              cursor: "pointer",
                            }}
                            title={`Attendance window closed: ${windowInfo.closeTime ? windowInfo.closeTime.toLocaleString() : "TBA"}`}
                            onClick={() => handleViewQR(event)}
                          >
                            Window Closed ⛔
                          </button>
                        );
                      }
                      return (
                        <button
                          type="button"
                          className="qr-btn"
                          style={{
                            background: "#4f46e5",
                            color: "#ffffff",
                            padding: "9px 14px",
                            borderRadius: "8px",
                            border: "none",
                            fontWeight: "600",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                          onClick={() => handleViewQR(event)}
                        >
                          Show QR ▦
                        </button>
                      );
                    })()}

                    <button
                      type="button"
                      className="certificate-btn"
                      disabled={!isPresent || !cert}
                      style={{
                        opacity: isPresent && cert ? 1 : 0.5,
                        cursor: isPresent && cert ? "pointer" : "not-allowed",
                      }}
                      title={
                        !isPresent
                          ? "Certificate is available after attendance is verified."
                          : !cert
                          ? "Certificate is being prepared."
                          : "View Certificate"
                      }
                      onClick={() => handleCertificate(event)}
                    >
                      Certificate
                    </button>

                    <button
                      type="button"
                      className="feedback-btn"
                      disabled={!isPresent}
                      style={{
                        opacity: isPresent ? 1 : 0.5,
                        cursor: isPresent ? "pointer" : "not-allowed",
                      }}
                      title={
                        !isPresent
                          ? "Feedback is available after your attendance is verified as Present."
                          : feedbackDone
                          ? "Feedback Submitted"
                          : "Give Feedback"
                      }
                      onClick={() => handleFeedback(event)}
                    >
                      {feedbackDone ? "Feedback ✓" : "Feedback"}
                    </button>

                    {event.registrationId && (
                      <button
                        type="button"
                        style={{
                          background: "#fee2e2",
                          color: "#b91c1c",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          border: "none",
                          fontWeight: "600",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                        title="Cancel Registration"
                        onClick={() => handleCancelRegistration(event.registrationId)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No Attended Events Yet"
            message="Events you have attended will appear here once your attendance has been verified as Present."
          />
        )}
      </div>

      {/* QR ATTENDANCE MODAL */}
      {selectedQREvent && (() => {
        const qrToken = selectedQREvent.qrToken || selectedQREvent.qrCode || `QR-${selectedQREvent.id}-${student.id}`;
        const windowInfo = getAttendanceWindowInfo(selectedQREvent);
        const isPresent = selectedQREvent.attendanceStatus === "present";

        return (
          <div
            className="feedback-modal-overlay"
            onClick={() => setSelectedQREvent(null)}
            style={{ zIndex: 9999 }}
          >
            <div
              className="feedback-modal"
              onClick={(e) => e.stopPropagation()}
              style={{ textAlign: "center", maxWidth: "440px" }}
            >
              <button
                type="button"
                className="feedback-close"
                onClick={() => setSelectedQREvent(null)}
                aria-label="Close"
              >
                ×
              </button>

              <h2 style={{ color: "#1f1f29", marginBottom: "6px" }}>Event Attendance Pass</h2>
              <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>
                {selectedQREvent.name}
              </p>

              {/* Attendance Window Status Badge */}
              <div style={{ marginBottom: "16px" }}>
                {isPresent ? (
                  <span style={{
                    display: "inline-block",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "700",
                    background: "#dcfce7",
                    color: "#166534",
                    border: "1px solid #bbf7d0"
                  }}>
                    ✓ Attendance Verified — Present
                  </span>
                ) : windowInfo.isBefore ? (
                  <span style={{
                    display: "inline-block",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "600",
                    background: "#fef3c7",
                    color: "#92400e",
                    border: "1px solid #fde68a"
                  }}>
                    ⏳ Attendance window not open yet
                  </span>
                ) : windowInfo.isAfter ? (
                  <span style={{
                    display: "inline-block",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "600",
                    background: "#fee2e2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca"
                  }}>
                    ⛔ Attendance window closed
                  </span>
                ) : (
                  <span style={{
                    display: "inline-block",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "700",
                    background: "#dcfce7",
                    color: "#166534",
                    border: "1px solid #bbf7d0"
                  }}>
                    ✓ Attendance is open — Ready to Scan
                  </span>
                )}
              </div>

              {/* QR Container / Lock Container */}
              {isPresent ? (
                <div
                  style={{
                    width: "220px",
                    height: "180px",
                    margin: "0 auto 16px",
                    padding: "16px",
                    background: "#f0fdf4",
                    borderRadius: "16px",
                    border: "2px solid #86efac",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ fontSize: "48px", color: "#16a34a", marginBottom: "8px" }}>✓</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#166534" }}>
                    Attendance Verified
                  </div>
                  <div style={{ fontSize: "11px", color: "#15803d", marginTop: "4px" }}>
                    Status: Present
                  </div>
                </div>
              ) : windowInfo.isBefore ? (
                <div
                  style={{
                    width: "220px",
                    height: "180px",
                    margin: "0 auto 16px",
                    padding: "16px",
                    background: "#fffbeb",
                    borderRadius: "16px",
                    border: "2px dashed #fcd34d",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ fontSize: "38px", color: "#d97706", marginBottom: "8px" }}>🔒</div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#92400e" }}>
                    QR Code Locked
                  </div>
                  <div style={{ fontSize: "11px", color: "#b45309", marginTop: "6px", textAlign: "center" }}>
                    Opens: {windowInfo.openTime ? windowInfo.openTime.toLocaleString() : "At event start"}
                  </div>
                </div>
              ) : windowInfo.isAfter ? (
                <div
                  style={{
                    width: "220px",
                    height: "180px",
                    margin: "0 auto 16px",
                    padding: "16px",
                    background: "#fef2f2",
                    borderRadius: "16px",
                    border: "2px dashed #fca5a5",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ fontSize: "38px", color: "#dc2626", marginBottom: "8px" }}>⛔</div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#991b1b" }}>
                    QR Code Inactive
                  </div>
                  <div style={{ fontSize: "11px", color: "#b91c1c", marginTop: "6px", textAlign: "center" }}>
                    Window closed: {windowInfo.closeTime ? windowInfo.closeTime.toLocaleString() : "Past"}
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      width: "210px",
                      height: "210px",
                      margin: "0 auto 16px",
                      padding: "10px",
                      background: "#ffffff",
                      borderRadius: "16px",
                      border: "2px solid #6366f1",
                      boxShadow: "0 8px 24px rgba(99, 102, 241, 0.15)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(qrToken)}`}
                      alt="Attendance QR Code"
                      style={{ width: "190px", height: "190px", display: "block" }}
                    />
                  </div>

                  <div style={{
                    fontFamily: "monospace",
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#475569",
                    background: "#f1f5f9",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    marginBottom: "16px",
                    wordBreak: "break-all"
                  }}>
                    {qrToken}
                  </div>
                </>
              )}

              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "10px",
                  padding: "12px",
                  fontSize: "13px",
                  color: "#334155",
                  textAlign: "left",
                  marginBottom: "16px",
                  border: "1px solid #e2e8f0"
                }}
              >
                <p style={{ margin: "3px 0" }}>
                  <strong>Student:</strong> {student.fullName}
                </p>
                <p style={{ margin: "3px 0" }}>
                  <strong>Enrollment No:</strong> {student.enrollmentNo || "220130107054"}
                </p>
                <p style={{ margin: "3px 0" }}>
                  <strong>Event Date:</strong> {selectedQREvent.eventDate || selectedQREvent.date ? new Date(selectedQREvent.eventDate || selectedQREvent.date).toLocaleDateString("en-IN") : "N/A"}
                </p>
                <p style={{ margin: "3px 0" }}>
                  <strong>Attendance Status:</strong>{" "}
                  <span style={{
                    fontWeight: "700",
                    color: selectedQREvent.attendanceStatus === "present" ? "#16a34a" : "#d97706"
                  }}>
                    {selectedQREvent.attendanceStatus === "present" ? "Present ✓" : "Pending Verification"}
                  </span>
                </p>
              </div>

              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                {windowInfo.isOpen && !isPresent
                  ? "Present this QR token to the TCF Volunteer at the event venue."
                  : windowInfo.isBefore
                  ? "Attendance QR will be generated and visible once the window opens."
                  : isPresent
                  ? "Attendance successfully recorded for this event."
                  : "Attendance window has closed."}
              </p>
            </div>
          </div>
        );
      })()}

      {/* CERTIFICATE MODAL */}
      {selectedCertificate && (
        <CertificateView
          certificate={selectedCertificate}
          studentName={student.fullName}
          enrollmentNo={student.enrollmentNo || "220130107054"}
          eventName={selectedCertificate.eventName}
          onClose={() => setSelectedCertificate(null)}
        />
      )}

      {/* FEEDBACK MODAL */}
      {selectedFeedbackEvent && (
        <div className="feedback-modal-overlay" onClick={closeFeedback}>
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="feedback-close" onClick={closeFeedback} aria-label="Close">
              ×
            </button>

            {!feedbackSubmitted ? (
              <>
                <div className="feedback-modal-header">
                  <h2>Event Feedback</h2>
                  <p>{selectedFeedbackEvent.name}</p>
                </div>

                <form onSubmit={handleFeedbackSubmit}>
                  <div className="feedback-field">
                    <label>Overall Rating *</label>
                    <select
                      name="overallRating"
                      value={feedbackData.overallRating}
                      onChange={handleFeedbackChange}
                    >
                      <option value="">Select rating</option>
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Very Good</option>
                      <option value="3">3 - Good</option>
                      <option value="2">2 - Fair</option>
                      <option value="1">1 - Poor</option>
                    </select>
                  </div>

                  <div className="feedback-field">
                    <label>Content Rating *</label>
                    <select
                      name="contentRating"
                      value={feedbackData.contentRating}
                      onChange={handleFeedbackChange}
                    >
                      <option value="">Select rating</option>
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Very Good</option>
                      <option value="3">3 - Good</option>
                      <option value="2">2 - Fair</option>
                      <option value="1">1 - Poor</option>
                    </select>
                  </div>

                  <div className="feedback-field">
                    <label>Speaker / Instructor Rating *</label>
                    <select
                      name="speakerRating"
                      value={feedbackData.speakerRating}
                      onChange={handleFeedbackChange}
                    >
                      <option value="">Select rating</option>
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Very Good</option>
                      <option value="3">3 - Good</option>
                      <option value="2">2 - Fair</option>
                      <option value="1">1 - Poor</option>
                    </select>
                  </div>

                  <div className="feedback-field">
                    <label>Comments & Suggestions *</label>
                    <textarea
                      name="comment"
                      value={feedbackData.comment}
                      onChange={handleFeedbackChange}
                      placeholder="Share your experience and feedback..."
                      rows="4"
                    />
                  </div>

                  <label className="recommend-checkbox">
                    <input
                      type="checkbox"
                      name="wouldRecommend"
                      checked={feedbackData.wouldRecommend}
                      onChange={handleFeedbackChange}
                    />
                    Would you recommend this event to fellow students?
                  </label>

                  {feedbackError && <p className="feedback-error">{feedbackError}</p>}

                  <button type="submit" className="feedback-submit-btn">
                    Submit Feedback
                  </button>
                </form>
              </>
            ) : (
              <div className="feedback-success">
                <div className="success-icon">✓</div>
                <h2>Feedback Submitted!</h2>
                <p>Thank you for sharing your experience. Your feedback has been recorded.</p>
                <button type="button" onClick={closeFeedback} className="feedback-done-btn">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </StudentLayout>
  );
}

export default MyEvents;