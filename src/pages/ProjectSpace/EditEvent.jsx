import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { showToast } from "../../functions/utils";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import "../../css/editEvent.css";
import TopBar from "../../components/TopBar";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { saveData, updateTask } from "./backend/ProjectDetails";
import { auth } from "../../firebase";

function EditEvent() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const selectedDate = queryParams.get("date");
  const taskDetails = queryParams.get("task");

  const initialFormData = taskDetails
    ? JSON.parse(decodeURIComponent(taskDetails))
    : {
        taskName: "",
        startDate: selectedDate || "",
        endDate: selectedDate || "",
        description: "",
        repeat: {
          frequency: "",
          unit: "day",
        },
        reminders: [
          { id: 1, time: "" },
          { id: 2, time: "" },
        ],
        repeatEnabled: true,
      };

  const [formData, setFormData] = useState(initialFormData);

  const handleInputChange = (e, fieldName, nestedField = null) => {
    const { value } = e.target;
    setFormData((prevFormData) => {
      if (nestedField) {
        return {
          ...prevFormData,
          [nestedField]: {
            ...prevFormData[nestedField],
            [fieldName]: value,
          },
        };
      }
      return {
        ...prevFormData,
        [fieldName]: value,
      };
    });
  };

  const handleReminderChange = (index, value) => {
    const newReminders = [...formData.reminders];
    newReminders[index].time = value;
    setFormData((prevData) => ({
      ...prevData,
      reminders: newReminders,
    }));
  };

  const addReminder = () => {
    const newReminder = { id: Date.now(), time: "" }; // Generate a unique ID
    setFormData((prevData) => ({
      ...prevData,
      reminders: [...prevData.reminders, newReminder],
    }));
  };

  const deleteReminder = (id) => {
    const newReminders = formData.reminders.filter((reminder) => reminder.id !== id);
    setFormData((prevData) => ({
      ...prevData,
      reminders: newReminders,
    }));
  };

  const handleSave = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      if (taskDetails) {
        // Update existing task
        const taskId = JSON.parse(decodeURIComponent(taskDetails)).id;
        await updateTask(currentUser.uid, projectId, taskId, formData);
      } else {
        // Save new task
        await saveData(projectId, formData);
      }
      navigate(-1); // Go back to the previous page
    }
  };

  return (
    <div>
      <TopBar state={"Edit Event"} />
      <div className="edit-event">
        <div className="form-container">
          <div className="form-group">
            <label htmlFor="taskName">Task / Event name</label>
            <input
              type="text"
              id="taskName"
              name="taskName"
              value={formData.taskName}
              onChange={(e) => handleInputChange(e, "taskName")}
            />
          </div>
          <div className="form-group">
            <label htmlFor="startDate">Start date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={(e) => handleInputChange(e, "startDate")}
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">End date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={(e) => handleInputChange(e, "endDate")}
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => handleInputChange(e, "description")}
            />
          </div>
          <div className="form-group repeat">
            <label>Repeat</label>
            <div className="repeat-inputs">
              <input
                type="number"
                name="frequency"
                value={formData.repeat.frequency}
                onChange={(e) => handleInputChange(e, "frequency", "repeat")}
              />
              <select
                name="unit"
                value={formData.repeat.unit}
                onChange={(e) => handleInputChange(e, "unit", "repeat")}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          </div>
          <div className="reminders">
            <div className="reminders-header">
              <span>Reminders</span>
              <button className="icon-button add-button" onClick={addReminder}>
                <AddIcon />
              </button>
            </div>
            {formData.reminders.map((reminder) => (
              <div key={reminder.id} className="reminder-item">
                <input
                  type="text"
                  value={reminder.time}
                  onChange={(e) =>
                    handleReminderChange(
                      formData.reminders.findIndex((r) => r.id === reminder.id),
                      e.target.value
                    )
                  }
                />
                <div className="reminder-actions">
                  <button className="icon-button" onClick={() => deleteReminder(reminder.id)}>
                    <DeleteIcon />
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => {
                      /* Handle edit */
                    }}
                  >
                    <EditIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="edit-event-button" onClick={handleSave}>
            Save event
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditEvent;
