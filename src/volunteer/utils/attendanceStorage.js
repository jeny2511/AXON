import { events as defaultEvents, users as mockUsers } from "../../mockData";

// Pre-seeded attendees for events
const initialAttendeeDataset = [
  { id: "ATT-001", enrollmentNo: "24IT001", name: "Priyanah Patel", branch: "IT", status: "Present", checkInTime: "10:02 AM", email: "priyanah@vgec.ac.in" },
  { id: "ATT-002", enrollmentNo: "24IT002", name: "Jinal Shah", branch: "IT", status: "Present", checkInTime: "10:03 AM", email: "jinal@vgec.ac.in" },
  { id: "ATT-003", enrollmentNo: "24CE015", name: "Meet Desai", branch: "CE", status: "Present", checkInTime: "10:05 AM", email: "meet.desai@vgec.ac.in" },
  { id: "ATT-004", enrollmentNo: "24EC007", name: "Krisha Vora", branch: "EC", status: "Present", checkInTime: "10:06 AM", email: "krisha@vgec.ac.in" },
  { id: "ATT-005", enrollmentNo: "24IT010", name: "Dhruv Mehta", branch: "IT", status: "Absent", checkInTime: "—", email: "dhruv@vgec.ac.in" },
  { id: "ATT-006", enrollmentNo: "220130107054", name: "Jeny Thesiya", branch: "IT", status: "Present", checkInTime: "10:08 AM", email: "jeny@vgec.ac.in" },
  { id: "ATT-007", enrollmentNo: "220130107055", name: "Archi Patel", branch: "IT", status: "Present", checkInTime: "10:10 AM", email: "archi@vgec.ac.in" },
  { id: "ATT-008", enrollmentNo: "220130107056", name: "Riya Shah", branch: "CE", status: "Absent", checkInTime: "—", email: "riya@vgec.ac.in" },
  { id: "ATT-009", enrollmentNo: "220130107057", name: "Meet Parmar", branch: "ICT", status: "Present", checkInTime: "10:12 AM", email: "meet@vgec.ac.in" },
  { id: "ATT-010", enrollmentNo: "220130107058", name: "Krishna Joshi", branch: "IT", status: "Present", checkInTime: "10:15 AM", email: "krishna@vgec.ac.in" },
  { id: "ATT-011", enrollmentNo: "220130107059", name: "Harsh Patel", branch: "EC", status: "Absent", checkInTime: "—", email: "harsh@vgec.ac.in" },
  { id: "ATT-012", enrollmentNo: "24IT014", name: "Aarav Sharma", branch: "IT", status: "Present", checkInTime: "10:18 AM", email: "aarav@vgec.ac.in" },
  { id: "ATT-013", enrollmentNo: "24CE022", name: "Ananya Trivedi", branch: "CE", status: "Present", checkInTime: "10:20 AM", email: "ananya@vgec.ac.in" },
  { id: "ATT-014", enrollmentNo: "24ICT009", name: "Devansh Dave", branch: "ICT", status: "Present", checkInTime: "10:22 AM", email: "devansh@vgec.ac.in" },
  { id: "ATT-015", enrollmentNo: "24EC012", name: "Diya Panchal", branch: "EC", status: "Absent", checkInTime: "—", email: "diya@vgec.ac.in" },
  { id: "ATT-016", enrollmentNo: "24IT033", name: "Hardik Goswami", branch: "IT", status: "Present", checkInTime: "10:25 AM", email: "hardik@vgec.ac.in" },
  { id: "ATT-017", enrollmentNo: "24CE045", name: "Ishaan Rathod", branch: "CE", status: "Present", checkInTime: "10:27 AM", email: "ishaan@vgec.ac.in" },
  { id: "ATT-018", enrollmentNo: "24IT049", name: "Kavya Soni", branch: "IT", status: "Absent", checkInTime: "—", email: "kavya@vgec.ac.in" },
  { id: "ATT-019", enrollmentNo: "24ICT018", name: "Manan Kothari", branch: "ICT", status: "Present", checkInTime: "10:30 AM", email: "manan@vgec.ac.in" },
  { id: "ATT-020", enrollmentNo: "24EC025", name: "Nandini Solanki", branch: "EC", status: "Present", checkInTime: "10:31 AM", email: "nandini@vgec.ac.in" },
];

export function getFullEvents() {
  const list = [...defaultEvents];
  const hasWebDev = list.some((e) =>
    e.name.toLowerCase().includes("web development workshop")
  );
  if (!hasWebDev) {
    list.unshift({
      id: "EV-WEBDEV",
      name: "Web Development Workshop",
      category: "Workshop",
      status: "upcoming",
      registrationStatus: "open",
      description:
        "Comprehensive hands-on workshop covering modern full-stack web engineering, React component design, Vite workflows, and backend API integration for university projects.",
      venue: "Computer Center - Lab 2",
      eventDate: "2027-10-22",
      startTime: "10:00",
      endTime: "13:00",
      speakerName: "Prof. Aniket Trivedi",
      participantLimit: 100,
      registeredCount: 78,
      eligibleDepartments: ["IT", "CE", "ICT", "EC"],
      eligibleYears: [1, 2, 3, 4],
      rulebook: "/rulebooks/webdev.pdf",
      certificateAvailable: true,
      feedbackRequired: true,
    });
  }
  return list;
}

export function getNearestEvent() {
  const events = getFullEvents();
  return [...events].sort((a, b) => {
    const aTime = new Date(`${a.eventDate}T${a.startTime || "00:00"}`).getTime();
    const bTime = new Date(`${b.eventDate}T${b.startTime || "00:00"}`).getTime();
    return Math.abs(aTime - Date.now()) - Math.abs(bTime - Date.now());
  })[0];
}

export function getAttendees(eventId) {
  if (!eventId) return [];
  const key = `axon_attendees_${eventId}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }

  // Pre-seed default attendees
  const seed = initialAttendeeDataset.map((item, idx) => ({
    ...item,
    id: `ATT-${eventId}-${idx + 1}`,
  }));
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

export function saveAttendees(eventId, list) {
  if (!eventId) return;
  const key = `axon_attendees_${eventId}`;
  localStorage.setItem(key, JSON.stringify(list));
  // Dispatch custom storage event for same-window listeners
  window.dispatchEvent(new Event("axon_attendance_updated"));
}

export function formatTime12(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
}

export function formatDateStr(dateStr) {
  if (!dateStr) return "N/A";
  const dateObj = new Date(`${dateStr}T00:00:00`);
  if (isNaN(dateObj)) return dateStr;
  return dateObj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
