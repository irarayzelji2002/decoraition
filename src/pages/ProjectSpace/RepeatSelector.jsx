import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, InputBase, Select, MenuItem } from "@mui/material";
import {
  KeyboardArrowRightRounded as KeyboardArrowRightRoundedIcon,
  KeyboardArrowLeftRounded as KeyboardArrowLeftRoundedIcon,
} from "@mui/icons-material";

const RepeatSelector = ({ count: initialCount, unit: initialUnit, onRepeatChange }) => {
  const [count, setCount] = useState(initialCount);
  const [unit, setUnit] = useState(initialUnit);

  useEffect(() => {
    onRepeatChange(count, unit);
  }, [count, unit, onRepeatChange]);

  const handleIncrement = () => {
    setCount((prevCount) => {
      switch (unit) {
        case "day":
          return prevCount < 6 ? prevCount + 1 : 6;
        case "week":
          return prevCount < 3 ? prevCount + 1 : 3;
        case "month":
          return prevCount < 11 ? prevCount + 1 : 11;
        case "year":
          return prevCount < 100 ? prevCount + 1 : 100;
        default:
          return prevCount + 1;
      }
    });
  };

  const handleDecrement = () => {
    setCount((prevCount) => (prevCount > 1 ? prevCount - 1 : 1));
  };

  const handleUnitChange = (event) => {
    const value = event.target.value;
    setUnit(value);
    switch (value) {
      case "none":
        setCount(null);
        break;
      case "day":
        setCount(1);
        break;
      case "week":
        setCount(1);
        break;
      case "month":
        setCount(1);
        break;
      case "year":
        setCount(1);
        break;
      default:
        setCount(1);
    }
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
      <Typography variant="body1">Repeat every</Typography>
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
            <KeyboardArrowLeftRoundedIcon fontSize="small" />
          </IconButton>
          <InputBase
            value={unit === "none" ? "" : count}
            readOnly
            sx={{
              width: "50px",
              textAlign: "center !important",
              border: "none",
              color: "var(--color-white)",
            }}
          />
          <IconButton onClick={handleIncrement} size="small">
            <KeyboardArrowRightRoundedIcon fontSize="small" />
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
          <MenuItem value="none">none</MenuItem>
          <MenuItem value="day">day</MenuItem>
          <MenuItem value="week">week</MenuItem>
          <MenuItem value="month">month</MenuItem>
          <MenuItem value="year">year</MenuItem>
        </Select>
      </div>
    </Box>
  );
};

export default RepeatSelector;
