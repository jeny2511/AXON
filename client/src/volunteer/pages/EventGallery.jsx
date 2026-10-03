import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";

import { galleryService } from "../../services/galleryService";
import apiClient from "../../services/apiClient";
import { getAssetUrl } from "../../utils/urlUtils";

function EventGallery() {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState("");

  const [photoIndex, setPhotoIndex] = useState(0);

  const [form, setForm] = useState({
    eventName: "",
    description: "",
    eventDate: "",
    eventTime: "",
    speakerName: "",
    photos: [],
  });

  useEffect(() => {
    let isMounted = true;
    async function loadGallery() {
      try {
        setLoading(true);
        const res = await galleryService.getGallery();
        const data = res?.data || res || [];
        if (isMounted && Array.isArray(data)) {
          const formatted = data.map((item) => ({
            galleryId: item._id || item.galleryId || item.id,
            _id: item._id,
            eventName: item.eventName || item.title,
            venue: item.venue || "",
            eventDate: item.date || item.eventDate,
            description: item.description || "",
            coverImage: item.banner || item.coverImage || (item.photos?.[0] || ""),
            photos: item.photos || [],
            speakerName: item.speakerName || "",
            totalPhotos: item.photos?.length || 0,
          }));
          setGalleries(formatted);
        }
      } catch (err) {
        console.warn("Failed to load gallery:", err.message);
        if (isMounted) setGalleries([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadGallery();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredGalleries = useMemo(() => {
    if (!search.trim()) return galleries;
    const q = search.toLowerCase();
    return galleries.filter(
      (item) =>
        item.eventName?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.speakerName?.toLowerCase().includes(q)
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
      description: selectedGallery.description || "",
      eventDate: selectedGallery.eventDate || "",
      eventTime: selectedGallery.eventTime || "",
      speakerName: selectedGallery.speakerName || "",
      photos: selectedGallery.photos || [],
    });
    setEditMode(true);
  }

  async function handleCreate() {
    if (!form.eventName.trim() || !form.description.trim() || !form.eventDate) {
      setToast("Please fill in event name, description, and date.");
      return;
    }

    try {
      const payload = {
        eventName: form.eventName.trim(),
        description: form.description.trim(),
        date: form.eventDate,
        speakerName: form.speakerName || "TCF Team",
        banner: form.photos[0] || "",
        photos: form.photos,
        tags: [form.eventName.split(" ")[0] || "Event"],
      };

      const res = await galleryService.createGallery(payload);
      const createdItem = res?.data || res;
      const formatted = {
        galleryId: createdItem._id || createdItem.id || `GAL${Date.now()}`,
        _id: createdItem._id || createdItem.id,
        eventName: createdItem.eventName || form.eventName,
        description: createdItem.description || form.description,
        eventDate: createdItem.date || form.eventDate,
        eventTime: form.eventTime || "14:00",
        speakerName: form.speakerName || "TCF Team",
        coverImage: form.photos[0] || "",
        photos: form.photos,
        videos: [],
        totalPhotos: form.photos.length,
      };

      setGalleries((current) => [formatted, ...current]);
      setShowCreate(false);
      setForm({
        eventName: "",
        description: "",
        eventDate: "",
        eventTime: "",
        speakerName: "",
        photos: [],
      });
      setToast("Event gallery created successfully.");
    } catch (err) {
      setToast(err.message || "Failed to create gallery in database.");
    }
  }

  async function handleUpdate() {
    if (!form.eventName.trim() || !form.description.trim()) {
      setToast("Event name and description cannot be empty.");
      return;
    }

    const galleryId = selectedGallery._id || selectedGallery.galleryId || selectedGallery.id;

    try {
      const payload = {
        eventName: form.eventName.trim(),
        description: form.description.trim(),
        date: form.eventDate,
        speakerName: form.speakerName,
        photos: form.photos,
        banner: form.photos[0] || selectedGallery.coverImage || "",
      };

      await galleryService.updateGallery(galleryId, payload);

      const updated = {
        ...selectedGallery,
        eventName: form.eventName,
        description: form.description,
        eventDate: form.eventDate,
        eventTime: form.eventTime,
        speakerName: form.speakerName,
        photos: form.photos,
        coverImage: form.photos[0] || selectedGallery.coverImage || "",
        totalPhotos: form.photos.length,
      };

      setGalleries((current) =>
        current.map((item) =>
          (item.galleryId === updated.galleryId || item._id === updated._id) ? updated : item
        )
      );

      setSelectedGallery(updated);
      setEditMode(false);
      setPhotoIndex(0);
      setToast("Gallery updated successfully.");
    } catch (err) {
      setToast(err.message || "Failed to update gallery in database.");
    }
  }

  async function handleDelete(galleryId) {
    try {
      await galleryService.deleteGallery(galleryId);
      setGalleries((current) =>
        current.filter((item) => item.galleryId !== galleryId && item._id !== galleryId)
      );
      setSelectedGallery(null);
      setToast("Gallery entry removed.");
    } catch (err) {
      setToast(err.message || "Failed to delete gallery from database.");
    }
  }

  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const uploadedUrls = [];
      for (const file of files) {
        const uploadData = new FormData();
        uploadData.append("file", file);
        const res = await apiClient.post("/gallery/upload", uploadData);
        const url = res.data?.url || res.data?.data?.url || res.url;
        if (url) {
          uploadedUrls.push(url);
        }
      }

      setForm((current) => ({
        ...current,
        photos: [...current.photos, ...uploadedUrls].slice(0, 6),
      }));
    } catch (err) {
      console.warn("Direct upload error:", err);
      setToast(err.message || "Failed to upload photo file.");
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
            setForm({
              eventName: "",
              description: "",
              eventDate: "",
              eventTime: "",
              speakerName: "",
              photos: [],
            });
            setShowCreate(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-[#24154f] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#36216f]"
        >
          <Plus size={17} />
          Create Event Gallery
        </button>
      </div>

      {/* Top Search Bar (No default selected, live query filtering) */}
      <div className="max-w-xl">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <Search size={18} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search gallery by event name, description, or speaker..."
            className="w-full text-sm outline-none"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
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
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
            >
              {/* Cover Photo */}
              <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-purple-900 to-indigo-950">
                {item.coverImage ? (
                  <img
                    src={getAssetUrl(item.coverImage)}
                    alt={item.eventName}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.style.display = "none";
                      if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}

                <div
                  className={`flex h-full w-full flex-col items-center justify-center p-4 text-center text-white ${
                    item.coverImage ? "hidden" : "flex"
                  }`}
                >
                  <ImagePlus size={36} className="text-purple-300 opacity-80" />
                  <p className="mt-2 text-xs font-medium text-purple-200">{item.eventName}</p>
                </div>

                <div className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                  {item.photos?.length || item.totalPhotos || 0} photos
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-semibold text-gray-800 line-clamp-1">{item.eventName}</h3>

                {/* 3-line truncated description */}
                <p className="mt-2 flex-1 text-sm text-gray-600 line-clamp-3 leading-relaxed">
                  {item.description}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-400">{item.eventDate || "Past Event"}</span>

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
          <h3 className="mt-4 font-semibold text-gray-700">No galleries found</h3>
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
                <h2 className="text-lg font-bold text-gray-800">{selectedGallery.eventName}</h2>
                <p className="text-xs text-gray-500">Event Gallery & Memory Highlights</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startEdit}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Pencil size={14} />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(selectedGallery.galleryId)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Delete
                </button>

                <button
                  type="button"
                  onClick={closeGallery}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
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
                    src={getAssetUrl(selectedGallery.photos[photoIndex])}
                    alt={selectedGallery.eventName}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImagePlus size={44} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No photos uploaded for this gallery.</p>
                  </div>
                )}

                {/* Left/Right Carousel Controls */}
                {selectedGallery.photos?.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoIndex((cur) =>
                          cur === 0 ? selectedGallery.photos.length - 1 : cur - 1
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPhotoIndex((cur) =>
                          cur === selectedGallery.photos.length - 1 ? 0 : cur + 1
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
                    >
                      <ChevronRight size={20} />
                    </button>

                    <div className="absolute bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
                      {photoIndex + 1} / {selectedGallery.photos.length} (Auto-scrolls every 60s)
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
                        photoIndex === idx ? "border-purple-600 scale-105" : "border-transparent opacity-60"
                      }`}
                    >
                      <img src={getAssetUrl(photo)} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Event Metadata */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3.5">
                  <Calendar size={18} className="text-purple-600 shrink-0" />
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium">Event Date</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {selectedGallery.eventDate || "Past Event"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3.5">
                  <Clock size={18} className="text-purple-600 shrink-0" />
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium">Time</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {selectedGallery.eventTime || "14:00 - 17:00"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3.5">
                  <User size={18} className="text-purple-600 shrink-0" />
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium">Speaker / Host</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {selectedGallery.speakerName || "TCF Team"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Description */}
              <div>
                <h3 className="font-semibold text-gray-800">Event Highlights & Summary</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {selectedGallery.description}
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

function GalleryFormModal({ title, form, setForm, onClose, onSave, onPhotoUpload }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="text-xs font-semibold text-gray-700">Event Name *</label>
            <input
              type="text"
              value={form.eventName}
              onChange={(e) => setForm({ ...form, eventName: e.target.value })}
              placeholder="e.g. Capture The Flag 2027"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Write event description and highlights..."
              className="mt-1 w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-gray-700">Event Date *</label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Event Time</label>
              <input
                type="time"
                value={form.eventTime}
                onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Speaker / Host Name</label>
            <input
              type="text"
              value={form.speakerName}
              onChange={(e) => setForm({ ...form, speakerName: e.target.value })}
              placeholder="e.g. Rahul Sharma"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-500"
            />
          </div>

          {/* Photos Upload */}
          <div>
            <label className="text-xs font-semibold text-gray-700">
              Photos ({form.photos.length}/6)
            </label>

            <label className="mt-2 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-6 hover:bg-gray-50">
              <div className="text-center">
                <ImagePlus size={28} className="mx-auto text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-700">Add event photos</p>
                <p className="mt-0.5 text-xs text-gray-400">Select up to 5-6 highlights</p>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onPhotoUpload}
                className="hidden"
              />
            </label>

            {form.photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {form.photos.map((photo, index) => (
                  <div key={index} className="group relative h-20 w-full overflow-hidden rounded-lg border">
                    <img src={getAssetUrl(photo)} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((cur) => ({
                          ...cur,
                          photos: cur.photos.filter((_, i) => i !== index),
                        }))
                      }
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-[#24154f] px-5 py-2 text-sm font-medium text-white hover:bg-[#36216f]"
          >
            Save Gallery
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventGallery;