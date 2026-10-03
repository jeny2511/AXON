import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./pages.css";
import "./Feedback.css";
import StudentLayout from "../layouts/StudentLayout";
import api from "../../services/api.js";
import {
  getActiveStudentId,
  getStudentProfile,
  getEventById,
  getAllEvents,
  fetchEvents,
  fetchStudentFeedbackSubmissions,
  hasSubmittedFeedback,
  submitStudentFeedback,
} from "../services/studentService";

function Feedback() {
  const { eventId: paramEventId } = useParams();
  const navigate = useNavigate();

  const studentId = getActiveStudentId();
  const student = getStudentProfile(studentId) || {
    id: studentId,
    fullName: "",
  };

  const [allEvents, setAllEvents] = useState(getAllEvents());
  const defaultEventId = paramEventId || (allEvents[0]?.id || allEvents[0]?._id || "");
  const [selectedEventId, setSelectedEventId] = useState(defaultEventId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic form state from backend
  const [dynamicForm, setDynamicForm] = useState(null);
  const [hasAttended, setHasAttended] = useState(true);
  const [answers, setAnswers] = useState({});
  const [overallRating, setOverallRating] = useState(5);
  const [comment, setComment] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);

  const [submittedEventIds, setSubmittedEventIds] = useState([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchEvents()
      .then((evs) => {
        if (Array.isArray(evs) && evs.length > 0) {
          setAllEvents(evs);
          if (!paramEventId) {
            setSelectedEventId(evs[0].id || evs[0]._id);
          }
        }
      })
      .catch(() => {});
    fetchStudentFeedbackSubmissions().catch(() => {});

    const handleEventsChange = () => {
      const updated = getAllEvents();
      setAllEvents(updated);
    };
    window.addEventListener("axon-events-change", handleEventsChange);
    window.addEventListener("axon-feedback-change", handleEventsChange);
    return () => {
      window.removeEventListener("axon-events-change", handleEventsChange);
      window.removeEventListener("axon-feedback-change", handleEventsChange);
    };
  }, [paramEventId]);

  const selectedEvent =
    getEventById(selectedEventId) ||
    allEvents.find((e) => e.id === selectedEventId || e._id === selectedEventId) ||
    allEvents[0];

  // Fetch feedback form configuration and attendance status whenever selected event changes
  useEffect(() => {
    if (!selectedEvent) return;
    const targetId = selectedEvent._id || selectedEvent.id;
    setError("");
    setSuccessMsg("");
    setAnswers({});

    api
      .get(`/feedback/form/${targetId}`)
      .then((res) => {
        if (res && res.form) {
          setDynamicForm(res.form);
          if (res.hasAttended !== undefined) {
            setHasAttended(res.hasAttended);
          }
          if (res.hasSubmitted) {
            setSubmittedEventIds((prev) => [...prev, targetId, selectedEvent.id, selectedEvent._id]);
          }
        }
      })
      .catch((err) => {
        console.warn("Feedback form fetch notice:", err?.message || err);
      });
  }, [selectedEvent]);

  const isSubmitted = selectedEvent
    ? hasSubmittedFeedback(student.id, selectedEvent.id || selectedEvent._id) ||
      submittedEventIds.includes(selectedEvent.id) ||
      submittedEventIds.includes(selectedEvent._id)
    : false;

  const handleEventChange = (e) => {
    setSelectedEventId(e.target.value);
    setAnswers({});
    setError("");
    setSuccessMsg("");
  };

  // Dynamic Answer Change Handlers
  const handleRatingChange = (qId, ratingValue) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: ratingValue,
    }));
    setError("");
  };

  const handleRadioChange = (qId, optionValue) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: optionValue,
    }));
    setError("");
  };

  const handleCheckboxToggle = (qId, optionValue) => {
    setAnswers((prev) => {
      const currentList = Array.isArray(prev[qId]) ? prev[qId] : [];
      const exists = currentList.includes(optionValue);
      const updated = exists
        ? currentList.filter((item) => item !== optionValue)
        : [...currentList, optionValue];
      return {
        ...prev,
        [qId]: updated,
      };
    });
    setError("");
  };

  const handleTextareaChange = (qId, textValue) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: textValue,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const questions = dynamicForm?.questions || [];

    // Frontend Validation
    if (questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qId = q.id || q._id || `q_${i}`;
        const val = answers[qId];

        if (q.type === "rating" && (!val || Number(val) < 1)) {
          setError(`Please select a rating for: "${q.question}"`);
          return;
        }
        if (q.type === "radio" && (!val || !String(val).trim())) {
          setError(`Please select an option for: "${q.question}"`);
          return;
        }
        if (q.type === "checkbox" && (!Array.isArray(val) || val.length === 0)) {
          setError(`Please select at least one option for: "${q.question}"`);
          return;
        }
        if (q.type === "textarea" && q.required && (!val || !String(val).trim())) {
          setError(`Please write an answer for: "${q.question}"`);
          return;
        }
      }
    } else {
      if (!comment.trim()) {
        setError("Please enter your detailed feedback comments.");
        return;
      }
    }

    setIsSubmitting(true);
    setError("");
    try {
      const evId = selectedEvent.id || selectedEvent._id;
      const res = await submitStudentFeedback(student.id, evId, answers, {
        overallRating,
        comment: comment || Object.values(answers).find((v) => typeof v === "string") || "",
        wouldRecommend,
      });

      setSubmittedEventIds((prev) => [...prev, evId, selectedEvent.id, selectedEvent._id].filter(Boolean));
      setSuccessMsg("Feedback submitted successfully! Thank you for your review.");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const questionsList = dynamicForm?.questions || [];

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
                <option key={ev.id || ev._id} value={ev.id || ev._id}>
                  {ev.name} ({ev.eventDate || ev.date})
                </option>
              ))}
            </select>
          </div>

          <div className="feedback-event">
            <h2>{selectedEvent?.name}</h2>
            <p>{selectedEvent?.description}</p>
          </div>

          {error && <div className="feedback-message feedback-error">{error}</div>}
          {successMsg && <div className="feedback-message feedback-success">{successMsg}</div>}

          {isSubmitted ? (
            <div>
              <div className="feedback-message feedback-success">
                Feedback has been submitted and recorded for this event. Thank you!
              </div>
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button
                  type="button"
                  className="rulebook-button"
                  onClick={() => navigate("/my-events")}
                >
                  ← Back to My Events
                </button>
              </div>
            </div>
          ) : !hasAttended ? (
            <div className="feedback-message feedback-error" style={{ marginTop: "15px" }}>
              ⚠️ You can only submit feedback for events you have physically attended and checked into.
            </div>
          ) : (
            <form className="feedback-form" onSubmit={handleSubmit}>
              {questionsList.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {questionsList.map((q, idx) => {
                    const qId = q.id || q._id || `q_${idx}`;
                    const qType = q.type || "textarea";
                    const currentVal = answers[qId];

                    return (
                      <div
                        key={qId}
                        className="form-group"
                        style={{
                          background: "#fdfdfd",
                          padding: "16px",
                          borderRadius: "10px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <label style={{ fontWeight: "600", fontSize: "14px", color: "#1f2937", display: "block", marginBottom: "8px" }}>
                          {idx + 1}. {q.question} *
                        </label>

                        {/* Rating Question */}
                        {qType === "rating" && (
                          <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                            {[1, 2, 3, 4, 5].map((star) => {
                              const isSelected = Number(currentVal) >= star;
                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => handleRatingChange(qId, star)}
                                  style={{
                                    fontSize: "24px",
                                    color: isSelected ? "#f59e0b" : "#d1d5db",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "2px",
                                    transition: "transform 0.15s ease",
                                  }}
                                  title={`${star} Stars`}
                                >
                                  ★
                                </button>
                              );
                            })}
                            <span style={{ fontSize: "12px", color: "#6b7280", alignSelf: "center", marginLeft: "8px" }}>
                              {currentVal ? `${currentVal} / 5 Stars` : "Select rating"}
                            </span>
                          </div>
                        )}

                        {/* Radio Question */}
                        {qType === "radio" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
                            {(q.options || []).map((opt, optIdx) => (
                              <label
                                key={optIdx}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  fontSize: "14px",
                                  cursor: "pointer",
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  background: currentVal === opt ? "#f3e8ff" : "#f9fafb",
                                  border: `1px solid ${currentVal === opt ? "#c084fc" : "#e5e7eb"}`,
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`radio_${qId}`}
                                  value={opt}
                                  checked={currentVal === opt}
                                  onChange={() => handleRadioChange(qId, opt)}
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* Checkbox Question */}
                        {qType === "checkbox" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
                            {(q.options || []).map((opt, optIdx) => {
                              const isChecked = Array.isArray(currentVal) && currentVal.includes(opt);
                              return (
                                <label
                                  key={optIdx}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    background: isChecked ? "#f3e8ff" : "#f9fafb",
                                    border: `1px solid ${isChecked ? "#c084fc" : "#e5e7eb"}`,
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    value={opt}
                                    checked={isChecked}
                                    onChange={() => handleCheckboxToggle(qId, opt)}
                                  />
                                  <span>{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* Textarea Question */}
                        {qType === "textarea" && (
                          <textarea
                            rows={3}
                            value={currentVal || ""}
                            onChange={(e) => handleTextareaChange(qId, e.target.value)}
                            placeholder="Write your feedback here..."
                            style={{
                              width: "100%",
                              padding: "10px",
                              borderRadius: "8px",
                              border: "1px solid #d1d5db",
                              fontSize: "14px",
                              outline: "none",
                              marginTop: "4px",
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="overallRating">Overall Event Rating *</label>
                    <select
                      id="overallRating"
                      value={overallRating}
                      onChange={(e) => setOverallRating(Number(e.target.value))}
                    >
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
                      rows="4"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share what went well and what can be improved..."
                    />
                  </div>

                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      id="wouldRecommend"
                      checked={wouldRecommend}
                      onChange={(e) => setWouldRecommend(e.target.checked)}
                    />
                    <label htmlFor="wouldRecommend">
                      I would recommend this event to other students.
                    </label>
                  </div>
                </>
              )}

              <div className="feedback-actions" style={{ marginTop: "24px" }}>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

export default Feedback;