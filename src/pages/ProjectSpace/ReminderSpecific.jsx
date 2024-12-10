import React, { useState, useEffect } from "react";
import { Box, Button, IconButton, InputBase, Select, MenuItem, DialogActions } from "@mui/material";
import {
  KeyboardArrowRightRounded as KeyboardArrowRightRoundedIcon,
  KeyboardArrowLeftRounded as KeyboardArrowLeftRoundedIcon,
  KeyboardArrowDownRounded as KeyboardArrowDownRoundedIcon,
} from "@mui/icons-material";
import { dialogActionsStyles } from "../../components/RenameModal";
import { gradientButtonStyles, outlinedButtonStyles } from "../DesignSpace/PromptBar";
import { menuItemStyles, selectStyles } from "../DesignSpace/DesignSettings";
import { iconButtonStyles } from "../Homepage/DrawerComponent";

function ReminderSpecific({ reminder, onSave, onCancel, isEditingReminder }) {
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
    setCount((prevCount) => {
      if (unit === "day" && prevCount >= 6) return 6;
      if (unit === "week" && prevCount >= 3) return 3;
      if (unit === "month" && prevCount >= 11) return 11;
      if (unit === "year" && prevCount >= 100) return 100;
      return prevCount + 1;
    });
  };

  const handleDecrement = () => {
    setCount((prevCount) => (prevCount > 1 ? prevCount - 1 : 1));
  };

  const handleUnitChange = (event) => {
    setUnit(event.target.value);
    setCount(1); // Reset count when unit changes
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
    const time = `${hours}:${minutes.toString().padStart(2, "0")} ${period}`;
    let reminderInMinutes = count;
    if (unit === "day") reminderInMinutes *= 1440;
    if (unit === "week") reminderInMinutes *= 10080;
    if (unit === "month") reminderInMinutes *= 43200;

    onSave({
      ...reminder,
      hours,
      minutes,
      period,
      count,
      unit,
      time, // Save the formatted time
      reminderInMinutes, // Save the reminder in minutes
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
        Remind {`every ${count === 1 ? "" : count} ${count > 1 ? `${unit}s` : unit}`} before {hours}
        :{minutes.toString().padStart(2, "0")} {period}
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: "15px", width: "100%" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "15px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <div className="quantity-section bgModal" style={{ margin: 0 }}>
            <IconButton onClick={handleDecrement} sx={iconButtonStyles} className="left">
              <KeyboardArrowLeftRoundedIcon sx={{ color: "var(color-white)" }} />
            </IconButton>
            <InputBase
              value={count}
              readOnly
              inputProps={{ style: { textAlign: "center" } }}
              sx={{
                width: "50px",
                textAlign: "center !important",
                border: "none",
                color: "var(--color-white)",
              }}
            />
            <IconButton onClick={handleIncrement} sx={iconButtonStyles} className="right">
              <KeyboardArrowRightRoundedIcon sx={{ color: "var(color-white)" }} />
            </IconButton>
          </div>

          <Select
            value={unit}
            onChange={handleUnitChange}
            IconComponent={(props) => (
              <KeyboardArrowDownRoundedIcon sx={{ color: "var(--color-white) !important" }} />
            )}
            sx={{
              ...selectStyles,
              height: "fit-content",
              flexGrow: 1,
              "& .MuiInputBase-input": {
                WebkitTextFillColor: unit === "none" ? "var(--greyText)" : "var(--color-white)",
                padding: "17px 40px 17px 20px !important",
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  borderRadius: "10px",
                  "& .MuiMenu-list": {
                    padding: 0,
                  },
                  "& .MuiMenuItem-root[aria-disabled='true']": {
                    display: "none",
                  },
                },
              },
            }}
          >
            <MenuItem value="day" sx={menuItemStyles}>
              day
            </MenuItem>
            <MenuItem value="week" sx={menuItemStyles}>
              week
            </MenuItem>
            <MenuItem value="month" sx={menuItemStyles}>
              month
            </MenuItem>
            <MenuItem value="year" sx={menuItemStyles}>
              year
            </MenuItem>
          </Select>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "15px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <div className="quantity-section bgModal" style={{ margin: 0 }}>
            <IconButton onClick={handleDecrementHours} sx={iconButtonStyles} className="left">
              <KeyboardArrowLeftRoundedIcon sx={{ color: "var(color-white)" }} />
            </IconButton>
            <InputBase
              value={hours}
              readOnly
              inputProps={{ style: { textAlign: "center" } }}
              sx={{
                width: "50px",
                textAlign: "center !important",
                border: "none",
                color: "var(--color-white)",
              }}
            />
            <IconButton onClick={handleIncrementHours} sx={iconButtonStyles} className="right">
              <KeyboardArrowRightRoundedIcon sx={{ color: "var(color-white)" }} />
            </IconButton>
          </div>

          <div className="quantity-section bgModal" style={{ margin: 0 }}>
            <IconButton onClick={handleDecrementMinutes} sx={iconButtonStyles} className="left">
              <KeyboardArrowLeftRoundedIcon sx={{ color: "var(color-white)" }} />
            </IconButton>
            <InputBase
              value={minutes.toString().padStart(2, "0")}
              readOnly
              inputProps={{ style: { textAlign: "center" } }}
              sx={{
                width: "50px",
                textAlign: "center !important",
                border: "none",
                color: "var(--color-white)",
              }}
            />
            <IconButton onClick={handleIncrementMinutes} sx={iconButtonStyles} className="right">
              <KeyboardArrowRightRoundedIcon sx={{ color: "var(color-white)" }} />
            </IconButton>
          </div>

          <Select
            value={period}
            onChange={handlePeriodChange}
            IconComponent={(props) => (
              <KeyboardArrowDownRoundedIcon sx={{ color: "var(--color-white) !important" }} />
            )}
            sx={{
              ...selectStyles,
              height: "fit-content",
              flexGrow: 1,
              "& .MuiInputBase-input": {
                WebkitTextFillColor: unit === "none" ? "var(--greyText)" : "var(--color-white)",
                padding: "17px 40px 17px 20px !important",
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  borderRadius: "10px",
                  "& .MuiMenu-list": {
                    padding: 0,
                  },
                  "& .MuiMenuItem-root[aria-disabled='true']": {
                    display: "none",
                  },
                },
              },
            }}
          >
            <MenuItem value="AM" sx={menuItemStyles}>
              AM
            </MenuItem>
            <MenuItem value="PM" sx={menuItemStyles}>
              PM
            </MenuItem>
          </Select>
        </div>
      </div>
      <DialogActions sx={{ ...dialogActionsStyles, width: "100%", margin: "10px 0px 20px 0px" }}>
        <Button fullWidth variant="contained" onClick={handleSave} sx={gradientButtonStyles}>
          {`${!isEditingReminder ? "Add" : "Edit"} reminder`}
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={onCancel}
          sx={outlinedButtonStyles}
          onMouseOver={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButtonHover)")
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
          }
        >
          Cancel
        </Button>
      </DialogActions>
    </Box>
  );
}

export default ReminderSpecific;
