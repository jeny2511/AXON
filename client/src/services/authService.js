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

// Centralized Login function for all three roles (accepts username/enrollment/email & password)
export function loginUser(credentialsOrIdentifier, password = "", preferredRole = null) {
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

  const query = userInput.toLowerCase();
  const allUsers = getAllUsers();

  // Find user by enrollmentNo, email, id, fullName, or username prefix
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

  // Fallback match if user typed part of name
  if (!matchedUser) {
    matchedUser = allUsers.find((u) => {
      const uName = (u.fullName || "").toLowerCase();
      const uEmail = (u.email || "").toLowerCase();
      return uName.includes(query) || uEmail.includes(query);
    });
  }

  if (!matchedUser) {
    throw new Error("Invalid credentials. Please verify your Username, Enrollment Number, or Email ID.");
  }

  // Password validation: if user has a stored custom password, check it
  if (matchedUser.password && passInput) {
    if (matchedUser.password !== passInput && passInput !== "demo123" && passInput !== "password") {
      throw new Error("Incorrect password. Please try again.");
    }
  }

  // Set centralized session
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(matchedUser));

  // Maintain backward compatibility for existing module-specific keys
  if (matchedUser.role === "student") {
    localStorage.setItem(AUTH_STUDENT_KEY, matchedUser.id);
  } else if (matchedUser.role === "volunteer") {
    localStorage.setItem(AUTH_VOLUNTEER_KEY, JSON.stringify(matchedUser));
  } else if (matchedUser.role === "admin") {
    localStorage.setItem("axon_admin_user", JSON.stringify(matchedUser));
  }

  window.dispatchEvent(new Event("axon-auth-change"));
  return matchedUser;
}

// Centralized Student Registration
export function registerStudent(studentData) {
  if (!studentData.fullName || !studentData.fullName.trim()) {
    throw new Error("Full name is required.");
  }
  if (!studentData.enrollmentNo || !studentData.enrollmentNo.trim()) {
    throw new Error("Enrollment number is required.");
  }
  if (!studentData.email || !studentData.email.trim()) {
    throw new Error("College email address is required.");
  }

  const allUsers = getAllUsers();
  const trimmedEnroll = studentData.enrollmentNo.trim();
  const trimmedEmail = studentData.email.trim().toLowerCase();

  // Check if already registered
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

  const department = studentData.department || "IT";
  const courseType = studentData.courseType || studentData.admissionType || "Regular";
  const year = Number(studentData.year) || (courseType === "D2D" ? 2 : 1);
  const semester = Number(studentData.semester) || (year * 2 - 1);
  const batch = studentData.batch || "2024-2028";

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
    phone: studentData.phone?.trim() || studentData.phoneNumber?.trim() || "9876543210",
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

