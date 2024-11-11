import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../css/timeline.css";
import ProjectHead from "./ProjectHead";
import BottomBarDesign from "./BottomBarProject";
import { useParams } from "react-router-dom";
import EditPen from "../DesignSpace/svg/EditPen";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import Trash from "../DesignSpace/svg/Trash";
import { fetchTasks, deleteTask } from "./backend/ProjectDetails";
import { ToastContainer } from "react-toastify";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { CalendarIcon, HorizontalIcon, ListIcon, SingleIcon } from "./svg/ExportIcon";
import { ArrowBackIosNew, ArrowForwardIos } from "@mui/icons-material";

function Timeline() {
  const [date, setDate] = useState(new Date());
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewMode, setViewMode] = useState("calendar"); // "calendar", "list", "single"
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const navigate = useNavigate();

  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  useEffect(() => {
    const fetchAndSetTasks = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await fetchTasks(currentUser.uid, projectId, setTasks);
      }
    };

    fetchAndSetTasks(); // Fetch tasks immediately when the component mounts

    const intervalId = setInterval(fetchAndSetTasks, 1000); // Refresh every 60 seconds

    return () => clearInterval(intervalId); // Clear interval on component unmount
  }, [projectId]);
  const formatDate = (date) => {
    const options = { month: "short", day: "numeric" };
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
    navigate(`/editEvent/${projectId}?task=${taskDetails}`);
  };

  const handleAddEventClick = () => {
    const formattedDate = new Date(date);
    formattedDate.setDate(formattedDate.getDate() + 1);
    const formattedDateString = formattedDate.toISOString().split("T")[0];
    navigate(`/editEvent/${projectId}?date=${formattedDateString}`);
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
    (task) => new Date(task.endDate).toDateString() === date.toDateString()
  );

  const hasTasks = (date) => {
    return tasks.some((task) => new Date(task.endDate).toDateString() === date.toDateString());
  };

  return (
    <>
      <ProjectHead />
      <ToastContainer />
      <div className="timeline-container">
        <div className="center-me" style={{ flexDirection: "row", marginBottom: "20px" }}>
          <Button
            className="gradient-from-none"
            style={{ marginRight: "10px" }}
            onClick={() => setViewMode("calendar")}
          >
            <CalendarIcon />
          </Button>
          <Button
            className="gradient-from-none"
            style={{ marginRight: "10px" }}
            onClick={handleListIconClick}
          >
            <ListIcon />
          </Button>
          <Button className="gradient-from-none" onClick={handleSingleIconClick}>
            <SingleIcon />
          </Button>
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
                  {/* dummy */}
                </button>
              </div>
              <div className="tasks-list">
                <h2>All Tasks</h2>
                {tasks.length === 0 ? (
                  <p>No tasks available</p>
                ) : (
                  tasks.map((task) => (
                    <div className="task-item" key={task.id}>
                      <div className="task-text">
                        <h3>{task.taskName}</h3>
                        <p>Until {new Date(task.endDate).toLocaleDateString()}</p>
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
          </>
        )}
        {viewMode === "list" && (
          <div className="calendar-head">
            <div className="date-navigation">
              <Button onClick={handlePrevDate}>
                <ArrowBackIosNew sx={{ color: "var(--color-white)" }} />
              </Button>

              <h2>
                {date.toLocaleDateString(undefined, {
                  weekday: "long",
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
                    <h3>{task.taskName}</h3>
                    <p>Until {new Date(task.endDate).toLocaleDateString()}</p>
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

              <h2>
                Task {currentTaskIndex + 1} of {tasks.length}
              </h2>

              <Button onClick={handleNextTask}>
                <ArrowForwardIos sx={{ color: "var(--color-white)" }} />{" "}
              </Button>
            </div>
            <div className="task-item">
              <div className="task-text">
                <h3>{tasks[currentTaskIndex].taskName}</h3>
                <p>Until {new Date(tasks[currentTaskIndex].endDate).toLocaleDateString()}</p>
                <p>{tasks[currentTaskIndex].description}</p>
              </div>
              <div className="task-actions">
                <div onClick={() => handleEditClick(tasks[currentTaskIndex])}>
                  <EditPen />
                </div>
                <div onClick={openDeleteModal}>
                  <Trash />
                </div>
              </div>
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
