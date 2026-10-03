/**
 * Student Event Lifecycle Utility
 *
 * Provides a single, authoritative definition of event stages based on:
 * - Event Start Datetime (event.date + event.startTime)
 * - Event End Datetime (event.endDate || event.date + event.endTime)
 * - Student Active Registration status
 * - Student Attendance verification status
 */

/**
 * Helper to parse an event's date and time string into a precise local Date object
 */
export function parseEventDateTime(dateVal, timeStr) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;

  if (!timeStr || typeof timeStr !== "string") {
    return d;
  }

  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([aApP][mM])?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3] ? match[3].toUpperCase() : null;

    if (meridiem === "PM" && hours < 12) {
      hours += 12;
    } else if (meridiem === "AM" && hours === 12) {
      hours = 0;
    }

    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  return d;
}

/**
 * Get accurate Start and End Date boundaries for an event
 */
export function getEventDateBounds(event) {
  if (!event) return { start: null, end: null };

  const startDateVal = event.date || event.eventDate;
  const endDateVal = event.endDate || event.eventEndDate || startDateVal;

  const start = parseEventDateTime(startDateVal, event.startTime);
  let end = parseEventDateTime(endDateVal, event.endTime);

  // If end is missing or earlier than start, fallback to start + 2 hours
  if (!end || (start && end < start)) {
    if (start) {
      end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    }
  }

  return { start, end };
}

/**
 * Check timing state for an event:
 * - "upcoming": now < eventStart
 * - "ongoing":  eventStart <= now <= eventEnd
 * - "ended":    now > eventEnd
 */
export function getEventTimingState(event, now = new Date()) {
  const { start, end } = getEventDateBounds(event);
  if (!start) return "upcoming";

  if (now < start) {
    return "upcoming";
  }
  if (end && now > end) {
    return "ended";
  }
  return "ongoing";
}

/**
 * Determine Student's View Stage for an Event:
 *
 * Stage Results:
 * 1. "attended":
 *    Student registered AND attendance.status === "present"
 *    -> Displays in Student -> My Events (stays even after event ends)
 *
 * 2. "ongoing":
 *    Student registered AND attendance != "present" AND eventStart <= now <= eventEnd
 *    -> Displays in Student -> Ongoing Events
 *
 * 3. "registered":
 *    Student registered AND attendance != "present" AND now < eventStart
 *    -> Displays in Student -> Registered Events
 *
 * 4. "upcoming":
 *    Event is published/active AND now < eventStart
 *    -> Displays in Student -> Upcoming Events
 *
 * 5. "missed" / "ended":
 *    Event ended (now > eventEnd) and student never attended.
 *    -> Hidden from all active student event views
 */
export function getStudentEventStage({ event, registration, attendance, now = new Date() }) {
  const isPresent = attendance?.status === "present";
  const hasActiveReg = Boolean(
    registration &&
    (registration.status === "registered" || registration.status === "confirmed" || registration.status === "attended") &&
    !registration.isDeleted
  );
  const timing = getEventTimingState(event, now);

  // If marked Present, it is always in My Events
  if (hasActiveReg && isPresent) {
    return "attended";
  }

  // Active registration but not yet marked Present:
  if (hasActiveReg && !isPresent) {
    if (timing === "ongoing") {
      return "ongoing";
    }
    if (timing === "upcoming") {
      return "registered";
    }
    if (timing === "ended") {
      return "missed";
    }
  }

  // General discovery:
  if (timing === "upcoming") {
    return "upcoming";
  }

  return "ended";
}

/**
 * Helper: Determine complete attendance window state
 */
export function getAttendanceWindowInfo(event, now = new Date()) {
  if (!event) {
    return { isOpen: false, isBefore: false, isAfter: true, openTime: null, closeTime: null };
  }

  // 1. Explicit attendance window
  let openTime = event.attendance?.openAt
    ? new Date(event.attendance.openAt)
    : event.attendanceOpenDate
    ? new Date(event.attendanceOpenDate)
    : event.attendanceOpen
    ? new Date(event.attendanceOpen)
    : null;

  let closeTime = event.attendance?.closeAt
    ? new Date(event.attendance.closeAt)
    : event.attendanceCloseDate
    ? new Date(event.attendanceCloseDate)
    : event.attendanceClose
    ? new Date(event.attendanceClose)
    : null;

  // 2. Fallback to event date & start/end times
  const baseDate = event.date || event.eventDate;
  if ((!openTime || isNaN(openTime.getTime())) && baseDate) {
    openTime = parseEventDateTime(baseDate, event.startTime);
  }
  if ((!closeTime || isNaN(closeTime.getTime())) && (event.endDate || baseDate)) {
    closeTime = parseEventDateTime(event.endDate || baseDate, event.endTime);
  }

  const isBefore = Boolean(openTime && !isNaN(openTime.getTime()) && now < openTime);
  const isAfter = Boolean(closeTime && !isNaN(closeTime.getTime()) && now > closeTime);
  const isOpen = !isBefore && !isAfter;

  return {
    isOpen,
    isBefore,
    isAfter,
    openTime,
    closeTime,
  };
}

