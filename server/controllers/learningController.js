import mongoose from "mongoose";
import LearningResource from "../models/LearningResource.js";

const ALLOWED_CATEGORIES = [
  "news",
  "research paper",
  "case study",
  "tool",
  "awareness",
  "article",
];

const ALLOWED_CONTENT_TYPES = [
  "article",
  "pdf",
  "external-link",
  "video",
  "image",
];

/**
 * Get All Learning Resources
 * GET /api/learning
 * Access: Protected | Allowed: student, volunteer, admin
 */
export const getLearningResources = async (req, res) => {
  try {
    const { category, contentType, search, tag, isFeatured } = req.query;

    const query = { isDeleted: false };

    if (category && category !== "All") {
      query.category = category.toLowerCase();
    }

    if (contentType && contentType !== "All") {
      query.contentType = contentType.toLowerCase();
    }

    if (tag && tag !== "All") {
      query.tags = { $in: [tag] };
    }

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === "true" || isFeatured === true;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: regex },
        { description: regex },
        { content: regex },
        { author: regex },
        { tags: { $in: [regex] } },
      ];
    }

    const resources = await LearningResource.find(query)
      .populate("authorId", "name fullName role")
      .sort({ isFeatured: -1, publishedDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch learning resources.",
    });
  }
};

/**
 * Get Specific Learning Resource by ID
 * GET /api/learning/:id
 * Access: Protected | Allowed: student, volunteer, admin
 */
export const getLearningResourceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid learning resource ID is required.",
      });
    }

    const resource = await LearningResource.findOne({ _id: id, isDeleted: false })
      .populate("authorId", "name fullName role");

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Learning resource not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch learning resource.",
    });
  }
};

/**
 * Create Learning Resource
 * POST /api/learning
 * Access: Protected | Allowed: volunteer, admin
 */
export const createLearningResource = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      contentType,
      content,
      pdfUrl,
      externalUrl,
      imageUrl,
      videoUrl,
      thumbnail,
      readTime,
      tags,
      isFeatured,
      author,
      resourceLink,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required for learning resource.",
      });
    }

    const normalizedCategory = (category || "article").toLowerCase().trim();
    if (!ALLOWED_CATEGORIES.includes(normalizedCategory)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(", ")}`,
      });
    }

    const normalizedContentType = (contentType || "article").toLowerCase().trim();
    if (!ALLOWED_CONTENT_TYPES.includes(normalizedContentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid content type. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
      });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags
      : typeof tags === "string"
      ? tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const newResource = await LearningResource.create({
      title: title.trim(),
      description: description || "",
      category: normalizedCategory,
      contentType: normalizedContentType,
      content: content || "",
      pdfUrl: pdfUrl || "",
      externalUrl: externalUrl || "",
      imageUrl: imageUrl || "",
      videoUrl: videoUrl || "",
      thumbnail: thumbnail || imageUrl || "",
      readTime: readTime || "5 min read",
      tags: normalizedTags,
      isFeatured: Boolean(isFeatured),
      author: author || req.user.name || "TCF Team",
      resourceLink: resourceLink || externalUrl || "#",
      authorId: req.user._id,
      publishedDate: new Date(),
    });

    const populated = await LearningResource.findById(newResource._id)
      .populate("authorId", "name fullName role");

    return res.status(201).json({
      success: true,
      message: "Learning resource created successfully.",
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create learning resource.",
    });
  }
};

/**
 * Update Learning Resource
 * PUT /api/learning/:id
 * Access: Protected | Allowed: volunteer, admin
 */
export const updateLearningResource = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid learning resource ID is required.",
      });
    }

    const resource = await LearningResource.findOne({ _id: id, isDeleted: false });
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Learning resource not found.",
      });
    }

    const {
      title,
      description,
      category,
      contentType,
      content,
      pdfUrl,
      externalUrl,
      imageUrl,
      videoUrl,
      thumbnail,
      readTime,
      tags,
      isFeatured,
      author,
      resourceLink,
    } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty.",
        });
      }
      resource.title = title.trim();
    }

    if (category !== undefined) {
      const normalizedCategory = category.toLowerCase().trim();
      if (!ALLOWED_CATEGORIES.includes(normalizedCategory)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(", ")}`,
        });
      }
      resource.category = normalizedCategory;
    }

    if (contentType !== undefined) {
      const normalizedContentType = contentType.toLowerCase().trim();
      if (!ALLOWED_CONTENT_TYPES.includes(normalizedContentType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid content type. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
        });
      }
      resource.contentType = normalizedContentType;
    }

    if (description !== undefined) resource.description = description;
    if (content !== undefined) resource.content = content;
    if (pdfUrl !== undefined) resource.pdfUrl = pdfUrl;
    if (externalUrl !== undefined) resource.externalUrl = externalUrl;
    if (imageUrl !== undefined) resource.imageUrl = imageUrl;
    if (videoUrl !== undefined) resource.videoUrl = videoUrl;
    if (thumbnail !== undefined) resource.thumbnail = thumbnail;
    if (readTime !== undefined) resource.readTime = readTime;
    if (tags !== undefined) {
      resource.tags = Array.isArray(tags)
        ? tags
        : typeof tags === "string"
        ? tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
    }
    if (isFeatured !== undefined) resource.isFeatured = Boolean(isFeatured);
    if (author !== undefined) resource.author = author;
    if (resourceLink !== undefined) resource.resourceLink = resourceLink;

    resource.updatedBy = req.user._id;
    await resource.save();

    const updated = await LearningResource.findById(resource._id)
      .populate("authorId", "name fullName role");

    return res.status(200).json({
      success: true,
      message: "Learning resource updated successfully.",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update learning resource.",
    });
  }
};

/**
 * Soft Delete Learning Resource
 * DELETE /api/learning/:id
 * Access: Protected | Allowed: volunteer, admin
 */
export const deleteLearningResource = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid learning resource ID is required.",
      });
    }

    const resource = await LearningResource.findOne({ _id: id, isDeleted: false });
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Learning resource not found.",
      });
    }

    resource.isDeleted = true;
    resource.deletedAt = new Date();
    resource.deletedBy = req.user._id;
    await resource.save();

    return res.status(200).json({
      success: true,
      message: "Learning resource deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete learning resource.",
    });
  }
};

export default {
  getLearningResources,
  getLearningResourceById,
  createLearningResource,
  updateLearningResource,
  deleteLearningResource,
};
