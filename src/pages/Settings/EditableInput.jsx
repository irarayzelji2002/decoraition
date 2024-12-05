import React, { useState, useEffect } from "react";
import { TextField, InputAdornment, IconButton, Button } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { getHasError, getErrMessage, toCamelCase } from "../../functions/utils";
import { ResetIconSmallGradient } from "../DesignSpace/svg/AddColor";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { SaveIconSmallGradient } from "../DesignSpace/svg/AddImage";
import {
  EditIconSmallGradient,
  CancelIconSmallGradient,
} from "../../components/svg/DefaultMenuIcons";
import { textFieldStyles } from "../DesignSpace/DesignSettings";

export default function EditableInput({
  label,
  value,
  onChange,
  onSave,
  onReset,
  errors,
  initErrors,
  isEditable = true,
  setErrors,
  disabled = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleEdit = () => {
    if (isEditable) setIsEditing(true);
  };

  const handleSave = async () => {
    const success = await onSave(inputValue);
    if (success) {
      setIsEditing(false);
    }
  };

  const icon = isEditing ? (
    <IconButton
      onClick={isEditing ? handleSave : handleEdit}
      sx={{
        ...iconButtonStyles,
        padding: "9.5px",
        opacity: disabled ? "0.5 !important" : "1 !important",
        cursor: disabled ? "default !important" : "pointer !important",
      }}
      disabled={disabled}
    >
      <SaveIconSmallGradient sx={{ color: "#FF894D" }} />
    </IconButton>
  ) : (
    <IconButton
      onClick={isEditing ? handleSave : handleEdit}
      sx={{ ...iconButtonStyles, padding: "9.5px" }}
    >
      <EditIconSmallGradient sx={{ color: "#FF894D" }} />
    </IconButton>
  );

  const handleChange = (e) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
  };

  const handleReset = (field) => {
    if (onReset) {
      onReset(field);
      setIsEditing(false);
      setErrors(initErrors);
    }
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center" }}>
      <div
        style={{ margin: `${isEditing ? "15px" : "10px"} 0px` }}
        className="settingsLabelAndInput"
      >
        <label className={`inputLabel ${isEditing && "editing"}`}>{label}</label>
        <TextField
          label=""
          type="text"
          value={inputValue}
          onChange={handleChange}
          disabled={!isEditing}
          fullWidth
          margin="normal"
          helperText={getErrMessage(toCamelCase(label), errors)}
          sx={{
            ...textFieldStyles,
            margin: 0,
            backgroundColor: "transparent",
            "& .MuiOutlinedInput-root": {
              ...textFieldStyles["& .MuiOutlinedInput-root"],
              backgroundColor: `${isEditing ? "var(--nav-card-modal)" : "transparent"}`,
              paddingRight: "7px",
              "& fieldset": {
                borderColor: "var(--borderInput)",
                borderWidth: `${isEditing ? "2px" : "0px"}`,
              },
              "&:hover fieldset": {
                borderColor: "var(--borderInput)",
                borderWidth: `${isEditing ? "2px" : "0px"}`,
              },
              "&.Mui-focused fieldset": {
                borderColor: "var(--borderInputBrighter)",
                borderWidth: "2px",
              },
            },
            "& input": {
              color: "var(--color-white)",
              padding: `${isEditing ? "15px" : "5px"} 15px`,
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
                padding: `${isEditing ? "15px" : "10px 0px 0px 0px"}`,
              },
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {isEditable && (
                  <>
                    {isEditing && (
                      <IconButton
                        onClick={() => handleReset(toCamelCase(label))}
                        sx={{ ...iconButtonStyles, padding: "10.5px" }}
                      >
                        <CancelIconSmallGradient />
                      </IconButton>
                    )}
                    {icon}
                  </>
                )}
              </InputAdornment>
            ),
          }}
        />
      </div>
    </div>
  );
}
