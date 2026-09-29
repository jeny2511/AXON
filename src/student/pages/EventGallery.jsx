import "./EventGallery.css";
import StudentLayout from "../layouts/StudentLayout";
import EmptyState from "../components/EmptyState/EmptyState";
import { getGallery } from "../services/studentService";

function EventGallery() {
  const galleryItems = getGallery();

  return (
    <StudentLayout>
      <div className="student-page">

        <div className="page-header">
          <h1>Event Gallery</h1>
          <p>Explore photos and memories from TCF events.</p>
        </div>

        <div className="event-gallery-section">
          {galleryItems.length > 0 ? (
            <div className="gallery-grid">
              {galleryItems.map((item) => (
                <div className="gallery-card" key={item.galleryId}>

                  <div className="gallery-photo-grid">
                    {item.photos.map((photo, index) => (
                      <div
                        className="gallery-photo-item"
                        key={index}
                      >
                        <img
                          src={photo}
                          alt={`${item.eventName} ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="gallery-card-content">
                    <h3>{item.eventName}</h3>

                    <p>{item.description}</p>

                    <p>
                      <strong>Date:</strong> {item.eventDate}
                    </p>

                    <p>
                      <strong>Venue:</strong> {item.venue}
                    </p>

                    <p>
                      <strong>Photos:</strong> {item.totalPhotos}
                    </p>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Gallery Photos"
              message="Photos from TCF events will appear here."
            />
          )}
        </div>

      </div>
    </StudentLayout>
  );
}

export default EventGallery;