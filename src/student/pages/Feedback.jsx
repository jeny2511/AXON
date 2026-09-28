import "./Feedback.css";
import StudentLayout from "../layouts/StudentLayout";

function Feedback() {
  return (
    <StudentLayout>
      <div className="student-page">
        <div className="page-header">
          <h1>Event Feedback</h1>
          <p>Share your experience and help us improve future events.</p>
        </div>

        <div className="feedback-card">
          <div className="feedback-event">
            <h2>Event Name</h2>
            <p>Event details will appear here.</p>
          </div>

          <form className="feedback-form">
            <div className="form-group">
              <label htmlFor="overallRating">
                Overall Rating
              </label>

              <select id="overallRating" name="overallRating">
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
                Content Rating
              </label>

              <select id="contentRating" name="contentRating">
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
                Speaker Rating
              </label>

              <select id="speakerRating" name="speakerRating">
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
                Your Feedback
              </label>

              <textarea
                id="comment"
                name="comment"
                rows="5"
                placeholder="Tell us about your experience..."
              />
            </div>

            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="wouldRecommend"
                name="wouldRecommend"
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