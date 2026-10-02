import { users as initialUsers } from "../mockData/users";

const AUTH_USER_KEY = "axon_auth_user";
const AUTH_STUDENT_KEY = "axon_auth_student_id";
const AUTH_VOLUNTEER_KEY = "axon_volunteer_user";
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
  return Boolean(user && user.id && user.role);
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

// Centralized Login function for all three roles
export function loginUser(identifier, password, preferredRole = null) {
  if (!identifier || !identifier.trim()) {
    throw new Error("Enrollment Number, Email, or User ID is required.");
  }

  const query = identifier.trim().toLowerCase();
  const allUsers = getAllUsers();

  // Find user by id, email, enrollmentNo, or fullName
  let matchedUser = allUsers.find((u) => {
    const idMatch = u.id && u.id.toLowerCase() === query;
    const emailMatch = u.email && u.email.toLowerCase() === query;
    const enrollMatch = u.enrollmentNo && u.enrollmentNo.toLowerCase() === query;
    const nameMatch = u.fullName && u.fullName.toLowerCase() === query;

    if (preferredRole) {
      return u.role === preferredRole && (idMatch || emailMatch || enrollMatch || nameMatch);
    }
    return idMatch || emailMatch || enrollMatch || nameMatch;
  });

  // If no exact match but preferredRole is specified, try fallback to first user of that role for demo testing
  if (!matchedUser && preferredRole) {
    const roleUsers = allUsers.filter((u) => u.role === preferredRole);
    if (roleUsers.length > 0 && query.length >= 2) {
      matchedUser = roleUsers.find((u) =>
        u.fullName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }
  }

  if (!matchedUser) {
    throw new Error("Invalid credentials. Please check your details or contact Administrator.");
  }

  // Set centralized session
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(matchedUser));

  // Maintain backward compatibility for existing module-specific keys
  if (matchedUser.role === "student") {
    localStorage.setItem(AUTH_STUDENT_KEY, matchedUser.id);
  } else if (matchedUser.role === "volunteer") {
    localStorage.setItem(AUTH_VOLUNTEER_KEY, JSON.stringify(matchedUser));
  }

  window.dispatchEvent(new Event("axon-auth-change"));
  return matchedUser;
}

// Centralized Student Registration
export function registerStudent(studentData) {
  if (!studentData.fullName || !studentData.fullName.trim()) {
    throw new Error("Full name is required.");
  }
  if (!studentData.email || !studentData.email.trim()) {
    throw new Error("College email address is required.");
  }

  const allUsers = getAllUsers();
  const studentCount = allUsers.filter((u) => u.role === "student").length;
  const newStudentId = `ST${String(studentCount + 1).padStart(3, "0")}`;

  const department = studentData.department || "IT";
  const year = Number(studentData.year) || 1;
  const semester = Number(studentData.semester) || (year * 2 - 1);
  const startYear = 2026 - year + 1;
  const batch = studentData.batch || `${startYear}-${startYear + 4}`;

  const newStudent = {
    id: newStudentId,
    studentId: newStudentId,
    role: "student",
    fullName: studentData.fullName.trim(),
    email: studentData.email.trim(),
    department,
    year,
    semester,
    enrollmentNo: studentData.enrollmentNo?.trim() || `24${department}0${String(studentCount + 1).padStart(2, "0")}`,
    phone: studentData.phone?.trim() || "9876543210",
    batch,
    profilePhoto: "/assets/images/profile/default.jpg",
    isActive: true,
  };

  // Save to custom students list
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

  // Log in as the new student
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newStudent));
  localStorage.setItem(AUTH_STUDENT_KEY, newStudent.id);
  window.dispatchEvent(new Event("axon-auth-change"));

  return newStudent;
}

// Global Logout function
export function logout() {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_STUDENT_KEY);
  localStorage.removeItem(AUTH_VOLUNTEER_KEY);
  localStorage.removeItem("axon_admin_user");
  window.dispatchEvent(new Event("axon-auth-change"));
}

// Backwards compatibility helpers for student module
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
  logout();
}

// Convenient Named Aliases
export const getAuthUser = getCurrentUser;
export const getAuthStudentId = getCurrentStudentId;
export const login = loginUser;
export function isStudentAuthenticated() {
  const user = getCurrentUser();
  return Boolean(user && user.role === "student");
}

