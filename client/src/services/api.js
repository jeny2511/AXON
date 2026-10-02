/**
 * AXON Centralized API Client
 * Wraps browser fetch with automatic JWT Bearer token attachment,
 * JSON serialization, and standardized error handling.
 */

const BASE_URL = "/api";
const TOKEN_KEY = "axon_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * Core HTTP Request Dispatcher
 */
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = { ...options.headers };

  // Attach JWT Bearer token if available
  const token = getToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Set default JSON Content-Type unless FormData is being transmitted
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Parse JSON response body if present
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      // Handle Unauthorized (Session Expired)
      if (response.status === 401) {
        removeToken();
        localStorage.removeItem("axon_auth_user");
        window.dispatchEvent(new Event("axon-auth-change"));
      }

      const errorMessage = data?.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`❌ [API Error] ${options.method || "GET"} ${url}:`, error.message);
    throw error;
  }
}

// Convenient HTTP Verb Shortcuts
export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: "DELETE" }),
};

export default api;
