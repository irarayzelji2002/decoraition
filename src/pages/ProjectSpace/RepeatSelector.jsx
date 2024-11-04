import React, { useState } from "react";
import { Box, Typography, IconButton, InputBase, Select, MenuItem } from "@mui/material";
import { ArrowRight as ArrowRightIcon, ArrowLeft as ArrowLeftIcon } from "@mui/icons-material";

const RepeatSelector = () => {
  const [count, setCount] = useState(1);
  const [unit, setUnit] = useState("week");
  const handleIncrement = () => {
    setCount((prevCount) => prevCount + 1);
  };
  const handleDecrement = () => {
    setCount((prevCount) => (prevCount > 1 ? prevCount - 1 : 1));
  };
  const handleUnitChange = (event) => {
    setUnit(event.target.value);
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
