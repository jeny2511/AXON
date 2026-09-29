import { useState } from "react";
import "./pages.css";
import "./MyEvents.css";

import StudentLayout from "../layouts/StudentLayout";
import EventCard from "../components/EventCard/EventCard";
import EmptyState from "../components/EmptyState/EmptyState";
import CertificateView from "../components/CertificateView";

import {
  getActiveStudentId,
  getStudentProfile,
  getStudentRegistrations,
  getEventById,
  getStudentAttendanceForEvent,
  getStudentCertificateForEvent,
  hasSubmittedFeedback,
  submitStudentFeedback,
} from "../services/studentService";

function MyEvents() {
  const studentId = getActiveStudentId();
  const student = getStudentProfile(studentId) || {
    id: studentId,
    fullName: "Student",
    enrollmentNo: "220130107054",
  };

  const registrations = getStudentRegistrations(studentId);

  const myEvents = registrations
    .map((registration) => {
      const event = getEventById(registration.eventId);
      if (!event) return null;
      return {
        ...event,
        registrationId: registration.registrationId,
        registrationStatus: registration.status,
        qrCode: registration.qrCode,
      };
    })
    .filter(Boolean);

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
    const cert = getStudentCertificateForEvent(student.id, event.id);
    if (cert) {
      setSelectedCertificate({
        ...cert,
        eventName: event.name,
      });
    }
  };

  // Open QR Token Modal
  const handleViewQR = (event) => {
    setSelectedQREvent(event);
  };

  // Open Feedback Modal for specific event
  const handleFeedback = (event) => {
    setSelectedFeedbackEvent(event);
    const alreadyDone = hasSubmittedFeedback(student.id, event.id);
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

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();

    if (
      !feedbackData.overallRating ||
      !feedbackData.contentRating ||
      !feedbackData.speakerRating ||
      !feedbackData.comment.trim()
    ) {
      setFeedbackError("Please complete all required rating and comment fields.");
      return;
    }

    submitStudentFeedback(student.id, selectedFeedbackEvent.id, feedbackData);

    setFeedbackError("");
    setFeedbackSubmitted(true);
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
              const attRecord = getStudentAttendanceForEvent(student.id, event.id);
              const attendanceStatus = attRecord ? attRecord.status : "pending";
              const cert = getStudentCertificateForEvent(student.id, event.id);
              const isPresent = attendanceStatus === "present";
              const feedbackDone = hasSubmittedFeedback(student.id, event.id);

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
                      Show QR
                    </button>

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
                      disabled={!isPresent && event.status === "upcoming"}
                      style={{
                        opacity: !isPresent && event.status === "upcoming" ? 0.5 : 1,
                        cursor: !isPresent && event.status === "upcoming" ? "not-allowed" : "pointer",
                      }}
                      onClick={() => handleFeedback(event)}
                    >
                      {feedbackDone ? "Feedback ✓" : "Feedback"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No Events Yet"
            message="Your registered and attended events will appear here once you register."
          />
        )}
      </div>

      {/* QR ATTENDANCE MODAL */}
      {selectedQREvent && (
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

            <h2 style={{ color: "#1f1f29", marginBottom: "6px" }}>Event Attendance QR</h2>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
              {selectedQREvent.name}
            </p>

            <div
              style={{
                width: "180px",
                height: "180px",
                margin: "0 auto 20px",
                padding: "16px",
                background: "#f8fafc",
                borderRadius: "16px",
                border: "2px dashed #6a3bc5",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: "64px", color: "#6a3bc5", lineHeight: 1 }}>▦</div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#4f46e5", marginTop: "8px" }}>
                {selectedQREvent.qrCode || `QR-${selectedQREvent.id}-${student.id}`}
              </span>
            </div>

            <div
              style={{
                background: "#f1f5f9",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "13px",
                color: "#334155",
                textAlign: "left",
                marginBottom: "16px",
              }}
            >
              <p style={{ margin: "4px 0" }}>
                <strong>Student:</strong> {student.fullName}
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Enrollment No:</strong> {student.enrollmentNo || "220130107054"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Event Date:</strong> {selectedQREvent.eventDate}
              </p>
            </div>

            <p style={{ fontSize: "12px", color: "#777", margin: 0 }}>
              Show this QR code to the Volunteer at the event venue to mark your attendance.
            </p>
          </div>
        </div>
      )}

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