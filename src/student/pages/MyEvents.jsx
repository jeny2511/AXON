import { useState } from "react";
import "./MyEvents.css";

import StudentLayout from "../layouts/StudentLayout";
import EventCard from "../components/EventCard/EventCard";
import EmptyState from "../components/EmptyState/EmptyState";
import CertificateView from "../components/CertificateView";
import { registrations } from "../../mockData/registrations";

import {
  getStudentRegistrations,
  getEventById,
} from "../services/studentService";

function MyEvents() {
  const studentId = "ST002";

  const registrations = getStudentRegistrations(studentId);

  const myEvents = registrations
    .map((registration) => getEventById(registration.eventId))
    .filter(Boolean);

  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [selectedFeedbackEvent, setSelectedFeedbackEvent] = useState(null);

  const [feedbackData, setFeedbackData] = useState({
    overallRating: "",
    contentRating: "",
    speakerRating: "",
    comment: "",
    wouldRecommend: false,
  });

  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  // Certificate
  const handleCertificate = (event) => {
    setSelectedCertificate({
      certificateId: "CERT003",
      certificateTitle:
        "Smart India Hackathon Internal Round - Participation Certificate",
      certificateUrl: "/assets/certificates/CERT003.pdf",
      verificationCode: "AXON-SIH-ST002-2027",
      issueDate: "2027-08-20",
      eventId: event.id,
    });
  };

  // Feedback
  const handleFeedback = (event) => {
    setSelectedFeedbackEvent(event);
    setFeedbackSubmitted(false);
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

    setFeedbackData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setFeedbackError("");
  };

  const handleFeedbackSubmit = (event) => {
    event.preventDefault();

    if (
      !feedbackData.overallRating ||
      !feedbackData.contentRating ||
      !feedbackData.speakerRating ||
      !feedbackData.comment.trim()
    ) {
      setFeedbackError(
        "Please complete all required fields before submitting."
      );
      return;
    }

    const feedback = {
      feedbackId: `FB-${Date.now()}`,
      studentId: studentId,
      eventId: selectedFeedbackEvent.id,
      overallRating: Number(feedbackData.overallRating),
      contentRating: Number(feedbackData.contentRating),
      speakerRating: Number(feedbackData.speakerRating),
      comment: feedbackData.comment.trim(),
      wouldRecommend: feedbackData.wouldRecommend,
      submittedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      `axon_feedback_${studentId}_${selectedFeedbackEvent.id}`,
      JSON.stringify(feedback)
    );

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
      <div className="student-page">
        <div className="page-header">
          <h1>My Events</h1>
          <p>View the events you have registered for and attended.</p>
        </div>

        {myEvents.length > 0 ? (
          <div className="my-events-grid">
            {myEvents.map((event) => {
  const registration = registrations.find(
    (item) => item.eventId === event.id
  );

  return (
              <div className="my-event-wrapper" key={event.id}>
                <EventCard
                  title={event.name}
                  poster={event.poster}
                  date={event.eventDate}
                  time={`${event.startTime} - ${event.endTime}`}
                  venue={event.venue}
                  description={event.description}
                  status={event.status}
                  buttonText="View Event"
                />
                <div className="my-event-status">
  <span>Attendance:</span>

  <strong
    className={
      registration?.attendanceStatus === "present"
        ? "attendance-present"
        : "attendance-pending"
    }
  >
    {registration?.attendanceStatus === "present"
      ? "Present"
      : "Pending"}
  </strong>
</div>

                <div className="my-event-extra-actions">
                  <button
                    type="button"
                    className="certificate-btn"
                    onClick={() => handleCertificate(event)}
                  >
                    Certificate
                  </button>

                  <button
                    type="button"
                    className="feedback-btn"
                    onClick={() => handleFeedback(event)}
                  >
                    Feedback
                  </button>
                </div>
              </div>
            );
})}
          </div>
        ) : (
          <EmptyState
            title="No Events Yet"
            message="Your registered and attended events will appear here."
          />
        )}
      </div>

      {/* CERTIFICATE */}
      {selectedCertificate && (
        <CertificateView
          certificate={selectedCertificate}
          studentName="Archi Patel"
          enrollmentNo="220130107055"
          eventName="Smart India Hackathon Internal Round"
          onClose={() => setSelectedCertificate(null)}
        />
      )}

      {/* FEEDBACK */}
      {selectedFeedbackEvent && (
        <div className="feedback-modal-overlay">
          <div className="feedback-modal">
            <button
              type="button"
              className="feedback-close"
              onClick={closeFeedback}
            >
              ×
            </button>

            {!feedbackSubmitted ? (
              <>
                <div className="feedback-modal-header">
                  <h2>Event Feedback</h2>
                  <p>
                    {selectedFeedbackEvent.name}
                  </p>
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
                    <label>Speaker Rating *</label>
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
                    <label>Comments *</label>
                    <textarea
                      name="comment"
                      value={feedbackData.comment}
                      onChange={handleFeedbackChange}
                      placeholder="Share your experience..."
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
                    Would you recommend this event?
                  </label>

                  {feedbackError && (
                    <p className="feedback-error">{feedbackError}</p>
                  )}

                  <button
                    type="submit"
                    className="feedback-submit-btn"
                  >
                    Submit Feedback
                  </button>
                </form>
              </>
            ) : (
              <div className="feedback-success">
                <div className="success-icon">✓</div>

                <h2>Feedback Submitted!</h2>

                <p>
                  Thank you for sharing your experience.
                </p>

                <button
                  type="button"
                  onClick={closeFeedback}
                  className="feedback-done-btn"
                >
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