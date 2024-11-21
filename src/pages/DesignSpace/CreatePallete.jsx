import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button as ButtonMUI,
  IconButton as IconButtonMUI,
  Typography as TypographyMUI,
  Box as BoxMUI,
  TextField as TextFieldMUI,
} from "@mui/material";
import {
  ArrowForwardIosRounded as ArrowForwardIosRoundedIcon,
  ArrowBackIosRounded as ArrowBackIosRoundedIcon,
  KeyboardArrowDownRounded as KeyboardArrowDownRoundedIcon,
  CloseRounded as CloseRoundedIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { DeleteIcon } from "../../components/svg/DefaultMenuIcons";
import { SaveIconSmall } from "./svg/AddImage";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { gradientButtonStyles, outlinedButtonStyles } from "./PromptBar";
import {
  dialogStyles,
  dialogTitleStyles,
  dialogContentStyles,
  dialogActionsStyles,
  dialogActionsVertButtonsStyles,
} from "../../components/RenameModal";
import { ChromePicker } from "react-color";
import { huePickerEncodedSvg } from "./svg/AddColor";
import {
  handleAddColorPalette as handleAddColorPaletteBackend,
  handleEditColorPalette as handleEditColorPaletteBackend,
  handleDeleteColorPalette as handleDeleteColorPaletteBackend,
} from "./backend/DesignActions";
import { showToast } from "../../functions/utils";
import { useFetcher } from "react-router-dom";
import { set } from "lodash";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { debounce } from "lodash";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";

const CreatePallete = ({ open, onClose, isEditingPalette, colorPaletteToEdit }) => {
  const { user, userDoc } = useSharedProps();
  const isOnline = useNetworkStatus();
  const [colorPalette, setColorPalette] = useState({ paletteName: "", colors: [] });
  const defaultColor = "#000000";
  const [colorToEdit, setColorToEdit] = useState("");
  const [pickedColor, setPickedColor] = useState("");
  const [pickColorModalOpen, setPickColorModalOpen] = useState(false);
  const [errors, setErrors] = useState({ paletteName: "", colors: "" });

  useEffect(() => {
    console.log("color palette", colorPalette);
  }, [colorPalette]);

  useEffect(() => {
    console.log("color to edit", colorToEdit);
  }, [colorToEdit]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setColorPalette({ paletteName: "", colors: [] });
    }, 500);
  };

  // Remove only the specified field error
  const clearFieldError = (field) => {
    setErrors((prevErrors) => {
      if (prevErrors && prevErrors[field]) {
        const { [field]: _, ...remainingErrors } = prevErrors;
        return remainingErrors;
      }
      return prevErrors;
    });
  };

  // Color palette functions
  const handleAddColorPalette = async () => {
    console.log("add color palette - clicked");
    let formErrors = { paletteName: "", colors: "" };
    const result = await handleAddColorPaletteBackend(colorPalette, user, userDoc);
    if (!result.success) {
      if (result.message === "Color palette name is required")
        formErrors.paletteName = result.message;
      else if (result.message === "Color palette must have at least one color")
        formErrors.colors = result.message;
      else showToast("error", result.message);
      setErrors(formErrors);
      return;
    }
    showToast("success", result.message);
    handleClose();
  };

  const handleEditColorPalette = async () => {
    let formErrors = { paletteName: "", colors: "" };
    const result = await handleEditColorPaletteBackend(
      colorPalette,
      colorPaletteToEdit,
      user,
      userDoc
    );
    if (!result.success) {
      if (
        result.message === "Name is the same as the current name" ||
        result.message === "Color palette name is required"
      )
        formErrors.paletteName = result.message;
      else if (result.message === "Color palette must have at least one color")
        formErrors.colors = result.message;
      else showToast("error", result.message);
      setErrors(formErrors);
      return;
    }
    showToast("success", result.message);
    handleClose();
  };

  const handleDeleteColorPalette = async () => {
    const result = await handleDeleteColorPaletteBackend(colorPalette, user, userDoc);
    if (!result.success) {
      showToast("error", result.message);
      return;
    }
    showToast("success", result.message);
    handleClose();
  };

  // Picking color
  const debouncedColorChange = useMemo(
    () =>
      debounce((color) => {
        setPickedColor(color.hex);
      }, 16), // Roughly matches 60fps
    []
  );

  useEffect(() => {
    return () => {
      debouncedColorChange.cancel();
    };
  }, [debouncedColorChange]);

  const handleColorChange = useCallback((color) => {
    debouncedColorChange(color);
  }, []);

  const handlePickColorModalClose = () => {
    setPickColorModalOpen(false);
    setTimeout(() => {
      setColorToEdit("");
      setPickedColor("");
    }, 500);
  };

  useEffect(() => {
    if (colorPaletteToEdit) {
      setColorPalette(colorPaletteToEdit);
    }
  }, [colorPaletteToEdit]);

  const colorPickerContRef = useCallback(
    (node) => {
      if (node !== null) {
        const huePicker = node.querySelector(
          ".color-picker-cont  > :nth-child(2)  > :nth-child(1)  > :nth-child(2)  > :nth-child(1)  > :nth-child(1)  > :nth-child(1)  > :nth-child(2)  > :nth-child(1)"
        );
        console.log("HuePicker", huePicker);
        if (huePicker) {
          huePicker.style.backgroundImage = `${huePickerEncodedSvg(true)}`;
        }

        const colorTextInput = node.querySelector(
          ".color-picker-cont > :nth-child(2) > :nth-child(2) > :nth-child(1) > :nth-child(1) > :nth-child(1) input"
        );
        console.log("ColorTextInput", colorTextInput);
        console.log("ColorToEdit", colorToEdit);
        if (colorTextInput && colorToEdit) {
          colorTextInput.style.width = "calc(100% - 155px)";
        } else {
          colorTextInput.style.width = "calc(100% - 113px)";
        }
      }
    },
    [colorToEdit]
  );

  return (
    <>
      <Dialog open={open} onClose={handleClose} sx={dialogStyles}>
        <DialogTitle sx={dialogTitleStyles}>
          <TypographyMUI
            variant="body1"
            sx={{
              fontWeight: "bold",
              fontSize: "1.15rem",
              flexGrow: 1,
              maxWidth: "70%",
              whiteSpace: "normal",
            }}
          >
            {`${!isEditingPalette ? "Add" : "Edit"} a color palette`}
          </TypographyMUI>
          <IconButtonMUI onClick={handleClose} sx={iconButtonStyles}>
            <CloseRoundedIcon />
          </IconButtonMUI>
        </DialogTitle>
        <DialogContent
          sx={{
            ...dialogContentStyles,
            alignItems: "center",
            padding: "20px",
            paddingBottom: 0,
          }}
        >
          <div className="rightBeside">
            <TextFieldMUI
              placeholder="Name of color palette"
              value={colorPalette.paletteName}
              onChange={(e) => {
                const newPaletteName = e.target.value;
                setColorPalette({ ...colorPalette, paletteName: newPaletteName.trim() });
                clearFieldError("paletteName");
              }}
              helperText={errors?.paletteName}
              variant="outlined"
              fullWidth
              sx={{
                marginBottom: "16px",
                backgroundColor: "var(  --nav-card-modal)",
                input: { color: "var(--color-white)" },
                borderRadius: "10px",
                "& .MuiOutlinedInput-root": {
                  borderColor: "var(--borderInput)",
                  borderRadius: "10px",
                  backgroundColor: "var(--nav-card-modal)",
                  "& fieldset": {
                    borderColor: "var( --borderInput)",
                    borderRadius: "10px",
                  },
                  "&:hover fieldset": {
                    borderColor: "var( --borderInput)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "var(--borderInputBrighter)",
                  },
                },
                "& .MuiFormHelperText-root": {
                  color: "var(--color-quaternary)",
                  textAlign: "left",
                  marginLeft: 0,
                  marginTop: "5px",
                },
              }}
            />
          </div>

          <div className="circle-container">
            {/* Display color of the palette */}
            {colorPalette.colors.length > 0 &&
              colorPalette.colors.map((color, index) => (
                <IconButtonMUI
                  key={index}
                  size="lg"
                  className="circle"
                  style={{
                    color: "var(--color-white)",
                    borderRadius: "50%",
                    border: "2px solid var(--borderInput)",
                    backgroundColor: color,
                    "&:hover": {
                      border: "2px solid var(--borderInputBrighter)",
                      backgroundColor: color,
                    },
                    "& .MuiTouchRippleRoot span": {
                      backgroundColor: "var(--iconButtonActive)",
                    },
                  }}
                  onClick={() => {
                    setColorToEdit(color);
                    setPickedColor(color);
                    setPickColorModalOpen(true);
                  }}
                ></IconButtonMUI>
              ))}
            {/* Add color button */}
            <IconButtonMUI
              size="lg"
              className="circle plus-circle"
              onClick={() => setPickColorModalOpen(true)}
              style={{
                color: "var(--color-white)",
                borderRadius: "50%",
                border: "2px solid var(--borderInput)",
                backgroundColor: "transparent",
                "&:hover": {
                  border: "2px solid var(--borderInputBrighter)",
                  backgroundColor: "var(--iconButtonHover)",
                },
                "& .MuiTouchRipple-root span": {
                  backgroundColor: "var(--iconButtonActive)",
                },
              }}
            >
              <AddIcon
                sx={{
                  color: "var(--borderInput)",
                  "&:hover": { color: "var(--borderInputBrighter)" },
                }}
              />
            </IconButtonMUI>
          </div>
          {errors.colors && (
            <span className="error-text" style={{ marginBottom: "20px" }}>
              {errors?.colors}
            </span>
          )}

          <DialogActions sx={dialogActionsVertButtonsStyles}>
            <ButtonMUI
              fullWidth
              variant="contained"
              disabled={!isOnline}
              sx={{
                ...gradientButtonStyles,
                color: "white !important",
                opacity: !isOnline ? "0.5" : "1",
                cursor: !isOnline ? "default" : "pointer",
                "&:hover": {
                  backgroundImage: isOnline && "var(--gradientButtonHover)",
                },
              }}
              onClick={() =>
                !isEditingPalette ? handleAddColorPalette() : handleEditColorPalette()
              }
            >
              {`${!isEditingPalette ? "Add" : "Edit"} color palette`}
            </ButtonMUI>
            {isEditingPalette && (
              <ButtonMUI
                fullWidth
                variant="contained"
                disabled={!isOnline}
                sx={{
                  ...outlinedButtonStyles,
                  color: "var(--color-white)",
                  opacity: !isOnline ? "0.5" : "1",
                  cursor: !isOnline ? "default" : "pointer",
                  "&:hover": {
                    backgroundImage: isOnline && "var(--gradientButtonHover)",
                  },
                }}
                onClick={() => handleDeleteColorPalette()}
                onMouseOver={(e) =>
                  (e.target.style.backgroundImage =
                    "var(--lightGradient), var(--gradientButtonHover)")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
                }
              >
                Delete color palette
              </ButtonMUI>
            )}
            <ButtonMUI
              fullWidth
              variant="contained"
              sx={outlinedButtonStyles}
              onClick={handleClose}
              onMouseOver={(e) =>
                (e.target.style.backgroundImage =
                  "var(--lightGradient), var(--gradientButtonHover)")
              }
              onMouseOut={(e) =>
                (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
              }
            >
              Cancel
            </ButtonMUI>
          </DialogActions>
        </DialogContent>
      </Dialog>

      {/* Modal for picking color */}
      <Dialog open={pickColorModalOpen} onClose={handlePickColorModalClose} sx={dialogStyles}>
        <DialogTitle sx={{ ...dialogTitleStyles, padding: "10px 12px 10px 6px" }}>
          <IconButtonMUI
            onClick={handlePickColorModalClose}
            sx={{ ...iconButtonStyles, marginRight: "5px" }}
          >
            <ArrowBackIosRoundedIcon />
          </IconButtonMUI>
          <TypographyMUI
            variant="body1"
            sx={{
              fontWeight: "bold",
              fontSize: "1.15rem",
              flexGrow: 1,
              maxWidth: "100%",
              whiteSpace: "normal",
            }}
          >
            {`Pick a color ${colorToEdit ? "to edit" : "to add"}`}
          </TypographyMUI>
        </DialogTitle>
        <DialogContent
          sx={{
            ...dialogContentStyles,
            alignItems: "center",
            padding: "20px",
            paddingBottom: 0,
            marginTop: 0,
          }}
        >
          <div
            ref={colorPickerContRef}
            style={{
              width: "min(50vw, 50vh)",
              height: "auto",
              maxWidth: "500px",
              maxHeight: "500px",
              padding: "20px 0",
            }}
          >
            <ChromePicker
              disableAlpha
              color={pickedColor ?? defaultColor}
              onChange={debouncedColorChange}
              className="color-picker-cont"
              styles={{
                default: {
                  picker: {
                    background: "transparent",
                    borderRadius: "10px",
                    boxShadow: "0 0 10px rgba(0, 0, 0, 0)",
                    width: "auto",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: "500",
                    padding: "0",
                  },
                  input: {
                    input: {
                      backgroundColor: "transparent",
                      borderRadius: "10px",
                      border: "1px solid var(--borderInput)",
                      color: "var(--color-white)",
                      boxShadow: "none",
                      padding: "4px 10px",
                    },
                    label: {
                      color: "var(--color-white)",
                    },
                  },
                  // Hide the toggle buttons
                  toggles: {
                    borderRadius: "10px",
                  },
                },
              }}
            />
            <div className="save-button-icon">
              {colorToEdit && (
                <IconButtonMUI
                  onClick={() => {
                    const newColors = colorPalette.colors.filter((color) => color !== colorToEdit);
                    setColorPalette({ ...colorPalette, colors: newColors });
                    setColorToEdit("");
                    handlePickColorModalClose();
                  }}
                  sx={{
                    ...iconButtonStyles,
                    flexShrink: 0,
                    height: "40px",
                    width: "40px",
                  }}
                >
                  <DeleteIcon />
                </IconButtonMUI>
              )}
              <IconButtonMUI
                onClick={() => {
                  if (colorToEdit) {
                    const colorIndex = colorPalette.colors.indexOf(colorToEdit);
                    const newColors = [...colorPalette.colors];
                    if (colorIndex !== -1) {
                      newColors[colorIndex] = pickedColor;
                    }
                    setColorPalette({ ...colorPalette, colors: newColors });
                    setColorToEdit("");
                  } else {
                    const newColors = [...colorPalette.colors, pickedColor];
                    setColorPalette({ ...colorPalette, colors: newColors });
                    clearFieldError("colors");
                  }
                  handlePickColorModalClose();
                }}
                sx={{
                  ...iconButtonStyles,
                  flexShrink: 0,
                  height: "40px",
                  width: "40px",
                }}
              >
                <SaveIconSmall />
              </IconButtonMUI>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreatePallete;
