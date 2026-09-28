function filterEvents(events, status) {
  if (!Array.isArray(events)) {
    return [];
  }

  if (!status) {
    return events;
  }

  return events.filter((event) => event.status === status);
}

export default filterEvents;