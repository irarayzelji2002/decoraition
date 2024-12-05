import React from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import {
  LinkIconSmallGradient,
  UnlinkIconSmallGradient,
  LightModeSmallGradient,
  DarkModeSmallGradient,
} from "../../components/svg/DefaultMenuIcons";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { textFieldStyles } from "../DesignSpace/DesignSettings";

const LongToggleInput = ({ label, value, onToggle, isConnectedAccount, disabled = false }) => {
  const icon = isConnectedAccount ? (
    value === null ? (
      <IconButton
        onClick={onToggle}
        sx={{
          ...iconButtonStyles,
          padding: "10px",
          opacity: disabled ? "0.5 !important" : "1 !important",
        }}
        disabled={disabled}
      >
        <LinkIconSmallGradient />
      </IconButton>
    ) : (
      <IconButton
        onClick={onToggle}
        sx={{
          ...iconButtonStyles,
          padding: "10px",
          cursor: disabled ? "default !important" : "pointer !important",
        }}
        disabled={disabled}
      >
        <UnlinkIconSmallGradient />
      </IconButton>
    )
  ) : value === 0 ? (
    <IconButton
      onClick={onToggle}
      sx={{ ...iconButtonStyles, opacity: disabled ? "0.5 !important" : "1 !important" }}
      disabled={disabled}
    >
      <DarkModeSmallGradient sx={{ color: "#FF894D" }} />
    </IconButton>
  ) : (
    <IconButton
      onClick={onToggle}
      sx={{ ...iconButtonStyles, cursor: disabled ? "default !important" : "pointer !important" }}
      disabled={disabled}
    >
      <LightModeSmallGradient sx={{ color: "#FF894D" }} />
    </IconButton>
  );

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center" }}>
      <div style={{ margin: "10px 0px" }} className="settingsLabelAndInput">
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
              WebkitTextFillColor: "inherit !important",
              opacity: 1,
            },
            "@media (max-width: 560px)": {
              "& input": {
                padding: "10px 0px 0px 0px",
              },
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
