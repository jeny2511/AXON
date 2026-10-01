import { users as mockUsers } from "../../mockData/users";
import { getStudentProfile } from "./studentService";

const AUTH_STORAGE_KEY = "axon_auth_student_id";

// Check if a student is currently logged in
export function isLoggedIn() {
  const studentId = localStorage.getItem(AUTH_STORAGE_KEY);
  return Boolean(studentId && studentId.trim());
}

// Get the active student ID, or null if guest
export function getCurrentStudentId() {
  const studentId = localStorage.getItem(AUTH_STORAGE_KEY);
  return studentId && studentId.trim() ? studentId : null;
}

// Get current logged-in student user object, or null if guest
export function getLoggedInUser() {
  const studentId = getCurrentStudentId();
  if (!studentId) return null;
  return getStudentProfile(studentId);
}

// Temporary mock login function
export function loginStudent(identifier, _password) {
  if (!identifier || !identifier.trim()) {
    throw new Error("Student ID or Email is required.");
  }

  const query = identifier.trim().toLowerCase();

  // Find matching student from mock users list
  const matchedStudent = mockUsers.find(
    (u) =>
      u.role === "student" &&
      (u.id.toLowerCase() === query ||
        (u.email && u.email.toLowerCase() === query) ||
        (u.enrollmentNo && u.enrollmentNo.toLowerCase() === query) ||
        (u.fullName && u.fullName.toLowerCase().includes(query)))
  );

  // If matched, use that student; otherwise fallback to ST001 for demo flexibility
  const studentId = matchedStudent ? matchedStudent.id : "ST001";

  localStorage.setItem(AUTH_STORAGE_KEY, studentId);
  window.dispatchEvent(new Event("axon-auth-change"));

  return getStudentProfile(studentId);
}

// Temporary mock signup function
export function signupStudent(studentData) {
  if (!studentData.fullName || !studentData.email) {
    throw new Error("Full name and email are required for registration.");
  }

  const existingStudents = mockUsers.filter((u) => u.role === "student");
  const newStudentId = `ST00${existingStudents.length + 1}`;

  const newStudent = {
    id: newStudentId,
    studentId: newStudentId,
    role: "student",
    fullName: studentData.fullName.trim(),
    email: studentData.email.trim(),
    department: studentData.department || "Computer Engineering",
    year: Number(studentData.year) || 1,
    semester: Number(studentData.semester) || 1,
    enrollmentNo: studentData.enrollmentNo || `CE202500${existingStudents.length + 1}`,
    phone: studentData.phone || "+91 98765 00000",
    batch: studentData.batch || "2025-2029",
    profilePhoto: "/assets/images/profile/default.jpg",
    isActive: true,
  };

  // Save to profile storage
  localStorage.setItem(`axon_profile_${newStudentId}`, JSON.stringify(newStudent));
  localStorage.setItem(AUTH_STORAGE_KEY, newStudentId);
  window.dispatchEvent(new Event("axon-auth-change"));

  return newStudent;
}

// Logout function to return to Guest mode
export function logoutStudent() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event("axon-auth-change"));
}
