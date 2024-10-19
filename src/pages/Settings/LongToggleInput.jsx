import React from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import UnlinkIcon from "@mui/icons-material/LinkOff";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

const LongToggleInput = ({ label, value, onToggle, isConnectedAccount }) => {
  const icon = isConnectedAccount ? (
    value === null ? (
      <LinkIcon sx={{ color: "#FF894D" }} />
    ) : (
      <UnlinkIcon sx={{ color: "#FF894D" }} />
    )
  ) : value === 0 ? (
    <DarkModeIcon sx={{ color: "#FF894D" }} />
  ) : (
    <LightModeIcon sx={{ color: "#FF894D" }} />
  );

  return (
    <TextField
      label=""
      value={(() => {
        if (isConnectedAccount) {
          if (value === null) return "None";
          if (value === 0) return "Google";
          if (value === 1) return "Facebook";
          return "Unknown";
        } else {
          return value === 0 ? "Dark" : "Light";
        }
      })()}
      disabled
      fullWidth
      margin="normal"
      sx={{
        marginTop: "10px",
        marginBottom: "10px",
        backgroundColor: "transparent",
        input: { color: "var(--color-white)", fontWeight: "bold" },
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderColor: "transparent",
            borderWidth: "0px",
          },
          "&:hover fieldset": {
            borderColor: "transparent",
            borderWidth: "0px",
          },
          "&.Mui-focused fieldset": {
            borderColor: "transparent",
            borderWidth: "2px",
          },
        },
        "& .MuiFormHelperText-root": {
          color: "white",
        },
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={onToggle}>{icon}</IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};

export default LongToggleInput;
