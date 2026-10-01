import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./pages.css";
import "./Feedback.css";
import StudentLayout from "../layouts/StudentLayout";
import {
  getActiveStudentId,
  getStudentProfile,
  getEventById,
  getAllEvents,
  hasSubmittedFeedback,
  submitStudentFeedback,
} from "../services/studentService";

function Feedback() {
  const { eventId: paramEventId } = useParams();
  const navigate = useNavigate();

  const studentId = getActiveStudentId();
  const student = getStudentProfile(studentId) || {
    id: studentId,
    fullName: "Student",
  };

  const allEvents = getAllEvents();
  const defaultEventId = paramEventId || "EV004";
  const [selectedEventId, setSelectedEventId] = useState(defaultEventId);

  const selectedEvent = getEventById(selectedEventId) || allEvents[0];

  const [formData, setFormData] = useState({
    overallRating: "",
    contentRating: "",
    speakerRating: "",
    comment: "",
    wouldRecommend: false,
  });

  const [submittedEventIds, setSubmittedEventIds] = useState([]);
  const [error, setError] = useState("");

  const isSubmitted = selectedEvent
    ? hasSubmittedFeedback(student.id, selectedEvent.id) ||
      submittedEventIds.includes(selectedEvent.id)
    : false;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
  };

  const handleEventChange = (e) => {
    setSelectedEventId(e.target.value);
    setFormData({
      overallRating: "",
      contentRating: "",
      speakerRating: "",
      comment: "",
      wouldRecommend: false,
    });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.overallRating ||
      !formData.contentRating ||
      !formData.speakerRating ||
      !formData.comment.trim()
    ) {
      setError("Please complete all required fields before submitting.");
      return;
    }

    submitStudentFeedback(student.id, selectedEvent.id, formData);

    setError("");
    setSubmittedEventIds((prev) => [...prev, selectedEvent.id]);
  };

  return (
    <StudentLayout>
      <div className="feedback-page">
        <div className="page-container">
          <h1 className="page-title">Event Feedback</h1>
          <p className="page-subtitle">
            Share your experience to help Volunteers and Admins improve future AXON events.
          </p>
        </div>

        <div className="feedback-card">
          {/* Event Selection */}
          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label htmlFor="selectEvent" style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>
              Select Event for Feedback
            </label>
            <select
              id="selectEvent"
              value={selectedEventId}
              onChange={handleEventChange}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
              }}
            >
              {allEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.eventDate})
                </option>
              ))}
            </select>
          </div>

          <div className="feedback-event">
            <h2>{selectedEvent?.name}</h2>
            <p>{selectedEvent?.description}</p>
          </div>

          {error && <div className="feedback-message feedback-error">{error}</div>}

          {isSubmitted && (
            <div className="feedback-message feedback-success">
              Feedback has been submitted and recorded for this event. Thank you!
            </div>
          )}

          {!isSubmitted ? (
            <form className="feedback-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="overallRating">Overall Event Rating *</label>
                <select
                  id="overallRating"
                  name="overallRating"
                  value={formData.overallRating}
                  onChange={handleChange}
                >
                  <option value="">Select rating</option>
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Very Good</option>
                  <option value="3">3 - Good</option>
                  <option value="2">2 - Fair</option>
                  <option value="1">1 - Poor</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="contentRating">Content & Learning Quality *</label>
                <select
                  id="contentRating"
                  name="contentRating"
                  value={formData.contentRating}
                  onChange={handleChange}
                >
                  <option value="">Select rating</option>
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Very Good</option>
                  <option value="3">3 - Good</option>
                  <option value="2">2 - Fair</option>
                  <option value="1">1 - Poor</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="speakerRating">Speaker / Instructor Rating *</label>
                <select
                  id="speakerRating"
                  name="speakerRating"
                  value={formData.speakerRating}
                  onChange={handleChange}
                >
                  <option value="">Select rating</option>
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Very Good</option>
                  <option value="3">3 - Good</option>
                  <option value="2">2 - Fair</option>
                  <option value="1">1 - Poor</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="comment">Your Detailed Feedback & Suggestions *</label>
                <textarea
                  id="comment"
                  name="comment"
                  rows="4"
                  value={formData.comment}
                  onChange={handleChange}
                  placeholder="Share what went well and what can be improved..."
                />
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="wouldRecommend"
                  name="wouldRecommend"
                  checked={formData.wouldRecommend}
                  onChange={handleChange}
                />
                <label htmlFor="wouldRecommend">
                  I would recommend this event to other students.
                </label>
              </div>

              <div className="feedback-actions">
                <button type="submit">Submit Feedback</button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                type="button"
                className="rulebook-button"
                onClick={() => navigate("/my-events")}
              >
                ← Back to My Events
              </button>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

export default Feedback;