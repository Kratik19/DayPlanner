
import { useEffect, useRef, useState } from "react";

import {
  HOUR_HEIGHT,
  categoryColors,
  dateKey,
  toMinutes,
  formatTime,
  startTaskDrag,
  isTaskDrag,
  getDraggedTaskId,
  getDropMinutes,
} from "./dragScheduling";

function formatHour(hour) {
  return `${hour % 12 || 12} ${hour >= 12 ? "PM" : "AM"}`;
}

// Arrange overlapping tasks side by side

function arrangeTasks(tasks) {
  const sorted = tasks
    .map((task) => ({
      ...task,
      start: toMinutes(task.startTime),
      end: toMinutes(task.endTime),
    }))
    .sort((a, b) => a.start - b.start);

  const groups = [];
  let groupEnd = -1;

  for (const task of sorted) {
    if (task.start >= groupEnd) {
      groups.push([]);
      groupEnd = task.end;
    } else {
      groupEnd = Math.max(groupEnd, task.end);
    }

    groups[groups.length - 1].push(task);
  }

  return groups.flatMap((group) => {
    const lanes = [];

    const positioned = group.map((task) => {
      let lane = lanes.findIndex(
        (end) => end <= task.start
      );

      if (lane === -1) {
        lane = lanes.length;
      }

      lanes[lane] = task.end;

      return { ...task, lane };
    });

    return positioned.map((task) => ({
      ...task,
      columns: lanes.length,
    }));
  });
}

function Timeline({
  tasks,
  days,
  onEdit,
  onAdd,
  onSelectDate,
  onMove,
}) {
  const scrollRef = useRef(null);

  const [now, setNow] = useState(() => new Date());
  const [draggedId, setDraggedId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  // Update current time

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const todayKey = dateKey(now);

  const minutesNow =
    now.getHours() * 60 + now.getMinutes();

  const firstDateKey = dateKey(days[0]);
  const dayCount = days.length;

  const visibleKeys = days.map(dateKey);

  const visibleTasks = tasks.filter((task) =>
    visibleKeys.includes(task.date)
  );

  const firstHour = visibleTasks.length
    ? Math.max(
        0,
        Math.floor(
          Math.min(
            ...visibleTasks.map((task) =>
              toMinutes(task.startTime)
            )
          ) / 60
        ) - 1
      )
    : 6;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        firstHour * HOUR_HEIGHT;
    }
  }, [firstDateKey, dayCount, firstHour]);

  // Start dragging

  function handleDragStart(event, task) {
    startTaskDrag(event, task);
    setDraggedId(task.id);
  }

  // Clear dragging state

  function handleDragEnd() {
    setDraggedId(null);
    setDropTarget(null);
  }

  // Highlight the destination time

  function handleDragOver(event, date) {
    if (!isTaskDrag(event)) return;

    event.preventDefault();

    event.dataTransfer.dropEffect = "move";

    const minutes = getDropMinutes(event);
    const key = dateKey(date);

    setDropTarget((previous) => {
      if (
        previous?.key === key &&
        previous?.minutes === minutes
      ) {
        return previous;
      }

      return { key, minutes };
    });
  }

  function handleDragLeave(event) {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }

    setDropTarget(null);
  }

  // Move the activity

  function handleDrop(event, date) {
    if (!isTaskDrag(event)) return;

    event.preventDefault();

    const id = getDraggedTaskId(event);
    const minutes = getDropMinutes(event);

    if (id) {
      onMove(id, date, minutes);
    }

    handleDragEnd();
  }

  return (
    <div className="timeline-container">

      <p className="timeline-hint">
        Drag activities to reschedule them.
        Click an empty slot to add a new task.
        Click an activity to edit its details.
      </p>

      <div className="timeline-legend">
        {Object.entries(categoryColors).map(
          ([category, color]) => (
            <span key={category}>
              <i style={{ background: color }} />
              {category}
            </span>
          )
        )}
      </div>

      <div
        className="planner-timeline-scroll"
        ref={scrollRef}
      >
        <div
          className={`planner-timeline ${
            dayCount === 7 ? "week-timeline" : ""
          }`}
          style={{ "--day-count": dayCount }}
        >

          {/* Calendar header */}

          <div className="planner-time-header">

            <div className="planner-timezone">
              Local
            </div>

            {days.map((date) => (
              <button
                type="button"
                key={dateKey(date)}
                className={`planner-day-heading ${
                  dateKey(date) === todayKey
                    ? "heading-today"
                    : ""
                }`}
                onClick={() => onSelectDate(date)}
              >
                <span>
                  {date.toLocaleDateString("en-IN", {
                    weekday: "short",
                  })}
                </span>

                <strong>{date.getDate()}</strong>
              </button>
            ))}

          </div>

          <div className="planner-time-body">

            {/* Time labels */}

            <div className="planner-time-labels">

              {Array.from({ length: 24 }, (_, hour) => (
                <div
                  key={hour}
                  className="planner-hour-label"
                  style={{ height: HOUR_HEIGHT }}
                >
                  {formatHour(hour)}
                </div>
              ))}

            </div>

            {/* Calendar columns */}

            {days.map((date) => {
              const key = dateKey(date);

              const events = arrangeTasks(
                tasks.filter((task) => task.date === key)
              );

              return (
                <div
                  key={key}
                  className={`planner-day-column ${
                    dropTarget?.key === key
                      ? "drag-target-column"
                      : ""
                  }`}
                  onDragOver={(event) =>
                    handleDragOver(event, date)
                  }
                  onDragLeave={handleDragLeave}
                  onDrop={(event) =>
                    handleDrop(event, date)
                  }
                >

                  {/* Empty time slots */}

                  {Array.from({ length: 24 }, (_, hour) => (
                    <button
                      type="button"
                      key={hour}
                      className="planner-hour-slot"
                      style={{ height: HOUR_HEIGHT }}
                      onClick={() => onAdd(date, hour)}
                      aria-label={`Add task on ${date.toDateString()} at ${formatHour(hour)}`}
                    >
                      <span>+ Add</span>
                    </button>
                  ))}

                  {/* Scheduled tasks */}

                  {events.map((task) => (
                    <button
                      type="button"
                      key={task.id}
                      draggable
                      onDragStart={(event) =>
                        handleDragStart(event, task)
                      }
                      onDragEnd={handleDragEnd}
                      className={`planner-event draggable-task
                        ${task.completed
                          ? "event-completed" : ""}
                        ${draggedId === task.id
                          ? "task-dragging" : ""}
                      `}
                      style={{
                        top:
                          (task.start / 60) *
                          HOUR_HEIGHT + 1,

                        height: Math.max(
                          1,
                          ((task.end - task.start) / 60) *
                            HOUR_HEIGHT - 2
                        ),

                        left: `calc(${
                          task.lane / task.columns * 100
                        }% + 3px)`,

                        width: `calc(${
                          100 / task.columns
                        }% - 6px)`,

                        "--event-color":
                          categoryColors[task.category] ||
                          categoryColors.Other,
                      }}
                      onClick={() => onEdit(task)}
                      title={`${task.title} | ${task.startTime} - ${task.endTime}`}
                      aria-label={`Edit ${task.title}`}
                    >

                      <strong>{task.title}</strong>

                      <span>
                        {task.startTime} – {task.endTime}
                      </span>

                      <small>
                        {task.completed
                          ? "✓ Completed"
                          : task.category}
                      </small>

                    </button>
                  ))}

                  {/* Drop time preview */}

                  {dropTarget?.key === key && (
                    <div
                      className="drop-time-preview"
                      style={{
                        top:
                          dropTarget.minutes / 60 *
                          HOUR_HEIGHT,
                      }}
                    >
                      <span>
                        Move to {formatTime(dropTarget.minutes)}
                      </span>
                    </div>
                  )}

                  {/* Current time indicator */}

                  {key === todayKey && (
                    <div
                      className="current-time-line"
                      style={{
                        top: minutesNow / 60 * HOUR_HEIGHT,
                      }}
                    >
                      <span />
                    </div>
                  )}

                </div>
              );
            })}

          </div>

        </div>
      </div>

    </div>
  );
}

export default Timeline;
