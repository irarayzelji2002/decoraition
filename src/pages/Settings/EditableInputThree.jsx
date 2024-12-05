import React, { useState } from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import { handleSetError, getHasError, getErrMessage, toCamelCase } from "../../functions/utils";
import { ResetIconSmallGradient } from "../DesignSpace/svg/AddColor";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { SaveIconSmallGradient } from "../DesignSpace/svg/AddImage";
import {
  EditIconSmallGradient,
  CancelIconSmallGradient,
} from "../../components/svg/DefaultMenuIcons";
import { textFieldStyles } from "../DesignSpace/DesignSettings";

const EditableInputThree = ({
  labels,
  values,
  onChange,
  onSave,
  errors,
  initErrors,
  setErrors,
  origValues,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValues, setInputValues] = useState(values);
  const maxLengths = [50, 50, 20];

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    const success = await onSave(inputValues);
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

  const handleChange = (index, value) => {
    if (value.length <= maxLengths[index]) {
      const newValues = [...inputValues];
      newValues[index] = value;
      setInputValues(newValues);
      onChange(index, value);
    } else {
      const tempErrors = [...errors];
      tempErrors[index].hasError = true;
      tempErrors[index].errMessage = `Character limit of ${maxLengths[index]} reached`;
      setErrors(tempErrors);
    }
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
    <div style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center" }}>
      <div style={{ flexGrow: "1" }}>
        {labels.map((label, index) => (
          <div key={index} className="settingsLabelAndInput">
            <label className={`inputLabel ${isEditing && "editing"}`}>{label}</label>
            <TextField
              value={inputValues[index]}
              onChange={(e) => handleChange(index, e.target.value)}
              disabled={!isEditing}
              placeholder={label}
              fullWidth
              margin="normal"
              helperText={
                getErrMessage(toCamelCase(label), errors) ||
                (inputValues[index].length >= maxLengths[index] &&
                  `Character limit of ${maxLengths[index]} reached`)
              }
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
                    {isEditing && (
                      <IconButton onClick={() => handleReset(index)} sx={iconButtonStyles}>
                        <ResetIconSmallGradient />
                      </IconButton>
                    )}
                  </InputAdornment>
                ),
              }}
            />
          </div>
        ))}
        {getHasError("all", errors) && <span className="">{getErrMessage("all", errors)}</span>}
      </div>
      <div
        style={{
          flexShrink: "1",
          marginLeft: "5px",
          marginRight: "8px",
          minWidth: "75px",
          justifyContent: "flex-end",
          display: "flex",
        }}
      >
        {isEditing && (
          <IconButton onClick={handleClose} sx={{ ...iconButtonStyles, padding: "10.5px" }}>
            <CancelIconSmallGradient />
          </IconButton>
        )}
        {icon}
      </div>
    </div>
  );
};

export default EditableInputThree;
