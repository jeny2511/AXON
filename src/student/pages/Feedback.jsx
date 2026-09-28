import { useState } from "react";
import "./Feedback.css";
import StudentLayout from "../layouts/StudentLayout";
import { getStudentFeedback } from "../services/studentService";

function Feedback() {
    
  const [formData, setFormData] = useState({
    overallRating: "",
    contentRating: "",
    speakerRating: "",
    comment: "",
    wouldRecommend: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
    setSubmitted(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !formData.overallRating ||
      !formData.contentRating ||
      !formData.speakerRating ||
      !formData.comment.trim()
    ) {
      setError("Please complete all required fields before submitting.");
      setSubmitted(false);
      return;
    }

    setError("");
    setSubmitted(true);
  };

  return (
    <StudentLayout>
      <div className="student-page">

        <div className="page-header">
          <h1>Event Feedback</h1>
          <p>
            Share your experience and help us improve future events.
          </p>
        </div>

        <div className="feedback-card">

          <div className="feedback-event">
            <h2>Event Name</h2>
            <p>Event details will appear here.</p>
          </div>

          {error && (
            <div className="feedback-message feedback-error">
              {error}
            </div>
          )}

          {submitted && (
            <div className="feedback-message feedback-success">
              Feedback submitted successfully.
            </div>
          )}

          <form className="feedback-form" onSubmit={handleSubmit}>

            <div className="form-group">
              <label htmlFor="overallRating">
                Overall Rating *
              </label>

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
              <label htmlFor="contentRating">
                Content Rating *
              </label>

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
              <label htmlFor="speakerRating">
                Speaker Rating *
              </label>

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
              <label htmlFor="comment">
                Your Feedback *
              </label>

              <textarea
                id="comment"
                name="comment"
                rows="5"
                value={formData.comment}
                onChange={handleChange}
                placeholder="Tell us about your experience..."
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
              <button type="submit">
                Submit Feedback
              </button>
            </div>

          </form>
        </div>

      </div>
    </StudentLayout>
  );
}

export default Feedback;