import { useEffect, useState } from "react";
import { CalendarDays, Clock, MapPin, Users, Plus, Trash2, X, AlertCircle } from "lucide-react";
import { eventService } from "../../services/eventService";
import { getAssetUrl } from "../../utils/urlUtils";

function Events() {
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const defaultForm = {
    name: "",
    speakerName: "",
    eventDate: "",
    eventEndDate: "",
    startTime: "10:00 AM",
    endTime: "01:00 PM",
    venue: "",
    category: "Workshop",
    description: "",
    participantLimit: 100,
    poster: "",
    registrationOpen: "",
    registrationClose: "",
  };
  const [formData, setFormData] = useState(defaultForm);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await eventService.getEvents();
      setEventsList(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim() || !formData.eventDate || !formData.venue.trim() || !formData.description.trim()) {
      setFormError("Please fill all required fields (Name, Date, Venue, Description).");
      return;
    }

    try {
      const payload = {
        ...formData,
        participantsLimit: Number(formData.participantLimit) || 100,
        registrationClose: formData.registrationClose || formData.eventDate,
      };
      await eventService.createEvent(payload);
      setIsCreateModalOpen(false);
      setFormData(defaultForm);
      loadEvents();
    } catch (err) {
      setFormError(err.message || "Failed to create event.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await eventService.deleteEvent(id);
        setEventsList((prev) => prev.filter((ev) => ev.id !== id && ev._id !== id));
      } catch (err) {
        alert(err.message || "Failed to delete event.");
      }
    }
  };

  return (
    <main className="dashboard">
      {/* Page heading */}
      <div className="page-heading">
        <div>
          <h2>Event Management</h2>
          <p>View and manage all events</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={16} />
          Create Event
        </button>
      </div>

      {/* Event count */}
      <div className="event-count">
        <CalendarDays size={18} />
        <span>
          <strong>{eventsList.length}</strong> Events
        </span>
      </div>

      {error && (
        <div style={{ padding: "12px", background: "#fde8e8", color: "#b42318", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#666" }}>
          Loading events...
        </div>
      ) : eventsList.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#888" }}>
          <AlertCircle size={32} style={{ margin: "0 auto 8px" }} />
          <p>No events found. Click "+ Create Event" to add an event.</p>
        </div>
      ) : (
        /* Event cards */
        <section className="event-card-grid">
          {eventsList.map((event) => {
            const posterUrl = event.poster ? getAssetUrl(event.poster) : "";
            const rawDate = event.eventDate || event.date;
            let formattedDate = rawDate || "Date TBA";
            if (rawDate && !isNaN(new Date(rawDate).getTime())) {
              formattedDate = new Date(rawDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
            }

            return (
              <div className="event-card" key={event.id || event._id}>
                {/* Poster */}
                <div className="event-poster">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={event.name}
                      onError={(e) => {
                        e.target.style.display = "none";
                        const ph = e.target.parentElement?.querySelector(".admin-poster-placeholder");
                        if (ph) ph.style.display = "flex";
                      }}
                    />
                  ) : null}

                  <div
                    className="admin-poster-placeholder"
                    style={{
                      display: posterUrl ? "none" : "flex",
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#6366f1",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    📅 {event.category || "Event"}
                  </div>

                  <span className={`event-status ${event.status}`}>
                    {event.status}
                  </span>
                </div>

                {/* Event information */}
                <div className="event-card-content">
                  <div className="event-card-title">
                    <div>
                      <h3>{event.name}</h3>

                      <p className="event-id">
                        {event.category}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(event.id || event._id)}
                      title="Delete Event"
                      style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Date */}
                  <div className="event-info-row">
                    <CalendarDays size={15} />
                    <span>{formattedDate}</span>
                  </div>

                {/* Time */}
                <div className="event-info-row">
                  <Clock size={15} />
                  <span>
                    {event.startTime} - {event.endTime}
                  </span>
                </div>

                {/* Venue */}
                <div className="event-info-row">
                  <MapPin size={15} />
                  <span>{event.venue}</span>
                </div>

                {/* Participants */}
                <div className="event-info-row">
                  <Users size={15} />
                  <span>
                    {event.registeredCount || 0} / {event.participantLimit || 100} registered
                  </span>
                </div>

                {/* Registration status */}
                <div className="event-registration">
                  <span>Registration</span>

                  <span className={`registration-badge ${event.registrationStatus || "open"}`}>
                    {event.registrationStatus || "open"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        </section>
      )}

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "16px",
          }}
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "540px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Create New Event</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: "10px", background: "#fde8e8", color: "#b42318", borderRadius: "8px", marginBottom: "12px", fontSize: "13px" }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#444" }}>Event Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Cybersecurity Bootcamp"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", marginTop: "4px" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#444" }}>Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", marginTop: "4px" }}
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Competition">Competition</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Session">Session</option>
                    <option value="Webinar">Webinar</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#444" }}>Event Date *</label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", marginTop: "4px" }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#444" }}>Start Time</label>
                  <input
                    type="text"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    placeholder="10:00 AM"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", marginTop: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#444" }}>End Time</label>
                  <input
                    type="text"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    placeholder="01:00 PM"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", marginTop: "4px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#444" }}>Venue *</label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  placeholder="e.g. Auditorium / Lab 3"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", marginTop: "4px" }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#444" }}>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Event details..."
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", marginTop: "4px" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#444" }}>Speaker / Coordinator</label>
                  <input
                    type="text"
                    name="speakerName"
                    value={formData.speakerName}
                    onChange={handleInputChange}
                    placeholder="e.g. John Doe"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", marginTop: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#444" }}>Capacity</label>
                  <input
                    type="number"
                    name="participantLimit"
                    value={formData.participantLimit}
                    onChange={handleInputChange}
                    min={1}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", marginTop: "4px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  style={{ padding: "8px 20px" }}
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Events;