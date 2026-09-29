import React from "react";

function GalleryCard({ item, onPhotoClick }) {
  if (!item) return null;

  return (
    <div className="gallery-card">
      <div className="gallery-photo-grid">
        {item.photos &&
          item.photos.slice(0, 4).map((photo, index) => (
            <div
              className="gallery-photo-item"
              key={index}
              onClick={() => onPhotoClick && onPhotoClick(photo, item)}
              style={{ cursor: onPhotoClick ? "pointer" : "default" }}
            >
              <img
                src={photo}
                alt={`${item.eventName} ${index + 1}`}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          ))}
      </div>

      <div className="gallery-card-content">
        <h3>{item.eventName}</h3>
        <p>{item.description}</p>

        {item.tags && item.tags.length > 0 && (
          <div className="gallery-tags" style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "10px 0" }}>
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

        <div style={{ marginTop: "10px", fontSize: "13px", color: "#555" }}>
          <p style={{ margin: "4px 0" }}>
            <strong>Date:</strong> {item.eventDate}
          </p>
          <p style={{ margin: "4px 0" }}>
            <strong>Venue:</strong> {item.venue}
          </p>
          <p style={{ margin: "4px 0" }}>
            <strong>Photos:</strong> {item.totalPhotos || item.photos?.length || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

export default GalleryCard;
