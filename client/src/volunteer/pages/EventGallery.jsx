import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ImagePlus,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";

import { gallery } from "../../mockData";

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

const initialFormState = {
  eventName: "",
  speakerName: "",
  eventDate: "",
  startTime: "",
  eventEndDate: "",
  endTime: "",
  venue: "",
  category: "Workshop",
  description: "",
  photos: [],
};

function EventGallery() {
  const [galleries, setGalleries] = useState(gallery);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState("");

  const [photoIndex, setPhotoIndex] = useState(0);

  const [form, setForm] = useState(initialFormState);

  const filteredGalleries = useMemo(() => {
    if (!search.trim()) return galleries;
    const q = search.toLowerCase();
    return galleries.filter(
      (item) =>
        item.eventName?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.speakerName?.toLowerCase().includes(q) ||
        item.venue?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
    );
  }, [galleries, search]);

  // Auto change image every 1 minute (60 seconds)
  useEffect(() => {
    if (!selectedGallery) return;

    const photos = selectedGallery.photos || [];
    if (photos.length <= 1) return;

    const timer = setInterval(() => {
      setPhotoIndex((current) => (current === photos.length - 1 ? 0 : current + 1));
    }, 60000);

    return () => clearInterval(timer);
  }, [selectedGallery]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  function openGallery(item) {
    setSelectedGallery(item);
    setPhotoIndex(0);
    setEditMode(false);
  }

  function closeGallery() {
    setSelectedGallery(null);
    setEditMode(false);
    setPhotoIndex(0);
  }

  function startEdit() {
    setForm({
      eventName: selectedGallery.eventName || "",
      speakerName: selectedGallery.speakerName || "",
      eventDate: selectedGallery.eventDate || "",
      startTime:
        selectedGallery.startTime ||
        selectedGallery.eventTime?.split("-")[0]?.trim() ||
        "",
      eventEndDate:
        selectedGallery.eventEndDate || selectedGallery.eventDate || "",
      endTime:
        selectedGallery.endTime ||
        selectedGallery.eventTime?.split("-")[1]?.trim() ||
        "",
      venue: selectedGallery.venue || "",
      category: selectedGallery.category || "Workshop",
      description: selectedGallery.description || "",
      photos: selectedGallery.photos || [],
    });
    setEditMode(true);
  }

  function handleCreate() {
    if (!form.eventName.trim()) {
      setToast("Please enter event name.");
      return;
    }
    if (!form.eventDate) {
      setToast("Please select event start date.");
      return;
    }
    if (!form.startTime) {
      setToast("Please select start time.");
      return;
    }
    if (!form.endTime) {
      setToast("Please select end time.");
      return;
    }
    if (!form.venue.trim()) {
      setToast("Please enter venue.");
      return;
    }
    if (!form.description.trim()) {
      setToast("Please enter description.");
      return;
    }

    const newGallery = {
      galleryId: `GAL${Date.now()}`,
      eventName: form.eventName,
      speakerName: form.speakerName || "TCF Team",
      eventDate: form.eventDate,
      eventEndDate: form.eventEndDate || form.eventDate,
      eventTime: `${form.startTime} - ${form.endTime}`,
      startTime: form.startTime,
      endTime: form.endTime,
      venue: form.venue,
      category: form.category || "Workshop",
      description: form.description,
      coverImage: form.photos[0] || "",
      photos: form.photos,
      videos: [],
      totalPhotos: form.photos.length,
    };

    setGalleries((current) => [newGallery, ...current]);
    setShowCreate(false);
    setForm(initialFormState);
    setToast("Event gallery created successfully.");
  }

  function handleUpdate() {
    if (!form.eventName.trim()) {
      setToast("Event name cannot be empty.");
      return;
    }
    if (!form.eventDate) {
      setToast("Please select event start date.");
      return;
    }
    if (!form.startTime) {
      setToast("Please select start time.");
      return;
    }
    if (!form.endTime) {
      setToast("Please select end time.");
      return;
    }
    if (!form.venue.trim()) {
      setToast("Please enter venue.");
      return;
    }
    if (!form.description.trim()) {
      setToast("Description cannot be empty.");
      return;
    }

    const updated = {
      ...selectedGallery,
      eventName: form.eventName,
      speakerName: form.speakerName || "TCF Team",
      eventDate: form.eventDate,
      eventEndDate: form.eventEndDate || form.eventDate,
      eventTime: `${form.startTime} - ${form.endTime}`,
      startTime: form.startTime,
      endTime: form.endTime,
      venue: form.venue,
      category: form.category || "Workshop",
      description: form.description,
      photos: form.photos,
      coverImage: form.photos[0] || selectedGallery.coverImage || "",
      totalPhotos: form.photos.length,
    };

    setGalleries((current) =>
      current.map((item) =>
        item.galleryId === updated.galleryId ? updated : item
      )
    );

    setSelectedGallery(updated);
    setEditMode(false);
    setPhotoIndex(0);
    setToast("Gallery updated successfully.");
  }

  function handleDelete(galleryId) {
    setGalleries((current) =>
      current.filter((item) => item.galleryId !== galleryId)
    );
    setSelectedGallery(null);
    setToast("Gallery entry removed.");
  }

  function handlePhotoUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const availableSlots = 6 - form.photos.length;
    if (availableSlots <= 0) {
      setToast("You can upload a maximum of 6 photos.");
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);
    const imageUrls = filesToProcess.map((file) => URL.createObjectURL(file));

    setForm((current) => ({
      ...current,
      photos: [...current.photos, ...imageUrls].slice(0, 6),
    }));

    if (files.length > availableSlots) {
      setToast(`Only ${availableSlots} photo(s) added. Maximum limit is 6.`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#24154f]">Event Gallery</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage photos, highlights, and memories from TCF campus events.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm(initialFormState);
            setShowCreate(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-[#24154f] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#36216f] transition shadow-xs"
        >
          <Plus size={17} />
          Create Event Gallery
        </button>
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
                  <ImagePlus size={36} className="text-purple-300 opacity-80" />
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
            Try searching for another event or click "Create Event Gallery".
          </p>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <GalleryFormModal
          title="Create Event Gallery"
          form={form}
          setForm={setForm}
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
          onPhotoUpload={handlePhotoUpload}
        />
      )}

      {/* Detail Pop-up Modal (60s Auto-Advancing Lightbox) */}
      {selectedGallery && !editMode && (
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startEdit}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <Pencil size={14} />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(selectedGallery.galleryId)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                >
                  <Trash2 size={14} />
                  Delete
                </button>

                <button
                  type="button"
                  onClick={closeGallery}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
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

      {/* Edit Modal */}
      {selectedGallery && editMode && (
        <GalleryFormModal
          title="Edit Event Gallery"
          form={form}
          setForm={setForm}
          onClose={() => setEditMode(false)}
          onSave={handleUpdate}
          onPhotoUpload={handlePhotoUpload}
        />
      )}

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-[#24154f] px-4 py-3 text-sm font-medium text-white shadow-lg">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}

function GalleryFormModal({
  title,
  form,
  setForm,
  onClose,
  onSave,
  onPhotoUpload,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-5 text-xs">
          {/* 1. Name & Speaker of Event */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                Name of event <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.eventName}
                onChange={(e) =>
                  setForm({ ...form, eventName: e.target.value })
                }
                placeholder="e.g. Capture The Flag 2027"
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition-all text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                Speaker of event
              </label>
              <input
                type="text"
                value={form.speakerName}
                onChange={(e) =>
                  setForm({ ...form, speakerName: e.target.value })
                }
                placeholder="e.g. Rahul Sharma"
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition-all text-xs"
              />
            </div>
          </div>

          {/* 2. Schedule: Start Schedule & End Schedule */}
          <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800 text-xs flex items-center gap-1.5">
                <Calendar size={14} className="text-[#7040d0]" />
                Event Schedule (Dates & Times)
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                {form.eventEndDate && form.eventEndDate !== form.eventDate
                  ? "Multi-day Event (End time on End Date)"
                  : "Single-day Event (End time on Start Date)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Schedule Box */}
              <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <span className="font-bold text-gray-800 text-xs">
                    Start Schedule
                  </span>
                  <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded">
                    Event Start
                  </span>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Event Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.eventDate}
                    onChange={(e) =>
                      setForm({ ...form, eventDate: e.target.value })
                    }
                    className="w-full h-9 px-2.5 bg-white border border-gray-200 rounded-md focus:border-[#7040d0] focus:ring-1 focus:ring-[#7040d0]/20 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Start Time (on Start Date) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                    className="w-full h-9 px-2.5 bg-white border border-gray-200 rounded-md focus:border-[#7040d0] focus:ring-1 focus:ring-[#7040d0]/20 outline-none text-xs"
                  />
                </div>
              </div>

              {/* End Schedule Box */}
              <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <span className="font-bold text-gray-800 text-xs">
                    End Schedule
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {form.eventEndDate && form.eventEndDate !== form.eventDate
                      ? `Ends on ${formatDate(form.eventEndDate)}`
                      : "Ends on Start Date"}
                  </span>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Event End Date{" "}
                    <span className="text-gray-400 font-normal text-[10px]">
                      (Optional — defaults to Start Date)
                    </span>
                  </label>
                  <input
                    type="date"
                    min={form.eventDate || undefined}
                    value={form.eventEndDate}
                    onChange={(e) =>
                      setForm({ ...form, eventEndDate: e.target.value })
                    }
                    className="w-full h-9 px-2.5 bg-white border border-gray-200 rounded-md focus:border-[#7040d0] focus:ring-1 focus:ring-[#7040d0]/20 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    End Time{" "}
                    <span className="text-purple-700 font-medium text-[10px]">
                      ({form.eventEndDate &&
                      form.eventEndDate !== form.eventDate
                        ? "on End Date"
                        : "on Start Date"})
                    </span>{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(e) =>
                      setForm({ ...form, endTime: e.target.value })
                    }
                    className="w-full h-9 px-2.5 bg-white border border-gray-200 rounded-md focus:border-[#7040d0] focus:ring-1 focus:ring-[#7040d0]/20 outline-none text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Venue of Event & Type of Event */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                Venue of event <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="e.g. VGEC Seminar Hall"
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition-all text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                Type of event <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition-all text-xs"
              >
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Competition">Competition</option>
                <option value="Webinar">Webinar</option>
                <option value="Bootcamp">Bootcamp</option>
                <option value="Hands-on Lab">Hands-on Lab</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* 4. Description of Event */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1.5">
              Description of event <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Provide detailed description of the event..."
              className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 outline-none transition-all text-xs"
            />
          </div>

          {/* 5. Event Photos Upload (Up to 6 photos) */}
          <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-gray-800 text-xs flex items-center gap-1.5">
                <ImagePlus size={14} className="text-[#7040d0]" />
                Event Photos <span className="text-gray-400 font-normal">({form.photos.length}/6 uploaded)</span>
              </label>
              <span className="text-[11px] text-gray-400 font-medium">
                Upload up to 6 photos
              </span>
            </div>

            {form.photos.length < 6 ? (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-purple-50/40 hover:border-[#7040d0]/40 transition-all bg-white">
                <ImagePlus size={30} className="text-[#7040d0] mb-2" />
                <span className="font-semibold text-gray-700 text-xs">
                  Click to select or drag & drop event photos
                </span>
                <span className="text-[11px] text-gray-400 mt-0.5">
                  PNG, JPG, JPEG, WEBP (Up to 6 images)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onPhotoUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold text-center">
                Maximum 6 photos reached ✓
              </div>
            )}

            {/* Photos Preview Grid */}
            {form.photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-3">
                {form.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="group relative h-20 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-2xs"
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((cur) => ({
                            ...cur,
                            photos: cur.photos.filter((_, i) => i !== index),
                          }))
                        }
                        className="p-1 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
                        title="Remove photo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-white font-medium">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t p-5 bg-gray-50/70">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-[#24154f] hover:bg-[#36216f] px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors"
          >
            Save Gallery
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventGallery;