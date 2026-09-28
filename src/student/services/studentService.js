// Student Shared Service

import { events } from "../../mockData/events";
import { registrations } from "../../mockData/registrations";
import { certificates } from "../../mockData/certificates";
import { feedback } from "../../mockData/feedback";
import { gallery } from "../../mockData/gallery";

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
  return events.filter(event => event.status === "Completed");
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