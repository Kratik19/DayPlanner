
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

function CalendarViews({
  selectedDate,
  tasks,
  onSelectDate,
  onAdd,
  onEdit,
}) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const firstDay = new Date(year, month, 1);

  const offset = (firstDay.getDay() + 6) % 7;

  const totalDays = new Date(
    year, month + 1, 0
  ).getDate();

  const totalCells =
    Math.ceil((offset + totalDays) / 7) * 7;

  const dates = Array.from(
    { length: totalCells },
    (_, index) =>
      new Date(year, month, index - offset + 1)
  );

  const todayKey = dateKey(new Date());
  const selectedKey = dateKey(selectedDate);

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
              `}
            >
              <div className="month-cell-header">

                <button
                  type="button"
                  className={`month-date
                    ${key === todayKey ? "month-today" : ""}
                  `}
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
                  key={task.id}
                  className={`month-event
                    ${task.completed ? "event-completed" : ""}
                  `}
                  style={{
                    "--event-color":
                      colors[task.category] || colors.Other,
                  }}
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
