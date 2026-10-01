// Simple event filtering utilities
export function filterEventsByStatus(events, status) {
  if (!Array.isArray(events)) return [];
  if (!status || status === "all") return events;
  return events.filter((event) => event.status === status);
}

export function filterEventsBySearch(events, searchTerm) {
  if (!Array.isArray(events)) return [];
  if (!searchTerm || !searchTerm.trim()) return events;

  const term = searchTerm.toLowerCase().trim();
  return events.filter((event) => {
    const nameMatch = event.name?.toLowerCase().includes(term);
    const descMatch = event.description?.toLowerCase().includes(term);
    const venueMatch = event.venue?.toLowerCase().includes(term);
    const catMatch = event.category?.toLowerCase().includes(term);
    return nameMatch || descMatch || venueMatch || catMatch;
  });
}

export default filterEventsByStatus;