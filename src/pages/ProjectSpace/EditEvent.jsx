import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "../../css/editEvent.css";
import TopBar from "../../components/TopBar";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { saveData, updateTask, createEvent } from "./backend/ProjectDetails";
import { ToastContainer } from "react-toastify";
import { auth } from "../../firebase";
import { CustomSwitch } from "./ProjectSettings.jsx";
import { Box, Modal, TextField, Button } from "@mui/material";
import RepeatSelector from "./RepeatSelector.jsx";
import { ThemeProvider } from "@mui/system";
import { theme } from "./ProjectSettings.jsx";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import ReminderSpecific from "./ReminderSpecific";
import { Typography, IconButton, InputBase, Select, MenuItem } from "@mui/material";
import DialogTitle from "@mui/material/DialogTitle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { fetchTaskDetails } from "./backend/ProjectDetails";

function EditEvent() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const navigateTo = location.state?.navigateFrom || "/";
  const navigateFrom = location.pathname;
  const user = useSharedProps();
  const queryParams = new URLSearchParams(location.search);
  const selectedDate = queryParams.get("date");
  const taskDetails = queryParams.get("task")
    ? JSON.parse(decodeURIComponent(queryParams.get("task")))
    : null;
  const taskId = queryParams.get("taskId");
  const timelineId = queryParams.get("timelineId"); // Retrieve timelineId
  const [allowRepeat, setAllowRepeat] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);

  const initialFormData = {
    taskName: "",
    startDate: selectedDate || "",
    endDate: selectedDate || "",
    description: "",
    repeat: {
      frequency: 0,
      unit: "none", // Ensure unit is set to a valid option
    },
    reminders: [],
    repeatEnabled: true,
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    const fetchTask = async () => {
      if (taskId) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const taskDetails = await fetchTaskDetails(currentUser.uid, taskId);
          setFormData({
            taskName: taskDetails.eventName,
            startDate: new Date(taskDetails.dateRange.start._seconds * 1000)
              .toISOString()
              .split("T")[0],
            endDate: new Date(taskDetails.dateRange.end._seconds * 1000)
              .toISOString()
              .split("T")[0],
            description: taskDetails.description,
            repeat: {
              frequency: taskDetails.repeatEvery.frequency,
              unit: taskDetails.repeatEvery.unit || "none",
            },
            reminders: taskDetails.reminders.map((reminder, index) => {
              let hours = 0,
                minutes = 0,
                period = "AM";
              if (reminder.time) {
                const [hoursPart, minutesPeriod] = reminder.time.split(":");
                const [minutesPart, periodPart] = minutesPeriod.split(" ");
                hours = parseInt(hoursPart, 10);
                minutes = parseInt(minutesPart, 10);
                period = periodPart;
              }
              return {
                ...reminder,
                id: index, // Assign an id to each reminder
                count: reminder.timeBeforeEvent,
                hours,
                minutes,
                period,
                time: reminder.time, // Retrieve the formatted time
              };
            }),
            repeatEnabled: taskDetails.repeating,
          });
          setAllowRepeat(taskDetails.repeating);
        }
      }
    };

    fetchTask();
  }, [taskId]);

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

  const handleReminderChange = (index, reminder) => {
    const newReminders = [...formData.reminders];
    newReminders[index] = reminder;
    setFormData((prevData) => ({
      ...prevData,
      reminders: newReminders,
    }));
  };

  const addReminder = () => {
    setSelectedReminder({
      id: Date.now(),
      count: 1,
      unit: "day",
      hours: 8,
      minutes: 0,
      period: "AM",
    });
    setOpenModal(true);
  };

  const saveReminder = (reminder) => {
    setFormData((prevData) => {
      const existingReminderIndex = prevData.reminders.findIndex((r) => r.id === reminder.id);
      if (existingReminderIndex !== -1) {
        const updatedReminders = [...prevData.reminders];
        updatedReminders[existingReminderIndex] = reminder;
        return {
          ...prevData,
          reminders: updatedReminders,
        };
      } else {
        return {
          ...prevData,
          reminders: [...prevData.reminders, { ...reminder, id: Date.now() }],
        };
      }
    });
    setOpenModal(false);
  };

  const deleteReminder = (id) => {
    setFormData((prevData) => ({
      ...prevData,
      reminders: prevData.reminders.filter((reminder) => reminder.id !== id),
    }));
  };

  const handleSave = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (isNaN(startDate) || isNaN(endDate)) {
        console.error("Invalid date value");
        return;
      }

      const eventData = {
        timelineId: timelineId,
        eventName: formData.taskName,
        dateRange: {
          start: startDate,
          end: endDate,
        },
        repeating: allowRepeat,
        repeatEvery: {
          frequency: formData.repeat.frequency,
          unit: formData.repeat.unit,
        },
        description: formData.description,
        reminders: formData.reminders.map((reminder) => ({
          timeBeforeEvent: reminder.count,
          time: reminder.time, // Save the formatted time
          unit: reminder.unit,
        })),
      };

      if (taskId) {
        await updateTask(currentUser.uid, projectId, taskId, eventData);
      } else {
        console.log("Creating event:", JSON.parse(JSON.stringify(eventData)));
        await createEvent(timelineId, JSON.parse(JSON.stringify(eventData))); // Ensure no circular references
      }
      navigate(-1);
    }
  };

  const handleCancel = () => {
    setOpenModal(false);
  };

  const handleRepeatToggle = () => {
    setAllowRepeat((prev) => !prev);
  };

  const handleRepeatChange = (count, unit) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      repeat: {
        frequency: count,
        unit: unit,
      },
    }));
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <ThemeProvider theme={theme}>
      <div style={{ overflowX: "hidden" }}>
        <ToastContainer />
        <TopBar state={"Edit Event"} navigateTo={navigateTo} navigateFrom={navigateFrom} />
        <div className="edit-event">
          <div className="form-container">
            <div className="form-group">
              <label htmlFor="taskName">Task / Event name </label>
              <input
                type="text"
                id="taskName"
                name="taskName"
                value={formData.taskName}
                style={{ color: "var(--color-white) !important" }}
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
                min={today}
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
                min={formData.startDate}
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
              <CustomSwitch label="Repeat" checked={allowRepeat} onChange={handleRepeatToggle} />
              {allowRepeat && (
                <RepeatSelector
                  count={formData.repeat.frequency}
                  unit={formData.repeat.unit}
                  onRepeatChange={handleRepeatChange}
                />
              )}
            </div>
            <div className="reminders">
              <div className="reminders-header">
                <span>Reminders</span>
                <button className="icon-button add-button" onClick={addReminder}>
                  <AddIcon />
                </button>
              </div>
              {formData.reminders.map((reminder, index) => (
                <div key={reminder.id} className="reminder-item">
                  <div className="reminder-display">
                    <span>
                      {reminder.count} {reminder.unit} before {reminder.hours}:
                      {reminder.minutes.toString().padStart(2, "0")} {reminder.period}
                    </span>
                    <div className="reminder-actions">
                      <button
                        className="icon-button"
                        onClick={() => {
                          setSelectedReminder(reminder);
                          setOpenModal(true);
                        }}
                      >
                        <EditIcon
                          sx={{
                            color: "var(--brightFont)",
                            marginRight: "12px",
                          }}
                        />
                      </button>{" "}
                      <button className="icon-button" onClick={() => deleteReminder(reminder.id)}>
                        <DeleteIcon
                          sx={{
                            color: "var(--brightFont)",
                          }}
                        />
                      </button>
                    </div>
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
      <Modal open={openModal} onClose={handleCancel}>
        <Box
          sx={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "auto",
            bgcolor: "var(--nav-card-modal)",
            boxShadow: 24,
            borderRadius: "12px",
            margin: "12px",
          }}
        >
          <DialogTitle
            className="dialog-title"
            sx={{
              borderRadius: "12px 12px 0 0",
            }}
          >
            <IconButton onClick={handleCancel} className="dialog-icon-button">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ color: "var(--color-white)" }}>
              Set Reminder
            </Typography>
          </DialogTitle>
          <div style={{ padding: "20px" }}>
            <ReminderSpecific
              reminder={selectedReminder}
              onSave={saveReminder}
              onCancel={handleCancel}
            />
          </div>
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

export default EditEvent;
