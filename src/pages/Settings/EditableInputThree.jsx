import React, { useState } from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { handleSetError, getHasError, getErrMessage, toCamelCase } from "../../functions/utils";

const EditableInputThree = ({
  labels,
  values,
  onChange,
  onSave,
  errors,
  initErrors,
  setErrors,
  origValues,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValues, setInputValues] = useState(values);

  const icon = isEditing ? (
    <SaveIcon sx={{ color: "#FF894D" }} />
  ) : (
    <EditIcon sx={{ color: "#FF894D" }} />
  );

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    const success = await onSave(inputValues);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleChange = (index, value) => {
    const newValues = [...inputValues];
    newValues[index] = value;
    setInputValues(newValues);
    onChange(index, value);
  };

  const handleReset = (index) => {
    const newValues = [...inputValues];
    newValues[index] = origValues[index];
    setInputValues(newValues);
  };

  const handleClose = () => {
    setIsEditing(false);
    setInputValues(origValues);
    if (setErrors) {
      setErrors(initErrors);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <div className="push-me-right">
        {isEditing && (
          <IconButton onClick={handleClose}>
            <CloseRoundedIcon sx={{ color: "rgba(255, 137, 77, 0.5)" }} />
          </IconButton>
        )}

        <IconButton onClick={isEditing ? handleSave : handleEdit}>{icon}</IconButton>
      </div>
      {labels.map((label, index) => (
        <TextField
          key={index}
          label=""
          value={inputValues[index]}
          onChange={(e) => handleChange(index, e.target.value)}
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
                {isEditing && (
                  <IconButton onClick={() => handleReset(index)}>
                    <CloseRoundedIcon sx={{ color: "rgba(255, 137, 77, 0.5)" }} />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
        />
      ))}

      {getHasError("all", errors) && <span className="">{getErrMessage("all", errors)}</span>}
    </div>
  );
};

export default EditableInputThree;
