import { useEffect, useState } from "react";
import { Image, Trash2, Plus, RefreshCw, AlertCircle, Calendar, MapPin, Tag, User } from "lucide-react";
import { galleryService } from "../../services/galleryService";
import { eventService } from "../../services/eventService";
import { getAssetUrl } from "../../utils/urlUtils";

function Gallery() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [galRes, evRes] = await Promise.all([
        galleryService.getGallery().catch(() => ({ data: [] })),
        eventService.getEvents().catch(() => ({ data: [] })),
      ]);
      setGalleryItems(galRes.data || []);
      setEvents(evRes.data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to load gallery items:", err);
      setError(err.message || "Failed to load gallery.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title || "this gallery entry"}"?`)) return;

    try {
      await galleryService.deleteGallery(id);
      setGalleryItems((prev) => prev.filter((item) => (item._id || item.id) !== id));
    } catch (err) {
      alert(err.message || "Failed to delete gallery item.");
    }
  };

  const handleEventSelect = (e) => {
    const evId = e.target.value;
    setSelectedEventId(evId);
    if (evId) {
      const selected = events.find((ev) => (ev._id || ev.id) === evId);
      if (selected) {
        setEventName(selected.name || selected.title || "");
        setVenue(selected.venue || "");
        if (selected.eventDate || selected.date) {
          const d = new Date(selected.eventDate || selected.date);
          if (!isNaN(d.getTime())) {
            setDate(d.toISOString().split("T")[0]);
          }
        }
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!eventName.trim()) {
      alert("Please provide an event name.");
      return;
    }
    if (!imageUrl.trim()) {
      alert("Please provide an image URL or upload a photo.");
      return;
    }

    try {
      setSubmitting(true);
      const parsedTags = tags
        ? tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [eventName.trim().toLowerCase()];

      const payload = {
        eventName: eventName.trim(),
        description: description.trim() || undefined,
        venue: venue.trim() || undefined,
        date: date || new Date().toISOString(),
        photos: [imageUrl.trim()],
        banner: imageUrl.trim(),
        tags: parsedTags,
        eventId: selectedEventId || undefined,
      };

      await galleryService.createGallery(payload);
      await fetchData();

      setEventName("");
      setDescription("");
      setVenue("");
      setDate("");
      setImageUrl("");
      setTags("");
      setSelectedEventId("");
      setShowAddModal(false);
    } catch (err) {
      alert(err.message || "Failed to create gallery item.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="dashboard">
      <div className="page-heading">
        <div>
          <h2>Event Gallery Management</h2>
          <p>Organize and manage event photos, highlights, and visual memories</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowAddModal(true)}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Plus size={16} />
          Add Photo
        </button>
      </div>

      {error && (
        <div style={{ color: "#ef4444", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
          <p>Loading gallery items...</p>
        </div>
      ) : galleryItems.length === 0 ? (
        <div style={{ background: "#ffffff", padding: "3rem", borderRadius: "0.75rem", textAlign: "center", color: "#64748b", border: "1px solid #e2e8f0" }}>
          <Image size={40} style={{ margin: "0 auto 1rem", opacity: 0.6, color: "#7040d0" }} />
          <h3 style={{ margin: "0 0 0.5rem", color: "#0f172a" }}>No gallery images found</h3>
          <p style={{ margin: "0 0 1.5rem" }}>Upload event photos from Volunteer or Admin to display visual memories.</p>
          <button
            className="primary-button"
            onClick={() => setShowAddModal(true)}
          >
            Add Photo
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {galleryItems.map((item) => {
            const itemId = item._id || item.id;
            const photoRaw = (item.photos && item.photos[0]) || item.banner || item.imageUrl || "";
            const photoUrl = photoRaw ? getAssetUrl(photoRaw) : "";
            const title = item.eventName || item.eventId?.name || item.title || "Event Gallery";
            const desc = item.description || item.caption || "Event visual highlight.";
            const rawDate = item.date || item.createdAt;
            let formattedDate = "";
            if (rawDate && !isNaN(new Date(rawDate).getTime())) {
              formattedDate = new Date(rawDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
            }

            return (
              <div
                key={itemId}
                style={{
                  background: "#ffffff",
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ height: "190px", overflow: "hidden", position: "relative", background: "#f1f5f9" }}>
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        const ph = e.target.parentElement?.querySelector(".admin-gallery-placeholder");
                        if (ph) ph.style.display = "flex";
                      }}
                    />
                  ) : null}

                  <div
                    className="admin-gallery-placeholder"
                    style={{
                      display: photoUrl ? "none" : "flex",
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
                    📷 Gallery Photo
                  </div>

                  <span
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      left: "8px",
                      background: "rgba(15, 23, 42, 0.85)",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#ffffff",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {title}
                  </span>
                </div>

                <div style={{ padding: "1.1rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h4 style={{ margin: "0 0 0.4rem", color: "#0f172a", fontSize: "1.05rem", fontWeight: 700 }}>
                      {title}
                    </h4>
                    <p style={{ margin: "0 0 0.75rem", color: "#64748b", fontSize: "0.85rem", lineHeight: 1.5 }}>
                      {desc}
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.8rem", color: "#475569", marginBottom: "0.75rem" }}>
                      {formattedDate && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Calendar size={13} color="#6366f1" />
                          <span>{formattedDate}</span>
                        </div>
                      )}
                      {item.venue && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <MapPin size={13} color="#6366f1" />
                          <span>{item.venue}</span>
                        </div>
                      )}
                      {item.createdBy?.fullName && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <User size={13} color="#6366f1" />
                          <span>Uploaded by: <strong>{item.createdBy.fullName}</strong></span>
                        </div>
                      )}
                    </div>

                    {Array.isArray(item.tags) && item.tags.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "0.5rem" }}>
                        {item.tags.map((t, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: "#f1f5f9",
                              color: "#475569",
                              fontSize: "0.7rem",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontWeight: 500,
                            }}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      {formattedDate || "Recent"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(itemId, title)}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", fontWeight: 600 }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Photo Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "500px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px", color: "#0f172a", fontSize: "1.25rem" }}>
              Add Gallery Photo
            </h3>

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {events.length > 0 && (
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Select Event (Optional)
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={handleEventSelect}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  >
                    <option value="">-- Custom / General Event --</option>
                    {events.map((ev) => (
                      <option key={ev._id || ev.id} value={ev._id || ev.id}>
                        {ev.name || ev.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g., Malware Analysis Workshop"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Image URL or Uploaded Path *
                </label>
                <input
                  type="text"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="e.g., /uploads/event_photo.jpg or https://..."
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe the highlight or moment..."
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Venue
                  </label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g., Lab 3"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="workshop, cyber, highlights"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "9px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#334155", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="primary-button"
                  style={{ padding: "9px 20px" }}
                >
                  {submitting ? "Adding..." : "Add to Gallery"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Gallery;
