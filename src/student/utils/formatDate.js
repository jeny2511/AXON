// Simple date and time formatting utilities
export function formatDate(dateString) {
  if (!dateString) return "";
  try {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateTimeString) {
  if (!dateTimeString) return "";
  try {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateTimeString).toLocaleDateString("en-US", options);
  } catch {
    return dateTimeString;
  }
}

export function formatTimeRange(startTime, endTime) {
  if (!startTime) return "";
  if (!endTime) return startTime;
  return `${startTime} - ${endTime}`;
}

export default formatDate;
