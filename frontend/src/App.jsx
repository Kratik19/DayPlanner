
import { useState, useEffect, useRef } from "react";

import Timeline from "./Timeline";
import CalendarViews from "./CalendarViews";

import {
  dateKey,
  parseDate,
  toMinutes,
  formatTime,
} from "./dragScheduling";

import "./App.css";
import "./CalendarViews.css";
import "./DragDrop.css";

const categories = [
  "Personal",
  "Education",
  "Work",
  "Sports",
  "Health",
  "Other",
];

const priorities = ["Low", "Medium", "High"];

// ==============================
// DATE UTILITIES
// ==============================

function addDays(date, amount) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + amount
  );
}

function getWeekStart(date) {
  return addDays(
    date,
    -((date.getDay() + 6) % 7)
  );
}

function App() {

  // ==============================
  // THEME MANAGEMENT
  // ==============================

  const [theme, setTheme] = useState(() =>
    localStorage.getItem("dayplanner-theme") === "dark"
      ? "dark"
      : "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    localStorage.setItem("dayplanner-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((previous) =>
      previous === "light" ? "dark" : "light"
    );
  }

  // ==============================
  // CALENDAR STATES
  // ==============================

  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const [currentMonth, setCurrentMonth] =
    useState(new Date());

  const [calendarView, setCalendarView] =
    useState("day");

  const [dailyView, setDailyView] =
    useState("timeline");

  const [notice, setNotice] = useState("");

  // ==============================
  // TASK STORAGE
  // ==============================

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("dayplanner-tasks")
      );

      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "dayplanner-tasks",
      JSON.stringify(tasks)
    );
  }, [tasks]);

  // ==============================
  // TASK FORM STATES
  // ==============================

  const [title, setTitle] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [category, setCategory] =
    useState("Personal");

  const [priority, setPriority] =
    useState("Medium");

  const [editingId, setEditingId] =
    useState(null);

  const formRef = useRef(null);
  const titleRef = useRef(null);

  // ==============================
  // CALENDAR CALCULATIONS
  // ==============================

  const selectedKey = dateKey(selectedDate);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay =
    (new Date(year, month, 1).getDay() + 6) % 7;

  const totalDays =
    new Date(year, month + 1, 0).getDate();

  const weekStart = getWeekStart(selectedDate);

  const weekDays = Array.from(
    { length: 7 },
    (_, index) => addDays(weekStart, index)
  );

  const weekEnd = weekDays[6];

  // ==============================
  // PRODUCTIVITY CALCULATIONS
  // ==============================

  const dailyTasks = tasks
    .filter((task) => task.date === selectedKey)
    .sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

  const completedTasks = dailyTasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks =
    dailyTasks.length - completedTasks;

  const progress = dailyTasks.length
    ? Math.round(
        completedTasks / dailyTasks.length * 100
      )
    : 0;

  const weekKeys = weekDays.map(dateKey);

  const weekTasks = tasks.filter((task) =>
    weekKeys.includes(task.date)
  );

  const monthTasks = tasks.filter((task) =>
    task.date.startsWith(selectedKey.slice(0, 7))
  );

  const visibleTaskCount =
    calendarView === "week"
      ? weekTasks.length
      : calendarView === "month"
        ? monthTasks.length
        : dailyTasks.length;

  // ==============================
  // RESET TASK FORM
  // ==============================

  function resetForm() {
    setTitle("");
    setTaskDate("");
    setStartTime("");
    setEndTime("");
    setCategory("Personal");
    setPriority("Medium");
    setEditingId(null);
  }

  function focusForm() {
    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    titleRef.current?.focus({
      preventScroll: true,
    });
  }

  // ==============================
  // CALENDAR NAVIGATION
  // ==============================

  function changeMonth(direction) {
    setCurrentMonth(
      new Date(year, month + direction, 1)
    );
  }

  function selectDate(date) {
    setSelectedDate(date);
    setCurrentMonth(date);
    setNotice("");
    resetForm();
  }

  function openDay(date) {
    selectDate(date);
    setCalendarView("day");
    setDailyView("timeline");
  }

  function goToToday() {
    selectDate(new Date());
  }

  function navigateCalendar(direction) {
    let nextDate;

    if (calendarView === "day") {
      nextDate = addDays(selectedDate, direction);

    } else if (calendarView === "week") {
      nextDate = addDays(selectedDate, direction * 7);

    } else {
      const targetMonth = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + direction,
        1
      );

      const lastDay = new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth() + 1,
        0
      ).getDate();

      nextDate = new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth(),
        Math.min(selectedDate.getDate(), lastDay)
      );
    }

    selectDate(nextDate);
  }

  function getCalendarTitle() {
    if (calendarView === "month") {
      return selectedDate.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });
    }

    if (calendarView === "week") {
      const start = weekStart.toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );

      const end = weekEnd.toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );

      return `${start} – ${end}`;
    }

    return selectedDate.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // ==============================
  // ADD OR UPDATE TASK
  // ==============================

  function saveTask(event) {
    event.preventDefault();

    if (!title.trim() || !startTime || !endTime) {
      alert("Please fill in all required fields.");
      return;
    }

    if (endTime <= startTime) {
      alert("End time must be after start time.");
      return;
    }

    const destinationDate = taskDate || selectedKey;

    const taskData = {
      title: title.trim(),
      date: destinationDate,
      startTime,
      endTime,
      category,
      priority,
    };

    if (editingId !== null) {
      setTasks((previous) =>
        previous.map((task) =>
          task.id === editingId
            ? { ...task, ...taskData }
            : task
        )
      );

      setNotice("Task updated successfully.");

    } else {
      const newTask = {
        id: crypto.randomUUID(),
        ...taskData,
        completed: false,
      };

      setTasks((previous) => [
        ...previous,
        newTask,
      ]);

      setNotice("New task added successfully.");
    }

    const newDate = parseDate(destinationDate);

    setSelectedDate(newDate);
    setCurrentMonth(newDate);

    resetForm();
  }

  // ==============================
  // EDIT EXISTING TASK
  // ==============================

  function editTask(task) {
    const date = parseDate(task.date);

    setSelectedDate(date);
    setCurrentMonth(date);

    setEditingId(task.id);
    setTitle(task.title);
    setTaskDate(task.date);
    setStartTime(task.startTime);
    setEndTime(task.endTime);
    setCategory(task.category);
    setPriority(task.priority);

    setNotice("");
    focusForm();
  }

  // ==============================
  // QUICK TASK CREATION
  // ==============================

  function addFromCalendar(date, hour = 9) {
    selectDate(date);

    const start = formatTime(hour * 60);

    const end =
      hour === 23
        ? "23:59"
        : formatTime((hour + 1) * 60);

    setTaskDate(dateKey(date));
    setStartTime(start);
    setEndTime(end);

    focusForm();
  }

  // ==============================
  // DRAG AND DROP SCHEDULING
  // ==============================

  function moveTask(id, destinationDate, newStartMinutes) {
    const task = tasks.find(
      (item) => String(item.id) === String(id)
    );

    if (!task) return;

    const originalStart = toMinutes(task.startTime);
    const originalEnd = toMinutes(task.endTime);

    const duration = originalEnd - originalStart;

    const newStart =
      newStartMinutes === null
        ? originalStart
        : newStartMinutes;

    const newEnd = newStart + duration;

    // Prevent tasks from crossing midnight.

    if (
      !Number.isInteger(newStart) ||
      newStart < 0 ||
      duration <= 0 ||
      newEnd > 1439
    ) {
      setNotice(
        "Cannot move this task: it would extend beyond midnight. Choose an earlier time."
      );

      return;
    }

    const destinationKey = dateKey(destinationDate);

    const updatedTask = {
      ...task,
      date: destinationKey,
      startTime: formatTime(newStart),
      endTime: formatTime(newEnd),
    };

    setTasks((previous) =>
      previous.map((item) =>
        item.id === task.id
          ? updatedTask
          : item
      )
    );

    if (editingId === task.id) {
      resetForm();
    }

    const formattedDate =
      destinationDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });

    setNotice(
      `${task.title} moved to ${formattedDate}, ${updatedTask.startTime} – ${updatedTask.endTime}.`
    );
  }

  // ==============================
  // COMPLETE TASK
  // ==============================

  function toggleTask(id) {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
            }
          : task
      )
    );
  }

  // ==============================
  // DELETE TASK
  // ==============================

  function deleteTask(id) {
    if (
      !window.confirm(
        "Are you sure you want to delete this task?"
      )
    ) {
      return;
    }

    setTasks((previous) =>
      previous.filter((task) => task.id !== id)
    );

    if (editingId === id) {
      resetForm();
    }

    setNotice("Task deleted successfully.");
  }

  // ==============================
  // WEBSITE INTERFACE
  // ==============================

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">
          <span className="brand-icon">D</span>
          <h2>DayPlanner</h2>
        </div>

        <p className="tagline">
          Make every day count.
        </p>

        <p className="nav-label">WORKSPACE</p>

        <nav>

          <button
            className={
              calendarView === "day" &&
              dailyView === "list"
                ? "nav-active"
                : ""
            }
            onClick={() => {
              setCalendarView("day");
              setDailyView("list");
            }}
          >
            ▦ Dashboard
          </button>

          <button
            className={
              calendarView === "day" &&
              dailyView === "timeline"
                ? "nav-active"
                : ""
            }
            onClick={() => openDay(new Date())}
          >
            ◷ Today's Schedule
          </button>

          <button
            className={
              calendarView === "week"
                ? "nav-active"
                : ""
            }
            onClick={() => setCalendarView("week")}
          >
            ▤ Weekly Calendar
          </button>

          <button
            className={
              calendarView === "month"
                ? "nav-active"
                : ""
            }
            onClick={() => setCalendarView("month")}
          >
            ▦ Monthly Calendar
          </button>

        </nav>

        <div className="sidebar-footer">
          <p>Small steps every day.</p>
          <span>Build better habits.</span>
        </div>

      </aside>

      {/* MAIN DASHBOARD */}

      <main className="main-content">

        <header className="header">

          <div>
            <p className="subtitle">
              YOUR PRODUCTIVITY SPACE
            </p>

            <h1>My Dashboard</h1>

            <p>Plan your day. Achieve your goals.</p>
          </div>

          <div className="header-actions">

            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
            >
              <span className="theme-icon">
                {theme === "light" ? "☾" : "☀"}
              </span>

              <span>
                {theme === "light"
                  ? "Dark Mode"
                  : "Light Mode"}
              </span>
            </button>

            <button
              className="primary-btn"
              onClick={goToToday}
            >
              Today
            </button>

          </div>

        </header>

        {/* PRODUCTIVITY STATISTICS */}

        <p className="stats-date-label">
          Daily overview ·{" "}
          {selectedDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <section className="stats-grid">

          <div className="stat-card">
            <p>Total Tasks</p>
            <h2 className="purple">{dailyTasks.length}</h2>
            <span>Scheduled activities</span>
          </div>

          <div className="stat-card">
            <p>Completed</p>
            <h2 className="green">{completedTasks}</h2>
            <span>Tasks accomplished</span>
          </div>

          <div className="stat-card">
            <p>Pending</p>
            <h2 className="orange">{pendingTasks}</h2>
            <span>Remaining activities</span>
          </div>

          <div className="stat-card">
            <p>Daily Progress</p>
            <h2 className="purple">{progress}%</h2>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

        </section>

        <section className="dashboard-grid advanced-dashboard">

          <div className="left-panel">

            {/* MINI CALENDAR */}

            <div className="panel calendar">

              <div className="panel-heading">

                <h3>
                  {currentMonth.toLocaleDateString(
                    "en-IN",
                    {
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </h3>

                <div className="month-controls">

                  <button
                    onClick={() => changeMonth(-1)}
                    aria-label="Previous month"
                  >
                    ‹
                  </button>

                  <button
                    onClick={() => changeMonth(1)}
                    aria-label="Next month"
                  >
                    ›
                  </button>

                </div>

              </div>

              <div className="calendar-grid">

                {[
                  "Mon", "Tue", "Wed", "Thu",
                  "Fri", "Sat", "Sun",
                ].map((day) => (
                  <span className="weekday" key={day}>
                    {day}
                  </span>
                ))}

                {Array.from(
                  { length: firstDay },
                  (_, index) => (
                    <span key={`empty-${index}`} />
                  )
                )}

                {Array.from(
                  { length: totalDays },
                  (_, index) => {
                    const day = index + 1;

                    const date = new Date(year, month, day);

                    const key = dateKey(date);

                    const hasTasks = tasks.some(
                      (task) => task.date === key
                    );

                    return (
                      <button
                        key={day}
                        className={`calendar-day
                          ${key === selectedKey
                            ? "selected" : ""}
                          ${key === dateKey(new Date())
                            ? "today" : ""}
                        `}
                        onClick={() => selectDate(date)}
                        aria-pressed={key === selectedKey}
                        aria-label={date.toDateString()}
                      >

                        {day}

                        {hasTasks && (
                          <span className="task-dot" />
                        )}

                      </button>
                    );
                  }
                )}

              </div>

            </div>

            {/* TASK CREATION AND EDITING FORM */}

            <div
              ref={formRef}
              className={`panel ${
                editingId !== null
                  ? "editing-panel"
                  : ""
              }`}
            >

              <h3>
                {editingId !== null
                  ? "Edit Task"
                  : "Add New Task"}
              </h3>

              <p className="form-date">
                {parseDate(
                  taskDate || selectedKey
                ).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>

              <form
                className="task-form"
                onSubmit={saveTask}
              >

                <label htmlFor="task-name">
                  Task Name
                </label>

                <input
                  id="task-name"
                  ref={titleRef}
                  type="text"
                  placeholder="What are you planning?"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  required
                />

                {/* NEW DATE FIELD */}

                <label htmlFor="task-date">
                  Task Date
                </label>

                <input
                  id="task-date"
                  type="date"
                  value={taskDate || selectedKey}
                  onChange={(e) =>
                    setTaskDate(e.target.value)
                  }
                  required
                />

                <div className="form-row">

                  <div>

                    <label htmlFor="start-time">
                      Start Time
                    </label>

                    <input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) =>
                        setStartTime(e.target.value)
                      }
                      required
                    />

                  </div>

                  <div>

                    <label htmlFor="end-time">
                      End Time
                    </label>

                    <input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) =>
                        setEndTime(e.target.value)
                      }
                      required
                    />

                  </div>

                </div>

                <label htmlFor="category">
                  Category
                </label>

                <select
                  id="category"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                >
                  {categories.map((item) => (
                    <option key={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <label htmlFor="priority">
                  Priority
                </label>

                <select
                  id="priority"
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value)
                  }
                >
                  {priorities.map((item) => (
                    <option key={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="primary-btn"
                >
                  {editingId !== null
                    ? "✓ Save Changes"
                    : "+ Add Task"}
                </button>

                {editingId !== null && (
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={resetForm}
                  >
                    Cancel Editing
                  </button>
                )}

              </form>

            </div>

          </div>

          {/* MAIN CALENDAR PANEL */}

          <div className="panel schedule-panel">

            <div className="schedule-header">

              <div>

                <p className="subtitle">
                  YOUR PLANNER
                </p>

                <h2>
                  {calendarView === "day"
                    ? "Daily Schedule"
                    : calendarView === "week"
                      ? "Weekly Schedule"
                      : "Monthly Calendar"}
                </h2>

                <p className="schedule-description">
                  {visibleTaskCount} activities planned
                  for this {calendarView}
                </p>

              </div>

              <button
                className="primary-btn"
                onClick={() => {
                  resetForm();
                  setNotice("");
                  focusForm();
                }}
              >
                + New Task
              </button>

            </div>

            {/* DAY, WEEK AND MONTH OPTIONS */}

            <div className="calendar-toolbar">

              <div className="period-switcher">

                {["day", "week", "month"].map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={
                      calendarView === item
                        ? "period-active"
                        : ""
                    }
                    onClick={() => setCalendarView(item)}
                    aria-pressed={calendarView === item}
                  >
                    {item.charAt(0).toUpperCase() +
                      item.slice(1)}
                  </button>
                ))}

              </div>

              <div className="calendar-navigation">

                <button
                  onClick={() => navigateCalendar(-1)}
                  aria-label={`Previous ${calendarView}`}
                >
                  ‹
                </button>

                <button onClick={goToToday}>
                  Today
                </button>

                <button
                  onClick={() => navigateCalendar(1)}
                  aria-label={`Next ${calendarView}`}
                >
                  ›
                </button>

              </div>

            </div>

            <h3 className="calendar-period-title">
              {getCalendarTitle()}
            </h3>

            {/* TASK STATUS MESSAGE */}

            <p
              className="schedule-notice"
              role="status"
            >
              {notice}
            </p>

            {/* LIST AND TIMELINE SWITCHER */}

            {calendarView === "day" && (

              <div className="view-switcher">

                <button
                  className={
                    dailyView === "list"
                      ? "active-view"
                      : ""
                  }
                  onClick={() => setDailyView("list")}
                  aria-pressed={dailyView === "list"}
                >
                  ☷ List View
                </button>

                <button
                  className={
                    dailyView === "timeline"
                      ? "active-view"
                      : ""
                  }
                  onClick={() =>
                    setDailyView("timeline")
                  }
                  aria-pressed={dailyView === "timeline"}
                >
                  ◷ Timeline
                </button>

              </div>

            )}

            {/* FULL MONTHLY CALENDAR */}

            {calendarView === "month" && (

              <CalendarViews
                selectedDate={selectedDate}
                tasks={tasks}
                onSelectDate={openDay}
                onAdd={addFromCalendar}
                onEdit={editTask}
                onMove={moveTask}
              />

            )}

            {/* DAILY AND WEEKLY TIMELINE */}

            {(calendarView === "week" ||
              (calendarView === "day" &&
                dailyView === "timeline")) && (

              <Timeline
                days={
                  calendarView === "week"
                    ? weekDays
                    : [selectedDate]
                }
                tasks={tasks}
                onEdit={editTask}
                onAdd={addFromCalendar}
                onSelectDate={openDay}
                onMove={moveTask}
              />

            )}

            {/* DAILY TASK LIST */}

            {calendarView === "day" &&
              dailyView === "list" && (

              <div className="task-list">

                {dailyTasks.length === 0 ? (

                  <div className="empty-state">

                    <div className="empty-icon">▤</div>

                    <h3>No tasks scheduled</h3>

                    <p>
                      Add your first task to start
                      planning your day.
                    </p>

                  </div>

                ) : (

                  dailyTasks.map((task) => (

                    <div
                      key={task.id}
                      className={`task-card ${
                        task.completed
                          ? "completed"
                          : ""
                      }`}
                    >

                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() =>
                          toggleTask(task.id)
                        }
                        aria-label={`Complete ${task.title}`}
                      />

                      <div className="task-details">

                        <p className="task-time">
                          {task.startTime} – {task.endTime}
                        </p>

                        <h4>{task.title}</h4>

                        <div className="task-tags">

                          <span className="category-tag">
                            {task.category}
                          </span>

                          <span
                            className={`priority ${task.priority.toLowerCase()}`}
                          >
                            {task.priority} Priority
                          </span>

                        </div>

                      </div>

                      <div className="task-actions">

                        <button
                          className="edit-btn"
                          onClick={() => editTask(task)}
                          aria-label={`Edit ${task.title}`}
                          title="Edit task"
                        >
                          ✎
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() =>
                            deleteTask(task.id)
                          }
                          aria-label={`Delete ${task.title}`}
                          title="Delete task"
                        >
                          ×
                        </button>

                      </div>

                    </div>

                  ))

                )}

              </div>

            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;
