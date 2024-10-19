import React, { useState, useEffect } from "react";
import { TextField, InputAdornment, IconButton, Button } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { getHasError, getErrMessage, toCamelCase } from "../../functions/utils";

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
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const icon = isEditing ? (
    <SaveIcon sx={{ color: "#FF894D" }} />
  ) : (
    <EditIcon sx={{ color: "#FF894D" }} />
  );

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
        marginTop: "10px",
        marginBottom: "10px",
        backgroundColor: "transparent",
        input: { color: "var(--color-white)", fontWeight: "bold" },
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderColor: "var(--inputBg)",
            borderWidth: `${isEditing ? "2px" : "0px"}`,
          },
          "&:hover fieldset": {
            borderColor: "var(--inputBg)",
            borderWidth: `${isEditing ? "2px" : "0px"}`,
          },
          "&.Mui-focused fieldset": {
            borderColor: "var(--inputBg)",
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
            {isEditable && (
              <>
                {isEditing && (
                  <IconButton onClick={() => handleReset(toCamelCase(label))}>
                    <CloseRoundedIcon sx={{ color: "rgba(255, 137, 77, 0.5)" }} />
                  </IconButton>
                )}
                <IconButton onClick={isEditing ? handleSave : handleEdit}>{icon}</IconButton>
              </>
            )}
          </InputAdornment>
        ),
      }}
    />
  );
}
