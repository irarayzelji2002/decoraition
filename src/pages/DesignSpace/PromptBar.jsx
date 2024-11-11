import React, { useState, useEffect, useRef } from "react";
import "../../css/design.css";
import { FormControl, Select, Option, Slider, Button, IconButton, Typography } from "@mui/joy";
import {
  ArrowForwardIosRounded as ArrowForwardIosRoundedIcon,
  ArrowBackIosRounded as ArrowBackIosRoundedIcon,
  KeyboardArrowDownRounded as KeyboardArrowDownRoundedIcon,
  CloseRounded as CloseRoundedIcon,
} from "@mui/icons-material";
import {
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button as ButtonMUI,
  IconButton as IconButtonMUI,
  Typography as TypographyMUI,
} from "@mui/material";
import Textarea from "@mui/joy/Textarea";
import { AddImage, DeselectMask, SelectMask, SaveIcon } from "./svg/AddImage";
import AddColor from "./svg/AddColor";
import NoImage from "./svg/NoImage";
import CreatePallete from "./CreatePallete";
import { extendTheme, CssVarsProvider } from "@mui/joy/styles";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { togglePromptBar, toggleComments } from "./backend/DesignActions";
import { showToast } from "../../functions/utils";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { EditIcon } from "../../components/svg/DefaultMenuIcons";
import {
  dialogStyles,
  dialogTitleStyles,
  dialogContentStyles,
  dialogActionsStyles,
  dialogActionsVertButtonsStyles,
} from "../../components/RenameModal";
import { set } from "lodash";
import deepEqual from "deep-equal";

const theme = extendTheme({
  components: {
    JoySelect: {
      defaultProps: {
        indicator: <KeyboardArrowDownRoundedIcon sx={{ color: "var(--color-white) !important" }} />,
      },
    },
  },
});

function PromptBar({
  workingAreaRef,
  numImageFrames,
  showPromptBar,
  setShowPromptBar,
  setShowComments,
  width,
  setWidth,
  prevWidth,
  setPrevWidth,
  prevHeight,
  setPrevHeight,
  selectedImage,
  setSelectedImage,
  isNextGeneration,
  setIsNextGeneration,
  isSelectingMask,
  setIsSelectingMask,
}) {
  const { user, userDoc, designs, userDesigns } = useSharedProps();

  const [colorPaletteModalOpen, setColorPaletteModalOpen] = useState(false);
  const [colorPalette, setColorPalette] = useState("");
  const [colorPaletteToEdit, setColorPaletteToEdit] = useState("");
  const [isEditingPalette, setIsEditingPalette] = useState(false);
  const [userColorPalettes, setUserColorPalettes] = useState([]);

  const [disabled, setDisabled] = useState(true);

  const [dragging, setDragging] = useState(false);
  const [baseImageModalOpen, setBaseImageModalOpen] = useState(false);
  const [initBaseImage, setInitBaseImage] = useState(null);
  const [baseImage, setBaseImage] = useState(null);
  const [baseImagePreview, setBaseImagePreview] = useState("");
  const baseImageFileInputRef = useRef(null);

  const [styleRefModalOpen, setStyleRefModalOpen] = useState(false);
  const [initStyleRef, setInitStyleRef] = useState(null);
  const [styleRef, setStyleRef] = useState(null);
  const [styleRefPreview, setStyleRefPreview] = useState("");
  const styleRefFileInputRef = useRef(null);

  const [prompt, setPrompt] = useState("");
  const [numImageToGenerate, setNumImageToGenerate] = useState(1);

  const [isSmallWidth, setIsSmallWidth] = useState(false);

  const handleSliderChange = (event, newValue) => {
    setNumImageToGenerate(newValue);
  };

  const handleColorPaletteChange = (event, newValue) => {
    setColorPalette(newValue);
  };

  const handleBaseImageModalClose = () => {
    setInitBaseImage(null);
    setBaseImagePreview("");
    setBaseImageModalOpen(false);
  };

  const handleStyleRefModalClose = () => {
    setInitStyleRef(null);
    setStyleRefPreview("");
    setStyleRefModalOpen(false);
  };

  const handleColorPaletteModalClose = () => {
    setColorPaletteToEdit("");
    setIsEditingPalette(false);
    setColorPaletteModalOpen(false);
  };

  const handleBaseImageContinue = () => {
    console.log("before set base image, initBaseImage", initBaseImage);
    setBaseImage(initBaseImage);
    setInitBaseImage(null);
    setBaseImageModalOpen(false);
  };

  const handleStyleRefContinue = () => {
    console.log("before set styleRef, initStyleRef", initStyleRef);
    setStyleRef(initStyleRef);
    setInitStyleRef(null);
    setStyleRefModalOpen(false);
  };

  const handleUploadClick = (ref) => {
    if (ref.current) ref.current.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e, setInitImage, setImagePreview) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      const message = handleImageValidation(file);
      if (message !== "") return;
      handleFileChange(file, setInitImage, setImagePreview);
    }
  };

  const onFileUpload = (event, setInitImage, setImagePreview) => {
    const file = event.target.files[0];
    if (file) handleFileChange(file, setInitImage, setImagePreview);
  };

  // Image validation
  const handleImageValidation = (file) => {
    let message = "";
    const acceptedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
    if (!acceptedTypes.includes(file.type)) {
      message = "Please upload an image file of png, jpg, jpeg, gif, or webp type";
      showToast("error", message);
    } else {
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        message = "Image size must be less than 5MB";
        showToast("error", message);
      }
    }
    return message;
  };

  const handleFileChange = (file, setInitImage, setImagePreview) => {
    const message = handleImageValidation(file);
    if (message !== "") return;

    setInitImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log("FileReader result:", reader.result);
      setImagePreview(reader.result);
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };
    reader.readAsDataURL(file);
    console.log("File uploaded:", file);
  };

  useEffect(() => {
    if (!isNextGeneration) setDisabled(false);
    else {
      // isNextGeneration is true
      if (!selectedImage) setDisabled(true);
      else if (selectedImage) setDisabled(false);
    }
  }, [isNextGeneration, selectedImage]);

  useEffect(() => {
    if (dummyUserColorPalettes && dummyUserColorPalettes?.length > 0) {
      setUserColorPalettes(dummyUserColorPalettes);
      return;
    }

    if (userDoc && userDoc?.colorPalettes) {
      if (!deepEqual(userDoc.colorPalettes, userColorPalettes)) {
        setUserColorPalettes(userDoc.colorPalettes);
      }
    }
  }, [userDoc]);

  const [height, setHeight] = useState("100%");
  const [applyMinHeight, setApplyMinHeight] = useState(true);
  const resizeFactor = 2;
  const promptBarRef = useRef(null);
  const resizeHandleRef = useRef(null);
  const resizeHandleHeightRef = useRef(null);

  // Effect for adjusting the promptBar width on drag
  useEffect(() => {
    const promptBar = promptBarRef.current;
    const resizeHandle = resizeHandleRef.current;
    if (!promptBar || !resizeHandle) return;

    promptBar.style.width = `${width}px`;

    const handleMouseDown = (e) => {
      e.preventDefault();
      if (window.innerWidth <= 600) {
        promptBar.style.width = "auto";
        return;
      }

      const initialX = e.clientX;
      const handleMouseMove = (e) => {
        const newWidth = width + resizeFactor * (e.clientX - initialX);
        if (newWidth > 0 && newWidth <= window.innerWidth * 0.75) {
          setWidth(newWidth);
        }
        setIsSmallWidth(newWidth <= 380);
      };

      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    };

    resizeHandleRef.current.addEventListener("mousedown", handleMouseDown);

    const handleResize = () => {
      if (window.innerWidth <= 600) {
        promptBar.style.width = "auto";
        setIsSmallWidth(window.innerWidth <= 380);
      } else {
        promptBar.style.width = `${width}px`;
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (resizeHandle.current) {
        resizeHandleRef.current.removeEventListener("mousedown", handleMouseDown);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [width]);

  // Effect for adjusting the promptBar height on drag
  useEffect(() => {
    const promptBar = promptBarRef.current;
    const resizeHandleHeight = resizeHandleHeightRef.current;
    if (!promptBar || !resizeHandleHeight) return;

    promptBar.style.height = `${height}px`;

    // Handle resizing on mousedown and drag
    const handleMouseDownHeight = (e) => {
      e.preventDefault();
      // console.log("Mouse down detected on resize handle");
      const startY = e.clientY;
      const startHeight = promptBar.getBoundingClientRect().height;

      const handleMouseMoveHeight = (e) => {
        const deltaY = startY - e.clientY;
        let newHeight = startHeight + deltaY;
        // console.log(
        //   `Mouse move detected. StartY: ${startY}, CurrentY: ${e.clientY}, deltaY: ${deltaY}, newHeight: ${newHeight}`
        // );

        // Adjust height
        if (window.innerWidth <= 600) {
          const initHeight = window.innerHeight - 154;
          if (newHeight >= initHeight - 40) {
            newHeight = initHeight - 40;
            // console.log("Max height reached, setting height to 100%");
          } else if (newHeight < 0) {
            newHeight = 0;
            // console.log("Min height reached, setting height to 0");
          }
          setHeight(`${newHeight}px`);
          promptBar.style.height = `${newHeight}px`;
        } else {
          setHeight("auto");
          promptBar.style.height = "auto";
        }
      };

      const handleMouseUpHeight = () => {
        // console.log("Mouse up detected, removing mousemove and mouseup listeners");
        window.removeEventListener("mousemove", handleMouseMoveHeight);
        window.removeEventListener("mouseup", handleMouseUpHeight);
      };

      window.addEventListener("mousemove", handleMouseMoveHeight);
      window.addEventListener("mouseup", handleMouseUpHeight);
    };

    resizeHandleHeight.addEventListener("mousedown", handleMouseDownHeight);

    // Handle screen resize adjustments
    const handleResizeHeight = () => {
      if (window.innerWidth <= 600) {
        promptBar.style.height = `${height}px`;
      } else {
        promptBar.style.height = "100%";
      }
    };
    window.addEventListener("resize", handleResizeHeight);

    return () => {
      resizeHandleHeight.removeEventListener("mousedown", handleMouseDownHeight);
      window.removeEventListener("resize", handleResizeHeight);
    };
  }, [height]);

  // Initial width/height
  useEffect(() => {
    const promptBar = promptBarRef.current;
    if (!promptBar) return;
    setWidth(prevWidth ?? width);
    setHeight(prevHeight ?? height);

    if (window.innerWidth <= 600) {
      promptBar.style.width = "auto";
    } else {
      promptBar.style.width = `${prevWidth ?? width}`;
    }

    if (window.innerWidth <= 600) {
      promptBar.style.height = `${prevHeight ?? height}`;
    } else {
      promptBar.style.height = "100%";
    }
  }, [showPromptBar]);

  // Check height on component mount and on numImageFrames change
  useEffect(() => {
    const checkWorkingAreaHeight = () => {
      if (workingAreaRef.current) {
        const workingAreaHeight = workingAreaRef.current.offsetHeight;
        if (workingAreaHeight + 154 > window.innerHeight) {
          setApplyMinHeight(false);
        } else {
          setApplyMinHeight(true);
        }
      }
    };

    checkWorkingAreaHeight();
  }, [numImageFrames]);

  return (
    <>
      <CssVarsProvider theme={theme}>
        <div className="promptBar" ref={promptBarRef}>
          <div className={window.innerWidth > 600 ? "resizeHandle" : ""} ref={resizeHandleRef}>
            <div className={window.innerWidth > 600 ? "resizeHandleChildDiv" : ""}>
              <div className={window.innerWidth > 600 ? "sliderIndicator" : ""}></div>
            </div>
          </div>
          <div
            className={window.innerWidth <= 600 ? "resizeHandle height" : ""}
            ref={resizeHandleHeightRef}
          >
            <div className={window.innerWidth <= 600 ? "resizeHandleChildDiv" : ""}>
              <div className={window.innerWidth <= 600 ? "sliderIndicator" : ""}></div>
            </div>
          </div>
          <IconButton
            sx={{
              color: "var(--color-white)",
              position: "absolute",
              borderRadius: "50%",
              right: "8px",
              top: "8px",
              marginTop: "20px",
              marginRight: "7px",
              zIndex: "49",
              "&:hover": {
                backgroundColor: "var(--iconButtonHover)",
              },
              "& .MuiTouchRipple-root span": {
                backgroundColor: "var(--iconButtonActive)",
              },
            }}
            onClick={() => {
              setPrevWidth(width);
              setPrevHeight(height);
              togglePromptBar(setShowPromptBar);
            }}
            className="promptBarIconButtonInside"
          >
            <ArrowBackIosRoundedIcon
              sx={{
                color: "var(--color-white) !important",
                transform: showPromptBar ? "rotate(270deg)" : "rotate(90deg)",
              }}
            />
          </IconButton>
          <div
            style={{ minHeight: applyMinHeight ? "calc(100% - 73px)" : "662.8px" }}
            className="transitionMinHeight"
          >
            <h3>
              Describe your Idea
              <span style={{ color: "var(--color-quaternary)" }}> *</span>
            </h3>
            <div
              onClick={(e) => {
                if (disabled) showToast("info", "Please select an image first");
                else e.stopPropagation();
              }}
            >
              <Textarea
                placeholder="Enter a prompt"
                maxRows={2}
                disabled={disabled}
                sx={{
                  padding: "20px",
                  color: "var(--color-white)",
                  backgroundColor: disabled ? "var(--disabledInput)" : "transparent",
                  border: "1.5px solid var(--borderInput)",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  // boxShadow: "inset 0 0 0 2px var(--borderInput)",
                  "&::placeholder": {
                    color: "var(--color-white)",
                    opacity: 0.7,
                  },
                  "&::before": {
                    boxShadow: "inset 0 0 0 1.5px var(--borderInput)",
                  },
                  "&:focus": {
                    borderColor: "var(--borderInput)",
                    outline: "none",
                  },
                }}
              />
            </div>

            <h3 style={{ marginTop: "35px" }}>
              Adjust number of images to generate
              <span style={{ color: "var(--color-quaternary)" }}> *</span>
            </h3>
            <div
              onClick={(e) => {
                if (disabled) showToast("info", "Please select an image first");
                else e.stopPropagation();
              }}
            >
              <Slider
                aria-labelledby="track-false-slider"
                valueLabelDisplay="auto"
                min={1}
                max={4}
                value={numImageToGenerate}
                onChange={handleSliderChange}
                disabled={disabled}
                sx={{
                  marginTop: "10px",
                  marginLeft: "7px",
                  marginRight: "8px",
                  width: "calc(100% - 19px)",
                  color: "var(--slider)",
                  "& .MuiSlider-thumb": {
                    background: "var(--gradientCircle)",
                    color: "transparent",
                    width: "19px",
                    height: "19px",
                    outline: "none",
                    opacity: disabled ? "0.5" : "1",
                  },
                  "& .MuiSlider-thumb::before": {
                    borderColor: "transparent",
                  },
                  "& .MuiSlider-track": {
                    backgroundColor: "var(--sliderHighlight)", // Track color
                  },
                  "& .MuiSlider-rail": {
                    backgroundColor: "var(--slider)", // Rail color
                  },
                  "& .MuiSlider-valueLabel": {
                    backgroundColor: "var(--slider)",
                    color: "var(--color-white)",
                    borderRadius: "5px",
                    padding: "1px",
                  },
                  "& .MuiSlider-valueLabel::before": {
                    color: "var(--slider)",
                  },
                }}
              />
            </div>
            {!isNextGeneration ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: "20px",
                }}
              >
                <div style={{ width: "100%" }}>
                  <h3 style={{ marginTop: 0 }}>Upload an image of the space</h3>
                  <h6>optional</h6>
                  {baseImage && (
                    <div className="fileInputChip">
                      <div className="fileInputChipImage">
                        <img src={baseImagePreview} alt="" />
                      </div>
                      <div className="fileInputChipText">{baseImage.name}</div>
                      <IconButton
                        onClick={() => {
                          setBaseImage(null);
                          setBaseImagePreview("");
                        }}
                        sx={{
                          color: "var(--color-white)",
                          borderRadius: "50%",
                          marginRight: "5px",
                          "&:hover": {
                            color: "var(--greyText)",
                            backgroundColor: "var(--iconButtonHover)",
                          },
                          "& .MuiTouchRipple-root span": {
                            backgroundColor: "var(--iconButtonActive)",
                          },
                        }}
                      >
                        <CloseRoundedIcon />
                      </IconButton>
                    </div>
                  )}
                </div>

                <Button
                  size="md"
                  disabled={disabled || baseImage}
                  sx={{
                    borderRadius: "100%",
                    marginLeft: "15px",
                    padding: "11px 11px 14px 14px",
                    backgroundImage: "var(--gradientCircle)",
                    opacity: disabled || baseImage ? "0.5" : "1",
                    "&:hover": {
                      backgroundImage: "var(--gradientCircleHover)",
                    },
                  }}
                  onClick={() => setBaseImageModalOpen(true)}
                >
                  <AddImage />
                </Button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: "20px",
                }}
              >
                <div style={{ width: "100%" }}>
                  <h3 style={{ margin: 0 }}>Select an area to edit</h3>
                </div>

                <div
                  onClick={(e) => {
                    if (disabled) showToast("info", "Please select an image first");
                    else e.stopPropagation();
                  }}
                >
                  <Button
                    size="md"
                    disabled={disabled}
                    sx={{
                      borderRadius: "100%",
                      marginLeft: "15px",
                      padding: "9.5px",
                      backgroundImage: "var(--gradientCircle)",
                      opacity: disabled ? "0.5" : "1",
                      "&:hover": {
                        backgroundImage: "var(--gradientCircleHover)",
                      },
                    }}
                    onClick={() => {
                      setIsSelectingMask(!isSelectingMask);
                      setPrevWidth(width);
                      setPrevHeight(height);
                      if (!isSelectingMask) {
                        setShowPromptBar(false);
                        setShowComments(false);
                      } else {
                        setShowPromptBar(true);
                      }
                    }}
                  >
                    {isSelectingMask ? <DeselectMask /> : <SelectMask />}
                  </Button>
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                marginTop: "35px",
              }}
            >
              <div style={{ width: "100%" }}>
                <h3 style={{ marginTop: 0 }}>Upload an image for style reference</h3>
                <h6>optional</h6>
                {styleRef && (
                  <div className="fileInputChip">
                    <div className="fileInputChipImage">
                      <img src={styleRefPreview} alt="" />
                    </div>
                    <div className="fileInputChipText">{styleRef.name}</div>
                    <IconButton
                      onClick={() => {
                        setStyleRef(null);
                        setStyleRefPreview("");
                      }}
                      sx={{
                        color: "var(--color-white)",
                        borderRadius: "50%",
                        marginRight: "5px",
                        "&:hover": {
                          color: "var(--greyText)",
                          backgroundColor: "var(--iconButtonHover)",
                        },
                        "& .MuiTouchRipple-root span": {
                          backgroundColor: "var(--iconButtonActive)",
                        },
                      }}
                    >
                      <CloseRoundedIcon />
                    </IconButton>
                  </div>
                )}
              </div>

              <div
                onClick={(e) => {
                  if (disabled) showToast("info", "Please select an image first");
                  else e.stopPropagation();
                }}
              >
                <Button
                  size="md"
                  disabled={disabled || styleRef}
                  sx={{
                    borderRadius: "100%",
                    marginLeft: "15px",
                    padding: "11px 11px 14px 14px",
                    backgroundImage: "var(--gradientCircle)",
                    opacity: disabled || styleRef ? "0.5" : "1",
                    "&:hover": {
                      backgroundImage: "var(--gradientCircleHover)",
                    },
                  }}
                  onClick={() => setStyleRefModalOpen(true)}
                >
                  <AddImage />
                </Button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "35px",
              }}
            >
              <div style={{ width: "100%" }}>
                <div style={{ display: "inline-flex" }} className="inline-flex-prompt-bar-2">
                  <h3 style={{ marginTop: 0, marginRight: "20px" }}>Use a color palette</h3>
                  <h6 style={{ marginTop: "2px" }}>optional</h6>
                </div>
              </div>

              <div
                style={{
                  display: isSmallWidth ? "flex" : "inline-flex",
                  width: "100%",
                  flexDirection: isSmallWidth ? "column" : "row",
                  flexFlow: isSmallWidth ? "column" : "row",
                  flexWrap: isSmallWidth ? "wrap" : "nowrap",
                }}
                className="inline-flex-prompt-bar"
                onClick={(e) => {
                  if (disabled) showToast("info", "Please select an image first");
                  else e.stopPropagation();
                }}
              >
                <FormControl sx={{ width: "100%" }}>
                  <Select
                    id="date-modified-select"
                    className="custom-select"
                    placeholder="Select a color pallete"
                    value={colorPalette}
                    onChange={handleColorPaletteChange}
                    disabled={disabled}
                    slotProps={{
                      listbox: {
                        sx: {
                          padding: 0,
                          border: 0,
                          borderRadius: "10px",
                        },
                      },
                    }}
                    endDecorator={
                      <KeyboardArrowDownRoundedIcon
                        sx={{ color: "var(--color-white) !important", scale: "1.15 !important" }}
                      />
                    }
                    indicator={null}
                    sx={{
                      ...selectStyles,
                      color:
                        colorPalette === "" ? "var(--optional) !important" : "var(--color-white)",
                      backgroundColor: disabled ? "var(--disabledInput)" : "transparent",
                    }}
                  >
                    <Option sx={{ ...optionStyles, display: "none !important" }} value="">
                      Select a color pallete
                    </Option>
                    {userColorPalettes.map((palette) => (
                      <Option key={palette.colorPaletteId} sx={optionStyles} value="Among Us">
                        <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                          {palette.paletteName}
                          <div
                            style={{ display: "flex", marginLeft: "auto", alignItems: "center" }}
                          >
                            {palette.colors.map((color) => (
                              <div
                                className="circle-small"
                                style={{ backgroundColor: color, marginLeft: "-15px" }}
                              ></div>
                            ))}
                            <IconButton
                              sx={{
                                color: "var(--color-white)",
                                borderRadius: "50%",
                                marginLeft: "10px",
                                marginRight: "-10px",
                                "&:hover": {
                                  bgcolor: "var(--iconButtonHover) !important",
                                },
                                "&:active": {
                                  bgcolor: "var(--iconButtonHover) !important",
                                },
                                "& .JoyTouchRipple-root span": {
                                  bgcolor: "var(--iconButtonActive) !important",
                                },
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setColorPaletteToEdit(palette);
                                setIsEditingPalette(true);
                                setColorPaletteModalOpen(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </div>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  size="md"
                  disabled={disabled}
                  sx={{
                    borderRadius: "100%",
                    marginTop: isSmallWidth ? "15px" : "4px",
                    marginLeft: isSmallWidth ? "auto" : "30px",
                    marginRight: isSmallWidth ? "auto" : "0px",
                    marginBottom: "4px",
                    padding: "12px 10px 12px 14px",
                    backgroundImage: "var(--gradientCircle)",
                    opacity: disabled ? "0.5" : "1",
                    "&:hover": {
                      backgroundImage: "var(--gradientCircleHover)",
                    },
                  }}
                  onClick={() => setColorPaletteModalOpen(true)}
                >
                  <AddColor />
                </Button>
              </div>
            </div>
          </div>
          {/* Generate Image button */}
          <div
            onClick={(e) => {
              if (disabled) showToast("info", "Please select an image first");
              else e.stopPropagation();
            }}
          >
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={disabled}
              sx={{
                color: "white",
                mt: 3,
                mb: 2,
                backgroundImage: "var(--gradientButton)",
                borderRadius: "20px",
                textTransform: "none",
                fontWeight: "bold",
                opacity: disabled ? "0.5" : "1",
                cursor: disabled ? "default" : "pointer",
                "&:hover": {
                  backgroundImage: !disabled && "var(--gradientButtonHover)",
                },
              }}
              onClick={() => {
                console.log("Generate Image clicked");
              }}
            >
              Generate Image
            </Button>
          </div>
        </div>
      </CssVarsProvider>

      {/* Upload base image modal */}
      <Dialog open={baseImageModalOpen} onClose={handleBaseImageModalClose} sx={dialogStyles}>
        <DialogTitle sx={dialogTitleStyles}>
          <TypographyMUI
            variant="body1"
            sx={{
              fontWeight: "bold",
              fontSize: "1.15rem",
              flexGrow: 1,
              maxWidth: "80%",
              whiteSpace: "normal",
            }}
          >
            Upload an image of the space
          </TypographyMUI>

          <IconButtonMUI
            onClick={handleBaseImageModalClose}
            sx={{
              ...iconButtonStyles,
              flexShrink: 0,
              marginLeft: "auto",
            }}
          >
            <CloseRoundedIcon />
          </IconButtonMUI>
        </DialogTitle>

        <DialogContent
          sx={{
            ...dialogContentStyles,
            alignItems: "center",
            padding: "20px",
            paddingBottom: 0,
            marginTop: 0,
            width: "auto",
          }}
        >
          <div
            style={{
              width: "min(50vw, 50vh)",
              height: "min(50vw, 50vh)",
              maxWidth: "500px",
              maxHeight: "500px",
              padding: "20px 0",
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, setInitBaseImage, setBaseImagePreview)}
          >
            {baseImagePreview ? (
              <img
                src={baseImagePreview}
                alt="Selected"
                style={{
                  objectFit: "cover",
                  width: "100%",
                  height: "100%",
                  marginBottom: "40px",
                  borderRadius: "20px",
                }}
              />
            ) : (
              <div
                className="image-placeholder-container"
                onClick={() => handleUploadClick(baseImageFileInputRef)}
                style={{ cursor: "pointer" }}
              >
                <div
                  style={{
                    padding: "10px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <NoImage />
                  <div className="image-placeholder">Upload a base image</div>
                </div>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/png, image/jpeg, image/gif, image/webp"
            ref={baseImageFileInputRef}
            style={{ display: "none" }}
            onChange={(event) => onFileUpload(event, setInitBaseImage, setBaseImagePreview)}
          />

          <div style={dialogActionsVertButtonsStyles}>
            <ButtonMUI
              variant="contained"
              fullWidth
              onClick={
                !initBaseImage
                  ? () => handleUploadClick(baseImageFileInputRef)
                  : handleBaseImageContinue
              }
              sx={gradientButtonStyles}
            >
              {!initBaseImage ? "Upload Image" : "Continue"}
            </ButtonMUI>
            {initBaseImage && (
              <ButtonMUI
                variant="contained"
                fullWidth
                onClick={() => handleUploadClick(baseImageFileInputRef)}
                sx={gradientButtonStyles}
              >
                Reupload Image
              </ButtonMUI>
            )}
            <ButtonMUI
              variant="contained"
              fullWidth
              onClick={handleBaseImageModalClose}
              sx={outlinedButtonStyles}
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload style ref modal */}
      <Dialog open={styleRefModalOpen} onClose={handleStyleRefModalClose} sx={dialogStyles}>
        <DialogTitle sx={dialogTitleStyles}>
          <TypographyMUI
            variant="body1"
            sx={{
              fontWeight: "bold",
              fontSize: "1.15rem",
              flexGrow: 1,
              maxWidth: "80%",
              whiteSpace: "normal",
            }}
          >
            Upload an style reference
          </TypographyMUI>

          <IconButtonMUI
            onClick={handleStyleRefModalClose}
            sx={{
              ...iconButtonStyles,
              flexShrink: 0,
              marginLeft: "auto",
            }}
          >
            <CloseRoundedIcon />
          </IconButtonMUI>
        </DialogTitle>

        <DialogContent
          sx={{
            ...dialogContentStyles,
            alignItems: "center",
            padding: "20px",
            paddingBottom: 0,
            marginTop: 0,
            width: "auto",
          }}
        >
          <div
            style={{
              width: "min(50vw, 50vh)",
              height: "min(50vw, 50vh)",
              maxWidth: "500px",
              maxHeight: "500px",
              padding: "20px 0",
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              handleDrop(e, setInitStyleRef, setStyleRefPreview);
            }}
          >
            {styleRefPreview ? (
              <img
                src={styleRefPreview}
                alt="Selected"
                style={{
                  objectFit: "cover",
                  width: "100%",
                  height: "100%",
                  marginBottom: "40px",
                  borderRadius: "20px",
                }}
              />
            ) : (
              <div
                className="image-placeholder-container"
                onClick={() => handleUploadClick(styleRefFileInputRef)}
                style={{ cursor: "pointer" }}
              >
                <div
                  style={{
                    padding: "10px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <NoImage />
                  <div className="image-placeholder">Upload an style reference</div>
                </div>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/png, image/jpeg, image/gif, image/webp"
            ref={styleRefFileInputRef}
            style={{ display: "none" }}
            onChange={(event) => onFileUpload(event, setInitStyleRef, setStyleRefPreview)}
          />

          <div style={dialogActionsVertButtonsStyles}>
            <ButtonMUI
              variant="contained"
              fullWidth
              onClick={
                !initStyleRef
                  ? () => handleUploadClick(styleRefFileInputRef)
                  : handleStyleRefContinue
              }
              sx={gradientButtonStyles}
            >
              {!initStyleRef ? "Upload Image" : "Continue"}
            </ButtonMUI>
            {initStyleRef && (
              <ButtonMUI
                variant="contained"
                fullWidth
                onClick={() => handleUploadClick(styleRefFileInputRef)}
                sx={gradientButtonStyles}
              >
                Reupload Image
              </ButtonMUI>
            )}
            <ButtonMUI
              variant="contained"
              fullWidth
              onClick={handleStyleRefModalClose}
              sx={outlinedButtonStyles}
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/edit color palette modal */}
      <CreatePallete
        open={colorPaletteModalOpen}
        onClose={handleColorPaletteModalClose}
        isEditingPalette={isEditingPalette}
        colorPaletteToEdit={colorPaletteToEdit}
      />
    </>
  );
}

export default PromptBar;

const selectStyles = {
  backgroundColor: "transparent",
  borderRadius: "10px",
  padding: "15px 20px",
  borderRight: "1px solid var(--borderInput)",
  fontSize: "1rem",
  color: "var(--color-white)",
  "& .MuiSelect-indicator": {
    color: "var(--color-white)",
  },
  "&:focus": {
    outline: "none",
    backgroundColor: "transparent !important",
    boxShadow: "none",
  },
  "&:hover": {
    backgroundColor: "transparent !important",
  },
};

const optionStyles = {
  color: "var(--color-white)",
  backgroundColor: "var(--dropdown2)",
  transition: "all 0.3s ease",
  minHeight: "auto",
  display: "block",
  padding: "10px 20px",
  "&:hover": {
    color: "var(--color-white) !important",
    backgroundColor: "var(--dropdownHover2) !important",
  },
  "&[aria-selected='true']": {
    backgroundColor: "var(--dropdownSelected2) !important",
    color: "var(--color-white)",
    fontWeight: "bold",
  },
  "&[aria-selected='true']:hover": {
    backgroundColor: "var(--dropdownSelectedHover2) !important",
  },
};

export const gradientButtonStyles = {
  background: "var(--gradientButton)",
  borderRadius: "20px",
  color: "var(--color-white)",
  fontWeight: "bold",
  textTransform: "none",
  margin: "0 !important",
  "&:hover": {
    background: "var(--gradientButtonHover)", // Reverse gradient on hover
  },
};

export const outlinedButtonStyles = {
  color: "var(--color-white)",
  background: "transparent",
  border: "2px solid transparent",
  borderRadius: "20px",
  backgroundImage: "var(--lightGradient), var(--gradientButton)",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
  fontWeight: "bold",
  textTransform: "none",
  margin: "0 !important",
};

const dummyUserColorPalettes = [
  { colorPaletteId: 1, paletteName: "Red-Green", colors: ["#efefef", "#ef4f56", "#397438"] },
  { colorPaletteId: 2, paletteName: "Pink-Yellow", colors: ["#ff8344", "#ec2073", "#3e3c47"] },
  { colorPaletteId: 3, paletteName: "Among Us", colors: ["#3e3c47", "#faa653", "#ff4500"] },
];
