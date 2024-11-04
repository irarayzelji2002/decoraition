import React, { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Box,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  LocalizationProvider,
  DatePicker,
  TimePicker,
} from "@mui/x-date-pickers";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const RemindTime = () => {
  const [open, setOpen] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [editingIndex, setEditingIndex] = useState(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setEditingIndex(null);
  };

  const handleSave = () => {
    const newReminder = {
      date: selectedDate,
      time: selectedTime,
    };
    if (editingIndex !== null) {
      // Update existing reminder
      const updatedReminders = [...reminders];
      updatedReminders[editingIndex] = newReminder;
      setReminders(updatedReminders);
    } else {
      // Add new reminder
      setReminders([...reminders, newReminder]);
    }
    handleClose();
  };

  const handleDelete = (index) => {
    setReminders(reminders.filter((_, i) => i !== index));
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setSelectedDate(reminders[index].date);
    setSelectedTime(reminders[index].time);
    setOpen(true);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Reminders</Typography>
        <List>
          {reminders.map((reminder, index) => (
            <ListItem
              key={index}
              sx={{ backgroundColor: "#333", borderRadius: 1, mb: 1 }}
            >
              <ListItemText
                primary={`${reminder.date.toLocaleDateString()} ${reminder.time.toLocaleTimeString()}`}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleEdit(index)}>
                  <EditIcon color="primary" />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDelete(index)}>
                  <DeleteIcon color="error" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        <IconButton onClick={handleOpen} color="primary">
          <AddIcon />
        </IconButton>
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {editingIndex !== null ? "Edit Reminder" : "Add Reminder"}
        </DialogTitle>
        <DialogContent>
          <DatePicker
            label="Choose a date"
            value={selectedDate}
            onChange={(newDate) => setSelectedDate(newDate)}
            renderInput={(props) => (
              <TextField {...props} fullWidth margin="normal" />
            )}
          />
          <TimePicker
            label="Select time"
            value={selectedTime}
            onChange={(newTime) => setSelectedTime(newTime)}
            renderInput={(props) => (
              <TextField {...props} fullWidth margin="normal" />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default RemindTime;
