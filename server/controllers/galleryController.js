import Gallery from "../models/Gallery.js";

/**
 * Gallery Controller
 * Handles Public/Student Event Memory Discovery, Volunteer/Admin Media Uploads,
 * Album Management, and Photo Additions.
 */

// =========================================================================
// 1. GET ALL GALLERY ALBUMS (Public)
// =========================================================================
export const getAllGalleryAlbums = async (req, res) => {
  try {
    const { search, tag, page = 1, limit = 20 } = req.query;

    const query = { isDeleted: false };

    if (tag && tag.trim()) {
      query.tags = tag.trim();
    }

    if (search && search.trim()) {
      const kw = search.trim();
      query.$or = [
        { eventName: new RegExp(kw, "i") },
        { venue: new RegExp(kw, "i") },
        { description: new RegExp(kw, "i") },
        { tags: new RegExp(kw, "i") },
      ];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const totalAlbums = await Gallery.countDocuments(query);
    const albums = await Gallery.find(query)
      .populate("createdBy", "fullName role")
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: albums.length,
      totalAlbums,
      totalPages: Math.ceil(totalAlbums / limitNum),
      currentPage: pageNum,
      albums: albums.map((a) => a.toObject({ virtuals: true })),
    });
  } catch (error) {
    console.error("❌ [Gallery Controller] getAllGalleryAlbums Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve gallery albums.",
    });
  }
};

// =========================================================================
// 2. GET GALLERY ALBUM BY ID (Public)
// =========================================================================
export const getGalleryAlbumById = async (req, res) => {
  try {
    const { id } = req.params;

    const album = await Gallery.findOne({ _id: id, isDeleted: false })
      .populate("createdBy", "fullName role email");

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Gallery album not found.",
      });
    }

    return res.status(200).json({
      success: true,
      album: album.toObject({ virtuals: true }),
    });
  } catch (error) {
    console.error("❌ [Gallery Controller] getGalleryAlbumById Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve album details.",
    });
  }
};

// =========================================================================
// 3. CREATE GALLERY ALBUM (Volunteer & Admin)
// =========================================================================
export const createGalleryAlbum = async (req, res) => {
  try {
    const {
      eventName,
      title,
      venue,
      date,
      eventDate,
      time,
      description,
      banner,
      coverImage,
      photos,
      videos,
      tags,
    } = req.body;

    const name = (eventName || title || "").trim();
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Event name is required for the gallery album.",
      });
    }

    const albumDate = date || eventDate ? new Date(date || eventDate) : null;
    const cover = (banner || coverImage || "").trim();
    const photoList = Array.isArray(photos) ? photos : [];
    const videoList = Array.isArray(videos) ? videos : [];
    const tagList = Array.isArray(tags)
      ? tags
      : typeof tags === "string"
      ? tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const newAlbum = await Gallery.create({
      eventName: name,
      venue: (venue || "").trim(),
      date: albumDate,
      time: (time || "").trim(),
      description: (description || "").trim(),
      banner: cover,
      photos: photoList,
      videos: videoList,
      tags: tagList,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: `Gallery album for '${newAlbum.eventName}' created successfully.`,
      album: newAlbum.toObject({ virtuals: true }),
    });
  } catch (error) {
    console.error("❌ [Gallery Controller] createGalleryAlbum Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create gallery album.",
    });
  }
};

// =========================================================================
// 4. UPDATE GALLERY ALBUM (Volunteer & Admin)
// =========================================================================
export const updateGalleryAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const album = await Gallery.findOne({ _id: id, isDeleted: false });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Gallery album not found.",
      });
    }

    const {
      eventName,
      title,
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

    if (eventName || title) album.eventName = (eventName || title).trim();
    if (venue !== undefined) album.venue = venue.trim();
    if (date !== undefined) album.date = date ? new Date(date) : null;
    if (time !== undefined) album.time = time.trim();
    if (description !== undefined) album.description = description.trim();
    if (banner !== undefined || coverImage !== undefined) {
      album.banner = (banner || coverImage || "").trim();
    }
    if (Array.isArray(photos)) album.photos = photos;
    if (Array.isArray(videos)) album.videos = videos;
    if (tags !== undefined) {
      album.tags = Array.isArray(tags)
        ? tags
        : typeof tags === "string"
        ? tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
    }

    album.updatedBy = req.user._id;
    await album.save();

    return res.status(200).json({
      success: true,
      message: "Gallery album updated successfully.",
      album: album.toObject({ virtuals: true }),
    });
  } catch (error) {
    console.error("❌ [Gallery Controller] updateGalleryAlbum Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update gallery album.",
    });
  }
};

// =========================================================================
// 5. ADD PHOTOS TO ALBUM (Volunteer & Admin)
// =========================================================================
export const addPhotosToAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const { photos } = req.body;

    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of photo URLs to add.",
      });
    }

    const album = await Gallery.findOne({ _id: id, isDeleted: false });
    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Gallery album not found.",
      });
    }

    // Append without duplicates
    const currentPhotos = new Set(album.photos);
    photos.forEach((url) => {
      if (typeof url === "string" && url.trim()) {
        currentPhotos.add(url.trim());
      }
    });

    album.photos = Array.from(currentPhotos);
    album.updatedBy = req.user._id;
    await album.save();

    return res.status(200).json({
      success: true,
      message: `Added ${photos.length} photo(s) to '${album.eventName}'. Total photos: ${album.photos.length}.`,
      album: album.toObject({ virtuals: true }),
    });
  } catch (error) {
    console.error("❌ [Gallery Controller] addPhotosToAlbum Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add photos to album.",
    });
  }
};

// =========================================================================
// 6. DELETE GALLERY ALBUM (Soft-Delete - Admin Only)
// =========================================================================
export const deleteGalleryAlbum = async (req, res) => {
  try {
    const { id } = req.params;

    const album = await Gallery.findOne({ _id: id, isDeleted: false });
    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Gallery album not found or already deleted.",
      });
    }

    album.isDeleted = true;
    album.deletedAt = new Date();
    album.deletedBy = req.user._id;
    await album.save();

    return res.status(200).json({
      success: true,
      message: `Gallery album for '${album.eventName}' deleted successfully.`,
    });
  } catch (error) {
    console.error("❌ [Gallery Controller] deleteGalleryAlbum Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete gallery album.",
    });
  }
};

export default {
  getAllGalleryAlbums,
  getGalleryAlbumById,
  createGalleryAlbum,
  updateGalleryAlbum,
  addPhotosToAlbum,
  deleteGalleryAlbum,
};
