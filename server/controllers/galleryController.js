import mongoose from "mongoose";
import Gallery from "../models/Gallery.js";
import Event from "../models/Event.js";

/**
 * Get All Gallery Items
 * GET /api/gallery
 * Access: Protected | Allowed: student, volunteer, admin
 */
export const getGalleryItems = async (req, res) => {
  try {
    const { search, tag, eventId } = req.query;

    const query = { isDeleted: false };

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      query.eventId = eventId;
    }

    if (tag && tag !== "All") {
      query.tags = { $in: [tag] };
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { eventName: regex },
        { description: regex },
        { venue: regex },
        { tags: { $in: [regex] } },
      ];
    }

    const items = await Gallery.find(query)
      .populate("createdBy", "name fullName role")
      .populate("eventId", "name date venue category status poster")
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch gallery entries.",
    });
  }
};

/**
 * Get Specific Gallery Item by ID
 * GET /api/gallery/:id
 * Access: Protected | Allowed: student, volunteer, admin
 */
export const getGalleryItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid gallery ID is required.",
      });
    }

    const item = await Gallery.findOne({ _id: id, isDeleted: false })
      .populate("createdBy", "name fullName role")
      .populate("eventId", "name date venue category status poster");

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch gallery entry.",
    });
  }
};

/**
 * Create Gallery Item
 * POST /api/gallery
 * Access: Protected | Allowed: volunteer, admin
 */
export const createGalleryItem = async (req, res) => {
  try {
    const {
      eventName,
      eventId,
      venue,
      date,
      time,
      description,
      banner,
      coverImage,
      photos,
      videos,
      tags,
    } = req.body;

    if (!eventName || !eventName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Event name is required for gallery entry.",
      });
    }

    let linkedEventId = null;
    if (eventId) {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid event ID provided.",
        });
      }
      const existingEvent = await Event.findOne({ _id: eventId, isDeleted: false });
      if (!existingEvent) {
        return res.status(404).json({
          success: false,
          message: "Referenced event does not exist or has been deleted.",
        });
      }
      linkedEventId = existingEvent._id;
    }

    const normalizedPhotos = Array.isArray(photos) ? photos : [];
    const normalizedVideos = Array.isArray(videos) ? videos : [];
    const normalizedTags = Array.isArray(tags)
      ? tags
      : typeof tags === "string"
      ? tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const newGallery = await Gallery.create({
      eventName: eventName.trim(),
      eventId: linkedEventId,
      venue: venue || "",
      date: date ? new Date(date) : null,
      time: time || "",
      description: description || "",
      banner: banner || coverImage || (normalizedPhotos.length > 0 ? normalizedPhotos[0] : ""),
      photos: normalizedPhotos,
      videos: normalizedVideos,
      tags: normalizedTags,
      createdBy: req.user._id,
    });

    const populated = await Gallery.findById(newGallery._id)
      .populate("createdBy", "name fullName role")
      .populate("eventId", "name date venue category status poster");

    return res.status(201).json({
      success: true,
      message: "Gallery entry created successfully.",
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create gallery item.",
    });
  }
};

/**
 * Update Gallery Item
 * PUT /api/gallery/:id
 * Access: Protected | Allowed: volunteer, admin
 */
export const updateGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid gallery ID is required.",
      });
    }

    const gallery = await Gallery.findOne({ _id: id, isDeleted: false });
    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found.",
      });
    }

    const {
      eventName,
      eventId,
      venue,
      date,
      time,
      description,
      banner,
      coverImage,
      photos,
      videos,
      tags,
    } = req.body;

    if (eventName !== undefined) {
      if (!eventName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Event name cannot be empty.",
        });
      }
      gallery.eventName = eventName.trim();
    }

    if (eventId !== undefined) {
      if (eventId === null || eventId === "") {
        gallery.eventId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid event ID provided.",
          });
        }
        const eventExists = await Event.findOne({ _id: eventId, isDeleted: false });
        if (!eventExists) {
          return res.status(404).json({
            success: false,
            message: "Referenced event does not exist or has been deleted.",
          });
        }
        gallery.eventId = eventExists._id;
      }
    }

    if (venue !== undefined) gallery.venue = venue;
    if (date !== undefined) gallery.date = date ? new Date(date) : null;
    if (time !== undefined) gallery.time = time;
    if (description !== undefined) gallery.description = description;
    if (banner !== undefined || coverImage !== undefined) {
      gallery.banner = banner || coverImage || "";
    }
    if (photos !== undefined) {
      gallery.photos = Array.isArray(photos) ? photos : [];
    }
    if (videos !== undefined) {
      gallery.videos = Array.isArray(videos) ? videos : [];
    }
    if (tags !== undefined) {
      gallery.tags = Array.isArray(tags)
        ? tags
        : typeof tags === "string"
        ? tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
    }

    gallery.updatedBy = req.user._id;
    await gallery.save();

    const updated = await Gallery.findById(gallery._id)
      .populate("createdBy", "name fullName role")
      .populate("eventId", "name date venue category status poster");

    return res.status(200).json({
      success: true,
      message: "Gallery entry updated successfully.",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update gallery item.",
    });
  }
};

/**
 * Soft Delete Gallery Item
 * DELETE /api/gallery/:id
 * Access: Protected | Allowed: volunteer, admin
 */
export const deleteGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid gallery ID is required.",
      });
    }

    const gallery = await Gallery.findOne({ _id: id, isDeleted: false });
    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found.",
      });
    }

    gallery.isDeleted = true;
    gallery.deletedAt = new Date();
    gallery.deletedBy = req.user._id;
    await gallery.save();

    return res.status(200).json({
      success: true,
      message: "Gallery item deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete gallery item.",
    });
  }
};

export default {
  getGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
};
