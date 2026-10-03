import { useState, useEffect } from "react";
import "./pages.css";
import "./EventGallery.css";
import StudentLayout from "../layouts/StudentLayout";
import EmptyState from "../components/EmptyState/EmptyState";
import SearchBar from "../components/SearchBar/SearchBar";
import { fetchGalleryApi, getGallery } from "../services/studentService";
import { getAssetUrl } from "../../utils/urlUtils";

function EventGallery() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadGallery() {
      try {
        setLoading(true);
        const data = await fetchGalleryApi();
        if (isMounted && data && Array.isArray(data)) {
          const formatted = data.map((item) => ({
            galleryId: item._id || item.galleryId,
            _id: item._id,
            eventName: item.eventName,
            venue: item.venue || "",
            eventDate: item.date
              ? new Date(item.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : item.eventDate || "Date N/A",
            description: item.description || "",
            coverImage: item.banner || item.coverImage || (item.photos?.[0] || ""),
            photos: item.photos || [],
            videos: item.videos || [],
            tags: item.tags || [],
            totalPhotos: item.photos?.length || 0,
          }));
          setGalleryItems(formatted);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Failed to load gallery from API:", err.message);
      }

      if (isMounted) {
        setGalleryItems([]);
        setLoading(false);
      }
    }

    loadGallery();
    return () => {
      isMounted = false;
    };
  }, []);

  // Extract all unique tags
  const allTags = [
    "All",
    ...new Set(galleryItems.flatMap((item) => item.tags || [])),
  ];

  const filteredGallery = galleryItems.filter((item) => {
    const matchesTag =
      selectedTag === "All" ||
      (item.tags && item.tags.includes(selectedTag));

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      item.eventName?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term) ||
      item.venue?.toLowerCase().includes(term) ||
      item.tags?.some((t) => t.toLowerCase().includes(term));

    return matchesTag && matchesSearch;
  });

  return (
    <StudentLayout>
      <div className="gallery-page">
        <div className="page-container">
          <h1 className="page-title">Event Gallery</h1>
          <p className="page-subtitle">
            Explore event highlights, photo memories, and videos from TCF cybersecurity events.
          </p>
        </div>

        {/* Search & Tag Filter */}
        <div style={{ maxWidth: "600px", marginBottom: "16px" }}>
          <SearchBar
            placeholder="Search gallery by event name, venue, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {allTags.length > 1 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: selectedTag === tag ? "1px solid #6a3bc5" : "1px solid #e2e8f0",
                  background: selectedTag === tag ? "#6a3bc5" : "#ffffff",
                  color: selectedTag === tag ? "#ffffff" : "#475569",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="event-gallery-section">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
              Loading event memories & gallery highlights...
            </div>
          ) : filteredGallery.length > 0 ? (
            <div className="gallery-grid">
              {filteredGallery.map((item) => (
                <div className="gallery-card" key={item.galleryId || item._id}>
                  <div className="gallery-photo-grid">
                    {item.photos && item.photos.length > 0 ? (
                      item.photos.slice(0, 4).map((photo, index) => {
                        const resolvedUrl = getAssetUrl(photo);
                        return (
                          <div
                            className="gallery-photo-item"
                            key={index}
                            onClick={() => setActivePhoto({ photo: resolvedUrl, name: `${item.eventName} (Photo ${index + 1})` })}
                            style={{ cursor: "pointer" }}
                          >
                            <img
                              src={resolvedUrl}
                              alt={`${item.eventName} ${index + 1}`}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          </div>
                        );
                      })
                    ) : (
                      <div
                        style={{
                          height: "140px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#f8fafc",
                          color: "#94a3b8",
                          fontSize: "13px",
                          borderRadius: "8px",
                        }}
                      >
                        📸 Photo gallery collection
                      </div>
                    )}
                  </div>

                  <div className="gallery-card-content">
                    <h3>{item.eventName}</h3>
                    <p>{item.description}</p>

                    {item.tags && item.tags.length > 0 && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "10px 0" }}>
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              background: "#f0ebfa",
                              color: "#6a3bc5",
                              fontSize: "11px",
                              padding: "3px 8px",
                              borderRadius: "12px",
                              fontWeight: "600",
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ fontSize: "13px", color: "#555", marginTop: "10px" }}>
                      <p style={{ margin: "4px 0" }}>
                        <strong>Date:</strong> {item.eventDate}
                      </p>
                      <p style={{ margin: "4px 0" }}>
                        <strong>Venue:</strong> {item.venue}
                      </p>
                      <p style={{ margin: "4px 0" }}>
                        <strong>Photos:</strong> {item.totalPhotos || item.photos?.length || 0}
                      </p>
                      {item.videos && item.videos.length > 0 && (
                        <p style={{ margin: "4px 0", color: "#4f46e5" }}>
                          <strong>Video Highlights:</strong> {item.videos.length} recording(s) available
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Gallery Photos Found"
              message={
                searchTerm || selectedTag !== "All"
                  ? "No gallery memories match your active filters. Try resetting search or tag."
                  : "Photos and highlights from TCF events will appear here."
              }
            />
          )}
        </div>

        {/* Photo Lightbox Modal */}
        {activePhoto && (
          <div
            className="feedback-modal-overlay"
            onClick={() => setActivePhoto(null)}
            style={{ zIndex: 10000 }}
          >
            <div
              className="feedback-modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "700px", padding: "16px", textAlign: "center" }}
            >
              <button
                type="button"
                className="feedback-close"
                onClick={() => setActivePhoto(null)}
                aria-label="Close"
              >
                ×
              </button>

              <h3 style={{ margin: "8px 0 14px", color: "#1f1f29" }}>{activePhoto.name}</h3>

              <img
                src={activePhoto.photo}
                alt={activePhoto.name}
                style={{
                  width: "100%",
                  maxHeight: "500px",
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

export default EventGallery;