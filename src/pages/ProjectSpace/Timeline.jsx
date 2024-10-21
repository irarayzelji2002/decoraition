import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../css/timeline.css";
import ProjectHead from "./ProjectHead";
import BottomBarDesign from "./BottomBarProject";
import { useParams } from "react-router-dom";
import EditPen from "../DesignSpace/svg/EditPen";
import Trash from "../DesignSpace/svg/Trash";
import { fetchTasks, deleteTask } from "./backend/ProjectDetails";
import { ToastContainer } from "react-toastify";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";

function Timeline() {
  const [date, setDate] = useState(new Date());
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

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
    const formattedDate = date.toISOString().split("T")[0];
    navigate(`/editEvent/${projectId}?date=${formattedDate}`);
  };
  return (
    <>
      <ProjectHead />
      <div className="timeline-container">
        {/* Calendar Section */}
        <div className="calendar-head">
          <div className="calendar-section">
            <Calendar onChange={setDate} value={date} className="custom-calendar" />
          </div>
          <div className="add-event-button">
            <button className="design-button" onClick={handleAddEventClick}>
              Add Event for {formatDate(date)}
            </button>
          </div>
          {/* Task List */}
          <div className="task-list">
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
                    <div onClick={() => handleDelete(task.id)}>
                      <Trash />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <BottomBarDesign Timeline={true} projId={projectId} />
    </>
  );
}

export default Timeline;
