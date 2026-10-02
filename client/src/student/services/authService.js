import {
  getAuthStudentId,
  isStudentAuthenticated,
  login as centralLogin,
  signupStudent as centralSignupStudent,
  logout as centralLogout,
} from "../../services/authService";
import { getStudentProfile } from "./studentService";

// Check if a student is currently logged in
export function isLoggedIn() {
  return isStudentAuthenticated();
}

// Get the active student ID, or null if unauthenticated
export function getCurrentStudentId() {
  return getAuthStudentId();
}

// Get current logged-in student user object, or null
export function getLoggedInUser() {
  const studentId = getCurrentStudentId();
  if (!studentId) return null;
  return getStudentProfile(studentId);
}

// Mock student login function - delegates to central auth
export function loginStudent(identifier, password) {
  const user = centralLogin({ role: "student", identifier, password });
  return getStudentProfile(user.id);
}

// Student signup function - delegates to central auth
export function signupStudent(studentData) {
  const newStudent = centralSignupStudent(studentData);
  return getStudentProfile(newStudent.id);
}

// Logout function
export function logoutStudent() {
  centralLogout();
}
