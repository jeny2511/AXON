import apiClient, { setAuthToken, getAuthToken } from "./apiClient";

const AUTH_USER_KEY = "axon_auth_user";
const AUTH_STUDENT_KEY = "axon_auth_student_id";
const AUTH_VOLUNTEER_KEY = "axon_volunteer_user";
const AUTH_ADMIN_KEY = "axon_admin_user";

/**
 * Get current authenticated user object from session or null
 */
export function getCurrentUser() {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Check if user is logged in
 */
export function isLoggedIn() {
  const user = getCurrentUser();
  const token = getAuthToken();
  return Boolean(user && (user.id || user._id) && user.role && token);
}

/**
 * Get active role: 'student' | 'volunteer' | 'admin' | null
 */
export function getUserRole() {
  const user = getCurrentUser();
  return user ? user.role : null;
}

/**
 * Check if user has a specific role
 */
export function hasRole(role) {
  const currentRole = getUserRole();
  return currentRole === role;
}

/**
 * Request server-side registration OTP
 */
export async function sendRegistrationOtp(email) {
  return await apiClient.post("/auth/send-otp", { email });
}

/**
 * Centralized Real API Login function for all three roles
 * Accepts identifier (Email OR Enrollment No) + password
 */
export async function loginUser(credentialsOrIdentifier, password = "") {
  let identifier = "";
  let passInput = password;

  if (typeof credentialsOrIdentifier === "object" && credentialsOrIdentifier !== null) {
    identifier = (
      credentialsOrIdentifier.identifier ||
      credentialsOrIdentifier.username ||
      credentialsOrIdentifier.enrollmentNo ||
      credentialsOrIdentifier.enrollmentNumber ||
      credentialsOrIdentifier.email ||
      credentialsOrIdentifier.emailId ||
      ""
    ).trim();
    passInput =
      credentialsOrIdentifier.password !== undefined
        ? credentialsOrIdentifier.password
        : passInput;
  } else if (typeof credentialsOrIdentifier === "string") {
    identifier = credentialsOrIdentifier.trim();
  }

  if (!identifier) {
    throw new Error("Please enter your Email ID or Enrollment Number.");
  }
  if (!passInput) {
    throw new Error("Please enter your password.");
  }

  // Call Real Backend API
  const response = await apiClient.post("/auth/login", {
    identifier,
    password: passInput,
  });

  const { token, user } = response.data;

  // Store token and user session
  setAuthToken(token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

  // Maintain backward compatibility for existing module-specific keys
  const resolvedId = user._id || user.id;
  if (user.role === "student") {
    localStorage.setItem(AUTH_STUDENT_KEY, resolvedId);
  } else if (user.role === "volunteer") {
    localStorage.setItem(AUTH_VOLUNTEER_KEY, JSON.stringify(user));
  } else if (user.role === "admin") {
    localStorage.setItem(AUTH_ADMIN_KEY, JSON.stringify(user));
  }

  window.dispatchEvent(new Event("axon-auth-change"));
  return user;
}

/**
 * Centralized Real API Student Registration
 */
export async function registerStudent(studentData) {
  const response = await apiClient.post("/auth/register", studentData);
  const { token, user } = response.data;

  // Store token and user session
  setAuthToken(token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

  const resolvedId = user._id || user.id;
  localStorage.setItem(AUTH_STUDENT_KEY, resolvedId);

  window.dispatchEvent(new Event("axon-auth-change"));
  return user;
}

/**
 * Fetch fresh current user session from backend
 */
export async function getMe() {
  try {
    const response = await apiClient.get("/auth/me");
    const user = response.data.user;
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    return user;
  } catch (err) {
    if (err.status === 401) {
      logout();
    }
    throw err;
  }
}

/**
 * Fetch live User Profile
 */
export async function getUserProfile() {
  const response = await apiClient.get("/users/profile");
  return response.data.user;
}

/**
 * Update User Profile
 */
export async function updateUserProfile(profileData) {
  const response = await apiClient.put("/users/profile", profileData);
  const updatedUser = response.data.user;
  const current = getCurrentUser() || {};
  const merged = { ...current, ...updatedUser };
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(merged));
  window.dispatchEvent(new Event("axon-auth-change"));
  return merged;
}

/**
 * Change Password
 */
export async function changeUserPassword(passwordData) {
  return await apiClient.put("/users/change-password", passwordData);
}

/**
 * Global Logout function
 */
export function logout() {
  setAuthToken(null);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_STUDENT_KEY);
  localStorage.removeItem(AUTH_VOLUNTEER_KEY);
  localStorage.removeItem(AUTH_ADMIN_KEY);
  window.dispatchEvent(new Event("axon-auth-change"));
}

// Backwards compatibility helpers
export function getCurrentStudentId() {
  const user = getCurrentUser();
  return user && user.role === "student"
    ? user._id || user.id
    : localStorage.getItem(AUTH_STUDENT_KEY) || null;
}

export function getLoggedInUser() {
  return getCurrentUser();
}

export async function loginStudent(identifier, password) {
  return await loginUser(identifier, password);
}

export async function signupStudent(studentData) {
  return await registerStudent(studentData);
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
  return Boolean(user && user.role === "student" && getAuthToken());
}

