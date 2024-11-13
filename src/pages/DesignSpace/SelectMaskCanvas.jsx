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
import { useCanvasDrawing } from "../../hooks/useCanvasDrawing";
import { useSamCanvas } from "../../hooks/useSamCanvas";
import {
  getQueuePositionMessage,
  checkTaskStatus,
  trackImageGenerationProgress,
  displayGeneratedImages,
  generateMask,
  previewMask as previewMaskAction,
  applyMask,
} from "./backend/DesignActions";

function SelectMaskCanvas({
  selectedImage,
  showPromptBar,
  showComments,
  controlWidthComments,
  controlWidthPromptBar,
  samMaskMask, // for canvas
  setSamMaskMask,
  maskPrompt,
  setMaskPrompt,
  combinedMask,
  setCombinedMask,
  errors,
  setErrors,
  samDrawing,
  setSamDrawing,
  pickedColorSam,
  setPickedColorSam,
  opacitySam,
  setOpacitySam,
  samMaskImage,
  setSamMaskImage,
  handleClearAllCanvas,
  setHandleClearAllCanvas,
  previewMask,
  setPreviewMask,
  base64ImageAdd,
  setBase64ImageAdd,
  base64ImageRemove,
  setBase64ImageRemove,
  selectedSamMask,
  setSelectedSamMask,
  refineMaskOption,
  setRefineMaskOption,
  showPreview,
  setShowPreview,
}) {
  // Canvas/Container refs
  const addCanvasRef = useRef(null);
  const removeCanvasRef = useRef(null);
  const samCanvasRef = useRef(null);
  const canvasStackRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const initImageRef = useRef(null);
  const containerRef = useRef(null);

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
  const [confirmSamMaskChangeModalOpen, setConfirmSamMaskChangeModalOpen] = useState(false);

  // Mask Prompt & Preview
  const [maskPromptTooltipOpen, setMaskPromptTooltipOpen] = useState(false);
  const [samMasks, setSamMasks] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  // passed form parent:
  // - maskPrompt, setMaskPrompt,
  // - selectedSamMask, setSelectedSamMask,
  // - showPreview, setShowPreview,
  // - previewMask, setPreviewMask,
  // - base64ImageAdd, setBase64ImageAdd,
  // - base64ImageRemove, setBase64ImageRemove,
  // - combinedMask, setCombinedMask,
  // - samMaskMask, setSamMaskMask,
  // - samMaskImage, setSamMaskImage

  // Mask Type
  const [canvasMode, setCanvasMode] = useState(true); // true for Add to Mask, false for Remove form Mask
  // passed from parent:
  // - refineMaskOption, setRefineMaskOption

  // Canvas controls for add mask
  const [brushModeAdd, setBrushModeAdd] = useState(true); // true for Draw, false for Erase
  const [maskVisibilityAdd, setMaskVisibilityAdd] = useState(true); // true for Visible, false for Hidden
  const [pickedColorAdd, setPickedColorAdd] = useState("var(--addMask)");
  const [brushSizeAdd, setBrushSizeAdd] = useState(40);
  const [opacityAdd, setOpacityAdd] = useState(0.5);

  // Canvas controls for remove mask
  const [brushModeRemove, setBrushModeRemove] = useState(true);
  const [maskVisibilityRemove, setMaskVisibilityRemove] = useState(true);
  const [pickedColorRemove, setPickedColorRemove] = useState("var(--removeMask)");
  const [brushSizeRemove, setBrushSizeRemove] = useState(40);
  const [opacityRemove, setOpacityRemove] = useState(0.5);

  // Canvas controls for sam mask
  // passed from parent:
  // - pickedColorSam, setPickedColorSam
  // - opacitySam, setOpacitySam

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
  // passed from parent: errors, setErrors

  const adjustCss = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.offsetWidth;

    const elements = [
      ...container.querySelectorAll(
        ".maskTypeAndControls, .maskTypeOptions, .maskTypeOptionsButtons, .optionsHeader.generalOptions.open, .canvasControls, .canvasControlsCont, .samMaskControls, .samMaskControls .sliderCont, .canvasControls.sam, .selectingMaskHiddenHeaders, .canvasModeAndVisibility, .maskPromptCont, .topMaskActions, .showPreviewButton, .canvasSliders, .maskPromptTextField, .maskPromptTextField .MuiOutlinedInput-root, .generateMaskButton, .canvasCont, .canvasAndPreviewContainer, .canvasTitleFlex, .canvasTitle, .actualCanvas, .canvasAndPreviewContainer"
      ),
    ];

    elements.forEach((element) => {
      element.classList.remove(
        "width-1307",
        "width-1038",
        "width-1000",
        "width-877",
        "width-800",
        "width-735",
        "width-600",
        "width-510",
        "width-500",
        "width-374",
        "browser"
      );
    });

    // Apply width-specific classes based on current container width

    if (width <= 1307) {
      // console.log(`${width} <= 1307`);
      container.querySelector(".maskTypeAndControls")?.classList.add("width-1307");
      container.querySelector(".maskTypeOptions")?.classList.add("width-1307");
      container.querySelector(".maskTypeOptionsButtons")?.classList.add("width-1307");
      container.querySelector(".optionsHeader.generalOptions.open")?.classList.add("width-1307");
    }
    if (width <= 1038) {
      // console.log(`${width} <= 1038`);
      container.querySelector(".canvasControls")?.classList.add("width-1038");
      container.querySelector(".canvasControlsCont")?.classList.add("width-1038");
      container.querySelector(".samMaskControls")?.classList.add("width-1038");
      container.querySelector(".samMaskControls .sliderCont")?.classList.add("width-1038");
      container.querySelector(".canvasControls.sam")?.classList.add("width-1038");
      container.querySelector(".maskTypeOptions")?.classList.add("width-1038");
      container.querySelector(".maskTypeOptionsButtons")?.classList.add("width-1038");
    }
    if (width <= 1000) {
      // console.log(`${width} <= 1000`);
      const conts = container.querySelectorAll(".canvasCont");
      conts.forEach((element) => {
        element.classList.add("width-1000");
      });
      container.querySelector(".canvasAndPreviewContainer")?.classList.add("width-1000");
    }
    if (width <= 877) {
      // console.log(`${width} <= 877`);
      container.querySelector(".selectingMaskHiddenHeaders")?.classList.add("width-877");
    }
    if (width <= 800) {
      // console.log(`${width} <= 800`);
      const conts = container.querySelectorAll(".canvasCont");
      conts.forEach((element) => {
        element.classList.add("width-800");
      });
    }
    if (width <= 735) {
      // console.log(`${width} <= 735`);
      container.querySelector(".canvasModeAndVisibility")?.classList.add("width-735");
      container.querySelector(".maskTypeOptionsButtons")?.classList.add("width-735");
    }
    if (width <= 600) {
      // console.log(`${width} <= 600`);
      container.querySelector(".maskPromptCont")?.classList.add("width-600");
      if (window.innerWidth <= 600) {
        container.querySelector(".topMaskActions")?.classList.add("browser");
      }
      container.querySelector(".topMaskActions")?.classList.add("width-600");
      container.querySelector(".showPreviewButton")?.classList.add("width-600");
      container.querySelector(".maskTypeOptionsButtons")?.classList.add("width-600");
      container.querySelector(".canvasModeAndVisibility")?.classList.add("width-600");
      container.querySelector(".maskPromptTextField")?.classList.add("width-600");
      container
        .querySelector(".maskPromptTextField .MuiOutlinedInput-root")
        ?.classList.add("width-600");
      container.querySelector(".generateMaskButton")?.classList.add("width-600");
      const conts = container.querySelectorAll(".canvasCont");
      conts.forEach((element) => {
        element.classList.add("width-600");
      });
      container.querySelector(".canvasAndPreviewContainer")?.classList.add("width-600");
    }
    if (width <= 510) {
      // console.log(`${width} <= 510`);
      container.querySelector(".maskTypeOptions")?.classList.add("width-510");
      container.querySelector(".generateMaskButton")?.classList.add("width-510");
      container.querySelector(".showPreviewButton")?.classList.add("width-510");
    }
    if (width <= 500) {
      // console.log(`${width} <= 500`);
      container.querySelector(".canvasSliders")?.classList.add("width-500");
      container.querySelector(".maskTypeOptionsButtons")?.classList.add("width-500");
      container.querySelector(".canvasModeAndVisibility")?.classList.add("width-500");
      container.querySelector(".samMaskControls")?.classList.add("width-500");
    }
    if (width <= 374) {
      // console.log(`${width} <= 374`);
      const canvasContFlexConts = container.querySelectorAll(".canvasCont");
      canvasContFlexConts.forEach((element) => {
        element.classList.add("width-374");
      });
      const canvasTitleFlexConts = container.querySelectorAll(".canvasTitleFlex");
      canvasTitleFlexConts.forEach((element) => {
        element.classList.add("width-374");
      });
      const canvasTitleConts = container.querySelectorAll(".canvasTitle");
      canvasTitleConts.forEach((element) => {
        element.classList.add("width-374");
      });
      const actualCanvasConts = container.querySelectorAll(".actualCanvas");
      actualCanvasConts.forEach((element) => {
        element.classList.add("width-374");
      });
      container.querySelector(".canvasAndPreviewContainer")?.classList.add("width-374");
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
  }, [showPromptBar, showComments, controlWidthComments, controlWidthPromptBar, showPreview]);

  const getInitColor = (canvas, pickedColor) => {
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
    const colorAdd = getInitColor("add", pickedColorAdd);
    setPickedColorAdd(colorAdd);
    const colorRemove = getInitColor("remove", pickedColorRemove);
    setPickedColorRemove(colorRemove);
    const colorSam = getInitColor("sam", pickedColorSam);
    setPickedColorSam(colorSam);
  }, []);

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

  // Drawing hooks
  const addDrawing = useCanvasDrawing(addCanvasRef, pickedColorAdd, opacityAdd, brushModeAdd);

  const removeDrawing = useCanvasDrawing(
    removeCanvasRef,
    pickedColorRemove,
    opacityRemove,
    brushModeRemove
  );

  const initSamDrawing = useSamCanvas(
    samCanvasRef,
    previewCanvasRef,
    pickedColorSam,
    opacitySam,
    setConfirmSamMaskChangeModalOpen,
    selectedSamMask,
    samMasks,
    samMaskImage,
    setSamMaskMask,
    showPreview
  );

  useEffect(() => {
    setSamDrawing(initSamDrawing);
  }, []);

  // Initialize canvases
  useEffect(() => {
    if (!selectedImage) return;
    const initCanvas = (canvas) => {
      if (!canvas.current) return;
      canvas.current.width = selectedImage.width;
      canvas.current.height = selectedImage.height;
    };
    [addCanvasRef, removeCanvasRef].forEach(initCanvas);
  }, [selectedImage]);

  useEffect(() => {
    if (
      !selectedImage ||
      !canvasStackRef.current ||
      !addCanvasRef.current ||
      !removeCanvasRef.current
    )
      return;

    const updateCanvasSize = () => {
      const stack = canvasStackRef.current;
      const stackWidth = stack.offsetWidth;
      const stackHeight = stack.offsetHeight;
      const size = Math.min(stackWidth, stackHeight);

      const scale = window.devicePixelRatio;
      [addCanvasRef, removeCanvasRef].forEach((ref) => {
        if (!ref.current) return;
        ref.current.width = size * scale;
        ref.current.height = size * scale;
        ref.current.style.width = `${size}px`;
        ref.current.style.height = `${size}px`;

        const ctx = ref.current.getContext("2d");
        ctx.scale(scale, scale);
      });
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [selectedImage]);

  // Set cursor when brush size changes
  useEffect(() => {
    if (canvasMode) {
      addDrawing.setCustomCursor(brushSizeAdd);
    } else {
      removeDrawing.setCustomCursor(brushSizeRemove);
    }
  }, [canvasMode, brushSizeAdd, brushSizeRemove]);

  // Update canvas when color and opacity changes (add/remove)
  useEffect(() => {
    if (canvasMode) {
      addDrawing.setNeedsRedraw(true);
    } else {
      removeDrawing.setNeedsRedraw(true);
    }
  }, [opacityAdd, opacityRemove, pickedColorAdd, pickedColorRemove]);

  // Update canvas when color and opacity changes (sam)
  useEffect(() => {
    if (samDrawing) samDrawing.setNeedsRedraw(true);
    console.log("from useeffect:", samDrawing);
  }, [opacitySam, pickedColorSam, showPreview]);

  // Update SAM mask when image, color, or opacity changes
  useEffect(() => {
    if (samDrawing && selectedSamMask) {
      samDrawing.useSelectedMask(selectedSamMask);
    }
  }, [selectedSamMask]);

  useEffect(() => {
    if (!maskVisibilityAdd) {
      addDrawing.redrawCanvasVisibility(false);
    } else {
      addDrawing.redrawCanvasVisibility(true);
    }
  }, [maskVisibilityAdd]);

  useEffect(() => {
    if (!maskVisibilityRemove) {
      removeDrawing.redrawCanvasVisibility(false);
    } else {
      removeDrawing.redrawCanvasVisibility(true);
    }
  }, [maskVisibilityRemove]);

  const debouncedRedraw = useMemo(() => {
    return {
      add: debounce((color, opacity) => {
        if (!addCanvasRef.current || !addDrawing) return;
        addDrawing.redrawCanvas();
      }, 100),

      remove: debounce((color, opacity) => {
        if (!removeCanvasRef.current || !removeDrawing) return;
        removeDrawing.redrawCanvas();
      }, 100),
    };
  }, [addDrawing, removeDrawing]);

  const handleOpacityChange = (opacity, canvas) => {
    if (canvas === "add") {
      setOpacityAdd(opacity);
      debouncedRedraw.add(pickedColorAdd, opacity);
    } else if (canvas === "remove") {
      setOpacityRemove(opacity);
      debouncedRedraw.remove(pickedColorRemove, opacity);
    } else if (canvas === "sam") {
      setOpacitySam(opacity);
    }
  };

  useEffect(() => {
    return () => {
      debouncedRedraw.add.cancel();
      debouncedRedraw.remove.cancel();
    };
  }, [debouncedRedraw]);

  // Drawing handlers
  const handleMouseDown = (e, isAdd) => {
    const drawing = isAdd ? addDrawing : removeDrawing;
    drawing.setDrawing(true);
    handleDraw(e, isAdd);
  };

  const handleMouseMove = (e, isAdd) => {
    const drawing = isAdd ? addDrawing : removeDrawing;
    if (!drawing.drawing) return;
    handleDraw(e, isAdd);
  };

  const handleMouseUp = (isAdd) => {
    const drawing = isAdd ? addDrawing : removeDrawing;
    drawing.setDrawing(false);
  };

  const handleDraw = (e, isAdd) => {
    const drawing = isAdd ? addDrawing : removeDrawing;
    const brushSize = isAdd ? brushSizeAdd : brushSizeRemove;
    drawing.draw(e, brushSize);
  };

  const handleClearCanvas = (canvas) => {
    if (canvas === "add") {
      addDrawing.clearCanvas();
    } else if (canvas === "remove") {
      removeDrawing.clearCanvas();
    }
    setClearCanvasModalOpen(false);
  };

  const initHandleClearAllCanvas = () => {
    addDrawing.clearCanvas();
    removeDrawing.clearCanvas();
  };
  useEffect(() => {
    setHandleClearAllCanvas(initHandleClearAllCanvas);
  }, []);

  const getUserMasks = async () => {
    const base64ImageAdd = await addDrawing.userMaskBase64BAW();
    setBase64ImageAdd(base64ImageAdd);
    const base64ImageRemove = await removeDrawing.userMaskBase64BAW();
    setBase64ImageRemove(base64ImageRemove);
  };

  const handleGenerateMask = async () => {
    setErrors((prev) => ({ ...prev, maskPrompt: "", initImage: "" }));
    if (dummySamMasks) {
      // Validation
      let formErrors = {};
      const mask_prompt = maskPrompt.trim();
      const init_image = selectedImage.link;
      if (!mask_prompt) {
        formErrors.maskPrompt = "Mask prompt is required to generate a mask.";
      }
      if (!init_image) {
        formErrors.initImage = "Initial image is required to generate a mask.";
      }
      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        return;
      }
      setSamMasks(dummySamMasks);
      const dummySamMask = dummySamMasks[0];
      setSelectedSamMask({
        id: 1,
        blended: dummySamMask.blended,
        mask: dummySamMask.mask,
        masked: dummySamMask.masked,
      });
      setSamMaskImage(dummySamMask.mask);
      setSamMaskMask(dummySamMask.masked);
      samDrawing.setNeedsRedraw(true);
      setSamMaskModalOpen(true);
      return;
    }
    try {
      const result = await generateMask(
        maskPrompt,
        selectedImage.link,
        setErrors,
        setStatusMessage,
        setSamMasks,
        selectedSamMask,
        setSelectedSamMask,
        setSamMaskImage,
        setSamMaskMask,
        samDrawing
      );
      if (result.success) {
        await Promise.resolve();
        samDrawing.setNeedsRedraw(true);
        setSamMaskModalOpen(true);
      } else {
        console.log(result.message);
        if (result.message !== "Invalid inputs.") showToast("error", result.message);
      }
    } catch (error) {
      setErrors((prev) => ({ ...prev, general: "Failed to generate mask" }));
    }
  };

  const handlePreviewMask = async () => {
    const isAddCanvasEmpty = addDrawing.isCanvasEmpty();
    const isRemoveCanvasEmpty = removeDrawing.isCanvasEmpty();
    if (isAddCanvasEmpty && isRemoveCanvasEmpty) {
      console.log("Both canvases are empty");
      setPreviewMask(samMaskMask);
      return;
    }
    try {
      console.log("combining masks");
      await getUserMasks();
      console.log(`sam mask path: ${samMaskImage ? "true" : "false"}`);
      console.log(`user mask add: ${base64ImageAdd ? "true" : "false"}`);
      console.log(`user mask remove: ${base64ImageRemove ? "true" : "false"}`);
      const result = await previewMaskAction(
        samMaskImage,
        base64ImageAdd,
        base64ImageRemove,
        selectedSamMask,
        setErrors,
        refineMaskOption,
        showPreview,
        setPreviewMask
      );
      if (!result.success) {
        console.log(result.message);
        if (result.message !== "Invalid inputs.") showToast("error", result.message);
      }
    } catch (error) {
      console.log("Error previewing masks: ", error);
      setErrors((prev) => ({ ...prev, general: "Failed to preview mask" }));
    }
  };

  const handleApplyMask = async () => {
    const isAddCanvasEmpty = addDrawing.isCanvasEmpty();
    const isRemoveCanvasEmpty = removeDrawing.isCanvasEmpty();
    if (isAddCanvasEmpty && isRemoveCanvasEmpty) {
      setCombinedMask({ samMaskImage, samMaskMask });
      setPreviewMask(null);
      handleClearAllCanvas();
      return;
    }
    try {
      await applyMask(
        setErrors,
        samDrawing,
        setSamMaskMask,
        pickedColorSam,
        opacitySam,
        setSamMaskImage,
        setCombinedMask,
        handleClearAllCanvas,
        setPreviewMask,
        samMaskImage,
        base64ImageAdd,
        base64ImageRemove,
        selectedSamMask,
        refineMaskOption,
        showPreview
      );
    } catch (error) {
      setErrors((prev) => ({ ...prev, general: "Failed to apply mask" }));
    }
  };

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
                  "@media (max-width: 768px)": {
                    width: "100%",
                    "& .MuiOutlinedInput-root": {
                      ...textFieldStyles["& .MuiOutlinedInput-root"],
                      padding: "11.8px 14px 11.8px 14px",
                    },
                  },
                }}
                className="maskPromptTextField"
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
                marginTop: "2.5px !important",
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
                  Generated mask options
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
                      max={80}
                      defaultValue={50}
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
                        canvasMode
                          ? handleOpacityChange(value, "add")
                          : handleOpacityChange(value, "remove")
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
                        onChange={(e, value) => handleOpacityChange(value, "sam")}
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

      {/* Canvas Stack and Preview */}
      <Box sx={canvasStyles.canvasAndPreviewContainer} className="canvasAndPreviewContainer">
        <div style={canvasStyles.canvasStack} className="canvasCont">
          <div className="canvasTitle">
            <div className="canvasTitleFlex">
              <Typography
                variant="body1"
                sx={{
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  whiteSpace: "normal",
                  flexGrow: 1,
                }}
              >
                Canvas for selecting mask
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setShowPreview(true);
                  handlePreviewMask();
                }}
                sx={{
                  ...gradientButtonStyles,
                  width: "125px",
                  borderRadius: "8px",
                }}
              >
                Preview mask
              </Button>
            </div>
          </div>
          {/* Canvas Stack */}
          <Box
            sx={{ ...canvasStyles.canvasStack, width: "100%", marginTop: 0, overflow: "hidden" }}
            className="actualCanvas"
            ref={canvasStackRef}
          >
            <img ref={initImageRef} src={selectedImage.link} style={styles.baseImage} alt="" />
            <div ref={samCanvasRef} style={styles.samCanvas}>
              <img src={samMaskMask} alt="" style={styles.samMaskImage} />
            </div>
            <canvas
              ref={removeCanvasRef}
              style={{
                ...styles.canvas,
                zIndex: canvasMode ? 1 : 2,
                pointerEvents: canvasMode ? "none" : "auto",
                opacity: maskVisibilityRemove ? (canvasMode ? 0.6 : 1) : 0,
              }}
              onMouseDown={(e) => handleMouseDown(e, false)}
              onMouseMove={(e) => handleMouseMove(e, false)}
              onMouseUp={() => handleMouseUp(false)}
              onMouseOut={() => handleMouseUp(false)}
            />
            <canvas
              ref={addCanvasRef}
              style={{
                ...styles.canvas,
                zIndex: canvasMode ? 2 : 1,
                pointerEvents: canvasMode ? "auto" : "none",
                opacity: maskVisibilityAdd ? (canvasMode ? 1 : 0.6) : 0,
              }}
              onMouseDown={(e) => handleMouseDown(e, true)}
              onMouseMove={(e) => handleMouseMove(e, true)}
              onMouseUp={() => handleMouseUp(true)}
              onMouseOut={() => handleMouseUp(true)}
            />
          </Box>
        </div>

        {showPreview && (
          <div style={canvasStyles.previewContainer} className="canvasCont">
            <div className="canvasTitle">
              <div className="canvasTitleFlex">
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    whiteSpace: "normal",
                    flexGrow: 1,
                  }}
                >
                  Mask preview
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleApplyMask}
                  sx={{
                    ...gradientButtonStyles,
                    width: "125px",
                    borderRadius: "8px",
                  }}
                >
                  Apply mask
                </Button>
              </div>
            </div>
            {/* Preview Container */}
            <Box
              sx={{
                ...canvasStyles.previewContainer,
                width: "100%",
                marginTop: 0,
                overflow: "hidden",
              }}
              className="actualCanvas"
            >
              <img src={selectedImage.link} style={styles.previewBaseImage} alt="" />
              <div ref={previewCanvasRef} style={styles.previewMask}>
                <img src={previewMask ?? ""} style={styles.previewMaskImage} alt="" />
              </div>
            </Box>
          </div>
        )}
      </Box>

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
          handleClear={handleClearCanvas}
          canvas={clearCanvasSelectedCanvas}
        />
      )}

      {confirmSamMaskChangeModalOpen && (
        <ConfirmSamMaskChangeModal
          isOpen={confirmSamMaskChangeModalOpen}
          onClose={() => setConfirmSamMaskChangeModalOpen(false)}
          handleSelectedMask={() =>
            samDrawing ? samDrawing.actualUseSelectedMask(selectedSamMask) : {}
          }
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
        "@media (max-width: 768px)": {
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
        requestAnimationFrame(() => setPickedColor(color.hex));
      }, 50),
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
      setPickedColor(color);
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

const ClearCanvasModal = ({ isOpen, onClose, handleClear, canvas }) => {
  const onSubmit = () => {
    handleClear(canvas);
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

const ConfirmSamMaskChangeModal = ({ isOpen, onClose, handleSelectedMask }) => {
  const onSubmit = () => {
    handleSelectedMask();
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
          Confirm Change the generated mask
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
          Are you sure you want to change the generated mask? It will reset your previous changes in
          the canvas.
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
          Select a mask generated from your prompt to apply to the image
        </Typography>
        <Box sx={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {samMasks.map((option, index) => (
            <Box
              key={index}
              onClick={() => setSelectedSamMask(option)}
              sx={{
                ...styles.maskOption,
                cursor: "pointer",
                border: selectedSamMask === option ? "2px solid var(--color-primary)" : "none",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <img src={option.blended} alt="Blended" />
              <img src={option.mask} alt="Mask" />
              <img src={option.masked} alt="Masked" />
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

const canvasStyles = {
  canvasContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  canvasAndPreviewContainer: {
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    justifyContent: "center",
    alignItems: "flex-start",
    backgroundColor: "var(--nav-card-modal)",
    borderRadius: "20px",
    margin: "0px 20px 20px 20px;",
    padding: "20px",
  },
  canvasStack: {
    position: "relative",
    width: "calc(50% - 10px)",
    maxWidth: "750px",
    aspectRatio: "1/1",
    margin: "55px auto auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "var(--iconBg)",
    borderRadius: "8px",
    overflow: "unset",
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
  previewContainer: {
    position: "relative",
    width: "calc(50% - 10px)",
    maxWidth: "750px",
    margin: "55px auto auto",
    aspectRatio: "1/1",
    backgroundColor: "var(--iconBg)",
    borderRadius: "8px",
    overflow: "unset",
  },
};

const styles = {
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  baseImage: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    // maxWidth: "100%",
    // maxHeight: "100%",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    oapcity: 1,
  },
  samCanvas: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    oapcity: 1,
  },
  samMaskImage: {
    width: "100%",
    height: "100%",
    transform: "translateY(-1000px)",
  },
  canvas: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    maxWidth: "100%",
    maxHeight: "100%",
    pointerEvents: "auto",
  },
  previewContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: "1/1",
  },
  previewBaseImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    oapcity: 1,
  },
  previewMask: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  previewMaskImage: {
    width: "100%",
    height: "100%",
    // filter: "drop-shadow(0px 1000px 0px rgba(117, 67, 255, 0.5))",
    transform: "translateY(-1000px)",
  },
  dialogContent: {
    padding: 2,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 2,
  },
  maskOption: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    cursor: "pointer",
    "&:hover": {
      opacity: 0.8,
    },
    "& img": {
      width: "100%",
      height: "auto",
    },
  },
};

const dummySamMasks = [
  {
    id: 0,
    blended: "../../test-img/masks/d3b1d166-1d13-4541-8ad0-f81ab9b6e7c7.png",
    mask: "../../test-img/masks/20f7c60f-e94c-45f7-9473-f4bb98902864.png",
    masked: "../../test-img/masks/f1627810-d96a-4b04-94e7-29931ee8184c.png",
  },
  {
    id: 1,
    blended: "../../test-img/masks/abd4bbe6-4e46-415c-bc3e-8550b7209808.png",
    mask: "../../test-img/masks/7e5417fa-f706-4aac-9e33-d0e0fa819949.png",
    masked: "../../test-img/masks/3931fca2-3b27-40c1-9f78-e49274274900.png",
  },
  {
    id: 2,
    blended: "../../test-img/masks/44b2a203-644f-4650-9dc1-16fe22638fb6.png",
    mask: "../../test-img/masks/7a3ac909-7b91-45a2-9d1d-a6f43a7c3ba0.png",
    masked: "../../test-img/masks/187dd26a-f865-42af-9baa-41972ad32e4c.png",
  },
];
