import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "../../css/editEvent.css";
import TopBar from "../../components/TopBar";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { saveData, updateTask } from "./backend/ProjectDetails";
import { ToastContainer } from "react-toastify";
import { auth } from "../../firebase";
import { CustomSwitch } from "./ProjectSettings.jsx";
import { Box, Modal, TextField, Button } from "@mui/material";
import { RepeatSelector } from "./svg/ExportIcon";
import { ThemeProvider } from "@mui/system";
import { theme } from "./ProjectSettings.jsx";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import ReminderSpecific from "./ReminderSpecific";
import { Typography, IconButton, InputBase, Select, MenuItem } from "@mui/material";
import DialogTitle from "@mui/material/DialogTitle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function EditEvent() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const navigateTo = location.state?.navigateFrom || "/";
  const navigateFrom = location.pathname;

  const queryParams = new URLSearchParams(location.search);
  const selectedDate = queryParams.get("date");
  const taskDetails = queryParams.get("task");
  const [allowRepeat, setAllowRepeat] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);

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
        reminders: [],
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
    setFormData((prevData) => ({
      ...prevData,
      reminders: [...prevData.reminders, { ...reminder, id: Date.now() }],
    }));
    setOpenModal(false);
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

  const handleCancel = () => {
    setOpenModal(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <div style={{ overflowX: "hidden" }}>
        <ToastContainer />
        <TopBar state={"Edit Event"} navigateTo={navigateTo} navigateFrom={navigateFrom} />
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
              <CustomSwitch label="Repeat" checked={allowRepeat} onChange={setAllowRepeat} />
              {allowRepeat && <RepeatSelector />}
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
