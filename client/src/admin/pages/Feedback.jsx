import { useEffect, useState } from "react";
import { MessageSquare, Star, RefreshCw, AlertCircle, Calendar, User } from "lucide-react";
import { eventService } from "../../services/eventService";
import { feedbackService } from "../../services/feedbackService";

function Feedback() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [feedbackList, setFeedbackList] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoadingEvents(true);
        const res = await eventService.getEvents();
        const evList = res.data || [];
        setEvents(evList);
        if (evList.length > 0) {
          setSelectedEventId(evList[0]._id || evList[0].id);
        }
      } catch (err) {
        console.error("Failed to load events for feedback:", err);
        setError(err.message || "Failed to load events.");
      } finally {
        setLoadingEvents(false);
      }
    };

    loadEvents();
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;

    const loadFeedback = async () => {
      try {
        setLoadingFeedback(true);
        const res = await feedbackService.getEventFeedback(selectedEventId);
        setFeedbackList(res.data?.feedback || res.data || []);
        setOverview(res.data?.overview || null);
        setError(null);
      } catch (err) {
        console.error("Failed to load event feedback:", err);
        setFeedbackList([]);
        setOverview(null);
      } finally {
        setLoadingFeedback(false);
      }
    };

    loadFeedback();
  }, [selectedEventId]);

  return (
    <main className="dashboard">
      <div className="page-heading">
        <div>
          <h2>Event Feedback & Reviews</h2>
          <p>Inspect student feedback, satisfaction ratings, and constructive reviews</p>
        </div>

        {events.length > 0 && (
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#0f172a",
              fontSize: "0.875rem",
              fontWeight: 500,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            {events.map((ev) => (
              <option key={ev._id || ev.id} value={ev._id || ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div style={{ color: "#ef4444", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loadingEvents ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
          <p>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div style={{ background: "#ffffff", padding: "3rem", borderRadius: "0.75rem", textAlign: "center", color: "#64748b", border: "1px solid #e2e8f0" }}>
          <MessageSquare size={40} style={{ margin: "0 auto 1rem", opacity: 0.6, color: "#7040d0" }} />
          <h3 style={{ margin: "0 0 0.5rem", color: "#0f172a" }}>No events found</h3>
          <p>Create an event in Event Management to begin receiving feedback.</p>
        </div>
      ) : loadingFeedback ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
          <p>Loading event feedback...</p>
        </div>
      ) : feedbackList.length === 0 ? (
        <div style={{ background: "#ffffff", padding: "3rem", borderRadius: "0.75rem", textAlign: "center", color: "#64748b", border: "1px solid #e2e8f0" }}>
          <MessageSquare size={40} style={{ margin: "0 auto 1rem", opacity: 0.6, color: "#7040d0" }} />
          <h3 style={{ margin: "0 0 0.5rem", color: "#0f172a" }}>No feedback submitted yet</h3>
          <p>Attendees who completed this event can submit reviews through their student portal.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {overview && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <span style={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 500 }}>Average Overall Rating</span>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f59e0b", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Star size={20} fill="#f59e0b" />
                  {overview.avgOverall || overview.averageRating || "N/A"} / 5
                </div>
              </div>
              <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <span style={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 500 }}>Total Reviews</span>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#7040d0", marginTop: "0.25rem" }}>
                  {overview.totalReviews || feedbackList.length}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
            {feedbackList.map((item) => (
              <div
                key={item._id || item.id}
                style={{
                  background: "#ffffff",
                  padding: "1.25rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#7040d0", fontSize: "0.875rem", fontWeight: 600 }}>
                        <User size={16} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#0f172a", fontWeight: 600 }}>
                          {item.studentId?.fullName || item.studentId?.name || "Verified Student"}
                        </h4>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {item.studentId?.department || "Attendee"}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#f59e0b", fontWeight: 600, fontSize: "0.9rem" }}>
                      <Star size={15} fill="#f59e0b" />
                      {item.overallRating || item.rating || 5}/5
                    </div>
                  </div>

                  <p style={{ margin: "0.5rem 0", color: "#334155", fontSize: "0.9rem", lineHeight: 1.5 }}>
                    "{item.comments || item.comment || "Great event overall!"}"
                  </p>
                </div>

                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.5rem", marginTop: "0.75rem", display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b" }}>
                  <span>Would recommend: {item.wouldRecommend !== false ? "Yes" : "No"}</span>
                  <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export default Feedback;
