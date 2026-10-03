import mongoose from "mongoose";
import Event from "../models/Event.js";

/**
 * Helper to parse time string ("10:00 AM", "14:00", "02:00 PM") to total minutes from midnight
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([aApP][mM]))?$/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Format and sanitize event response for client consumption
 */
function formatEvent(doc) {
  if (!doc) return null;
  const event = doc.toObject ? doc.toObject({ virtuals: true }) : doc;

  // Ensure frontend-friendly aliases and string representations
  const eventDateStr = event.date ? new Date(event.date).toISOString().split("T")[0] : "";
  const eventEndDateStr = event.endDate ? new Date(event.endDate).toISOString().split("T")[0] : eventDateStr;

  return {
    ...event,
    _id: event._id,
    id: event._id.toString(),
    eventDate: eventDateStr,
    eventEndDate: eventEndDateStr,
    speakerName: event.speaker || "",
    participantLimit: event.participantsLimit || 100,
    registrationOpen: event.registration?.openAt ? new Date(event.registration.openAt).toISOString() : "",
    registrationClose: event.registration?.closeAt ? new Date(event.registration.closeAt).toISOString() : "",
    attendanceOpen: event.attendance?.openAt ? new Date(event.attendance.openAt).toISOString() : "",
    attendanceClose: event.attendance?.closeAt ? new Date(event.attendance.closeAt).toISOString() : "",
    eligibleYears: event.eligibility?.years || [],
    eligibleDepartments: event.eligibility?.branchCodes || [],
    rulebook: event.rulebooks?.[0]?.url || "",
    registrationStatus: event.status === "draft" ? "closed" : event.status === "cancelled" ? "cancelled" : "open",
  };
}

/**
 * Get all events with filtering and search
 * GET /api/events
 * Access: Authenticated (Student, Volunteer, Admin)
 */
export const getEvents = async (req, res) => {
  try {
    const { status, category, search, tab } = req.query;
    const userRole = req.user?.role || "student";

    const query = { isDeleted: false };

    // Role-based visibility: regular students can only see published/active events
    if (userRole === "student") {
      query.status = { $ne: "draft" };
    } else if (status) {
      query.status = status;
    }

    // Tab-based filtering for frontend consistency
    if (tab) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (tab === "drafts") {
        if (userRole === "student") {
          return res.status(200).json({ success: true, count: 0, data: [] });
        }
        query.status = "draft";
      } else if (tab === "ongoing") {
        query.status = "ongoing";
      } else if (tab === "past" || tab === "completed") {
        query.$or = [{ status: "completed" }, { status: "past" }, { date: { $lt: now } }];
      } else if (tab === "upcoming") {
        query.status = { $in: ["published", "upcoming", "registration_open", "registration_closed"] };
        query.date = { $gte: now };
      }
    }

    // Category filter
    if (category && category !== "All" && category !== "all") {
      query.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    // Search query by name, venue, speaker, or description
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { name: searchRegex },
        { venue: searchRegex },
        { speaker: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    const events = await Event.find(query)
      .sort({ date: 1, startTime: 1 })
      .populate("createdBy", "fullName email role")
      .populate("updatedBy", "fullName email role");

    const formattedEvents = events.map(formatEvent);

    return res.status(200).json({
      success: true,
      count: formattedEvents.length,
      data: formattedEvents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch events.",
    });
  }
};

/**
 * Get single event by ID
 * GET /api/events/:id
 * Access: Authenticated (Student, Volunteer, Admin)
 */
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    let event = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      event = await Event.findOne({ _id: id, isDeleted: false })
        .populate("createdBy", "fullName email role")
        .populate("updatedBy", "fullName email role");
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    // Enforce student cannot view draft events
    if (req.user?.role === "student" && event.status === "draft") {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: formatEvent(event),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch event.",
    });
  }
};

/**
 * Create a new Event
 * POST /api/events
 * Access: Protected | Allowed Roles: admin, volunteer
 */
export const createEvent = async (req, res) => {
  try {
    const {
      name,
      speaker,
      speakerName,
      date,
      eventDate,
      endDate,
      eventEndDate,
      startTime,
      endTime,
      venue,
      description,
      poster,
      category,
      registrationOpen,
      registrationClose,
      attendanceOpen,
      attendanceClose,
      participantLimit,
      participantsLimit,
      eligibleYears,
      eligibleDepartments,
      rulebook,
      rulebooks,
      status = "published",
    } = req.body;

    // 1. Mandatory field validations
    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Event name is required (minimum 3 characters).",
      });
    }

    const resolvedDate = date || eventDate;
    if (!resolvedDate) {
      return res.status(400).json({
        success: false,
        message: "Event start date is required.",
      });
    }

    const startDateObj = new Date(resolvedDate);
    if (isNaN(startDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid event start date format.",
      });
    }

    const resolvedEndDate = endDate || eventEndDate || resolvedDate;
    const endDateObj = new Date(resolvedEndDate);
    if (isNaN(endDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid event end date format.",
      });
    }

    if (endDateObj < startDateObj) {
      return res.status(400).json({
        success: false,
        message: "Event end date cannot be earlier than start date.",
      });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Both start time and end time are required.",
      });
    }

    // For same-day events, check time ordering
    const isSameDay = startDateObj.toISOString().split("T")[0] === endDateObj.toISOString().split("T")[0];
    if (isSameDay) {
      const startMinutes = parseTimeToMinutes(startTime);
      const endMinutes = parseTimeToMinutes(endTime);
      if (startMinutes !== null && endMinutes !== null && endMinutes <= startMinutes) {
        return res.status(400).json({
          success: false,
          message: "Event end time must be after start time for same-day events.",
        });
      }
    }

    if (!venue || !venue.trim()) {
      return res.status(400).json({
        success: false,
        message: "Event venue is required.",
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Event description is required.",
      });
    }

    const limit = Number(participantsLimit || participantLimit);
    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Participants limit must be a positive number (minimum 1).",
      });
    }

    // 2. Registration window validation
    let regOpenDate = registrationOpen ? new Date(registrationOpen) : new Date();
    let regCloseDate = registrationClose ? new Date(registrationClose) : new Date(startDateObj);

    if (regCloseDate < regOpenDate) {
      return res.status(400).json({
        success: false,
        message: "Registration closing time cannot be earlier than opening time.",
      });
    }

    // 3. Attendance window validation (if provided)
    let attOpenDate = attendanceOpen ? new Date(attendanceOpen) : null;
    let attCloseDate = attendanceClose ? new Date(attendanceClose) : null;

    if (attOpenDate && attCloseDate && attCloseDate < attOpenDate) {
      return res.status(400).json({
        success: false,
        message: "Attendance closing time cannot be earlier than opening time.",
      });
    }

    // 4. Rulebooks normalization
    let parsedRulebooks = [];
    if (Array.isArray(rulebooks) && rulebooks.length > 0) {
      parsedRulebooks = rulebooks;
    } else if (rulebook && typeof rulebook === "string" && rulebook.trim()) {
      parsedRulebooks = [{ name: "Event Rulebook", url: rulebook.trim(), type: "pdf" }];
    }

    // 5. Construct Event Document
    const newEvent = await Event.create({
      name: name.trim(),
      speaker: (speaker || speakerName || "").trim(),
      date: startDateObj,
      endDate: isSameDay ? null : endDateObj,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      venue: venue.trim(),
      description: description.trim(),
      poster: poster || "",
      category: category || "Workshop",
      registration: {
        openAt: regOpenDate,
        closeAt: regCloseDate,
      },
      attendance: {
        openAt: attOpenDate,
        closeAt: attCloseDate,
      },
      participantsLimit: limit,
      eligibility: {
        enabled: (eligibleYears?.length > 0 || eligibleDepartments?.length > 0),
        years: Array.isArray(eligibleYears) ? eligibleYears.map(Number) : [],
        branchCodes: Array.isArray(eligibleDepartments) ? eligibleDepartments : [],
      },
      rulebooks: parsedRulebooks,
      status: ["draft", "published", "upcoming", "ongoing", "completed", "cancelled"].includes(status)
        ? status === "upcoming" ? "published" : status
        : "published",
      createdBy: req.user._id,
      registeredCount: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully.",
      data: formatEvent(newEvent),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create event.",
    });
  }
};

/**
 * Update an existing Event
 * PUT /api/events/:id
 * Access: Protected | Allowed Roles: admin, volunteer
 */
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Invalid event ID format.",
      });
    }

    const event = await Event.findOne({ _id: id, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const {
      name,
      speaker,
      speakerName,
      date,
      eventDate,
      endDate,
      eventEndDate,
      startTime,
      endTime,
      venue,
      description,
      poster,
      category,
      registrationOpen,
      registrationClose,
      attendanceOpen,
      attendanceClose,
      participantLimit,
      participantsLimit,
      eligibleYears,
      eligibleDepartments,
      rulebook,
      rulebooks,
      status,
      cancellationReason,
    } = req.body;

    if (name !== undefined) {
      if (name.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: "Event name must be at least 3 characters.",
        });
      }
      event.name = name.trim();
    }

    if (speaker !== undefined || speakerName !== undefined) {
      event.speaker = (speaker || speakerName || "").trim();
    }

    const resolvedDate = date || eventDate;
    if (resolvedDate) {
      const d = new Date(resolvedDate);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid start date format." });
      }
      event.date = d;
    }

    const resolvedEndDate = endDate || eventEndDate;
    if (resolvedEndDate) {
      const ed = new Date(resolvedEndDate);
      if (isNaN(ed.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid end date format." });
      }
      if (ed < event.date) {
        return res.status(400).json({ success: false, message: "End date cannot be earlier than start date." });
      }
      event.endDate = ed;
    }

    if (startTime !== undefined) event.startTime = startTime.trim();
    if (endTime !== undefined) event.endTime = endTime.trim();
    if (venue !== undefined) event.venue = venue.trim();
    if (description !== undefined) event.description = description.trim();
    if (poster !== undefined) event.poster = poster;
    if (category !== undefined) event.category = category;

    if (participantsLimit !== undefined || participantLimit !== undefined) {
      const limit = Number(participantsLimit || participantLimit);
      if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({
          success: false,
          message: "Participants limit must be a positive number.",
        });
      }
      event.participantsLimit = limit;
    }

    if (registrationOpen !== undefined || registrationClose !== undefined) {
      if (!event.registration) event.registration = {};
      if (registrationOpen) event.registration.openAt = new Date(registrationOpen);
      if (registrationClose) event.registration.closeAt = new Date(registrationClose);

      if (event.registration.openAt && event.registration.closeAt && event.registration.closeAt < event.registration.openAt) {
        return res.status(400).json({
          success: false,
          message: "Registration close time cannot be earlier than open time.",
        });
      }
    }

    if (attendanceOpen !== undefined || attendanceClose !== undefined) {
      if (!event.attendance) event.attendance = {};
      if (attendanceOpen) event.attendance.openAt = new Date(attendanceOpen);
      if (attendanceClose) event.attendance.closeAt = new Date(attendanceClose);

      if (event.attendance.openAt && event.attendance.closeAt && event.attendance.closeAt < event.attendance.openAt) {
        return res.status(400).json({
          success: false,
          message: "Attendance close time cannot be earlier than open time.",
        });
      }
    }

    if (eligibleYears !== undefined || eligibleDepartments !== undefined) {
      if (!event.eligibility) event.eligibility = {};
      if (eligibleYears !== undefined) event.eligibility.years = eligibleYears.map(Number);
      if (eligibleDepartments !== undefined) event.eligibility.branchCodes = eligibleDepartments;
      event.eligibility.enabled = (event.eligibility.years.length > 0 || event.eligibility.branchCodes.length > 0);
    }

    if (rulebooks !== undefined) {
      event.rulebooks = rulebooks;
    } else if (rulebook !== undefined) {
      event.rulebooks = rulebook ? [{ name: "Event Rulebook", url: rulebook, type: "pdf" }] : [];
    }

    if (status !== undefined) {
      const validStatuses = ["draft", "published", "upcoming", "ongoing", "completed", "cancelled"];
      if (validStatuses.includes(status)) {
        event.status = status === "upcoming" ? "published" : status;
      }
    }

    if (cancellationReason !== undefined) {
      event.cancellationReason = cancellationReason;
    }

    event.updatedBy = req.user._id;
    await event.save();

    return res.status(200).json({
      success: true,
      message: "Event updated successfully.",
      data: formatEvent(event),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update event.",
    });
  }
};

/**
 * Soft Delete Event
 * DELETE /api/events/:id
 * Access: Protected | Allowed Roles: admin, volunteer
 */
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Invalid event ID format.",
      });
    }

    const event = await Event.findOne({ _id: id, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found or already deleted.",
      });
    }

    event.isDeleted = true;
    event.deletedAt = new Date();
    event.deletedBy = req.user._id;
    await event.save();

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully.",
      data: { id: event._id },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete event.",
    });
  }
};

/**
 * Update Event Status (Publish, Ongoing, Complete, Cancel)
 * PATCH /api/events/:id/status
 * Access: Protected | Allowed Roles: admin, volunteer
 */
export const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason } = req.body;

    const validStatuses = ["draft", "published", "upcoming", "ongoing", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const event = await Event.findOne({ _id: id, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    event.status = status === "upcoming" ? "published" : status;
    if (status === "cancelled" && cancellationReason) {
      event.cancellationReason = cancellationReason;
    }
    event.updatedBy = req.user._id;
    await event.save();

    return res.status(200).json({
      success: true,
      message: `Event status updated to ${event.status}.`,
      data: formatEvent(event),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update event status.",
    });
  }
};
