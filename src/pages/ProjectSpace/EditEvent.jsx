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
import { CustomSwitch } from "../Settings/ProjSetting";
import { Box, Modal, TextField, Button } from "@mui/material";
import RepeatSelector from "./RepeatSelector";
import { ThemeProvider } from "@mui/system";
import { theme } from "../Settings/ProjSetting";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

function EditEvent() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
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

  const handleReminderChange = (index, value) => {
    const newReminders = [...formData.reminders];
    newReminders[index].time = value;
    setFormData((prevData) => ({
      ...prevData,
      reminders: newReminders,
    }));
  };

  const addReminder = () => {
    setSelectedReminder({ id: Date.now(), time: new Date() });
    setOpenModal(true);
  };

  const saveReminder = () => {
    setFormData((prevData) => ({
      ...prevData,
      reminders: [...prevData.reminders, selectedReminder],
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

  return (
    <ThemeProvider theme={theme}>
      <div style={{ overflowX: "hidden" }}>
        <ToastContainer />
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
              {formData.reminders.map((reminder) => (
                <div key={reminder.id} className="reminder-item">
                  <div className="reminder-display">
                    <span>{new Date(reminder.time).toLocaleString()}</span>

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
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
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
            p: 4,
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Select Date & Time"
              value={selectedReminder?.time || new Date()}
              onChange={(newValue) => setSelectedReminder((prev) => ({ ...prev, time: newValue }))}
              renderInput={(params) => <TextField {...params} />}
            />
          </LocalizationProvider>
          <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
            <Button onClick={() => setOpenModal(false)} className="cancel-button">
              Cancel
            </Button>
            <Button onClick={saveReminder} className="confirm-button">
              Save
            </Button>
          </Box>
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

export default EditEvent;
