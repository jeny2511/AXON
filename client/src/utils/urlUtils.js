/**
 * Resolves an asset URL (poster, rulebook PDF, photo) to an absolute URL
 */
export function getAssetUrl(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== "string") return "";
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return "";

  // Already a full URL (http, https, blob, data)
  if (/^(https?:|\/\/|blob:|data:)/i.test(trimmed)) {
    return trimmed;
  }

  // Base backend URL
  const backendBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api")
    .replace(/\/api\/?$/, "");

  // Clean relative path
  let relative = trimmed;
  if (relative.startsWith("/uploads/")) {
    relative = relative.substring(9);
  } else if (relative.startsWith("uploads/")) {
    relative = relative.substring(8);
  } else if (relative.startsWith("/")) {
    relative = relative.substring(1);
  }

  // Encode path components while avoiding double encoding
  const encodedPath = relative
    .split("/")
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join("/");

  return `${backendBase}/uploads/${encodedPath}`;
}

export default getAssetUrl;
