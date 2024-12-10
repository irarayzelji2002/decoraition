import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, InputBase, Select, MenuItem } from "@mui/material";
import {
  KeyboardArrowRightRounded as KeyboardArrowRightRoundedIcon,
  KeyboardArrowLeftRounded as KeyboardArrowLeftRoundedIcon,
  KeyboardArrowDownRounded as KeyboardArrowDownRoundedIcon,
} from "@mui/icons-material";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { selectStyles, menuItemStyles } from "../DesignSpace/DesignSettings";

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

  useEffect(() => {
    console.log(`count: ${count}; type: ${typeof count} unit: ${unit}`);
  }, [count, unit]);

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      sx={{
        flexDirection: "column",
        alignItems: "flex-start",
        marginTop: "-5px",
      }}
    >
      {count !== null && unit !== "none" && (
        <Typography variant="body1" sx={{ fontSize: "0.875rem" }}>
          {`Repeat every ${count === 1 ? "" : count} ${count > 1 ? `${unit}s` : unit}`}
        </Typography>
      )}
      <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
        <div className="quantity-section" style={{ margin: 0 }}>
          <IconButton onClick={handleDecrement} sx={iconButtonStyles} className="left">
            <KeyboardArrowLeftRoundedIcon sx={{ color: "var(color-white)" }} />
          </IconButton>
          <InputBase
            value={unit === "none" ? "No. of" : count}
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
          renderValue={(selected) => {
            if (selected === "none") {
              return "Time period";
            }
            return selected;
          }}
        >
          <MenuItem disabled value="none" sx={menuItemStyles}>
            Time period
          </MenuItem>
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
    </Box>
  );
};

export default RepeatSelector;
