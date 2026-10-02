import LearningResource from "../models/LearningResource.js";

/**
 * Learning Controller
 * Handles Public/Student Discovery of Cyber Learning Resources,
 * Categorization, Search, and Volunteer/Admin Resource Publishing.
 */

// =========================================================================
// 1. GET ALL LEARNING RESOURCES (Public & Students)
// =========================================================================
export const getAllLearningResources = async (req, res) => {
  try {
    const { category, search, tag, contentType, isFeatured, page = 1, limit = 12 } = req.query;

    const query = { isDeleted: false };

    if (category && category.trim()) {
      query.category = category.trim().toLowerCase();
    }

    if (contentType && contentType.trim()) {
      query.contentType = contentType.trim().toLowerCase();
    }

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === "true" || isFeatured === true;
    }

    if (tag && tag.trim()) {
      query.tags = tag.trim();
    }

    if (search && search.trim()) {
      const kw = search.trim();
      query.$or = [
        { title: new RegExp(kw, "i") },
        { description: new RegExp(kw, "i") },
        { author: new RegExp(kw, "i") },
        { tags: new RegExp(kw, "i") },
        { content: new RegExp(kw, "i") },
      ];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const skip = (pageNum - 1) * limitNum;

    const totalResources = await LearningResource.countDocuments(query);
    const resources = await LearningResource.find(query)
      .populate("authorId", "fullName role")
      .sort({ isFeatured: -1, publishedDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: resources.length,
      totalResources,
      totalPages: Math.ceil(totalResources / limitNum),
      currentPage: pageNum,
      resources: resources.map((r) => r.toObject({ virtuals: true })),
    });
  } catch (error) {
    console.error("❌ [Learning Controller] getAllLearningResources Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve learning resources.",
    });
  }
};

// =========================================================================
// 2. GET FEATURED LEARNING RESOURCES (Public & Students)
// =========================================================================
export const getFeaturedLearningResources = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const featured = await LearningResource.find({
      isDeleted: false,
      isFeatured: true,
    })
      .populate("authorId", "fullName role")
      .sort({ publishedDate: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: featured.length,
      resources: featured.map((r) => r.toObject({ virtuals: true })),
    });
  } catch (error) {
    console.error("❌ [Learning Controller] getFeaturedLearningResources Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve featured resources.",
    });
  }
};

// =========================================================================
// 3. GET LEARNING CATEGORIES & METRICS (Public & Students)
// =========================================================================
export const getLearningCategories = async (req, res) => {
  try {
    const allowedCategories = ["news", "research paper", "case study", "tool", "awareness", "article"];

    const counts = await LearningResource.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id] = c.count;
    });

    const categoryStats = allowedCategories.map((cat) => ({
      category: cat,
      count: countMap[cat] || 0,
    }));

    return res.status(200).json({
      success: true,
      categories: categoryStats,
    });
  } catch (error) {
    console.error("❌ [Learning Controller] getLearningCategories Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve categories.",
    });
  }
};

// =========================================================================
// 4. GET LEARNING RESOURCE BY ID (Public & Students)
// =========================================================================
export const getLearningResourceById = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await LearningResource.findOne({ _id: id, isDeleted: false })
      .populate("authorId", "fullName role email");

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Learning resource not found.",
      });
    }

    return res.status(200).json({
      success: true,
      resource: resource.toObject({ virtuals: true }),
    });
  } catch (error) {
    console.error("❌ [Learning Controller] getLearningResourceById Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve learning resource.",
    });
  }
};

// =========================================================================
// 5. CREATE LEARNING RESOURCE (Volunteer & Admin)
// =========================================================================
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
        message: "Title is required for the learning resource.",
      });
    }

    const validCategories = ["news", "research paper", "case study", "tool", "awareness", "article"];
    const validCategory = category && validCategories.includes(category.toLowerCase())
      ? category.toLowerCase()
      : "article";

    const validContentTypes = ["article", "pdf", "external-link", "video", "image"];
    const validContentType = contentType && validContentTypes.includes(contentType.toLowerCase())
      ? contentType.toLowerCase()
      : "article";

    const tagList = Array.isArray(tags)
      ? tags
      : typeof tags === "string"
      ? tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const newResource = await LearningResource.create({
      title: title.trim(),
      description: (description || "").trim(),
      category: validCategory,
      contentType: validContentType,
      content: (content || "").trim(),
      pdfUrl: (pdfUrl || "").trim(),
      externalUrl: (externalUrl || "").trim(),
      imageUrl: (imageUrl || "").trim(),
      videoUrl: (videoUrl || "").trim(),
      thumbnail: (thumbnail || imageUrl || "").trim(),
      readTime: (readTime || "5 min read").trim(),
      tags: tagList,
      isFeatured: isFeatured === true || isFeatured === "true",
      author: (author || req.user.fullName || "TCF Editorial Team").trim(),
      resourceLink: (resourceLink || externalUrl || "#").trim(),
      authorId: req.user._id,
      publishedDate: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: `Learning resource '${newResource.title}' created successfully.`,
      resource: newResource.toObject({ virtuals: true }),
    });
  } catch (error) {
    console.error("❌ [Learning Controller] createLearningResource Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create learning resource.",
    });
  }
};

// =========================================================================
// 6. UPDATE LEARNING RESOURCE (Volunteer & Admin)
// =========================================================================
export const updateLearningResource = async (req, res) => {
  try {
    const { id } = req.params;

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

    if (title !== undefined) resource.title = title.trim();
    if (description !== undefined) resource.description = description.trim();
    if (category !== undefined) {
      const validCategories = ["news", "research paper", "case study", "tool", "awareness", "article"];
      if (validCategories.includes(category.toLowerCase())) {
        resource.category = category.toLowerCase();
      }
    }
    if (contentType !== undefined) {
      const validContentTypes = ["article", "pdf", "external-link", "video", "image"];
      if (validContentTypes.includes(contentType.toLowerCase())) {
        resource.contentType = contentType.toLowerCase();
      }
    }
    if (content !== undefined) resource.content = content.trim();
    if (pdfUrl !== undefined) resource.pdfUrl = pdfUrl.trim();
    if (externalUrl !== undefined) resource.externalUrl = externalUrl.trim();
    if (imageUrl !== undefined) resource.imageUrl = imageUrl.trim();
    if (videoUrl !== undefined) resource.videoUrl = videoUrl.trim();
    if (thumbnail !== undefined) resource.thumbnail = thumbnail.trim();
    if (readTime !== undefined) resource.readTime = readTime.trim();
    if (resourceLink !== undefined) resource.resourceLink = resourceLink.trim();
    if (author !== undefined) resource.author = author.trim();
    if (isFeatured !== undefined) {
      resource.isFeatured = isFeatured === true || isFeatured === "true";
    }
    if (tags !== undefined) {
      resource.tags = Array.isArray(tags)
        ? tags
        : typeof tags === "string"
        ? tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
    }

    await resource.save();

    return res.status(200).json({
      success: true,
      message: "Learning resource updated successfully.",
      resource: resource.toObject({ virtuals: true }),
    });
  } catch (error) {
    console.error("❌ [Learning Controller] updateLearningResource Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update learning resource.",
    });
  }
};

// =========================================================================
// 7. DELETE LEARNING RESOURCE (Soft Delete - Admin Only)
// =========================================================================
export const deleteLearningResource = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await LearningResource.findOne({ _id: id, isDeleted: false });
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Learning resource not found or already deleted.",
      });
    }

    resource.isDeleted = true;
    resource.deletedAt = new Date();
    resource.deletedBy = req.user._id;
    await resource.save();

    return res.status(200).json({
      success: true,
      message: `Learning resource '${resource.title}' deleted successfully.`,
    });
  } catch (error) {
    console.error("❌ [Learning Controller] deleteLearningResource Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete learning resource.",
    });
  }
};

export default {
  getAllLearningResources,
  getFeaturedLearningResources,
  getLearningCategories,
  getLearningResourceById,
  createLearningResource,
  updateLearningResource,
  deleteLearningResource,
};
