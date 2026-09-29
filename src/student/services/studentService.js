// Student Shared Service
import { attendance } from "../../mockData/attendance";
import { events } from "../../mockData/events";
import { registrations } from "../../mockData/registrations";
import { certificates } from "../../mockData/certificates";
import { feedback } from "../../mockData/feedback";
import { gallery } from "../../mockData/gallery";
import { aboutTCF } from "../../mockData/about";
import { notifications } from "../../mockData/notifications";
import { learning } from "../../mockData/learning";
import { users } from "../../mockData/users";


// --------------------------------------------
// EVENTS
// --------------------------------------------

// Get all events
export function getAllEvents() {
  return events;
}
export function getGallery() {
  return gallery;
}

// Get upcoming events
export function getUpcomingEvents() {
  return events.filter((event) => event.status === "upcoming");
}

// Get ongoing events
export function getOngoingEvents() {
  return events.filter((event) => event.status === "ongoing");
}

// Get completed events
export function getCompletedEvents() {
  return events.filter(event => event.status === "completed");
}

// Get one event by ID
export function getEventById(eventId) {
  return events.find(event => event.id === eventId);
}

// --------------------------------------------
// REGISTRATIONS
// --------------------------------------------

// Get all registrations of one student
export function getStudentRegistrations(studentId) {
  return registrations.filter(
    registration => registration.studentId === studentId
  );
}

// Get full registered event details
export function getRegisteredEvents(studentId) {
  const studentRegistrations = getStudentRegistrations(studentId);

  return studentRegistrations.map(registration => {
    const event = getEventById(registration.eventId);

    return {
      ...registration,
      ...event,
    };
  });
}

// --------------------------------------------
// CERTIFICATES
// --------------------------------------------

// Get student certificates
export function getStudentCertificates(studentId) {
  return certificates.filter(
    certificate => certificate.studentId === studentId
  );
}

// --------------------------------------------
// FEEDBACK
// --------------------------------------------

// Get feedback submitted by student
export function getStudentFeedback(studentId) {
  return feedback.filter(
    item => item.studentId === studentId
  );
}

// Check if feedback already exists
export function hasSubmittedFeedback(studentId, eventId) {
  return feedback.some(
    item =>
      item.studentId === studentId &&
      item.eventId === eventId
  );
}

// --------------------------------------------
// ATTENDANCE
// --------------------------------------------

// Get attendance records of one student
export function getStudentAttendance(studentId) {
  return attendance.filter(
    item => item.studentId === studentId
  );
}

// Get events attended by one student
export function getStudentCompletedEvents(studentId) {
  const studentAttendance = getStudentAttendance(studentId);

  return studentAttendance.filter(
    item => item.status === "present"
  );
}

// --------------------------------------------
// DASHBOARD
// --------------------------------------------

// Get nearest upcoming event
export function getNearestUpcomingEvent() {
  const upcomingEvents = getUpcomingEvents();

  if (upcomingEvents.length === 0) {
    return null;
  }

  return upcomingEvents.reduce((nearest, event) => {
    return new Date(event.eventDate) < new Date(nearest.eventDate)
      ? event
      : nearest;
  });
}

// Dashboard statistics
export function getDashboardStats(studentId) {
  const registeredEvents = getStudentRegistrations(studentId);
  const completedEvents = getStudentCompletedEvents(studentId);
  const studentCertificates = getStudentCertificates(studentId);

  return {
    upcomingEvents: getUpcomingEvents().length,
    registeredEvents: registeredEvents.length,
    completedEvents: completedEvents.length,
    certificates: studentCertificates.length,
  };
}

// --------------------------------------------
// ABOUT TCF
// --------------------------------------------

// Get TCF information
export function getAboutTCF() {
  return aboutTCF;
}

// --------------------------------------------
// LEARNING HUB
// --------------------------------------------

// Get all learning resources
export function getLearningResources() {
  return learning;
}

// Get featured learning resources
export function getFeaturedLearningResources() {
  return learning.filter(
    resource => resource.isFeatured === true
  );
}

// Get learning resources by category
export function getLearningResourcesByCategory(category) {
  return learning.filter(
    resource => resource.category === category
  );
}

// --------------------------------------------
// NOTIFICATIONS
// --------------------------------------------

// Get notifications of one student
export function getStudentNotifications(studentId) {
  return notifications.filter(
    notification => notification.userId === studentId
  );
}

// PROFILE
export function getStudentProfile(studentId) {
  return users.find(
    user => user.id === studentId && user.role === "student"
  );
}