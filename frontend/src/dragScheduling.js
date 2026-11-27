
export const HOUR_HEIGHT = 64;

const DRAG_TYPE = "application/x-dayplanner-task";

export const categoryColors = {
  Personal: "#64748b",
  Education: "#6366f1",
  Work: "#9333ea",
  Sports: "#ea580c",
  Health: "#16a34a",
  Other: "#0891b2",
};

export function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

export function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    mins
  ).padStart(2, "0")}`;
}

export function startTaskDrag(event, task) {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(DRAG_TYPE, String(task.id));
}

export function isTaskDrag(event) {
  return Array.from(event.dataTransfer.types)
    .includes(DRAG_TYPE);
}

export function getDraggedTaskId(event) {
  return event.dataTransfer.getData(DRAG_TYPE);
}

// Calculate drop time in 15-minute intervals

export function getDropMinutes(event) {
  const rectangle =
    event.currentTarget.getBoundingClientRect();

  const position = event.clientY - rectangle.top;

  const minutes = (position / HOUR_HEIGHT) * 60;

  return Math.max(
    0,
    Math.min(1425, Math.floor(minutes / 15) * 15)
  );
}
