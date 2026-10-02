import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import Branch from "../models/Branch.js";

/**
 * Event Controller
 * Handles creation, management, discovery (upcoming, ongoing, past), details, and status updates for events.
 */

// =========================================================================
// 1. CREATE EVENT (Admin & Volunteers)
// =========================================================================
export const createEvent = async (req, res) => {
  try {
    const {
      name,
      title,
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
      participantsLimit,
      participantLimit,
      registration,
      registrationOpen,
      registrationClose,
      attendance,
      attendanceOpen,
      attendanceClose,
      eligibility,
      eligibleDepartments,
      eligibleYears,
      rulebooks,
      rulebook,
      certificateAvailable,
      feedbackRequired,
    } = req.body;

    const eventTitle = (name || title || "").trim();
    const eventSpeaker = (speaker || speakerName || "").trim();
    const startDate = date || eventDate;
    const finalEndDate = endDate || eventEndDate || null;
    const sTime = (startTime || "").trim();
    const eTime = (endTime || "").trim();
    const eventVenue = (venue || "").trim();
    const eventDesc = (description || "").trim();
    const limit = Number(participantsLimit || participantLimit);

    // Validations
    if (!eventTitle) {
      return res.status(400).json({
        success: false,
        message: "Event name/title is required.",
      });
    }

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: "Event start date is required.",
      });
    }

    if (!sTime || !eTime) {
      return res.status(400).json({
        success: false,
        message: "Start time and end time are required (e.g. 10:00 AM, 04:00 PM).",
      });
    }

    if (!eventVenue) {
      return res.status(400).json({
        success: false,
        message: "Event venue is required.",
      });
    }

    if (!eventDesc) {
      return res.status(400).json({
        success: false,
        message: "Event description is required.",
      });
    }

    if (!limit || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Participants limit must be at least 1.",
      });
    }

    // Parse Registration Window
    const regClose = registration?.closeAt || registrationClose || startDate;
    const regOpen = registration?.openAt || registrationOpen || new Date();

    const regWindow = {
      openAt: new Date(regOpen),
      closeAt: new Date(regClose),
      reopened: false,
    };

    // Parse Attendance Window (default to event date and times)
    const attOpen = attendance?.openAt || attendanceOpen || startDate;
    const attClose = attendance?.closeAt || attendanceClose || finalEndDate || startDate;
    const attWindow = {
      openAt: new Date(attOpen),
      closeAt: new Date(attClose),
    };

    // Parse Eligibility
    const deptCodes = eligibleDepartments || eligibility?.branchCodes || [];
    const yearsList = eligibleYears || eligibility?.years || [];
    const isEligibilityEnabled = eligibility?.enabled || deptCodes.length > 0 || yearsList.length > 0;

    // Resolve branch ObjectIds if branchCodes provided
    let branchObjectIds = [];
    if (deptCodes.length > 0) {
      const branches = await Branch.find({ code: { $in: deptCodes.map((c) => c.toUpperCase()) } });
      branchObjectIds = branches.map((b) => b._id);
    }

    const eligibilityObj = {
      enabled: isEligibilityEnabled,
      years: yearsList.map(Number),
      branchCodes: deptCodes.map((c) => c.toUpperCase()),
      branchIds: branchObjectIds,
    };

    // Parse Rulebooks
    let rulebooksList = [];
    if (Array.isArray(rulebooks) && rulebooks.length > 0) {
      rulebooksList = rulebooks;
    } else if (rulebook) {
      rulebooksList = [{ name: "Event Rulebook", url: rulebook, type: "pdf" }];
    }

    const newEvent = await Event.create({
      name: eventTitle,
      speaker: eventSpeaker,
      date: new Date(startDate),
      endDate: finalEndDate ? new Date(finalEndDate) : null,
      startTime: sTime,
      endTime: eTime,
      venue: eventVenue,
      description: eventDesc,
      poster: poster || "",
      category: category || "General",
      participantsLimit: limit,
      registration: regWindow,
      attendance: attWindow,
      eligibility: eligibilityObj,
      rulebooks: rulebooksList,
      certificateAvailable: certificateAvailable !== undefined ? certificateAvailable : true,
      feedbackRequired: feedbackRequired !== undefined ? feedbackRequired : true,
      status: "published",
      createdBy: req.user._id,
      registeredCount: 0,
    });

    return res.status(201).json({
      success: true,
      message: `Event '${newEvent.name}' created successfully.`,
      event: newEvent,
    });
  } catch (error) {
    console.error("❌ [Event Controller] createEvent Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create event.",
    });
  }
};

// =========================================================================
// 2. GET ALL EVENTS (With Search, Status Filters, & Pagination)
// =========================================================================
export const getAllEvents = async (req, res) => {
  try {
    const {
      status,
      category,
      department,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isDeleted: false };

    // Default for public/students: hide draft events unless user is admin or volunteer
    const isStaff = req.user && (req.user.role === "admin" || req.user.role === "volunteer");
    if (!isStaff) {
      query.status = { $ne: "draft" };
    }

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = new RegExp(category, "i");
    }

    if (department) {
      query.$or = [
        { "eligibility.enabled": false },
        { "eligibility.branchCodes": department.toUpperCase() },
      ];
    }

    if (search && search.trim()) {
      const keyword = search.trim();
      query.$or = [
        { name: new RegExp(keyword, "i") },
        { speaker: new RegExp(keyword, "i") },
        { venue: new RegExp(keyword, "i") },
        { description: new RegExp(keyword, "i") },
      ];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const totalEvents = await Event.countDocuments(query);
    const events = await Event.find(query)
      .populate("createdBy", "fullName role email")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);

    // Compute remaining seats and dynamic registration status for each event
    const now = new Date();
    const formattedEvents = events.map((event) => {
      const eObj = event.toObject({ virtuals: true });
      const seatsLeft = Math.max(0, event.participantsLimit - (event.registeredCount || 0));
      const isRegOpen =
        event.status === "published" &&
        now >= new Date(event.registration.openAt) &&
        now <= new Date(event.registration.closeAt) &&
        seatsLeft > 0;

      return {
        ...eObj,
        seatsLeft,
        isRegistrationOpen: isRegOpen,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedEvents.length,
      totalEvents,
      totalPages: Math.ceil(totalEvents / limitNum),
      currentPage: pageNum,
      events: formattedEvents,
    });
  } catch (error) {
    console.error("❌ [Event Controller] getAllEvents Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve events.",
    });
  }
};

// =========================================================================
// 3. GET UPCOMING EVENTS
// =========================================================================
export const getUpcomingEvents = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query = {
      isDeleted: false,
      status: { $in: ["published", "registration_open"] },
      date: { $gte: today },
    };

    const events = await Event.find(query)
      .populate("createdBy", "fullName role")
      .sort({ date: 1 });

    const now = new Date();
    const formatted = events.map((e) => {
      const obj = e.toObject({ virtuals: true });
      const seatsLeft = Math.max(0, e.participantsLimit - (e.registeredCount || 0));
      const isOpen = now <= new Date(e.registration.closeAt) && seatsLeft > 0;
      return {
        ...obj,
        seatsLeft,
        isRegistrationOpen: isOpen,
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      events: formatted,
    });
  } catch (error) {
    console.error("❌ [Event Controller] getUpcomingEvents Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch upcoming events.",
    });
  }
};

// =========================================================================
// 4. GET ONGOING EVENTS (Happening Today)
// =========================================================================
export const getOngoingEvents = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const query = {
      isDeleted: false,
      status: { $ne: "cancelled" },
      date: { $lte: endOfToday },
      $or: [
        { endDate: { $gte: startOfToday } },
        { endDate: null, date: { $gte: startOfToday } },
      ],
    };

    const events = await Event.find(query)
      .populate("createdBy", "fullName role")
      .sort({ date: 1 });

    return res.status(200).json({
      success: true,
      count: events.length,
      events: events.map((e) => e.toObject({ virtuals: true })),
    });
  } catch (error) {
    console.error("❌ [Event Controller] getOngoingEvents Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch ongoing events.",
    });
  }
};

// =========================================================================
// 5. GET PAST EVENTS (Completed)
// =========================================================================
export const getPastEvents = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const query = {
      isDeleted: false,
      $or: [
        { status: "completed" },
        { endDate: { $lt: startOfToday } },
        { endDate: null, date: { $lt: startOfToday } },
      ],
    };

    const events = await Event.find(query)
      .populate("createdBy", "fullName role")
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      count: events.length,
      events: events.map((e) => e.toObject({ virtuals: true })),
    });
  } catch (error) {
    console.error("❌ [Event Controller] getPastEvents Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch past events.",
    });
  }
};

// =========================================================================
// 6. GET EVENT BY ID (With User Registration Status)
// =========================================================================
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findOne({ _id: id, isDeleted: false })
      .populate("createdBy", "fullName role email")
      .populate("eligibility.branchIds", "name code");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const now = new Date();
    const eventObj = event.toObject({ virtuals: true });
    const seatsLeft = Math.max(0, event.participantsLimit - (event.registeredCount || 0));
    const isRegOpen =
      event.status === "published" &&
      now >= new Date(event.registration.openAt) &&
      now <= new Date(event.registration.closeAt) &&
      seatsLeft > 0;

    // Check if requesting user has already registered for this event
    let isUserRegistered = false;
    let userRegistration = null;

    if (req.user) {
      const reg = await Registration.findOne({
        studentId: req.user._id,
        eventId: event._id,
        status: "registered",
        isDeleted: false,
      });

      if (reg) {
        isUserRegistered = true;
        userRegistration = {
          registrationId: reg._id,
          registeredAt: reg.registeredAt,
          qrCode: reg.qrCode,
          status: reg.status,
        };
      }
    }

    return res.status(200).json({
      success: true,
      event: {
        ...eventObj,
        seatsLeft,
        isRegistrationOpen: isRegOpen,
        isUserRegistered,
        userRegistration,
      },
    });
  } catch (error) {
    console.error("❌ [Event Controller] getEventById Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch event details.",
    });
  }
};

// =========================================================================
// 7. UPDATE EVENT (Admin & Volunteers)
// =========================================================================
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findOne({ _id: id, isDeleted: false });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const {
      name,
      title,
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
      participantsLimit,
      participantLimit,
      registration,
      attendance,
      eligibility,
      eligibleDepartments,
      eligibleYears,
      rulebooks,
      status,
      certificateAvailable,
      feedbackRequired,
    } = req.body;

    if (name || title) event.name = (name || title).trim();
    if (speaker !== undefined || speakerName !== undefined) event.speaker = (speaker || speakerName || "").trim();
    if (date || eventDate) event.date = new Date(date || eventDate);
    if (endDate !== undefined || eventEndDate !== undefined) {
      event.endDate = (endDate || eventEndDate) ? new Date(endDate || eventEndDate) : null;
    }
    if (startTime) event.startTime = startTime.trim();
    if (endTime) event.endTime = endTime.trim();
    if (venue) event.venue = venue.trim();
    if (description) event.description = description.trim();
    if (poster !== undefined) event.poster = poster.trim();
    if (category) event.category = category.trim();
    if (status) event.status = status;
    if (certificateAvailable !== undefined) event.certificateAvailable = certificateAvailable;
    if (feedbackRequired !== undefined) event.feedbackRequired = feedbackRequired;

    // Check capacity limit: cannot be reduced below current registered count
    const newLimit = participantsLimit || participantLimit;
    if (newLimit !== undefined) {
      const parsedLimit = Number(newLimit);
      if (parsedLimit < (event.registeredCount || 0)) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce capacity to ${parsedLimit}. Currently ${event.registeredCount} students have already registered.`,
        });
      }
      event.participantsLimit = parsedLimit;
    }

    // Update Registration Window
    if (registration) {
      if (registration.openAt) event.registration.openAt = new Date(registration.openAt);
      if (registration.closeAt) event.registration.closeAt = new Date(registration.closeAt);
      if (registration.reopened !== undefined) event.registration.reopened = registration.reopened;
    }

    // Update Attendance Window
    if (attendance) {
      if (attendance.openAt) event.attendance.openAt = new Date(attendance.openAt);
      if (attendance.closeAt) event.attendance.closeAt = new Date(attendance.closeAt);
    }

    // Update Eligibility
    if (eligibleDepartments || eligibility?.branchCodes) {
      const codes = eligibleDepartments || eligibility.branchCodes;
      event.eligibility.branchCodes = codes.map((c) => c.toUpperCase());
      const branches = await Branch.find({ code: { $in: event.eligibility.branchCodes } });
      event.eligibility.branchIds = branches.map((b) => b._id);
      event.eligibility.enabled = true;
    }

    if (eligibleYears || eligibility?.years) {
      event.eligibility.years = (eligibleYears || eligibility.years).map(Number);
      event.eligibility.enabled = true;
    }

    if (rulebooks && Array.isArray(rulebooks)) {
      event.rulebooks = rulebooks;
    }

    event.updatedBy = req.user._id;
    await event.save();

    return res.status(200).json({
      success: true,
      message: `Event '${event.name}' updated successfully.`,
      event,
    });
  } catch (error) {
    console.error("❌ [Event Controller] updateEvent Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update event.",
    });
  }
};

// =========================================================================
// 8. DELETE EVENT (Soft-Delete - Admin Only)
// =========================================================================
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
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
    event.status = "cancelled";
    await event.save();

    // Cancel all active registrations for this event
    await Registration.updateMany(
      { eventId: event._id, status: "registered" },
      {
        status: "cancelled",
        cancellationReason: "Event was cancelled by administration.",
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id,
      }
    );

    return res.status(200).json({
      success: true,
      message: `Event '${event.name}' has been deleted and its registrations cancelled.`,
    });
  } catch (error) {
    console.error("❌ [Event Controller] deleteEvent Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete event.",
    });
  }
};

// =========================================================================
// 9. REOPEN REGISTRATION (Admin & Volunteers)
// =========================================================================
export const reopenRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { newCloseAt, newLimit } = req.body;

    const event = await Event.findOne({ _id: id, isDeleted: false });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    if (!newCloseAt) {
      return res.status(400).json({
        success: false,
        message: "New registration closing date/time is required.",
      });
    }

    event.registration.closeAt = new Date(newCloseAt);
    event.registration.reopened = true;
    event.registration.reopenedAt = new Date();
    event.status = "registration_open";

    if (newLimit && Number(newLimit) > event.participantsLimit) {
      event.participantsLimit = Number(newLimit);
    }

    event.updatedBy = req.user._id;
    await event.save();

    return res.status(200).json({
      success: true,
      message: `Registration reopened for event '${event.name}' until ${event.registration.closeAt}.`,
      event,
    });
  } catch (error) {
    console.error("❌ [Event Controller] reopenRegistration Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reopen registration.",
    });
  }
};

export default {
  createEvent,
  getAllEvents,
  getUpcomingEvents,
  getOngoingEvents,
  getPastEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  reopenRegistration,
};
