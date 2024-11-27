import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../css/timeline.css";
import ProjectHead from "./ProjectHead";
import BottomBarDesign from "./BottomBarProject";
import { useParams } from "react-router-dom";
import EditPen from "../DesignSpace/svg/EditPen";
import SimpleDeleteConfirmation from "../../components/SimpleDeleteConfirmation";
import Trash from "../DesignSpace/svg/Trash";
import {
  fetchTasks,
  deleteTask,
  fetchTimelineId,
  fetchTaskDetails,
} from "./backend/ProjectDetails";
import { showToast } from "../../functions/utils";
import { auth } from "../../firebase";
import { Button, IconButton } from "@mui/material";
import { CalendarIcon, ListIconTimeline, SingleIconTimeline } from "./svg/ExportIcon";
import { ArrowBackIosNew, ArrowForwardIos } from "@mui/icons-material";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import ProjectSpace from "./ProjectSpace";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import deepEqual from "deep-equal";
import {
  isManagerProject,
  isManagerContentManagerProject,
  isManagerContentManagerContributorProject,
  isCollaboratorProject,
} from "./Project";

function Timeline() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateFrom = location.pathname;
  const { projectId } = useParams();
  const { user, userDoc, isDarkMode, projects, userProjects } = useSharedProps();
  const [changeMode, setChangeMode] = useState(location?.state?.changeMode || "");
  const [project, setProject] = useState({});
  const [loadingProject, setLoadingProject] = useState(true);

  const [date, setDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewMode, setViewMode] = useState("calendar"); // "calendar", "list", "single"
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [timelineId, setTimelineId] = useState(null); // Add state for timelineId
  const [taskIdToDelete, setTaskIdToDelete] = useState(null); // Add state for taskId to delete
  const [loadingTasks, setLoadingTasks] = useState(true); // Add loading state for tasks

  const [isManager, setIsManager] = useState(false);
  const [isManagerContentManager, setIsManagerContentManager] = useState(false);
  const [isManagerContentManagerContributor, setIsManagerContentManagerContributor] =
    useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);

  // Get project
  useEffect(() => {
    if (projectId && userProjects.length > 0) {
      const fetchedProject =
        userProjects.find((d) => d.id === projectId) || projects.find((d) => d.id === projectId);

      if (!fetchedProject) {
        console.error("Project not found.");
        setLoadingProject(false);
      } else if (Object.keys(project).length === 0 || !deepEqual(project, fetchedProject)) {
        setProject(fetchedProject);
        console.log("current project:", fetchedProject);
      }
    }
    setLoadingProject(false);
  }, [projectId, projects, userProjects]);

  // Initialize access rights
  useEffect(() => {
    if (!project?.projectSettings || !userDoc?.id) return;
    // Check if user has any access
    const hasAccess = isCollaboratorProject(project, userDoc.id);
    if (!hasAccess) {
      showToast("error", "You don't have access to this project");
      navigate("/");
      return;
    }
    // If they have access, proceed with setting roles
    setIsManager(isManagerProject(project, userDoc.id));
    setIsManagerContentManager(isManagerContentManagerProject(project, userDoc.id));
    setIsManagerContentManagerContributor(
      isManagerContentManagerContributorProject(project, userDoc.id)
    );
    setIsCollaborator(isCollaboratorProject(project, userDoc.id));
  }, [project, userDoc]);

  const openDeleteModal = (taskId) => {
    setTaskIdToDelete(taskId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setTaskIdToDelete(null);
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
    if (!timelineId) return;

    const fetchAndSetTasks = async () => {
      setLoadingTasks(true); // Set loading to true before fetching tasks
      const currentUser = auth.currentUser;
      if (currentUser) {
        const tasks = await fetchTasks(timelineId);
        setTasks(tasks);
        setLoadingTasks(false); // Set loading to false after tasks are fetched
      }
    };

    fetchAndSetTasks(); // Fetch tasks immediately when the component mounts

    // const intervalId = setInterval(fetchAndSetTasks, 10000); // Refresh every 60 seconds

    // return () => clearInterval(intervalId); // Clear interval on component unmount
  }, [timelineId]);

  const formatDate = (date) => {
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString(undefined, options);
  };

  const formatDateRange = (start, end) => {
    const startDate = new Date(start._seconds * 1000);
    const endDate = new Date(end._seconds * 1000);
    const options = { month: "short", day: "numeric", year: "numeric" };
    if (startDate.toDateString() === endDate.toDateString()) {
      return `Until ${endDate.toLocaleDateString(undefined, options)}`;
    }
    return `${startDate.toLocaleDateString(undefined, options)} Until ${endDate.toLocaleDateString(
      undefined,
      options
    )}`;
  };

  const handleDelete = async () => {
    console.log("handleDelete called with taskId:", taskIdToDelete); // Debugging statement
    const currentUser = auth.currentUser;
    if (currentUser && taskIdToDelete) {
      try {
        await deleteTask(currentUser.uid, projectId, taskIdToDelete);
        showToast("success", "Task deleted successfully"); // Debugging statement
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskIdToDelete));
        closeDeleteModal();
      } catch (error) {
        console.error("Error deleting task:", error); // Debugging statement
        showToast("error", "Error deleting task! Please try again.");
      }
    }
  };

  const handleEditClick = (taskId) => {
    navigate(`/editEvent/${projectId}?taskId=${taskId}&timelineId=${timelineId}`, {
      state: { navigateFrom: navigateFrom },
    });
  };

  const handleAddEventClick = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight to compare only dates
    if (date < today) {
      showToast("error", "Cannot add event for a past date!");
      return;
    }
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

  const filteredTasks = tasks.filter((task) => {
    if (task.dateRange) {
      const startDate = new Date(task.dateRange.start._seconds * 1000);
      const endDate = new Date(task.dateRange.end._seconds * 1000);
      return (
        date.toDateString() === startDate.toDateString() ||
        date.toDateString() === endDate.toDateString() ||
        (date >= startDate && date <= endDate)
      );
    }
    return false;
  });

  const hasTasks = (date) => {
    return tasks.some((task) => {
      if (task.dateRange) {
        const startDate = new Date(task.dateRange.start._seconds * 1000);
        const endDate = new Date(task.dateRange.end._seconds * 1000);
        return (
          date.toDateString() === startDate.toDateString() ||
          date.toDateString() === endDate.toDateString() ||
          (date >= startDate && date <= endDate)
        );
      }
      return false;
    });
  };

  return (
    <ProjectSpace
      project={project}
      projectId={projectId}
      inDesign={false}
      inPlanMap={false}
      inTimeline={true}
      inBudget={false}
      changeMode={changeMode}
      setChangeMode={setChangeMode}
    >
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
              {isManagerContentManagerContributor &
                (changeMode === "Managing Content" ||
                  changeMode === "Managing" ||
                  changeMode === "Contributing") && (
                <div className="add-event-button">
                  <button className="design-button" onClick={handleAddEventClick}>
                    Add Event for {formatDate(date)}
                  </button>
                </div>
              )}

              <div className="tasks-list">
                <h2 style={{ color: "var(--color-white)" }}>All Tasks</h2>
                {loadingTasks ? (
                  <p>Loading tasks...</p>
                ) : tasks.length === 0 ? (
                  <p>No tasks available</p>
                ) : (
                  tasks.map((task) => (
                    <div className="task-item" key={task.id}>
                      <div className="task-text">
                        <h3>{task.eventName}</h3>
                        <p>
                          {task.dateRange
                            ? formatDateRange(task.dateRange.start, task.dateRange.end)
                            : "N/A"}
                        </p>
                      </div>
                      <div className="task-actions">
                        {isManagerContentManagerContributor &
                          (changeMode === "Managing Content" ||
                            changeMode === "Managing" ||
                            changeMode === "Contributing") && (
                          <div onClick={() => handleEditClick(task.id)}>
                            <EditPen />
                          </div>
                        )}
                        {isManagerContentManager &
                          (changeMode === "Managing Content" || changeMode === "Managing") && (
                          <div onClick={() => openDeleteModal(task.id)}>
                            <Trash />
                          </div>
                        )}
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

            {loadingTasks ? (
              <p>Loading tasks...</p>
            ) : filteredTasks.length === 0 ? (
              <p>No tasks available</p>
            ) : (
              filteredTasks.map((task) => (
                <div className="task-item" key={task.id}>
                  <div className="task-text">
                    <h3>{task.eventName}</h3>
                    <p>
                      {task.dateRange
                        ? formatDateRange(task.dateRange.start, task.dateRange.end)
                        : "N/A"}
                    </p>
                  </div>
                  <div className="task-actions">
                    {isManagerContentManagerContributor &
                      (changeMode === "Managing Content" ||
                        changeMode === "Managing" ||
                        changeMode === "Contributing") && (
                      <div onClick={() => handleEditClick(task.id)}>
                        <EditPen />
                      </div>
                    )}
                    {isManagerContentManager &
                      (changeMode === "Managing Content" || changeMode === "Managing") && (
                      <div onClick={() => openDeleteModal(task.id)}>
                        <Trash />
                      </div>
                    )}
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
                  {tasks[currentTaskIndex].dateRange
                    ? formatDateRange(
                        tasks[currentTaskIndex].dateRange.start,
                        tasks[currentTaskIndex].dateRange.end
                      )
                    : "N/A"}
                </p>
              </div>

              <div className="task-actions">
                {isManagerContentManagerContributor &
                  (changeMode === "Managing Content" ||
                    changeMode === "Managing" ||
                    changeMode === "Contributing") && (
                  <div onClick={() => handleEditClick(tasks[currentTaskIndex].id)}>
                    <EditPen />
                  </div>
                )}
                {isManagerContentManager &
                  (changeMode === "Managing Content" || changeMode === "Managing") && (
                  <div onClick={() => openDeleteModal(tasks[currentTaskIndex].id)}>
                    <Trash />
                  </div>
                )}
              </div>
            </div>{" "}
            <div style={{ padding: "1rem", paddingTop: "0px" }}>
              <p className="label-item">Reminders before the event</p>
              {tasks[currentTaskIndex].reminders.map((reminder, index) => (
                <p key={index}>
                  {reminder.timeBeforeEvent} {reminder.unit}, {reminder.time}
                </p>
              ))}
              <p className="label-item">Repetition</p>
              <p>{tasks[currentTaskIndex].repeatEvery.unit}</p>

              <p className="label-item">Description</p>
              <p>{tasks[currentTaskIndex].description}</p>
            </div>
          </div>
        )}
        <SimpleDeleteConfirmation
          item={"task"}
          open={showDeleteModal}
          handleClose={closeDeleteModal}
          handleDelete={handleDelete}
        />
      </div>
      <div className="bottom-filler" />
    </ProjectSpace>
  );
}

export default Timeline;
