// SelectMaskCanvas.jsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Box,
  TextField,
  InputAdornment,
  Paper,
} from "@mui/material";
import Draggable from "react-draggable";
import DelayedTooltip from "../../components/DelayedTooltip";

import {
  CloseRounded as CloseRoundedIcon,
  AddCircleRounded as AddCircleRoundedIcon,
  RemoveCircleRounded as RemoveCircleRoundedIcon,
  ChangeCircleRounded as ChangeCircleRoundedIcon,
  BrushRounded as BrushRoundedIcon,
  ArrowBackIosRounded as ArrowBackIosRoundedIcon,
  ArrowForwardIosRounded as ArrowForwardIosRoundedIcon,
  ColorizeRounded as ColorizeRoundedIcon,
} from "@mui/icons-material";
import { ViewIcon, UnviewIcon, EraseIcon, DeleteIcon } from "../../components/svg/DefaultMenuIcons";
import { SaveIconSmall } from "./svg/AddImage";
import { ResetIcon } from "./svg/AddColor";
import {
  dialogStyles,
  dialogTitleStyles,
  dialogContentStyles,
  dialogActionsStyles,
} from "../../components/RenameModal";
import {
  selectStyles,
  selectStylesDisabled,
  menuItemStyles,
  textFieldStyles,
  textFieldInputProps,
  switchStyles,
} from "./DesignSettings";
import { gradientButtonStyles, outlinedButtonStyles } from "./PromptBar";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { ChromePicker } from "react-color";
import { huePickerEncodedSvg } from "./svg/AddColor";
import { showToast, getContrastingTextColor } from "../../functions/utils";
import { debounce, set } from "lodash";

const canvasStyles = {
  canvasContainer: {
    position: "relative",
    width: "100%",
    height: "calc(100vh - 200px)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  canvasStack: {
    position: "relative",
    width: "100%",
    flex: 1,
    aspectRatio: "1/1",
    margin: "0 auto",
  },
  canvas: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  controls: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    backgroundColor: "var(--color-grey3)",
    borderRadius: "8px",
  },
  previewSection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "10px",
  },
};

function SelectMaskCanvas({
  selectedImage,
  showPromptBar,
  showComments,
  controlWidthComments,
  controlWidthPromptBar,
}) {
  // Canvas refs
  const addCanvasRef = useRef(null);
  const removeCanvasRef = useRef(null);
  const samCanvasRef = useRef(null);
  const previewCanvasRef = useRef(null);

  // Show/Hide States
  const [showAllOptions, setShowAllOptions] = useState(true);
  const [showGeneralOptions, setShowGeneralOptions] = useState(true);
  const [showAddRemoveOptions, setShowAddRemoveOptions] = useState(true);
  const [showSamOptions, setShowSamOptions] = useState(true);

  // Modal States
  const [samMaskModalOpen, setSamMaskModalOpen] = useState(false);
  const [clearCanvasModalOpen, setClearCanvasModalOpen] = useState(false);
  const [clearCanvasSelectedCanvas, setClearCanvasSelectedCanvas] = useState("");
  const [pickColorModalOpen, setPickColorModalOpen] = useState(false);
  const [pickedColorCanvas, setPickedColorCanvas] = useState("");

  // Mask Prompt & Preview
  const [maskPromptTooltipOpen, setMaskPromptTooltipOpen] = useState(false);
  const [maskPrompt, setMaskPrompt] = useState("");
  const [samMasks, setSamMasks] = useState([]);
  const [selectedSamMask, setSelectedSamMask] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Mask Type
  const [canvasMode, setCanvasMode] = useState(true); // true for Add to Mask, false for Remove form Mask
  const [refineMaskOption, setRefineMaskOption] = useState(true); // true for Add first then remove, false for Remove first then add

  // Canvas controls for add mask
  const [brushModeAdd, setBrushModeAdd] = useState(true); // true for Draw, false for Erase
  const [maskVisibilityAdd, setMaskVisibilityAdd] = useState(true); // true for Visible, false for Hidden
  const [pickedColorAdd, setPickedColorAdd] = useState("var(--addMask)");
  const [brushSizeAdd, setBrushSizeAdd] = useState(20);
  const [opacityAdd, setOpacityAdd] = useState(0.5);

  // Canvas controls for add mask
  const [brushModeRemove, setBrushModeRemove] = useState(true);
  const [maskVisibilityRemove, setMaskVisibilityRemove] = useState(true);
  const [pickedColorRemove, setPickedColorRemove] = useState("var(--removeMask)");
  const [brushSizeRemove, setBrushSizeRemove] = useState(20);
  const [opacityRemove, setOpacityRemove] = useState(0.5);

  // Canvas controls for sam mask
  const [pickedColorSam, setPickedColorSam] = useState("var(--samMask)");
  const [opacitySam, setOpacitySam] = useState(0.5);

  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState({ add: [], remove: [] });

  // Error states
  const initErrors = {
    maskPrompt: "",
    selectedSamMask: "",
    refineMaskOption: "",
    general: "",
    previewMask: "",
    applyMask: "",
  };
  const [errors, setErrors] = useState(initErrors);

  const containerRef = useRef(null);

  const adjustCss = useCallback(() => {
    console.log("containerRef", containerRef);
    const container = containerRef.current;
    console.log("containerRef.current", container);
    if (!container) return;
    console.log("entered", container);
    const width = container.offsetWidth;

    const elements = [
      ...container.querySelectorAll(
        ".maskTypeAndControls, .maskTypeOptions, .maskTypeOptionsButtons, .optionsHeader.generalOptions.open, .canvasControls, .canvasControlsCont, .samMaskControls, .samMaskControls .sliderCont, .canvasControls.sam, .selectingMaskHiddenHeaders, .canvasModeAndVisibility, .maskPromptCont, .topMaskActions, .showPreviewButton, .canvasSliders"
      ),
    ];

    elements.forEach((element) => {
      element.classList.remove(
        "width-1307",
        "width-1038",
        "width-877",
        "width-735",
        "width-600",
        "width-510",
        "width-500"
      );
    });

    // Apply width-specific classes based on current container width
    if (width <= 1307) {
      console.log(`${width} <= 1307`);
      container.querySelector(".maskTypeAndControls")?.classList.add("width-1307");
      container.querySelector(".maskTypeOptions")?.classList.add("width-1307");
      container.querySelector(".maskTypeOptionsButtons")?.classList.add("width-1307");
      container.querySelector(".optionsHeader.generalOptions.open")?.classList.add("width-1307");
    }
    if (width <= 1038) {
      console.log(`${width} <= 1038`);
      container.querySelector(".canvasControls")?.classList.add("width-1038");
      container.querySelector(".canvasControlsCont")?.classList.add("width-1038");
      container.querySelector(".samMaskControls")?.classList.add("width-1038");
      container.querySelector(".samMaskControls .sliderCont")?.classList.add("width-1038");
      container.querySelector(".canvasControls.sam")?.classList.add("width-1038");
      container.querySelector(".maskTypeOptions")?.classList.add("width-1038");
      container.querySelector(".maskTypeOptionsButtons")?.classList.add("width-1038");
    }
    if (width <= 877) {
      console.log(`${width} <= 877`);
      container.querySelector(".selectingMaskHiddenHeaders")?.classList.add("width-877");
    }
    if (width <= 735) {
      console.log(`${width} <= 735`);
      container.querySelector(".canvasModeAndVisibility")?.classList.add("width-735");
      container.querySelector(".maskTypeOptionsButtons")?.classList.add("width-735");
    }

    if (width <= 600) {
      console.log(`${width} <= 600`);
      container.querySelector(".maskPromptCont")?.classList.add("width-600");
      container.querySelector(".topMaskActions")?.classList.add("width-600");
      container.querySelector(".showPreviewButton")?.classList.add("width-600");
      container.querySelector(".maskTypeOptionsButtons")?.classList.add("width-600");
      container.querySelector(".canvasModeAndVisibility")?.classList.add("width-600");
    }
    if (width <= 510) {
      console.log(`${width} <= 510`);
      container.querySelector(".maskTypeOptions")?.classList.add("width-510");
    }
    if (width <= 500) {
      console.log(`${width} <= 500`);
      container.querySelector(".canvasSliders")?.classList.add("width-500");
      container.querySelector(".maskTypeOptionsButtons")?.classList.add("width-500");
      container.querySelector(".canvasModeAndVisibility")?.classList.add("width-500");
      container.querySelector(".showPreviewButton")?.classList.add("width-500");
      container.querySelector(".samMaskControls")?.classList.add("width-500");
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    adjustCss();

    const handleResize = () => {
      if (!containerRef.current) return;
      adjustCss();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustCss]);

  useEffect(() => {
    if (!containerRef.current) return;
    adjustCss();
  }, [showPromptBar, showComments, controlWidthComments, controlWidthPromptBar]);

  useEffect(() => {
    initializeCanvases();
  }, [selectedImage]);

  useEffect(() => {
    if (canvasMode) {
      console.log("add", canvasMode);
    } else {
      console.log("remove", canvasMode);
    }
    // console.log("Canvas mode changed:", canvasMode);
  }, [canvasMode]);

  function percentText(value) {
    return `${value * 100}%`;
  }

  const getSelectedColorValuesMap = (canvas) => {
    let color;

    switch (canvas) {
      case "add":
        color = pickedColorAdd === "var(--addMask)" ? "#00ff40" : pickedColorAdd;
        break;
      case "remove":
        color = pickedColorRemove === "var(--removeMask)" ? "#ff0000" : pickedColorRemove;
        break;
      case "sam":
        color = pickedColorSam === "var(--samMask)" ? "#7543ff" : pickedColorSam;
        break;
      default:
        color = ""; // Default color if canvas is invalid
    }

    const contrastingColor = getContrastingTextColor(color);

    return {
      true: {
        label: color,
        icon: <ColorizeRoundedIcon sx={{ color: contrastingColor }} />,
        color: contrastingColor,
        backgroundColor: color,
        backgroundColorHover: color,
      },
    };
  };

  const getPickedColorStates = (canvas) => {
    let pickedColor, setPickedColor;

    switch (canvas) {
      case "add":
        pickedColor = pickedColorAdd;
        setPickedColor = setPickedColorAdd;
        break;
      case "remove":
        pickedColor = pickedColorRemove;
        setPickedColor = setPickedColorRemove;
        break;
      case "sam":
        pickedColor = pickedColorSam;
        setPickedColor = setPickedColorSam;
        break;
      default:
        console.error(`Invalid canvas value: ${canvas}`);
    }

    return { pickedColor, setPickedColor };
  };

  const getClearCanvasRef = (canvas) => {
    let canvasRef;

    switch (canvas) {
      case "add":
        canvasRef = addCanvasRef;
        break;
      case "remove":
        canvasRef = removeCanvasRef;
        break;
      default:
        console.error(`Invalid canvas value: ${canvas}`);
    }

    return canvasRef;
  };

  const initializeCanvases = () => {
    if (!selectedImage) return;

    const canvasSize = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.8);
    [addCanvasRef, removeCanvasRef, samCanvasRef, previewCanvasRef].forEach((ref) => {
      if (ref.current) {
        ref.current.width = canvasSize;
        ref.current.height = canvasSize;
        const ctx = ref.current.getContext("2d");
        ctx.imageSmoothingEnabled = true;
      }
    });

    // Draw initial image
    drawInitialImage();
  };

  const drawInitialImage = () => {
    const img = new Image();
    img.src = selectedImage.link;
    img.onload = () => {
      const ctx = addCanvasRef.current.getContext("2d");
      ctx.drawImage(img, 0, 0, addCanvasRef.current.width, addCanvasRef.current.height);
    };
  };

  const handleStartDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasMode === "add" ? addCanvasRef.current : removeCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = pickedColorAdd;
    ctx.lineWidth = brushSizeAdd;
    ctx.globalAlpha = opacityAdd;
    ctx.lineCap = "round";
  };

  const handleDrawing = (e) => {
    if (!isDrawing) return;

    const canvas = canvasMode === "add" ? addCanvasRef.current : removeCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasMode === "add" ? addCanvasRef.current : removeCanvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.closePath();
  };

  const clearCanvas = (canvasRef) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (canvasRef === addCanvasRef || canvasRef === removeCanvasRef) {
      drawInitialImage();
    }
  };

  const handleGenerateMask = async () => {
    // trial
    setSamMaskModalOpen(true);

    if (!maskPrompt.trim()) return;

    try {
      // API call to generate SAM mask
      const response = await fetch("/generate-sam-mask", {
        method: "POST",
        body: JSON.stringify({
          prompt: maskPrompt,
          image: selectedImage.link,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate mask");

      const masks = await response.json();
      setSamMasks(masks);
      setSamMaskModalOpen(true);
    } catch (error) {
      console.error("Error generating mask:", error);
    }
  };

  const onMaskSelect = (samMask, addMask, removeMask) => {};

  return (
    <Box sx={canvasStyles.canvasContainer} ref={containerRef}>
      {/* Controls */}
      <Box sx={canvasStyles.controls}>
        <div className="topMaskActions">
          {/* Mask Prompt */}
          <div className="maskPromptCont">
            <DelayedTooltip
              title="Type objects in the image to mask"
              delay={1000}
              open={maskPromptTooltipOpen}
              setOpen={setMaskPromptTooltipOpen}
            >
              <TextField
                value={maskPrompt}
                onChange={(e) => setMaskPrompt(e.target.value)}
                placeholder="Type objects in the image to mask"
                size="small"
                helperText={errors?.maskPrompt}
                variant="outlined"
                inputProps={textFieldInputProps}
                sx={{
                  ...textFieldStyles,
                  flexGrow: 1,
                  "& .MuiOutlinedInput-root": {
                    ...textFieldStyles["& .MuiOutlinedInput-root"],
                    padding: "11.8px 146px 11.8px 14px",
                  },
                  "@media (max-width: 600px)": {
                    width: "100%",
                    "& .MuiOutlinedInput-root": {
                      ...textFieldStyles["& .MuiOutlinedInput-root"],
                      padding: "11.8px 14px 11.8px 14px",
                    },
                  },
                }}
              />
            </DelayedTooltip>

            <Button
              variant="contained"
              onClick={handleGenerateMask}
              sx={{
                ...gradientButtonStyles,
                minWidth: "133px",
                height: "42.6px",
                borderRadius: "0px 8px 8px 0px",
                marginLeft: "-145px !important",
                "@media (max-width: 600px)": {
                  borderRadius: "35px",
                  // marginLeft: "0px !important",
                  marginLeft: "-225px !important",
                  height: "46.6px",
                  width: "210.8px",
                },
                "@media (max-width: 510px)": {
                  marginLeft: "0px !important",
                  width: "100%",
                },
              }}
            >
              Generate Mask
            </Button>

            <div className="showPreviewButton">
              {/* <ToggleButton
                label="Preview visibility"
                value={showPreview}
                handleToggle={() => setShowPreview(!showPreview)}
                valuesMap={visibilityValuesMap}
                minWidth="210.8px"
                width600="210.8px"
                width510="100%"
                width500="100%"
              /> */}
              <div
                className="optionsHeader"
                style={{ height: "46.6px", alignItems: "center", cursor: "pointer" }}
                onClick={() => setShowAllOptions(!showAllOptions)}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: "bold",
                    textAlign: "center",
                    fontSize: "0.9rem",
                    flexGrow: 1,
                    whiteSpace: "normal",
                  }}
                >
                  {`${showAllOptions ? "Hide" : "Show"} all options`}
                </Typography>
                <IconButton
                  disableRipple
                  sx={{
                    ...iconButtonStyles,
                    flexShrink: 0,
                    transform: showAllOptions ? "rotate(90deg)" : "rotate(270deg)",
                    height: "40px",
                    width: "40px",
                  }}
                >
                  <ArrowBackIosRoundedIcon />
                </IconButton>
              </div>
            </div>
          </div>
        </div>

        {showAllOptions && (
          <div className="selectingMaskHiddenHeaders">
            {!showGeneralOptions && (
              <div
                className="optionsHeader hiddenHeader"
                onClick={() => setShowGeneralOptions(!showGeneralOptions)}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: "bold",
                    textAlign: "center",
                    fontSize: "0.9rem",
                    flexGrow: 1,
                    whiteSpace: "normal",
                  }}
                >
                  General options
                </Typography>
                <IconButton
                  sx={{
                    ...iconButtonStyles,
                    transform: showGeneralOptions ? "rotate(90deg)" : "rotate(270deg)",
                    height: "40px",
                    width: "40px",
                    flexShrink: 0,
                  }}
                >
                  <ArrowBackIosRoundedIcon />
                </IconButton>
              </div>
            )}
            {!showAddRemoveOptions && (
              <div
                className="optionsHeader  hiddenHeader"
                onClick={() => setShowAddRemoveOptions(!showAddRemoveOptions)}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: "bold",
                    textAlign: "center",
                    fontSize: "0.9rem",
                    flexGrow: 1,
                    whiteSpace: "normal",
                  }}
                >
                  {`${canvasMode ? "Add to" : "Remove from"} generated mask options`}
                </Typography>
                <IconButton
                  sx={{
                    ...iconButtonStyles,
                    transform: showAddRemoveOptions ? "rotate(90deg)" : "rotate(270deg)",
                    height: "40px",
                    width: "40px",
                    flexShrink: 0,
                  }}
                >
                  <ArrowBackIosRoundedIcon />
                </IconButton>
              </div>
            )}
            {!showSamOptions && (
              <div
                className="optionsHeader  hiddenHeader"
                onClick={() => setShowSamOptions(!showSamOptions)}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: "bold",
                    textAlign: "center",
                    fontSize: "0.9rem",
                    flexGrow: 1,
                    whiteSpace: "normal",
                  }}
                >
                  {`Generated mask options`}
                </Typography>
                <IconButton
                  sx={{
                    ...iconButtonStyles,
                    flexShrink: 0,
                    transform: showSamOptions ? "rotate(90deg)" : "rotate(270deg)",
                    height: "40px",
                    width: "40px",
                  }}
                >
                  <ArrowBackIosRoundedIcon />
                </IconButton>
              </div>
            )}
          </div>
        )}

        <div className="maskTypeAndControls">
          {showAllOptions && showGeneralOptions && (
            <div className="maskTypeOptions">
              <div
                className="optionsHeader generalOptions open"
                onClick={() => setShowGeneralOptions(!showGeneralOptions)}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: "bold",
                    textAlign: "center",
                    fontSize: "0.9rem",
                    flexGrow: 1,
                    whiteSpace: "normal",
                  }}
                >
                  General options
                </Typography>
                <IconButton
                  sx={{
                    ...iconButtonStyles,
                    transform: showGeneralOptions ? "rotate(90deg)" : "rotate(270deg)",
                    height: "40px",
                    width: "40px",
                    flexShrink: 0,
                    marginTop: "-9px",
                    marginRight: "-8px",
                  }}
                >
                  <ArrowBackIosRoundedIcon />
                </IconButton>
              </div>
              <div className="maskTypeOptionsButtons">
                {/* Canvas Mode */}
                <ToggleButton
                  label="Canvas mode"
                  value={canvasMode}
                  handleToggle={() => {
                    console.log(!canvasMode);
                    setCanvasMode(!canvasMode);
                  }}
                  valuesMap={canvasModeValuesMap}
                  minWidth="213.8px"
                  width="30%"
                  width600="213.8px"
                  width510="100%"
                  width500="100%"
                />
                {/* Refine Mask Option */}
                <ToggleButton
                  label="Refine mask option"
                  value={refineMaskOption}
                  handleToggle={() => setRefineMaskOption(!refineMaskOption)}
                  valuesMap={refineMaskOptionValuesMap}
                  minWidth="213.8px"
                  width="30%"
                  width600="213.8px"
                  width510="100%"
                  width500="100%"
                />
                {/* Preview visibility */}
                <ToggleButton
                  label="Preview visibility"
                  value={showPreview}
                  handleToggle={() => setShowPreview(!showPreview)}
                  valuesMap={visibilityValuesMap}
                  minWidth="213.8px"
                  width="30%"
                  width600="213.8px"
                  width510="100%"
                  width500="100%"
                />
              </div>
            </div>
          )}

          <div className="canvasControlsCont">
            {showAllOptions && showAddRemoveOptions && (
              <div className="canvasControls">
                <div
                  className="optionsHeader"
                  onClick={() => setShowAddRemoveOptions(!showAddRemoveOptions)}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: "bold",
                      marginBottom: "20px",
                      textAlign: "center",
                      fontSize: "0.9rem",
                      flexGrow: 1,
                      whiteSpace: "normal",
                    }}
                  >
                    {`${canvasMode ? "Add to" : "Remove from"} generated mask options`}
                  </Typography>
                  <IconButton
                    sx={{
                      ...iconButtonStyles,
                      transform: showAddRemoveOptions ? "rotate(90deg)" : "rotate(270deg)",
                      height: "40px",
                      width: "40px",
                      flexShrink: 0,
                      marginTop: "-9px",
                      marginRight: "-8px",
                    }}
                  >
                    <ArrowBackIosRoundedIcon />
                  </IconButton>
                </div>

                <div className="canvasModeAndVisibility">
                  {/* Brush Mode */}
                  <ToggleButton
                    label="Brush mode"
                    value={canvasMode ? brushModeAdd : brushModeRemove}
                    handleToggle={() =>
                      canvasMode
                        ? setBrushModeAdd(!brushModeAdd)
                        : setBrushModeRemove(!brushModeRemove)
                    }
                    valuesMap={brushModeValuesMap}
                    minWidth="154.5px"
                    width="25%"
                    width600="154.5px"
                    width510="100%"
                  />

                  {/* Visibility For Add/Remove */}
                  <ToggleButton
                    label="Mask visibility"
                    value={canvasMode ? maskVisibilityAdd : maskVisibilityRemove}
                    handleToggle={() =>
                      canvasMode
                        ? setMaskVisibilityAdd(!maskVisibilityAdd)
                        : setMaskVisibilityRemove(!maskVisibilityRemove)
                    }
                    valuesMap={visibilityValuesMap}
                    minWidth="154.5px"
                    width="25%"
                    width600="154.5px"
                    width510="100%"
                  />

                  {/* Mask Color for Add/Remove */}
                  <ToggleButton
                    label="Mask color"
                    value={true}
                    handleToggle={() => {
                      if (canvasMode) setPickedColorCanvas("add");
                      else setPickedColorCanvas("remove");
                      setPickColorModalOpen(true);
                    }}
                    valuesMap={getSelectedColorValuesMap(canvasMode ? "add" : "remove")}
                    minWidth="154.5px"
                    width="25%"
                    width600="154.5px"
                    width510="100%"
                  />

                  {/* Clear Mask for Add/Remove */}
                  <ToggleButton
                    label=""
                    value={true}
                    handleToggle={() => {
                      if (canvasMode) setClearCanvasSelectedCanvas("add");
                      else setClearCanvasSelectedCanvas("remove");
                      setClearCanvasModalOpen(true);
                    }}
                    valuesMap={clearCanvasValuesMap}
                    minWidth="154.5px"
                    width="25%"
                    width600="154.5px"
                    width510="100%"
                    height="46.68px"
                    isOneLine={true}
                  />
                </div>

                <div className="canvasSliders">
                  {/* Brush Size for Add/Remove */}
                  <div className="sliderCont">
                    <Slider
                      value={canvasMode ? brushSizeAdd : brushSizeRemove}
                      onChange={(e, value) =>
                        canvasMode ? setBrushSizeAdd(value) : setBrushSizeRemove(value)
                      }
                      min={5}
                      max={50}
                      defaultValue={30}
                      valueLabelDisplay="auto"
                      aria-label={`Brush size for ${canvasMode ? "add" : "remove"} canvas`}
                      sx={sliderStyles}
                    />
                    <div className="sliderLabel">
                      <Typography variant="body1" sx={{ fontWeight: "400", fontSize: "0.875rem" }}>
                        Brush size
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: "bold", fontSize: "0.875rem" }}>
                        {canvasMode ? brushSizeAdd : brushSizeRemove}
                      </Typography>
                    </div>
                  </div>

                  {/* Mask Opacity for Add/Remove */}
                  <div className="sliderCont">
                    <Slider
                      value={canvasMode ? opacityAdd : opacityRemove}
                      valueLabelFormat={percentText}
                      onChange={(e, value) =>
                        canvasMode ? setOpacityAdd(value) : setOpacityRemove(value)
                      }
                      min={0}
                      max={1}
                      step={0.1}
                      defaultValue={0.5}
                      valueLabelDisplay="auto"
                      aria-label={`Opacity for ${canvasMode ? "add" : "remove"} canvas`}
                      sx={sliderStyles}
                    />
                    <div className="sliderLabel">
                      <Typography variant="body1" sx={{ fontWeight: "400", fontSize: "0.875rem" }}>
                        Mask opacity
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: "bold", fontSize: "0.875rem" }}>
                        {percentText(canvasMode ? opacityAdd : opacityRemove)}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showAllOptions && showSamOptions && (
              <div className="canvasControls sam">
                <div className="optionsHeader" onClick={() => setShowSamOptions(!showSamOptions)}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: "bold",
                      marginBottom: "20px",
                      textAlign: "center",
                      fontSize: "0.9rem",
                      flexGrow: 1,
                      whiteSpace: "normal",
                    }}
                  >
                    Generated mask options
                  </Typography>
                  <IconButton
                    sx={{
                      ...iconButtonStyles,
                      flexShrink: 0,
                      transform: showSamOptions ? "rotate(90deg)" : "rotate(270deg)",
                      height: "40px",
                      width: "40px",
                      marginTop: "-9px",
                      marginRight: "-8px",
                    }}
                  >
                    <ArrowBackIosRoundedIcon />
                  </IconButton>
                </div>

                <div className="samMaskControls">
                  {/* Mask Color for SAM */}
                  <div className="canvasModeAndVisibility">
                    <ToggleButton
                      label="Mask color"
                      value={true}
                      handleToggle={() => {
                        setPickedColorCanvas("sam");
                        setPickColorModalOpen(true);
                      }}
                      valuesMap={getSelectedColorValuesMap("sam")}
                      minWidth="154.5px"
                      width="100%"
                      width600="154.5px"
                      width510="100%"
                      minWidth500="154.5px"
                    />
                  </div>
                  {/* Mask Opacity for SAM */}
                  <div className="canvasSliders sam">
                    <div className="sliderCont">
                      <Slider
                        value={opacitySam}
                        valueLabelFormat={percentText}
                        onChange={(e, value) => setOpacitySam(value)}
                        min={0}
                        max={1}
                        step={0.1}
                        defaultValue={0.5}
                        valueLabelDisplay="auto"
                        aria-label="Opacity for SAM canvas"
                        sx={sliderStyles}
                      />
                      <div className="sliderLabel">
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: "400", fontSize: "0.875rem" }}
                        >
                          Mask opacity
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: "bold", fontSize: "0.875rem" }}
                        >
                          {percentText(opacitySam)}
                        </Typography>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Box>

      {/* Canvas Stack */}
      <Box sx={canvasStyles.canvasStack}>
        <canvas
          ref={samCanvasRef}
          style={{
            ...canvasStyles.canvas,
            zIndex: 1,
            display: selectedSamMask ? "block" : "none",
          }}
        />
        <canvas
          ref={addCanvasRef}
          style={{
            ...canvasStyles.canvas,
            zIndex: canvasMode === "add" ? 3 : 2,
          }}
          onMouseDown={handleStartDrawing}
          onMouseMove={handleDrawing}
          onMouseUp={handleStopDrawing}
          onMouseOut={handleStopDrawing}
        />
        <canvas
          ref={removeCanvasRef}
          style={{
            ...canvasStyles.canvas,
            zIndex: canvasMode === "remove" ? 3 : 2,
          }}
          onMouseDown={handleStartDrawing}
          onMouseMove={handleDrawing}
          onMouseUp={handleStopDrawing}
          onMouseOut={handleStopDrawing}
        />
      </Box>

      {/* Preview Section */}
      {showPreview && (
        <Box sx={canvasStyles.previewSection}>
          <canvas ref={previewCanvasRef} />
          <Button
            variant="contained"
            onClick={() => {
              // Handle applying mask
              if (onMaskSelect) {
                onMaskSelect({
                  samMask: selectedSamMask,
                  addMask: addCanvasRef.current.toDataURL(),
                  removeMask: removeCanvasRef.current.toDataURL(),
                });
              }
            }}
          >
            Apply Mask
          </Button>
        </Box>
      )}

      {/* SAM Mask Selection Dialog */}
      {samMaskModalOpen && (
        <SamMaskModal
          isOpen={samMaskModalOpen}
          onClose={() => setSamMaskModalOpen(false)}
          samMasks={samMasks}
          selectedSamMask={selectedSamMask}
          setSelectedSamMask={setSelectedSamMask}
        />
      )}

      {/* Pick Color Modal */}
      {pickColorModalOpen && (
        <PickColorModal
          pickColorModalOpen={pickColorModalOpen}
          setPickColorModalOpen={setPickColorModalOpen}
          pickedColor={getPickedColorStates(pickedColorCanvas).pickedColor}
          setPickedColor={getPickedColorStates(pickedColorCanvas).setPickedColor}
          canvas={pickedColorCanvas}
        />
      )}

      {clearCanvasModalOpen && (
        <ClearCanvasModal
          isOpen={clearCanvasModalOpen}
          onClose={() => setClearCanvasModalOpen(false)}
          handleClear={clearCanvas}
          canvas={clearCanvasSelectedCanvas}
          canvasRef={getClearCanvasRef(clearCanvasSelectedCanvas)}
        />
      )}
    </Box>
  );
}

export default SelectMaskCanvas;

const ToggleButton = ({
  label,
  value,
  handleToggle,
  valuesMap,
  width = "auto",
  minWidth = "",
  width600 = "auto",
  width500 = "auto",
  width510 = "auto",
  height = "fit-content",
  isOneLine = false,
  minWidth500 = "",
}) => {
  return (
    <Button
      variant="contained"
      onClick={handleToggle}
      sx={{
        ...gradientButtonStyles,
        borderRadius: "35px",
        height: height,
        color: valuesMap[value]?.color ?? "var(--color-white)",
        width: width,
        minWidth: minWidth,
        backgroundColor: valuesMap[value]?.backgroundColor ?? "",
        background: valuesMap[value]?.background ?? "",
        "&:hover": {
          backgroundColor:
            valuesMap[value]?.backgroundColorHover ?? valuesMap[value]?.backgroundColor ?? "",
          background: valuesMap[value]?.backgroundHover ?? "",
        },
        "&:active": {
          backgroundColor:
            valuesMap[value]?.backgroundColorHover ?? valuesMap[value]?.backgroundColor ?? "",
          background: valuesMap[value]?.backgroundHover ?? "",
        },
        "@media (max-width: 600px)": {
          width: width600,
        },
        "@media (max-width: 510px)": {
          width: width510 ?? "",
        },
        "@media (max-width: 500px)": {
          width: width500,
          minWidth: minWidth500 ?? "",
        },
      }}
      className="toggleButton"
    >
      <div className="toggleButtonContent">
        <div className="toggleButtonText">
          <span className="toggleButtonTextLabel">{label}</span>
          <span className="toggleButtonTextValue" style={{ marginTop: isOneLine ? "-2px" : "" }}>
            {valuesMap[value]?.label || ""}
          </span>
        </div>
        <div className="toggleButtonIcon">{valuesMap[value]?.icon}</div>
      </div>
    </Button>
  );
};

// Modal for picking color
function PaperComponent({ handle, ...props }) {
  return (
    <Draggable handle={handle} cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper {...props} />
    </Draggable>
  );
}

const PickColorModal = ({
  pickColorModalOpen,
  setPickColorModalOpen,
  canvas,
  pickedColor,
  setPickedColor,
}) => {
  const [initColor, setInitColor] = useState("#000000");

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
      setPickedColor(initColor);
    }, 100);
  };

  const getDefaultColor = () => {
    let defaultColor = "#000000";
    if (canvas === "add") defaultColor = "var(--addMask)";
    else if (canvas === "remove") defaultColor = "var(--removeMask)";
    else if (canvas === "sam") defaultColor = "var(--samMask)";
    return defaultColor;
  };

  const getInitColor = () => {
    const initColor = pickedColor;
    let color;

    switch (canvas) {
      case "add":
        color = initColor === "var(--addMask)" ? "#00ff40" : initColor;
        break;
      case "remove":
        color = initColor === "var(--removeMask)" ? "#ff0000" : initColor;
        break;
      case "sam":
        color = initColor === "var(--samMask)" ? "#7543ff" : initColor;
        break;
      default:
        color = "#000000";
    }
    return color;
  };

  useEffect(() => {
    if (pickColorModalOpen) {
      const color = getInitColor();
      setInitColor(color);
    }
  }, [pickColorModalOpen]);

  const colorPickerContRef = useCallback((node) => {
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
      if (colorTextInput) {
        colorTextInput.style.width = "calc(100% - 155px)";
      }
    }
  }, []);

  return (
    <Dialog
      open={pickColorModalOpen}
      onClose={handlePickColorModalClose}
      sx={dialogStyles}
      PaperComponent={(dialogProps) => (
        <PaperComponent handle="#draggable-color-picker-dialog" {...dialogProps} />
      )}
      aria-labelledby="draggable-color-picker-dialog"
      slots={{
        backdrop: () => null,
      }}
      PaperProps={{
        elevation: 8,
      }}
    >
      <DialogTitle
        sx={{ ...dialogTitleStyles, padding: "10px 12px 10px 6px", cursor: "move" }}
        id="draggable-color-picker-dialog"
      >
        <IconButton
          onClick={handlePickColorModalClose}
          sx={{ ...iconButtonStyles, marginRight: "5px" }}
        >
          <ArrowBackIosRoundedIcon />
        </IconButton>
        <Typography
          variant="body1"
          sx={{
            fontWeight: "bold",
            fontSize: "1.15rem",
            flexGrow: 1,
            maxWidth: "100%",
            whiteSpace: "normal",
          }}
        >
          {`Pick a color ${
            canvas === "add"
              ? "for add mask"
              : canvas === "remove"
              ? "for remove mask"
              : canvas === "sam"
              ? "for SAM mask"
              : ""
          }`}
        </Typography>
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
            color={pickedColor ?? getDefaultColor()}
            onChangeComplete={handleColorChange}
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
            <IconButton
              onClick={() => setPickedColor(initColor)}
              sx={{
                ...iconButtonStyles,
                flexShrink: 0,
                height: "40px",
                width: "40px",
              }}
            >
              <ResetIcon />
            </IconButton>
            <IconButton
              onClick={() => {
                // setPickedColor(newPickedColor);
                setPickColorModalOpen(false);
              }}
              sx={{
                ...iconButtonStyles,
                flexShrink: 0,
                height: "40px",
                width: "40px",
              }}
            >
              <SaveIconSmall />
            </IconButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ClearCanvasModal = ({ isOpen, onClose, handleClear, canvas, canvasRef }) => {
  const onSubmit = () => {
    handleClear(canvasRef);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} sx={dialogStyles}>
      <DialogTitle sx={dialogTitleStyles}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: "bold",
            fontSize: "1.15rem",
            flexGrow: 1,
            maxWidth: "80%",
            whiteSpace: "normal",
          }}
        >
          {`Clear ${canvas === "add" ? "add" : "remove"} canvas`}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            ...iconButtonStyles,
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={dialogContentStyles}>
        <Typography variant="body1" sx={{ marginBottom: "10px", textAlign: "center" }}>
          Are you sure you want to clear the canvas?
        </Typography>
      </DialogContent>
      <DialogActions sx={dialogActionsStyles}>
        <Button fullWidth variant="contained" onClick={onSubmit} sx={gradientButtonStyles}>
          Yes
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={outlinedButtonStyles}
          onMouseOver={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButtonHover)")
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
          }
        >
          No
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SamMaskModal = ({ isOpen, onClose, samMasks, selectedSamMask, setSelectedSamMask }) => {
  const [initSamMask, setInitSamMask] = useState({});

  useEffect(() => {
    if (isOpen) setInitSamMask(selectedSamMask);
  }, [isOpen]);

  const handleClose = () => {
    setSelectedSamMask(initSamMask);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      sx={dialogStyles}
      PaperComponent={(dialogProps) => (
        <PaperComponent handle="#draggable-sam-mask-dialog" {...dialogProps} />
      )}
      aria-labelledby="draggable-sam-mask-dialog"
      slots={{
        backdrop: () => null,
      }}
      PaperProps={{
        elevation: 8,
      }}
    >
      <DialogTitle sx={{ ...dialogTitleStyles, cursor: "move" }} id="draggable-sam-mask-dialog">
        <Typography
          variant="body1"
          sx={{
            fontWeight: "bold",
            fontSize: "1.15rem",
            flexGrow: 1,
            maxWidth: "80%",
            whiteSpace: "normal",
          }}
        >
          Select generated mask
        </Typography>
        <IconButton
          onClick={handleClose}
          sx={{
            ...iconButtonStyles,
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={dialogContentStyles}>
        <Typography variant="body1" sx={{ marginBottom: "10px" }}>
          Select a mask generated from the prompt to apply to the image
        </Typography>
        <Box sx={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {samMasks.map((mask, index) => (
            <Box
              key={index}
              onClick={() => setSelectedSamMask(mask)}
              sx={{
                cursor: "pointer",
                border: selectedSamMask === mask ? "2px solid var(--color-primary)" : "none",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <img src={mask.preview} alt={`Mask ${index + 1}`} style={{ width: "150px" }} />
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={dialogActionsStyles}>
        <Button fullWidth variant="contained" onClick={handleClose} sx={gradientButtonStyles}>
          Select mask
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={handleClose}
          sx={outlinedButtonStyles}
          onMouseOver={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButtonHover)")
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
          }
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// VALUES MAPS
// Selected Mask
const selectedSamMaskValuesMap = {
  0: {
    label: "Option 1",
    icon: <ChangeCircleRoundedIcon sx={{ color: "var(--color-white)" }} />,
  },
  1: {
    label: "Option 2",
    icon: <ChangeCircleRoundedIcon sx={{ color: "var(--color-white)" }} />,
  },
  2: {
    label: "Option 3",
    icon: <ChangeCircleRoundedIcon sx={{ color: "var(--color-white)" }} />,
  },
};

// Canvas Mode
const canvasModeValuesMap = {
  true: {
    label: "Add to mask",
    icon: <AddCircleRoundedIcon sx={{ color: "var(--color-white)" }} />,
    backgroundColor: "var(--green)",
    backgroundColorHover: "var(--greenHover)",
  },
  false: {
    label: "Remove from mask",
    icon: <RemoveCircleRoundedIcon sx={{ color: "var(--color-white)" }} />,
    backgroundColor: "var(--red)",
    backgroundColorHover: "var(--redHover)",
  },
};

// Refine Mask Option
const refineMaskOptionValuesMap = {
  true: {
    label: "Add first then remove",
    icon: <AddCircleRoundedIcon sx={{ color: "var(--color-white)" }} />,
    backgroundColor: "var(--green)",
    backgroundColorHover: "var(--greenHover)",
  },
  false: {
    label: "Remove first then add",
    icon: <RemoveCircleRoundedIcon sx={{ color: "var(--color-white)" }} />,
    backgroundColor: "var(--red)",
    backgroundColorHover: "var(--redHover)",
  },
};

// Brush Mode
const brushModeValuesMap = {
  true: {
    label: "Draw",
    icon: <BrushRoundedIcon sx={{ color: "var(--color-white)" }} />,
    backgroundColor: "var(--green)",
    backgroundColorHover: "var(--greenHover)",
  },
  false: {
    label: "Erase",
    icon: <EraseIcon />,
    backgroundColor: "var(--red)",
    backgroundColorHover: "var(--redHover)",
  },
};

// Visibility
const visibilityValuesMap = {
  true: {
    label: "Visible",
    icon: <ViewIcon />,
    backgroundColor: "var(--pinkButton)",
    backgroundColorHover: "var(--pinkButtonHover)",
  },
  false: {
    label: "Hidden",
    icon: <UnviewIcon />,
    backgroundColor: "var(--inputBg)",
    backgroundColorHover: "var(--inputBgBrighter)",
  },
};

const clearCanvasValuesMap = {
  true: {
    label: "Clear Canvas",
    icon: <DeleteIcon />,
    background: "var(--gradientButton)",
    backgroundHover: "var(--gradientButtonHover)",
  },
};

export const sliderStyles = {
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
    opacity: "1",
    boxShadow: "0 0 2px 0px rgba(0, 0, 0, 0.1)",
    "&:focus, &:hover, &.Mui-active": {
      boxShadow: "0px 0px 3px 1px rgba(0, 0, 0, 0.1)",
      "@media (hover: none)": {
        boxShadow:
          "0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.13),0 0 0 1px rgba(0,0,0,0.02)",
      },
    },
    "&:before": {
      boxShadow:
        "0px 0px 1px 0px rgba(0,0,0,0.2), 0px 0px 0px 0px rgba(0,0,0,0.14), 0px 0px 1px 0px rgba(0,0,0,0.12)",
    },
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
    padding: "1px 10px",
  },
  "& .MuiSlider-valueLabel::before": {
    color: "var(--slider)",
  },
};
