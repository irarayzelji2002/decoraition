import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "../../css/editEvent.css";
import TopBar from "../../components/TopBar";
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  AddIconGradient,
  EditIconSmallGradient,
} from "../../components/svg/DefaultMenuIcons.jsx";
import { updateTask, createEvent } from "./backend/ProjectDetails";
import { auth } from "../../firebase";
import { CustomSwitch } from "./ProjectSettings.jsx";
import CustomDatePicker from "../../components/CustomDatePicker.jsx";
import {
  Box,
  Button,
  IconButton,
  Modal,
  TextField,
  Typography,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import RepeatSelector from "./RepeatSelector.jsx";
import { ThemeProvider } from "@mui/system";
import { theme } from "./ProjectSettings.jsx";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import ReminderSpecific from "./ReminderSpecific";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { fetchTaskDetails } from "./backend/ProjectDetails";
import EditPen from "../DesignSpace/svg/EditPen.jsx";
import Trash from "../DesignSpace/svg/Trash.jsx";
import deepEqual from "deep-equal";
import { showToast } from "../../functions/utils";
import {
  isManagerProject,
  isManagerContentManagerProject,
  isManagerContentManagerContributorProject,
  isCollaboratorProject,
} from "./Project";
import { iconButtonStyles } from "../Homepage/DrawerComponent.jsx";
import { gradientButtonStyles } from "../DesignSpace/PromptBar.jsx";
import { textFieldInputProps, textFieldStyles } from "../DesignSpace/DesignSettings.jsx";
import dayjs from "dayjs";
import { LocalizationProvider, DatePicker, DateTimePicker, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { dialogStyles } from "../DesignSpace/EditDescModal.jsx";
import { dialogContentStyles, dialogTitleStyles } from "../../components/RenameModal.jsx";
import { CloseRounded } from "@mui/icons-material";

function EditEvent() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const navigateTo = location.state?.navigateFrom || "/";
  const navigateFrom = location.pathname;
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
  const [isSaveBtnDisabled, setIsSaveBtnDisabled] = useState(false);
  const { userDoc, projects, userProjects } = useSharedProps();
  const [loadingProject, setLoadingProject] = useState(true);
  const [project, setProject] = useState({});
  const [isManager, setIsManager] = useState(false);
  const [isManagerContentManager, setIsManagerContentManager] = useState(false);
  const [isManagerContentManagerContributor, setIsManagerContentManagerContributor] =
    useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [errors, setErrors] = useState({});

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
      showToast("error", "You don't have access to this portion of the project.");
      navigate("/timeline/" + projectId);
      return;
    }
    // If they have access, proceed with setting roles
    setIsManager(isManagerProject(project, userDoc.id));
    setIsManagerContentManager(isManagerContentManagerProject(project, userDoc.id));
    setIsManagerContentManagerContributor(
      isManagerContentManagerContributorProject(project, userDoc.id)
    );
    setIsCollaborator(isCollaboratorProject(project, userDoc.id));

    // Check if none of the manager roles are true
    if (
      isManagerProject(project, userDoc.id) ||
      isManagerContentManagerProject(project, userDoc.id) ||
      isManagerContentManagerContributorProject(project, userDoc.id)
    ) {
    } else {
      showToast("error", "You don't have access to this portion of the project.");
      navigate("/timeline/" + projectId);
      return;
    }

    if (!isManagerContentManagerContributor) {
      console.log("You are a manager content manager contributor");
    } else {
      showToast("error", "You don't have access to this portion of the project.");
      navigate("/timeline/" + projectId);
    }
  }, [project, userDoc, navigate, projectId]);

  const today = dayjs();
  const yesterday = dayjs().subtract(1, "day");
  const todayStartOfTheDay = today.startOf("day");

  const initialFormData = {
    taskName: "",
    startDate: today,
    endDate: today,
    description: "",
    repeat: {
      frequency: 0,
      unit: "none",
    },
    reminders: [],
    repeatEnabled: true,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isEditingReminder, setIsEditingReminder] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      if (taskId) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const taskDetails = await fetchTaskDetails(currentUser.uid, taskId);
          console.log("taskDetails", taskDetails);
          setFormData({
            taskName: taskDetails.eventName,
            // startDate: new Date(taskDetails.dateRange.start._seconds * 1000)
            //   .toISOString()
            //   .split("T")[0],
            // endDate: new Date(taskDetails.dateRange.end._seconds * 1000)
            //   .toISOString()
            //   .split("T")[0],
            startDate: dayjs(taskDetails.dateRange.start._seconds * 1000), // Convert to dayjs
            endDate: dayjs(taskDetails.dateRange.end._seconds * 1000), // Convert to dayjs
            description: taskDetails.description,
            repeat: {
              frequency: taskDetails.repeatEvery.frequency || 0,
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
          setAllowRepeat(taskDetails.repeating ?? false);
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
    setIsEditingReminder(false);
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
      const startDate = formData.startDate.toDate(); // dayjs to Date object
      const endDate = formData.endDate.toDate(); // dayjs to Date object

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
          reminderInMinutes: reminder.reminderInMinutes, // Save the reminder in minutes
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

  const handleSaveWithLoading = async () => {
    setIsSaveBtnDisabled(true);
    await handleSave();
    setIsSaveBtnDisabled(false);
  };

  const handleCancel = () => {
    setOpenModal(false);
    setIsEditingReminder(false);
  };

  const handleRepeatToggle = () => {
    setAllowRepeat((prev) => !prev);
    // previous value of allowRepeat
    if (!allowRepeat) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        repeat: {
          frequency: 1, // default
          unit: "week", // default
        },
      }));
    } else {
      setFormData((prevFormData) => ({
        ...prevFormData,
        repeat: {
          frequency: 0,
          unit: "none",
        },
      }));
    }
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

  // const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    console.log("event - startDate", formData.startDate);
    console.log("event - endDate", formData.endDate);
  }, [formData.startDate, formData.endDate]);

  return (
    <ThemeProvider theme={theme}>
      <div style={{ overflowX: "hidden" }}>
        <TopBar
          state={`${!taskId ? "Add" : "Edit"} Event`}
          navigateTo={navigateTo}
          navigateFrom={navigateFrom}
        />
        <div className="edit-event" style={{ paddingTop: "74px" }}>
          <div className="form-container">
            <div className="form-group">
              <label htmlFor="taskName">Task / Event name </label>
              <TextField
                fullWidth
                variant="outlined"
                type="text"
                id="taskName"
                name="taskName"
                placeholder="Task / Event name"
                value={formData.taskName}
                onChange={(e) => handleInputChange(e, "taskName")}
                sx={{
                  ...textFieldStyles,
                  marginTop: "10px",
                  "& .MuiOutlinedInput-root": {
                    ...textFieldStyles["& .MuiOutlinedInput-root"],
                    backgroundColor: "transparent",
                  },
                }}
                helperText={errors?.taskName}
                InputProps={textFieldInputProps}
                inputProps={{ maxLength: 100 }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="startDate">Start date</label>
              <CustomDatePicker
                defaultValue={today}
                minDate={today}
                value={formData.startDate ? dayjs(formData.startDate) : null}
                onChange={(newValue) => {
                  setFormData((prev) => {
                    const currentEndDate = dayjs(prev.endDate);
                    const newStartDate = dayjs(newValue);
                    // If end date is before the new start date or not set
                    if (!prev.endDate || currentEndDate.isBefore(newStartDate)) {
                      return {
                        ...prev,
                        startDate: newValue,
                        endDate: newValue, // Set end date to match start date
                      };
                    }
                    // Otherwise just update start date
                    return {
                      ...prev,
                      startDate: newValue,
                    };
                  });
                }}
                error={errors?.startDate}
                id="startDate"
                name="startDate"
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">End date</label>
              <CustomDatePicker
                defaultValue={dayjs(formData.startDate)}
                minDate={dayjs(formData.startDate)}
                value={formData.endDate ? dayjs(formData.endDate) : null}
                onChange={(newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    endDate: newValue,
                  }));
                }}
                error={errors?.endDate}
                id="endDate"
                name="endDate"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <TextField
                fullWidth
                variant="outlined"
                type="text"
                multiline
                minRows={4}
                id="description"
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={(e) => handleInputChange(e, "description")}
                sx={{
                  ...textFieldStyles,
                  marginTop: "10px",
                  "& .MuiOutlinedInput-root": {
                    ...textFieldStyles["& .MuiOutlinedInput-root"],
                    backgroundColor: "transparent",
                    "& textarea": {
                      scrollbarWidth: "thin",
                      color: "var(--color-white)",
                      minHeight: "0px",
                      "& .mention": {
                        color: "var(--brightFont)",
                        fontWeight: "bold",
                      },
                      "&::-webkit-scrollbar": {
                        width: "8px",
                      },
                    },
                  },
                }}
                helperText={errors?.description}
                InputProps={textFieldInputProps}
                inputProps={{ maxLength: 1000 }}
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
            <div className="form-group reminders">
              <div className="reminders-header">
                <label>Reminders</label>
                <IconButton
                  // className="icon-button add-button"
                  onClick={addReminder}
                  sx={iconButtonStyles}
                >
                  <AddIconGradient />
                </IconButton>
              </div>
              <div className="reminders-cont">
                {formData.reminders.map((reminder, index) => (
                  <div key={reminder.id} className="reminder-item">
                    <div className="reminder-display">
                      <span>
                        {`Every ${reminder.count === 1 ? "" : reminder.count} ${
                          reminder.count > 1 ? `${reminder.unit}s` : reminder.unit
                        }`}{" "}
                        before {reminder.hours}:{reminder.minutes.toString().padStart(2, "0")}{" "}
                        {reminder.period}
                      </span>
                      <div className="reminder-actions">
                        <IconButton
                          // className="icon-button"
                          onClick={() => {
                            setSelectedReminder(reminder);
                            setIsEditingReminder(true);
                            setOpenModal(true);
                          }}
                          sx={iconButtonStyles}
                        >
                          <EditIconSmallGradient />
                        </IconButton>{" "}
                        <IconButton
                          // className="icon-button"
                          onClick={() => deleteReminder(reminder.id)}
                          sx={iconButtonStyles}
                        >
                          <Trash />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="centerButtonHorizontally">
              <Button
                // className="edit-event-button"
                variant="contained"
                onClick={handleSaveWithLoading}
                sx={{
                  ...gradientButtonStyles,
                  maxWidth: "235px",
                  paddingLeft: "50px",
                  paddingRight: "50px",
                  opacity: isSaveBtnDisabled ? "0.5" : "1",
                  cursor: isSaveBtnDisabled ? "default" : "pointer",
                  "&:hover": {
                    backgroundImage: !isSaveBtnDisabled && "var(--gradientButtonHover)",
                  },
                }}
                disabled={isSaveBtnDisabled}
              >
                {`${!taskId ? "Add" : "Edit"} event`}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={openModal} onClose={handleCancel} sx={dialogStyles}>
        <DialogTitle sx={dialogTitleStyles}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: "bold",
              fontSize: "1.15rem",
              flexGrow: 1,
              maxWidth: "80%",
              whiteSpace: "normal",
            }}
          >
            {`${!isEditingReminder ? "Add" : "Edit"} reminder`}
          </Typography>
          <IconButton
            onClick={handleCancel}
            sx={{
              ...iconButtonStyles,
              flexShrink: 0,
              marginLeft: "auto",
            }}
          >
            <CloseRounded />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{ ...dialogContentStyles, width: "calc(100% - 40px)", minWidth: "min(50vw, 50vh)" }}
        >
          <ReminderSpecific
            reminder={selectedReminder}
            onSave={saveReminder}
            onCancel={handleCancel}
            isEditingReminder={isEditingReminder}
          />
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
}

export default EditEvent;
