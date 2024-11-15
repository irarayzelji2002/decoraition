import React from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import UnlinkIcon from "@mui/icons-material/LinkOff";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import {
  LinkIconSmallGradient,
  UnlinkIconSmallGradient,
  LightModeSmallGradient,
  DarkModeSmallGradient,
} from "../../components/svg/DefaultMenuIcons";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { textFieldStyles } from "../DesignSpace/DesignSettings";

const LongToggleInput = ({ label, value, onToggle, isConnectedAccount }) => {
  const icon = isConnectedAccount ? (
    value === null ? (
      <IconButton onClick={onToggle} sx={{ ...iconButtonStyles, padding: "10px" }}>
        <LinkIconSmallGradient />
      </IconButton>
    ) : (
      <IconButton onClick={onToggle} sx={{ ...iconButtonStyles, padding: "10px" }}>
        <UnlinkIconSmallGradient />
      </IconButton>
    )
  ) : value === 0 ? (
    <IconButton onClick={onToggle} sx={iconButtonStyles}>
      <DarkModeSmallGradient sx={{ color: "#FF894D" }} />
    </IconButton>
  ) : (
    <IconButton onClick={onToggle} sx={iconButtonStyles}>
      <LightModeSmallGradient sx={{ color: "#FF894D" }} />
    </IconButton>
  );

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center" }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          margin: "10px 0px",
        }}
      >
        <label className="inputLabel">{label}</label>
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
            ...textFieldStyles,
            margin: 0,
            backgroundColor: "transparent",
            "& .MuiOutlinedInput-root": {
              ...textFieldStyles["& .MuiOutlinedInput-root"],
              backgroundColor: "transparent",
              paddingRight: "7px",
              "& fieldset": {
                borderColor: "var(--borderInput)",
                borderWidth: "0px",
              },
              "&:hover fieldset": {
                borderColor: "var(--borderInput)",
                borderWidth: "0px",
              },
              "&.Mui-focused fieldset": {
                borderColor: "var(--borderInputBrighter)",
                borderWidth: "2px",
              },
            },
            "& input": {
              color: "var(--color-white)",
              padding: "5px 15px",
            },
            "& .MuiFormHelperText-root": {
              color: "var(--color-quaternary)",
              marginLeft: 0,
            },
            "& .Mui-disabled": {
              WebkitTextFillColor: "inherit",
              opacity: 1,
            },
          }}
          InputProps={{
            endAdornment: <InputAdornment position="end">{icon}</InputAdornment>,
          }}
        />
      </div>
    </div>
  );
};

export default LongToggleInput;
