import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./pages.css";
import "./Feedback.css";
import StudentLayout from "../layouts/StudentLayout";
import EmptyState from "../components/EmptyState/EmptyState";
import { fetchAllEventsApi } from "../services/studentService";
import { feedbackService } from "../../services/feedbackService";

function Feedback() {
  const { eventId: paramEventId } = useParams();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(paramEventId || "");
  const [submittedFeedbackList, setSubmittedFeedbackList] = useState([]);

  const [formData, setFormData] = useState({
    overallRating: "",
    contentRating: "",
    speakerRating: "",
    comment: "",
    wouldRecommend: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [eventsRes, feedbackRes] = await Promise.all([
          fetchAllEventsApi().catch(() => []),
          feedbackService.getMyFeedback().catch(() => ({ data: [] })),
        ]);

        if (!isMounted) return;

        const liveEvents = Array.isArray(eventsRes) ? eventsRes : [];
        setEvents(liveEvents);

        const myFeedback = feedbackRes?.data?.data || feedbackRes?.data || [];
        setSubmittedFeedbackList(Array.isArray(myFeedback) ? myFeedback : []);

        if (paramEventId) {
          setSelectedEventId(paramEventId);
        } else if (liveEvents.length > 0) {
          setSelectedEventId(liveEvents[0]._id || liveEvents[0].id);
        }
      } catch (err) {
        console.warn("Failed to load feedback context:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [paramEventId]);

  const selectedEvent = events.find(
    (ev) => (ev._id || ev.id) === selectedEventId
  );

  const isSubmitted =
    submittedSuccess ||
    submittedFeedbackList.some(
      (fb) =>
        (fb.eventId?._id || fb.eventId || fb.event) === selectedEventId ||
        (fb.eventId?._id || fb.eventId || fb.event) === selectedEvent?.id
    );

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
    setSubmittedSuccess(false);
    setError("");
  };

  const handleSubmit = async (e) => {
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

    if (!selectedEventId) {
      setError("Please select an event to submit feedback for.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        eventId: selectedEventId,
        overallRating: Number(formData.overallRating),
        speakerRating: Number(formData.speakerRating),
        contentRating: Number(formData.contentRating),
        organizationRating: 5,
        wouldRecommend: formData.wouldRecommend,
        comment: formData.comment.trim(),
      };

      await feedbackService.submitFeedback(payload);
      setSubmittedSuccess(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to submit feedback. Ensure you have attended this event.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
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

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
            Loading feedback form...
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            title="No Feedback Forms Available"
            message="There are currently no events available for feedback submission."
          />
        ) : (
          <div className="feedback-card">
            {/* Event Selection */}
            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label
                htmlFor="selectEvent"
                style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}
              >
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
                {events.map((ev) => (
                  <option key={ev._id || ev.id} value={ev._id || ev.id}>
                    {ev.title || ev.name} ({ev.date || ev.eventDate || "TBA"})
                  </option>
                ))}
              </select>
            </div>

            {selectedEvent && (
              <div className="feedback-event">
                <h2>{selectedEvent?.title || selectedEvent?.name}</h2>
                <p>{selectedEvent?.description}</p>
              </div>
            )}

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
                    required
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
                    required
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
                    required
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
                    required
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
                  <button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Feedback"}
                  </button>
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
        )}
      </div>
    </StudentLayout>
  );
}

export default Feedback;