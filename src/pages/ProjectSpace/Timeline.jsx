import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../css/timeline.css";
import ProjectHead from "./ProjectHead";
import BottomBarDesign from "./BottomBarProject";
import { useParams } from "react-router-dom";
import EditPen from "../DesignSpace/svg/EditPen";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import Trash from "../DesignSpace/svg/Trash";
import { fetchTasks, deleteTask, fetchTimelineId } from "./backend/ProjectDetails";
import { ToastContainer } from "react-toastify";
import { auth } from "../../firebase";
import { Button, IconButton } from "@mui/material";
import {
  CalendarIcon,
  HorizontalIcon,
  ListIconTimeline,
  SingleIconTimeline,
} from "./svg/ExportIcon";
import { ArrowBackIosNew, ArrowForwardIos } from "@mui/icons-material";
import { iconButtonStyles } from "../Homepage/DrawerComponent";

function Timeline() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateFrom = location.pathname;
  const { projectId } = useParams();

  const [date, setDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewMode, setViewMode] = useState("calendar"); // "calendar", "list", "single"
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [timelineId, setTimelineId] = useState(null); // Add state for timelineId

  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  useEffect(() => {
    const fetchAndSetTimelineId = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const id = await fetchTimelineId(currentUser.uid, projectId);
        setTimelineId(id);
      }
    };

    fetchAndSetTimelineId(); // Fetch timelineId when the component mounts
  }, [projectId]);

  useEffect(() => {
    const fetchAndSetTasks = async () => {
      const currentUser = auth.currentUser;
      if (currentUser && timelineId) {
        const tasks = await fetchTasks(timelineId);
        setTasks(tasks);
      }
    };

    fetchAndSetTasks(); // Fetch tasks immediately when the component mounts

    const intervalId = setInterval(fetchAndSetTasks, 1000); // Refresh every 60 seconds

    return () => clearInterval(intervalId); // Clear interval on component unmount
  }, [projectId, timelineId]);

  const formatDate = (date) => {
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString(undefined, options);
  };

  const handleDelete = async (taskId) => {
    console.log("handleDelete called with taskId:", taskId); // Debugging statement
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await deleteTask(currentUser.uid, projectId, taskId);
        console.log("Task deleted successfully"); // Debugging statement
      } catch (error) {
        console.error("Error deleting task:", error); // Debugging statement
      }
    }
  };

  const handleEditClick = (task) => {
    const taskDetails = encodeURIComponent(JSON.stringify(task));
    navigate(`/editEvent/${projectId}?task=${taskDetails}&timelineId=${timelineId}`, {
      state: { navigateFrom: navigateFrom },
    });
  };

  const handleAddEventClick = () => {
    const formattedDate = new Date(date);
    formattedDate.setDate(formattedDate.getDate() + 1);
    const formattedDateString = formattedDate.toISOString().split("T")[0];
    navigate(`/editEvent/${projectId}?date=${formattedDateString}&timelineId=${timelineId}`, {
      state: { navigateFrom: navigateFrom },
    });
  };

  const handleListIconClick = () => {
    setViewMode("list");
  };

  const handleSingleIconClick = () => {
    setViewMode("single");
  };

  const handlePrevDate = () => {
    setDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(prevDate.getDate() - 1);
      return newDate;
    });
  };

  const handleNextDate = () => {
    setDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(prevDate.getDate() + 1);
      return newDate;
    });
  };

  const handlePrevTask = () => {
    setCurrentTaskIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : tasks.length - 1));
  };

  const handleNextTask = () => {
    setCurrentTaskIndex((prevIndex) => (prevIndex < tasks.length - 1 ? prevIndex + 1 : 0));
  };

  const filteredTasks = tasks.filter(
    (task) => task.dateRange && new Date(task.dateRange.end).toDateString() === date.toDateString()
  );

  const hasTasks = (date) => {
    return tasks.some(
      (task) =>
        task.dateRange && new Date(task.dateRange.end).toDateString() === date.toDateString()
    );
  };

  return (
    <>
      <ProjectHead />
      <ToastContainer />
      <div className="timeline-container">
        <div className="center-me" style={{ flexDirection: "row", marginBottom: "20px" }}>
          <IconButton
            onClick={() => setViewMode("calendar")}
            sx={{
              ...iconButtonStyles,
              padding: "10px",
              marginRight: "10px",
              borderRadius: "8px",
              backgroundColor: viewMode === "calendar" ? "var(--nav-card-modal)" : "transparent",
            }}
          >
            <CalendarIcon />
          </IconButton>
          <IconButton
            onClick={handleListIconClick}
            sx={{
              ...iconButtonStyles,
              padding: "10px",
              marginRight: "10px",
              borderRadius: "8px",
              backgroundColor: viewMode === "list" ? "var(--nav-card-modal)" : "transparent",
            }}
          >
            <ListIconTimeline />
          </IconButton>
          <IconButton
            onClick={handleSingleIconClick}
            sx={{
              ...iconButtonStyles,
              padding: "10px",
              borderRadius: "8px",
              backgroundColor: viewMode === "single" ? "var(--nav-card-modal)" : "transparent",
            }}
          >
            <SingleIconTimeline />
          </IconButton>
        </div>
        {viewMode === "calendar" && (
          <>
            <div className="calendar-head">
              <div className="calendar-section">
                <Calendar
                  onChange={setDate}
                  value={date}
                  className="custom-calendar"
                  tileClassName={({ date, view }) =>
                    view === "month" && hasTasks(date) ? "task-date" : null
                  }
                />
              </div>
              <div className="add-event-button">
                <button className="design-button" onClick={handleAddEventClick}>
                  Add Event for {formatDate(date)}
                </button>
              </div>
              <div className="tasks-list">
                <h2 style={{ color: "var(--color-white)" }}>All Tasks</h2>
                {tasks.length === 0 ? (
                  <p>No tasks available</p>
                ) : (
                  tasks.map((task) => (
                    <div className="task-item" key={task.id}>
                      <div className="task-text">
                        <h3>{task.eventName}</h3>
                        <p>
                          Until{" "}
                          {task.dateRange
                            ? new Date(task.dateRange.end).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "N/A"}
                        </p>
                      </div>
                      <div className="task-actions">
                        <div onClick={() => handleEditClick(task)}>
                          <EditPen />
                        </div>
                        <div onClick={openDeleteModal}>
                          <Trash />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="bottom-filler" />
          </>
        )}
        {viewMode === "list" && (
          <div className="calendar-head">
            <div className="date-navigation">
              <Button onClick={handlePrevDate}>
                <ArrowBackIosNew sx={{ color: "var(--color-white)" }} />
              </Button>

              <h2 style={{ color: "var(--color-white)" }}>
                {date.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </h2>
              <Button onClick={handleNextDate}>
                <ArrowForwardIos sx={{ color: "var(--color-white)" }} />{" "}
              </Button>
            </div>

            {filteredTasks.length === 0 ? (
              <p>No tasks available</p>
            ) : (
              filteredTasks.map((task) => (
                <div className="task-item" key={task.id}>
                  <div className="task-text">
                    <h3>{task.eventName}</h3>
                    <p>
                      Until{" "}
                      {task.dateRange
                        ? new Date(task.dateRange.end).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </div>
                  <div className="task-actions">
                    <div onClick={() => handleEditClick(task)}>
                      <EditPen />
                    </div>
                    <div onClick={openDeleteModal}>
                      <Trash />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {viewMode === "single" && tasks.length > 0 && (
          <div className="calendar-head">
            <div className="date-navigation">
              <Button onClick={handlePrevTask}>
                <ArrowBackIosNew sx={{ color: "var(--color-white)" }} />
              </Button>

              <h2 style={{ color: "var(--color-white)" }}>
                Task {currentTaskIndex + 1} of {tasks.length}
              </h2>

              <Button onClick={handleNextTask}>
                <ArrowForwardIos sx={{ color: "var(--color-white)" }} />{" "}
              </Button>
            </div>
            <div className="task-item" style={{ background: "none", marginBottom: "0px" }}>
              <div className="task-text">
                <h3>{tasks[currentTaskIndex].eventName}</h3>
                <p>
                  Until{" "}
                  {tasks[currentTaskIndex].dateRange
                    ? new Date(tasks[currentTaskIndex].dateRange.end).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )
                    : "N/A"}
                </p>
              </div>

              <div className="task-actions">
                <div onClick={() => handleEditClick(tasks[currentTaskIndex])}>
                  <EditPen />
                </div>
                <div onClick={openDeleteModal}>
                  <Trash />
                </div>
              </div>
            </div>{" "}
            <div style={{ padding: "1rem", paddingTop: "0px" }}>
              <p className="label-item">Reminders before the event</p>
              <p>1 day, 6:00AM 2 days, 10:00AM</p>

              <p className="label-item">Repetition</p>
              <p>Every week</p>

              <p className="label-item">Description</p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
          </div>
        )}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={closeDeleteModal}
          onDelete={handleDelete}
        />
      </div>
      <div className="bottom-filler" />
      <BottomBarDesign Timeline={true} projId={projectId} />
    </>
  );
}

export default Timeline;
