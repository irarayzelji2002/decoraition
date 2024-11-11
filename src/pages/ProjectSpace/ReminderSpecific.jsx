import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  IconButton,
  InputBase,
  Select,
  MenuItem,
} from "@mui/material";
import {
  ArrowRight as ArrowRightIcon,
  ArrowLeft as ArrowLeftIcon,
} from "@mui/icons-material";

function ReminderSpecific({ reminder, onSave, onCancel }) {
  const [hours, setHours] = useState(reminder?.hours || 8);
  const [minutes, setMinutes] = useState(reminder?.minutes || 0);
  const [period, setPeriod] = useState(reminder?.period || "AM");
  const [count, setCount] = useState(reminder?.count || 1);
  const [unit, setUnit] = useState(reminder?.unit || "day");

  useEffect(() => {
    if (reminder) {
      setHours(reminder.hours);
      setMinutes(reminder.minutes);
      setPeriod(reminder.period);
      setCount(reminder.count);
      setUnit(reminder.unit);
    }
  }, [reminder]);

  const handleIncrement = () => {
    setCount((prevCount) => prevCount + 1);
  };

  const handleDecrement = () => {
    setCount((prevCount) => (prevCount > 1 ? prevCount - 1 : 1));
  };

  const handleUnitChange = (event) => {
    setUnit(event.target.value);
  };

  const handleIncrementHours = () => {
    setHours((prevHours) => (prevHours < 12 ? prevHours + 1 : 1));
  };

  const handleDecrementHours = () => {
    setHours((prevHours) => (prevHours > 1 ? prevHours - 1 : 12));
  };

  const handleIncrementMinutes = () => {
    setMinutes((prevMinutes) => (prevMinutes < 59 ? prevMinutes + 1 : 0));
  };

  const handleDecrementMinutes = () => {
    setMinutes((prevMinutes) => (prevMinutes > 0 ? prevMinutes - 1 : 59));
  };

  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
  };

  const handleSave = () => {
    onSave({
      hours,
      minutes,
      period,
      count,
      unit,
    });
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      sx={{
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <label>
        Repeat {count} {unit} before {hours}:
        {minutes.toString().padStart(2, "0")} {period}
      </label>
      <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
        <Box
          display="flex"
          alignItems="center"
          sx={{
            border: "1px solid gray",
            borderRadius: 1,
            backgroundColor: "var(--inputBg)",
          }}
        >
          <IconButton onClick={handleDecrement} size="small">
            <ArrowLeftIcon fontSize="small" />
          </IconButton>
          <InputBase
            value={count}
            readOnly
            sx={{
              width: "50px",
              textAlign: "center !important",
              border: "none",
              color: "var(--color-white)",
            }}
          />
          <IconButton onClick={handleIncrement} size="small">
            <ArrowRightIcon fontSize="small" />
          </IconButton>
        </Box>

        <Select
          value={unit}
          onChange={handleUnitChange}
          sx={{
            border: "1px solid gray",
            borderRadius: 1,
            width: "100px",
            color: "var(--color-white)",
          }}
        >
          <MenuItem value="week">Week</MenuItem>
          <MenuItem value="day">Day</MenuItem>
          <MenuItem value="month">Month</MenuItem>
        </Select>
      </div>
      <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
        <Box
          display="flex"
          alignItems="center"
          sx={{
            border: "1px solid gray",
            borderRadius: 1,
            backgroundColor: "var(--inputBg)",
          }}
        >
          <IconButton onClick={handleDecrementHours} size="small">
            <ArrowLeftIcon fontSize="small" />
          </IconButton>
          <InputBase
            value={hours}
            readOnly
            sx={{
              width: "50px",
              textAlign: "center !important",
              border: "none",
              color: "var(--color-white)",
            }}
          />
          <IconButton onClick={handleIncrementHours} size="small">
            <ArrowRightIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box
          display="flex"
          alignItems="center"
          sx={{
            border: "1px solid gray",
            borderRadius: 1,
            backgroundColor: "var(--inputBg)",
          }}
        >
          <IconButton onClick={handleDecrementMinutes} size="small">
            <ArrowLeftIcon fontSize="small" />
          </IconButton>
          <InputBase
            value={minutes.toString().padStart(2, "0")}
            readOnly
            sx={{
              width: "50px",
              textAlign: "center !important",
              border: "none",
              color: "var(--color-white)",
            }}
          />
          <IconButton onClick={handleIncrementMinutes} size="small">
            <ArrowRightIcon fontSize="small" />
          </IconButton>
        </Box>

        <Select
          value={period}
          onChange={handlePeriodChange}
          sx={{
            border: "1px solid gray",
            borderRadius: 1,
            width: "100px",
            color: "var(--color-white)",
          }}
        >
          <MenuItem value="AM">AM</MenuItem>
          <MenuItem value="PM">PM</MenuItem>
        </Select>
      </div>
      <Box mt={2} display="flex" gap="10px" sx={{ width: "100%" }}>
        <Button onClick={onCancel} className="cancel-button">
          Cancel
        </Button>
        <Button className="confirm-button" onClick={handleSave}>
          Save
        </Button>
      </Box>
    </Box>
  );
}

export default ReminderSpecific;
