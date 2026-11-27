
import { useState, useEffect } from "react";
import "./App.css";

// Convert dates into YYYY-MM-DD format
function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function App() {
  // =============================
  // LIGHT AND DARK THEME
  // =============================

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("dayplanner-theme") === "dark"
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("dayplanner-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((previousTheme) =>
      previousTheme === "light" ? "dark" : "light"
    );
  }

  // =============================
  // CALENDAR STATES
  // =============================

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // =============================
  // TASK STATES
  // =============================

  const [tasks, setTasks] = useState(() => {
    try {
      const savedTasks = JSON.parse(
        localStorage.getItem("dayplanner-tasks")
      );

      return Array.isArray(savedTasks) ? savedTasks : [];
    } catch {
      return [];
    }
  });

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [category, setCategory] = useState("Personal");
  const [priority, setPriority] = useState("Medium");

  // Save tasks automatically
  useEffect(() => {
    localStorage.setItem(
      "dayplanner-tasks",
      JSON.stringify(tasks)
    );
  }, [tasks]);

  // =============================
  // CALENDAR CALCULATIONS
  // =============================

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const selectedKey = dateKey(selectedDate);

  // Filter and sort tasks for selected date
  const dailyTasks = tasks
    .filter((task) => task.date === selectedKey)
    .sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

  // =============================
  // PRODUCTIVITY CALCULATIONS
  // =============================

  const completedTasks = dailyTasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks =
    dailyTasks.length - completedTasks;

  const progress = dailyTasks.length
    ? Math.round(
        (completedTasks / dailyTasks.length) * 100
      )
    : 0;

  // =============================
  // CALENDAR FUNCTIONS
  // =============================

  function changeMonth(direction) {
    setCurrentMonth(
      new Date(year, month + direction, 1)
    );
  }

  function goToToday() {
    const today = new Date();

    setSelectedDate(today);
    setCurrentMonth(today);
  }

  // =============================
  // ADD NEW TASK
  // =============================

  function addTask(event) {
    event.preventDefault();

    if (!title.trim() || !startTime || !endTime) {
      alert("Please fill in all required fields.");
      return;
    }

    if (endTime <= startTime) {
      alert("End time must be after start time.");
      return;
    }

    const newTask = {
      id: crypto.randomUUID(),
      title: title.trim(),
      date: selectedKey,
      startTime,
      endTime,
      category,
      priority,
      completed: false,
    };

    setTasks((previous) => [
      ...previous,
      newTask,
    ]);

    // Clear form
    setTitle("");
    setStartTime("");
    setEndTime("");
    setCategory("Personal");
    setPriority("Medium");
  }

  // =============================
  // COMPLETE TASK
  // =============================

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

  // =============================
  // DELETE TASK
  // =============================

  function deleteTask(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (confirmDelete) {
      setTasks((previous) =>
        previous.filter((task) => task.id !== id)
      );
    }
  }

  // =============================
  // WEBSITE INTERFACE
  // =============================

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

        <p className="nav-label">
          WORKSPACE
        </p>

        <nav>
          <button
            className="nav-active"
            onClick={goToToday}
          >
            ▦ Dashboard
          </button>

          <button onClick={goToToday}>
            ◷ Today's Schedule
          </button>
        </nav>

        <div className="sidebar-footer">
          <p>Small steps every day.</p>
          <span>Build better habits.</span>
        </div>

      </aside>

      {/* MAIN DASHBOARD */}

      <main className="main-content">

        {/* HEADER */}

        <header className="header">

          <div>
            <p className="subtitle">
              YOUR PRODUCTIVITY SPACE
            </p>

            <h1>My Dashboard</h1>

            <p>
              Plan your day. Achieve your goals.
            </p>
          </div>

          {/* THEME AND TODAY BUTTONS */}

          <div className="header-actions">

            <button
              className="theme-toggle"
              onClick={toggleTheme}
              type="button"
              aria-label={
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
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

        {/* STATISTICS CARDS */}

        <section className="stats-grid">

          <div className="stat-card">

            <p>Total Tasks</p>

            <h2 className="purple">
              {dailyTasks.length}
            </h2>

            <span>Scheduled activities</span>

          </div>

          <div className="stat-card">

            <p>Completed</p>

            <h2 className="green">
              {completedTasks}
            </h2>

            <span>Tasks accomplished</span>

          </div>

          <div className="stat-card">

            <p>Pending</p>

            <h2 className="orange">
              {pendingTasks}
            </h2>

            <span>Remaining activities</span>

          </div>

          <div className="stat-card">

            <p>Daily Progress</p>

            <h2 className="purple">
              {progress}%
            </h2>

            <div className="progress-track">

              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

          </div>

        </section>

        {/* CALENDAR AND SCHEDULE */}

        <section className="dashboard-grid">

          <div className="left-panel">

            {/* MONTHLY CALENDAR */}

            <div className="panel calendar">

              <div className="panel-heading">

                <h3>
                  {currentMonth.toLocaleDateString(
                    "en-US",
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
                  "Sun",
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                ].map((day) => (

                  <span
                    className="weekday"
                    key={day}
                  >
                    {day}
                  </span>

                ))}

                {Array.from(
                  { length: firstDay },
                  (_, i) => (
                    <span key={`empty-${i}`} />
                  )
                )}

                {Array.from(
                  { length: totalDays },
                  (_, i) => {

                    const day = i + 1;

                    const date = new Date(
                      year,
                      month,
                      day
                    );

                    const key = dateKey(date);

                    const hasTasks = tasks.some(
                      (task) => task.date === key
                    );

                    return (

                      <button
                        key={day}
                        className={`calendar-day ${
                          key === selectedKey
                            ? "selected"
                            : ""
                        } ${
                          key === dateKey(new Date())
                            ? "today"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedDate(date)
                        }
                        aria-label={date.toDateString()}
                        aria-pressed={key === selectedKey}
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

            {/* ADD NEW TASK FORM */}

            <div className="panel">

              <h3>Add New Task</h3>

              <form
                className="task-form"
                onSubmit={addTask}
              >

                <label htmlFor="task-name">
                  Task Name
                </label>

                <input
                  id="task-name"
                  type="text"
                  placeholder="What are you planning?"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
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

                  <option>Personal</option>
                  <option>Education</option>
                  <option>Work</option>
                  <option>Sports</option>
                  <option>Health</option>
                  <option>Other</option>

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

                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>

                </select>

                <button
                  className="primary-btn"
                  type="submit"
                >
                  + Add Task
                </button>

              </form>

            </div>

          </div>

          {/* DAILY SCHEDULE */}

          <div className="panel schedule-panel">

            <p className="subtitle">

              {selectedDate.toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }
              )}

            </p>

            <h2>Daily Schedule</h2>

            <p className="schedule-description">

              {dailyTasks.length} activities planned
              for this day

            </p>

            <div className="task-list">

              {dailyTasks.length === 0 ? (

                /* EMPTY STATE */

                <div className="empty-state">

                  <div className="empty-icon">
                    ▤
                  </div>

                  <h3>No tasks scheduled</h3>

                  <p>
                    Add your first task to start
                    planning your day.
                  </p>

                </div>

              ) : (

                /* DISPLAY ALL TASKS */

                dailyTasks.map((task) => (

                  <div
                    className={`task-card ${
                      task.completed
                        ? "completed"
                        : ""
                    }`}
                    key={task.id}
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

                    <button
                      className="delete-btn"
                      onClick={() =>
                        deleteTask(task.id)
                      }
                      aria-label={`Delete ${task.title}`}
                    >
                      ×
                    </button>

                  </div>

                ))

              )}

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;
