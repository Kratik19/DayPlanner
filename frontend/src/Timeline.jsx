
import { useEffect, useRef, useState } from "react";

const HOUR_HEIGHT = 64;

const colors = {
  Personal: "#64748b",
  Education: "#6366f1",
  Work: "#9333ea",
  Sports: "#ea580c",
  Health: "#16a34a",
  Other: "#0891b2",
};

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatHour(hour) {
  return `${hour % 12 || 12} ${hour >= 12 ? "PM" : "AM"}`;
}

// Arrange overlapping tasks into separate columns

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
}) {
  const scrollRef = useRef(null);

  const [now, setNow] = useState(() => new Date());

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

  return (
    <div className="timeline-container">

      <p className="timeline-hint">
        Click a time slot to add an activity.
        Click an existing activity to edit it.
      </p>

      <div className="timeline-legend">
        {Object.entries(colors).map(
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
          className={`planner-timeline
            ${dayCount === 7 ? "week-timeline" : ""}
          `}
          style={{
            "--day-count": dayCount,
          }}
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
                className={`planner-day-heading
                  ${dateKey(date) === todayKey
                    ? "heading-today" : ""}
                `}
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

          {/* Hourly timeline */}

          <div className="planner-time-body">

            <div className="planner-time-labels">

              {Array.from(
                { length: 24 },
                (_, hour) => (
                  <div
                    className="planner-hour-label"
                    key={hour}
                    style={{ height: HOUR_HEIGHT }}
                  >
                    {formatHour(hour)}
                  </div>
                )
              )}

            </div>

            {days.map((date) => {
              const key = dateKey(date);

              const events = arrangeTasks(
                tasks.filter(
                  (task) => task.date === key
                )
              );

              return (
                <div
                  className="planner-day-column"
                  key={key}
                >

                  {Array.from(
                    { length: 24 },
                    (_, hour) => (
                      <button
                        className="planner-hour-slot"
                        type="button"
                        key={hour}
                        style={{ height: HOUR_HEIGHT }}
                        onClick={() => onAdd(date, hour)}
                        aria-label={`Add task on ${date.toDateString()} at ${formatHour(hour)}`}
                      >
                        <span>+ Add</span>
                      </button>
                    )
                  )}

                  {/* Scheduled activities */}

                  {events.map((task) => (
                    <button
                      type="button"
                      key={task.id}
                      className={`planner-event
                        ${task.completed
                          ? "event-completed" : ""}
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
                          colors[task.category] ||
                          colors.Other,
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

                  {/* Current time indicator */}

                  {key === todayKey && (
                    <div
                      className="current-time-line"
                      style={{
                        top:
                          (minutesNow / 60) * HOUR_HEIGHT,
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
