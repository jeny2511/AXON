import { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import StudentLayout from "../layouts/StudentLayout";
import { getGallery } from "../services/studentService";

// Format date helper
function formatDate(dateStr) {
  if (!dateStr) return "";
  const dateObj = new Date(`${dateStr}`.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  if (isNaN(dateObj)) return dateStr;
  return dateObj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function EventGallery() {
  const galleries = getGallery();
  const [search, setSearch] = useState("");
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const filteredGalleries = useMemo(() => {
    if (!search.trim()) return galleries;
    const q = search.toLowerCase();
    return galleries.filter(
      (item) =>
        item.eventName?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.speakerName?.toLowerCase().includes(q) ||
        item.venue?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [galleries, search]);

  // Auto change image every 1 minute (60 seconds)
  useEffect(() => {
    if (!selectedGallery) return;

    const photos = selectedGallery.photos || [];
    if (photos.length <= 1) return;

    const timer = setInterval(() => {
      setPhotoIndex((current) =>
        current === photos.length - 1 ? 0 : current + 1
      );
    }, 60000);

    return () => clearInterval(timer);
  }, [selectedGallery]);

  function openGallery(item) {
    setSelectedGallery(item);
    setPhotoIndex(0);
  }

  function closeGallery() {
    setSelectedGallery(null);
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header (Matches Volunteer Module) */}
        <div>
          <h1 className="text-2xl font-bold text-[#24154f]">Event Gallery</h1>
          <p className="mt-1 text-sm text-gray-500">
            Explore photos, highlights, and memories from TCF campus events.
          </p>
        </div>

        {/* Top Search Bar */}
        <div className="max-w-xl">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-xs">
            <Search size={18} className="text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search gallery by event name, description, venue, or speaker..."
              className="w-full text-sm outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Gallery Cards Grid */}
        {filteredGalleries.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredGalleries.map((item) => (
              <div
                key={item.galleryId}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition-all hover:shadow-md"
              >
                {/* Cover Photo */}
                <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-purple-900 to-indigo-950">
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.eventName}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = "flex";
                        }
                      }}
                    />
                  ) : null}

                  <div
                    className={`flex h-full w-full flex-col items-center justify-center p-4 text-center text-white ${
                      item.coverImage ? "hidden" : "flex"
                    }`}
                  >
                    <ImagePlus
                      size={36}
                      className="text-purple-300 opacity-80"
                    />
                    <p className="mt-2 text-xs font-medium text-purple-200">
                      {item.eventName}
                    </p>
                  </div>

                  <div className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-xs">
                    {item.photos?.length || item.totalPhotos || 0} photos
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">
                      {item.eventName}
                    </h3>
                    {item.category && (
                      <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-[#7040d0] border border-purple-200">
                        {item.category}
                      </span>
                    )}
                  </div>

                  {/* 3-line truncated description */}
                  <p className="mt-1 flex-1 text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                    <span className="text-gray-400">
                      {formatDate(item.eventDate) || "Past Event"}
                    </span>

                    <button
                      type="button"
                      onClick={() => openGallery(item)}
                      className="text-sm font-semibold text-purple-700 hover:text-purple-900"
                    >
                      View More →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <ImagePlus size={40} className="mx-auto text-gray-300" />
            <h3 className="mt-4 font-semibold text-gray-700">
              No galleries found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try searching for another event or keyword.
            </p>
          </div>
        )}

        {/* Detail Pop-up Modal (60s Auto-Advancing Lightbox) */}
        {selectedGallery && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onMouseDown={closeGallery}
          >
            <div
              className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-gray-800">
                      {selectedGallery.eventName}
                    </h2>
                    {selectedGallery.category && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-[#7040d0] border border-purple-200">
                        {selectedGallery.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Event Gallery & Memory Highlights
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeGallery}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* Main Photo Slideshow */}
                <div className="relative flex h-[380px] w-full items-center justify-center overflow-hidden rounded-xl bg-gray-950">
                  {selectedGallery.photos?.length ? (
                    <img
                      src={selectedGallery.photos[photoIndex]}
                      alt={selectedGallery.eventName}
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.target.src = selectedGallery.coverImage || "";
                      }}
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImagePlus
                        size={44}
                        className="mx-auto mb-2 opacity-50"
                      />
                      <p className="text-sm">
                        No photos uploaded for this gallery.
                      </p>
                    </div>
                  )}

                  {/* Left/Right Carousel Controls */}
                  {selectedGallery.photos?.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setPhotoIndex((cur) =>
                            cur === 0
                              ? selectedGallery.photos.length - 1
                              : cur - 1
                          )
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white text-gray-800 transition"
                        aria-label="Previous photo"
                      >
                        <ChevronLeft size={20} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPhotoIndex((cur) =>
                            cur === selectedGallery.photos.length - 1
                              ? 0
                              : cur + 1
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white text-gray-800 transition"
                        aria-label="Next photo"
                      >
                        <ChevronRight size={20} />
                      </button>

                      <div className="absolute bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-xs">
                        {photoIndex + 1} / {selectedGallery.photos.length}{" "}
                        (Auto-scrolls every 60s)
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnails strip */}
                {selectedGallery.photos?.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedGallery.photos.map((photo, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPhotoIndex(idx)}
                        className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                          photoIndex === idx
                            ? "border-purple-600 scale-105"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={photo}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Event Metadata Grid (Date, Time, Venue, Speaker) */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {/* 1. Date */}
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3.5 border border-gray-100">
                    <Calendar size={18} className="text-[#7040d0] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">
                        Date
                      </p>
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {formatDate(selectedGallery.eventDate) || "Past Event"}
                        {selectedGallery.eventEndDate &&
                          selectedGallery.eventEndDate !== selectedGallery.eventDate &&
                          ` - ${formatDate(selectedGallery.eventEndDate)}`}
                      </p>
                    </div>
                  </div>

                  {/* 2. Time */}
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3.5 border border-gray-100">
                    <Clock size={18} className="text-[#7040d0] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">
                        Time
                      </p>
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {selectedGallery.startTime && selectedGallery.endTime
                          ? `${selectedGallery.startTime} - ${selectedGallery.endTime}`
                          : selectedGallery.eventTime || "14:00 - 17:00"}
                      </p>
                    </div>
                  </div>

                  {/* 3. Venue */}
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3.5 border border-gray-100">
                    <MapPin size={18} className="text-[#7040d0] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">
                        Venue
                      </p>
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {selectedGallery.venue || "VGEC Seminar Hall"}
                      </p>
                    </div>
                  </div>

                  {/* 4. Speaker */}
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3.5 border border-gray-100">
                    <User size={18} className="text-[#7040d0] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">
                        Speaker
                      </p>
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {selectedGallery.speakerName || "TCF Team"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description of Event & Type of Event */}
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Description of Event
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-gray-500 font-medium">Type of Event:</span>
                      <span className="text-[11px] font-bold text-[#7040d0] bg-purple-100 px-2.5 py-0.5 rounded-md border border-purple-200">
                        {selectedGallery.category || "Workshop"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                    {selectedGallery.description || "No description provided."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

export default EventGallery;