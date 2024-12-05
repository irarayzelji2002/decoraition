import React, { useState } from "react";
import { TextField, InputAdornment, IconButton, Box } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { EditIcon } from "../../components/svg/DefaultMenuIcons";
import { SaveIcon } from "../DesignSpace/svg/AddImage";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { handleSetError, getHasError, getErrMessage, toCamelCase } from "../../functions/utils";
import { ResetIconSmallGradient } from "../DesignSpace/svg/AddColor";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { SaveIconSmallGradient } from "../DesignSpace/svg/AddImage";
import {
  EditIconSmallGradient,
  CancelIconSmallGradient,
} from "../../components/svg/DefaultMenuIcons";
import { textFieldStyles } from "../DesignSpace/DesignSettings";

const EditablePassInput = ({
  labels,
  values,
  onChange,
  onSave,
  errors,
  initErrors,
  setErrors,
  isEditable = true,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inputValues, setInputValues] = useState(values);

  const handleEdit = () => {
    if (isEditable) setIsEditing(true);
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

  const VisibilityGradientIcon = () => (
    <>
      <svg width={0} height={0}>
        <linearGradient id="gradientButton" x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} style={{ stopColor: "#F68B3F", stopOpacity: 1 }} />
          <stop offset={0.5} style={{ stopColor: "#F15D3F", stopOpacity: 1 }} />
        </linearGradient>
      </svg>
      <Visibility sx={{ fill: "url(#gradientButton)" }} />
    </>
  );

  const VisibilityOffGradientIcon = () => (
    <>
      <svg width={0} height={0}>
        <linearGradient id="gradientButton" x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} style={{ stopColor: "#F68B3F", stopOpacity: 1 }} />
          <stop offset={0.5} style={{ stopColor: "#F15D3F", stopOpacity: 1 }} />
        </linearGradient>
      </svg>
      <VisibilityOff sx={{ fill: "url(#gradientButton)" }} />
    </>
  );

  const handleChange = (index, value) => {
    const newValues = [...inputValues];
    newValues[index] = value;
    setInputValues(newValues);
    onChange(index, value);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleReset = (index) => {
    const newValues = [...inputValues];
    newValues[index] = "";
    setInputValues(newValues);
  };

  const handleClose = () => {
    setIsEditing(false);
    const newValues = Array(values.length).fill("");
    setInputValues(newValues);
    if (setErrors) {
      setErrors(initErrors);
      labels.slice(0, labels.length - 1).forEach((label, index) => {
        onChange(index, ""); // exclude the last one
      });
    }
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center" }}>
      <div style={{ flexGrow: "1" }}>
        {isEditing ? (
          <>
            {labels.slice(0, labels.length - 1).map((label, index) => (
              <div key={index} className="settingsLabelAndInput">
                <TextField
                  key={index}
                  label=""
                  placeholder={label}
                  type={showPassword ? "text" : "password"}
                  value={inputValues[index]}
                  onChange={(e) => handleChange(index, e.target.value)}
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
                      WebkitTextFillColor: "inherit",
                      opacity: 1,
                    },
                    " .MuiInputAdornment-root": {
                      paddingRight: "13px",
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
                        <IconButton
                          onClick={handleClickShowPassword}
                          edge="end"
                          disabled={!isEditing}
                          sx={{ ...iconButtonStyles, padding: "6px" }}
                        >
                          {showPassword ? (
                            <VisibilityOffGradientIcon />
                          ) : (
                            <VisibilityGradientIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
            ))}
          </>
        ) : (
          <TextField
            // label={labels[labels.length - 1]} // last label
            type="password"
            value="********"
            disabled
            fullWidth
            margin="normal"
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
                padding: `15px`,
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
                  padding: `${isEditing ? "15px" : "10px 0px"}`,
                },
              },
            }}
          />
        )}
        {getHasError("all", errors) && <span className="">{getErrMessage("all", errors)}</span>}
      </div>
      {isEditable && (
        <div
          style={{
            flexShrink: "1",
            marginLeft: "5px",
            marginRight: "8px",
            display: "flex",
            minWidth: "75px",
            justifyContent: "flex-end",
          }}
        >
          {isEditing && (
            <IconButton onClick={handleClose} sx={{ ...iconButtonStyles, padding: "10.5px" }}>
              <CancelIconSmallGradient />
            </IconButton>
          )}
          {icon}
        </div>
      )}
    </div>
  );
};

export default EditablePassInput;
