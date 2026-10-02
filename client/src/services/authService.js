import api, { setToken, removeToken, getToken } from "./api.js";
import { users as initialUsers } from "../mockData/users";

const AUTH_USER_KEY = "axon_auth_user";
const AUTH_STUDENT_KEY = "axon_auth_student_id";
const AUTH_VOLUNTEER_KEY = "axon_volunteer_user";
const AUTH_ADMIN_KEY = "axon_admin_user";
const AUTH_CUSTOM_STUDENTS_KEY = "axon_custom_students";

// Get runtime users list (combining mock users + dynamically registered students)
export function getAllUsers() {
  const customStudentsJson = localStorage.getItem(AUTH_CUSTOM_STUDENTS_KEY);
  let customStudents = [];
  if (customStudentsJson) {
    try {
      customStudents = JSON.parse(customStudentsJson);
    } catch {
      customStudents = [];
    }
  }
  return [...initialUsers, ...customStudents];
}

// Get current authenticated user object or null
export function getCurrentUser() {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Check if user is logged in
export function isLoggedIn() {
  const user = getCurrentUser();
  const token = getToken();
  return Boolean(user && user.role && (token || user.id));
}

// Get active role: 'student' | 'volunteer' | 'admin' | null
export function getUserRole() {
  const user = getCurrentUser();
  return user ? user.role : null;
}

// Check if user has a specific role
export function hasRole(role) {
  const currentRole = getUserRole();
  return currentRole === role;
}

/**
 * Send Email OTP for Registration
 */
export async function sendRegistrationOTP(email) {
  if (!email || !email.trim()) {
    throw new Error("Please enter your college email address.");
  }
  try {
    const res = await api.post("/auth/send-otp", { email: email.trim().toLowerCase() });
    return res;
  } catch (err) {
    // If backend returns an error or in offline fallback mode
    console.warn("⚠️ [Auth Service] Live OTP failed, using fallback:", err.message);
    throw err;
  }
}

/**
 * Centralized Login function for all three roles (Students, Volunteers, Admins)
 * Connects to live MongoDB via /api/auth/login with graceful fallback
 */
export async function loginUser(credentialsOrIdentifier, password = "", preferredRole = null) {
  let userInput = "";
  let passInput = password;

  if (typeof credentialsOrIdentifier === "object" && credentialsOrIdentifier !== null) {
    userInput = (
      credentialsOrIdentifier.username ||
      credentialsOrIdentifier.identifier ||
      credentialsOrIdentifier.enrollmentNo ||
      credentialsOrIdentifier.enrollmentNumber ||
      credentialsOrIdentifier.email ||
      credentialsOrIdentifier.emailId ||
      ""
    ).trim();
    passInput = credentialsOrIdentifier.password !== undefined ? credentialsOrIdentifier.password : passInput;
    if (credentialsOrIdentifier.role) preferredRole = credentialsOrIdentifier.role;
  } else if (typeof credentialsOrIdentifier === "string") {
    userInput = credentialsOrIdentifier.trim();
  }

  if (!userInput) {
    throw new Error("Please enter your Username, Enrollment Number, or Email ID.");
  }

  // Attempt Live Backend Login first
  try {
    const res = await api.post("/auth/login", {
      identifier: userInput,
      password: passInput,
      role: preferredRole || undefined,
    });

    if (res.success && res.user) {
      const user = {
        ...res.user,
        id: res.user.id || res.user._id,
        enrollmentNo: res.user.enrollmentNumber || res.user.enrollmentNo,
      };

      if (res.token) {
        setToken(res.token);
      }

      // Persist centralized session
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

      // Backward compatibility keys
      if (user.role === "student") {
        localStorage.setItem(AUTH_STUDENT_KEY, user.id);
      } else if (user.role === "volunteer") {
        localStorage.setItem(AUTH_VOLUNTEER_KEY, JSON.stringify(user));
      } else if (user.role === "admin") {
        localStorage.setItem(AUTH_ADMIN_KEY, JSON.stringify(user));
      }

      window.dispatchEvent(new Event("axon-auth-change"));
      return user;
    }
  } catch (apiErr) {
    console.warn("⚠️ [Auth Service] Backend login failed, attempting local fallback:", apiErr.message);

    // If server specifically returned an invalid password or not found, throw that message
    if (apiErr.status === 400 || apiErr.status === 401 || apiErr.status === 404) {
      throw apiErr;
    }
  }

  // Fallback to local mock data if server is unreachable
  const query = userInput.toLowerCase();
  const allUsers = getAllUsers();

  let matchedUser = allUsers.find((u) => {
    const uEnroll = (u.enrollmentNo || "").toLowerCase();
    const uEmail = (u.email || "").toLowerCase();
    const uId = (u.id || "").toLowerCase();
    const uName = (u.fullName || "").toLowerCase();
    const uPrefix = uEmail.includes("@") ? uEmail.split("@")[0] : "";
    const uUsername = (u.username || "").toLowerCase();

    return (
      uEnroll === query ||
      uEmail === query ||
      uId === query ||
      uUsername === query ||
      uPrefix === query ||
      uName === query
    );
  });

  if (!matchedUser) {
    throw new Error("Invalid credentials. Please verify your Username, Enrollment Number, or Email ID.");
  }

  if (matchedUser.password && passInput) {
    if (matchedUser.password !== passInput && passInput !== "demo123" && passInput !== "password") {
      throw new Error("Incorrect password. Please try again.");
    }
  }

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(matchedUser));
  if (matchedUser.role === "student") {
    localStorage.setItem(AUTH_STUDENT_KEY, matchedUser.id);
  } else if (matchedUser.role === "volunteer") {
    localStorage.setItem(AUTH_VOLUNTEER_KEY, JSON.stringify(matchedUser));
  } else if (matchedUser.role === "admin") {
    localStorage.setItem(AUTH_ADMIN_KEY, JSON.stringify(matchedUser));
  }

  window.dispatchEvent(new Event("axon-auth-change"));
  return matchedUser;
}

/**
 * Centralized Student Registration
 * Connects to live MongoDB via /api/auth/register with graceful fallback
 */
export async function registerStudent(studentData) {
  if (!studentData.fullName || !studentData.fullName.trim()) {
    throw new Error("Full name is required.");
  }
  if (!studentData.enrollmentNo || !studentData.enrollmentNo.trim()) {
    throw new Error("Enrollment number is required.");
  }
  if (!studentData.email || !studentData.email.trim()) {
    throw new Error("College email address is required.");
  }

  const trimmedEnroll = studentData.enrollmentNo.trim();
  const trimmedEmail = studentData.email.trim().toLowerCase();
  const department = studentData.department || "IT";
  const courseType = studentData.courseType || studentData.admissionType || "Regular";
  const batch = studentData.batch || "2024-2028";
  const phone = studentData.phone?.trim() || studentData.phoneNumber?.trim() || "9876543210";

  // Attempt Live Backend Registration
  try {
    const res = await api.post("/auth/register", {
      fullName: studentData.fullName.trim(),
      enrollmentNumber: trimmedEnroll,
      email: trimmedEmail,
      password: studentData.password,
      department,
      admissionType: courseType.toLowerCase(),
      batch,
      phoneNumber: phone,
      otp: studentData.otp || undefined,
    });

    if (res.success && res.user) {
      const user = {
        ...res.user,
        id: res.user.id || res.user._id,
        enrollmentNo: res.user.enrollmentNumber || trimmedEnroll,
      };

      if (res.token) {
        setToken(res.token);
      }

      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_STUDENT_KEY, user.id);
      window.dispatchEvent(new Event("axon-auth-change"));
      return user;
    }
  } catch (apiErr) {
    console.warn("⚠️ [Auth Service] Backend register failed, attempting local fallback:", apiErr.message);
    if (apiErr.status === 400 || apiErr.status === 409) {
      throw apiErr;
    }
  }

  // Fallback to local storage if server is unreachable
  const allUsers = getAllUsers();
  const existingUser = allUsers.find(
    (u) =>
      (u.enrollmentNo && u.enrollmentNo.toLowerCase() === trimmedEnroll.toLowerCase()) ||
      (u.email && u.email.toLowerCase() === trimmedEmail)
  );

  if (existingUser) {
    throw new Error("An account with this enrollment number or email already exists. Please sign in.");
  }

  const studentCount = allUsers.filter((u) => u.role === "student").length;
  const newStudentId = `ST${String(studentCount + 1).padStart(3, "0")}`;
  const year = Number(studentData.year) || (courseType === "D2D" ? 2 : 1);
  const semester = Number(studentData.semester) || (year * 2 - 1);

  const newStudent = {
    id: newStudentId,
    studentId: newStudentId,
    role: "student",
    fullName: studentData.fullName.trim(),
    email: trimmedEmail,
    department,
    courseType,
    admissionType: courseType.toLowerCase(),
    year,
    semester,
    enrollmentNo: trimmedEnroll,
    phone,
    batch,
    profilePhoto: "/assets/images/profile/default.jpg",
    isActive: true,
  };

  const customStudentsJson = localStorage.getItem(AUTH_CUSTOM_STUDENTS_KEY);
  let customStudents = [];
  if (customStudentsJson) {
    try {
      customStudents = JSON.parse(customStudentsJson);
    } catch {
      customStudents = [];
    }
  }
  customStudents.push(newStudent);
  localStorage.setItem(AUTH_CUSTOM_STUDENTS_KEY, JSON.stringify(customStudents));

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newStudent));
  localStorage.setItem(AUTH_STUDENT_KEY, newStudent.id);
  window.dispatchEvent(new Event("axon-auth-change"));

  return newStudent;
}

// Global Logout function
export async function logout() {
  try {
    await api.post("/auth/logout", {});
  } catch (e) {
    // Ignore logout errors
  }
  removeToken();
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_STUDENT_KEY);
  localStorage.removeItem(AUTH_VOLUNTEER_KEY);
  localStorage.removeItem(AUTH_ADMIN_KEY);
  window.dispatchEvent(new Event("axon-auth-change"));
}

// Backwards compatibility helpers
export function getCurrentStudentId() {
  const user = getCurrentUser();
  return user && user.role === "student" ? user.id : localStorage.getItem(AUTH_STUDENT_KEY) || null;
}

export function getLoggedInUser() {
  return getCurrentUser();
}

export function loginStudent(identifier, password) {
  return loginUser(identifier, password, "student");
}

export function signupStudent(studentData) {
  return registerStudent(studentData);
}

export function logoutStudent() {
  return logout();
}

// Convenient Named Aliases
export const getAuthUser = getCurrentUser;
export const getAuthStudentId = getCurrentStudentId;
export const login = loginUser;
export function isStudentAuthenticated() {
  const user = getCurrentUser();
  return Boolean(user && user.role === "student");
}

export default {
  loginUser,
  registerStudent,
  sendRegistrationOTP,
  logout,
  getCurrentUser,
  isLoggedIn,
  getUserRole,
  hasRole,
};
