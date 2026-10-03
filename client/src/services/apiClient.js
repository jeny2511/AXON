const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const AUTH_TOKEN_KEY = "axon_auth_token";

/**
 * Get stored JWT auth token
 */
export const getAuthToken = () => {
  return localStorage.getItem(AUTH_TOKEN_KEY) || null;
};

/**
 * Store JWT auth token
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

/**
 * Base HTTP Request Handler using native Fetch
 */
async function request(endpoint, options = {}) {
  // Strip leading '/api' or '/api/' if passed in endpoint to ensure uniform /api base path
  let cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (cleanEndpoint.startsWith("/api/")) {
    cleanEndpoint = cleanEndpoint.substring(4);
  } else if (cleanEndpoint === "/api") {
    cleanEndpoint = "";
  }

  // Serialize query parameters if options.params is provided
  let queryString = "";
  if (options.params && typeof options.params === "object") {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value);
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      queryString = (cleanEndpoint.includes("?") ? "&" : "?") + qs;
    }
  }

  const url = `${API_BASE_URL}${cleanEndpoint.startsWith("/") ? cleanEndpoint : `/${cleanEndpoint}`}${queryString}`;

  const headers = {
    ...options.headers,
  };

  // Delete manual Content-Type for FormData so fetch sets multipart boundary automatically
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  } else if (!headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // Attach Bearer JWT token if user is logged in
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg =
        data.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export const apiClient = {
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
  delete: (endpoint, options = {}) =>
    request(endpoint, { ...options, method: "DELETE" }),
};

export default apiClient;
