
import { useState } from "react";

import {
  categoryColors,
  dateKey,
  startTaskDrag,
  isTaskDrag,
  getDraggedTaskId,
} from "./dragScheduling";

function CalendarViews({
  selectedDate,
  tasks,
  onSelectDate,
  onAdd,
  onEdit,
  onMove,
}) {
  const [draggedId, setDraggedId] = useState(null);
  const [dropDate, setDropDate] = useState(null);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;

  const totalDays =
    new Date(year, month + 1, 0).getDate();

  const totalCells =
    Math.ceil((offset + totalDays) / 7) * 7;

  const dates = Array.from(
    { length: totalCells },
    (_, index) =>
      new Date(year, month, index - offset + 1)
  );

  const todayKey = dateKey(new Date());
  const selectedKey = dateKey(selectedDate);

  function handleDragStart(event, task) {
    startTaskDrag(event, task);
    setDraggedId(task.id);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDropDate(null);
  }

  function handleDragOver(event, key) {
    if (!isTaskDrag(event)) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropDate(key);
  }

  function handleDragLeave(event) {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }

    setDropDate(null);
  }

  function handleDrop(event, date) {
    if (!isTaskDrag(event)) return;

    event.preventDefault();

    const id = getDraggedTaskId(event);

    if (id) {
      // Null means preserve the original timing.
      onMove(id, date, null);
    }

    handleDragEnd();
  }

  return (
    <div className="month-calendar-scroll">

      <div className="month-calendar">

        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          .map((day) => (
            <div
              className="month-weekday"
              key={day}
            >
              {day}
            </div>
          ))}

        {dates.map((date) => {
          const key = dateKey(date);

          const dayTasks = tasks
            .filter((task) => task.date === key)
            .sort((a, b) =>
              a.startTime.localeCompare(b.startTime)
            );

          return (
            <div
              key={key}
              className={`month-cell
                ${date.getMonth() !== month
                  ? "outside-month" : ""}
                ${key === selectedKey
                  ? "month-selected" : ""}
                ${dropDate === key
                  ? "month-drop-target" : ""}
              `}
              onDragOver={(event) =>
                handleDragOver(event, key)
              }
              onDragLeave={handleDragLeave}
              onDrop={(event) =>
                handleDrop(event, date)
              }
            >

              <div className="month-cell-header">

                <button
                  type="button"
                  className={`month-date ${
                    key === todayKey ? "month-today" : ""
                  }`}
                  onClick={() => onSelectDate(date)}
                  aria-label={`Open ${date.toDateString()}`}
                >
                  {date.getDate()}
                </button>

                <button
                  type="button"
                  className="month-add"
                  onClick={() => onAdd(date, 9)}
                  aria-label={`Add task on ${date.toDateString()}`}
                >
                  +
                </button>

              </div>

              {dayTasks.slice(0, 3).map((task) => (
                <button
                  type="button"
                  draggable
                  key={task.id}
                  className={`month-event draggable-task
                    ${task.completed
                      ? "event-completed" : ""}
                    ${draggedId === task.id
                      ? "task-dragging" : ""}
                  `}
                  style={{
                    "--event-color":
                      categoryColors[task.category] ||
                      categoryColors.Other,
                  }}
                  onDragStart={(event) =>
                    handleDragStart(event, task)
                  }
                  onDragEnd={handleDragEnd}
                  onClick={() => onEdit(task)}
                  title={`${task.startTime} - ${task.title}`}
                >
                  <small>{task.startTime}</small>
                  <span>{task.title}</span>
                </button>
              ))}

              {dayTasks.length > 3 && (
                <button
                  type="button"
                  className="more-events"
                  onClick={() => onSelectDate(date)}
                >
                  +{dayTasks.length - 3} more
                </button>
              )}

            </div>
          );
        })}

      </div>

    </div>
  );
}

export default CalendarViews;
