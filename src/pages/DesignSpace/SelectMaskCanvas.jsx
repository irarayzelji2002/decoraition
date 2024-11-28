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
  Tune,
} from "@mui/icons-material";
import {
  ViewIconWhite,
  UnviewIcon,
  EraseIconWhite,
  DeleteIconWhite,
} from "../../components/svg/DefaultMenuIcons";
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
import { GeneratingOverlay } from "./Design";
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
  updateDesignVersionSamMask,
  updateDesignVersionCombinedMask,
} from "./backend/DesignActions";
import { togglePromptBar } from "./backend/DesignActions";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import TooltipWithClickAway from "../../components/TooltipWithClickAway";
import { DescriptionTooltip } from "./Design";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

function SelectMaskCanvas({
  selectedImage,
  showPromptBar,
  setShowPromptBar,
  controlWidthPromptBar,
  setControlWidthPromptBar,
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
  promptBarRef,
  generationErrors,
  canvasMode,
  setCanvasMode,
  samMasks,
  setSamMasks,
  design,
  designVersion,
  designVersionImages,
  isPreviewingMask,
  setIsPreviewingMask,
  validateApplyMask,
  setValidateApplyMask,
  isSelectingMask,
}) {
  const { user, userDoc, designVersions, userDesignVersions } = useSharedProps();
  // Canvas/Container refs
  const addCanvasRef = useRef(null);
  const removeCanvasRef = useRef(null);
  const samCanvasRef = useRef(null);
  const canvasStackRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const initImageRef = useRef(null);
  const containerRef = useRef(null);

  // Show/Hide States
  const [showAllOptions, setShowAllOptions] = useState(false);
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
  const [isGeneratingMask, setIsGeneratingMask] = useState(false); // for loading
  const [statusMessage, setStatusMessage] = useState("");
  const [isChangingMask, setIsChangingMask] = useState(false);
  const [hasCombinedMask, setHasCombinedMask] = useState(false);
  const [option, setOption] = useState(null);
  const [isGenerateMaskBtnDisabled, setIsGenerateMaskBtnDisabled] = useState(false);
  const [isPreviewMaskBtnDisabled, setIsPreviewMaskBtnDisabled] = useState(false);
  const [isApplyMaskBtnDisabled, setIsApplyMaskBtnDisabled] = useState(false);
  // passed form parent:
  // - samMasks, setSamMasks
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
  // passed from parent:
  // - canvasMode, setCanvasMode
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

  const [showGuide, setShowGuide] = useState(false);
  const [showGuideLocked, setShowGuideLocked] = useState(false);

  // Canvas controls for sam mask
  // passed from parent:
  // - pickedColorSam, setPickedColorSam
  // - opacitySam, setOpacitySam

  // Error states
  // passed from parent: errors, setErrors

  const adjustContainerWidth = () => {
    // If windows is 600 or promptBar is hidden, set container to 100%
    if (window.innerWidth <= 600) {
      containerRef.current.style.width = "100%";
      return;
    }
    if (!showPromptBar) {
      containerRef.current.style.width = "100%";
      return;
    }

    let promptBarWidth = 0;
    if (showPromptBar) {
      if (promptBarRef.current) promptBarWidth = promptBarRef.current.offsetWidth;
    }
    const totalWidth = window.innerWidth - promptBarWidth;

    if (totalWidth <= 320) {
      togglePromptBar(setShowPromptBar);
      let newPromptBarWidth = 500;
      if (Number(controlWidthPromptBar) < 500) {
        newPromptBarWidth = Math.max(240, controlWidthPromptBar - 200);
      }
      setControlWidthPromptBar(newPromptBarWidth);
      containerRef.current.style.width = "100%";
    } else {
      containerRef.current.style.width = `${totalWidth}px`;
    }
  };

  const adjustCss = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.offsetWidth;

    const elements = [
      ...container.querySelectorAll(
        ".maskTypeAndControls, .maskTypeOptions, .maskTypeOptionsButtons, .optionsHeader.generalOptions.open, .canvasControls, .canvasControlsCont, .samMaskControls, .samMaskControls .sliderCont, .canvasControls.sam, .selectingMaskHiddenHeaders, .canvasModeAndVisibility, .maskPromptCont, .topMaskActions, .showPreviewButton, .canvasSliders, .maskPromptTextField, .maskPromptTextField .MuiOutlinedInput-root, .generateMaskButton, .canvasCont, .canvasAndPreviewContainer, .canvasTitleFlex, .canvasTitle, .actualCanvas, .canvasAndPreviewContainer, .maskTypeOptionsButton, .canvasModeAndVisibilityButton, .samMaskControlsButton"
      ),
    ];

    elements.forEach((element) => {
      element.classList.remove(
        "width-1155",
        "width-1307",
        "width-1038",
        "width-1000",
        "width-877",
        "width-800",
        "width-763",
        "width-600",
        "width-510",
        "width-500",
        "width-374",
        "browser"
      );
    });

    // Apply width-specific classes based on current container width
    if (width <= 1155) {
      container.querySelector(".canvasControlsCont")?.classList.add("width-1155");
      container.querySelector(".canvasControls")?.classList.add("width-1155");
      container.querySelector(".canvasControls.sam")?.classList.add("width-1155");
    }
    if (width <= 1307) {
      // console.log(`${width} <= 1307`);
      container.querySelector(".maskTypeAndControls")?.classList.add("width-1307");
      container.querySelector(".maskTypeOptions")?.classList.add("width-1307");
      container.querySelector(".maskTypeOptionsButtons")?.classList.add("width-1307");
      container.querySelector(".optionsHeader.generalOptions.open")?.classList.add("width-1307");
    }
    if (width <= 1038) {
      // console.log(`${width} <= 1038`);
      container.querySelector(".samMaskControls")?.classList.add("width-1038");
      container.querySelector(".samMaskControls .sliderCont")?.classList.add("width-1038");
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
    if (width <= 763) {
      // console.log(`${width} <= 763`);
      const canvasModeAndVisibilityConts = container.querySelectorAll(".canvasModeAndVisibility");
      canvasModeAndVisibilityConts.forEach((element) => {
        element.classList.add("width-763");
      });
      container.querySelector(".maskTypeOptionsButtons")?.classList.add("width-763");
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
      const canvasModeAndVisibilityConts = container.querySelectorAll(".canvasModeAndVisibility");
      canvasModeAndVisibilityConts.forEach((element) => {
        element.classList.add("width-600");
      });
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
      const maskTypeOptionsButtonConts = container.querySelectorAll(".maskTypeOptionsButton");
      maskTypeOptionsButtonConts.forEach((element) => {
        element.classList.add("width-600");
      });
      const canvasModeAndVisibilityButtonConts = container.querySelectorAll(
        ".canvasModeAndVisibilityButton"
      );
      canvasModeAndVisibilityButtonConts.forEach((element) => {
        element.classList.add("width-600");
      });
      const samMaskControlsButtonConts = container.querySelectorAll(".samMaskControlsButton");
      samMaskControlsButtonConts.forEach((element) => {
        element.classList.add("width-600");
      });
    }
    if (width <= 510) {
      // console.log(`${width} <= 510`);
      container.querySelector(".maskTypeOptions")?.classList.add("width-510");
      container.querySelector(".generateMaskButton")?.classList.add("width-510");
      container.querySelector(".showPreviewButton")?.classList.add("width-510");
      const maskTypeOptionsButtonConts = container.querySelectorAll(".maskTypeOptionsButton");
      maskTypeOptionsButtonConts.forEach((element) => {
        element.classList.add("width-510");
      });
      const canvasModeAndVisibilityButtonConts = container.querySelectorAll(
        ".canvasModeAndVisibilityButton"
      );
      canvasModeAndVisibilityButtonConts.forEach((element) => {
        element.classList.add("width-510");
      });
      const samMaskControlsButtonConts = container.querySelectorAll(".samMaskControlsButton");
      samMaskControlsButtonConts.forEach((element) => {
        element.classList.add("width-510");
      });
    }
    if (width <= 500) {
      // console.log(`${width} <= 500`);
      container.querySelector(".canvasSliders")?.classList.add("width-500");
      container.querySelector(".maskTypeOptionsButtons")?.classList.add("width-500");
      const canvasModeAndVisibilityConts = container.querySelectorAll(".canvasModeAndVisibility");
      canvasModeAndVisibilityConts.forEach((element) => {
        element.classList.add("width-500");
      });
      container.querySelector(".samMaskControls")?.classList.add("width-500");
      const samMaskControlsButtonConts = container.querySelectorAll(".samMaskControlsButton");
      samMaskControlsButtonConts.forEach((element) => {
        element.classList.add("width-500");
      });
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
    adjustContainerWidth();
    adjustCss();

    const handleResize = () => {
      if (!containerRef.current) return;
      adjustContainerWidth();
      adjustCss();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustCss]);

  useEffect(() => {
    if (!containerRef.current) return;
    adjustContainerWidth();
    adjustCss();
  }, [showPromptBar, controlWidthPromptBar, showPreview]);

  useEffect(() => {
    if (samMaskModalOpen || pickColorModalOpen) {
      document.body.style.overflow = "auto";
    } else {
      document.body.style.overflow = ""; // Reset when closed
    }
  }, [samMaskModalOpen, pickColorModalOpen]);

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
  const addDrawing = useCanvasDrawing(
    addCanvasRef,
    pickedColorAdd,
    opacityAdd,
    brushModeAdd,
    isSelectingMask
  );

  const removeDrawing = useCanvasDrawing(
    removeCanvasRef,
    pickedColorRemove,
    opacityRemove,
    brushModeRemove,
    isSelectingMask
  );

  const initSamDrawing = useSamCanvas(
    samCanvasRef,
    previewCanvasRef,
    pickedColorSam,
    opacitySam,
    samMaskModalOpen,
    setConfirmSamMaskChangeModalOpen,
    selectedSamMask,
    samMasks,
    samMaskMask,
    setSamMaskImage,
    samMaskImage,
    setSamMaskMask,
    showPreview
  );

  useEffect(() => {
    setSamDrawing(initSamDrawing);
  }, []);

  // useEffect(() => {
  //   const handleResize = (canvasRef) => {
  //     if (!canvasRef.current || !containerRef.current) return;

  //     // Store current drawing data
  //     const tempCanvas = document.createElement("canvas");
  //     const tempCtx = tempCanvas.getContext("2d");
  //     tempCanvas.width = canvasRef.current.width;
  //     tempCanvas.height = canvasRef.current.height;
  //     tempCtx.drawImage(canvasRef.current, 0, 0);

  //     // Resize canvas
  //     const container = containerRef.current;
  //     const newWidth = container.offsetWidth;
  //     const newHeight = container.offsetHeight;

  //     canvasRef.current.width = newWidth;
  //     canvasRef.current.height = newHeight;

  //     // Restore drawing with proper scaling
  //     const ctx = canvasRef.current.getContext("2d");
  //     ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);

  //     // Trigger redraw
  //     if (addDrawing) addDrawing.setNeedsRedraw(true);
  //     if (removeDrawing) removeDrawing.setNeedsRedraw(true);
  //   };

  //   const handleResizeAllCanvas = () => {
  //     handleResize(addCanvasRef);
  //     handleResize(removeCanvasRef);
  //   };

  //   window.addEventListener("resize", handleResizeAllCanvas);
  //   return () => window.removeEventListener("resize", handleResizeAllCanvas);
  // }, [addDrawing, removeDrawing]);

  useEffect(() => {
    const clearAllCanvas = () => {
      addDrawing.clearCanvas();
      removeDrawing.clearCanvas();
    };
    setHandleClearAllCanvas(() => clearAllCanvas);

    const validateApplyMask = async () => {
      const isAddCanvasEmpty = addDrawing.isCanvasEmpty();
      const isRemoveCanvasEmpty = removeDrawing.isCanvasEmpty();
      if (isAddCanvasEmpty && isRemoveCanvasEmpty) {
        setPreviewMask(null);
        if (handleClearAllCanvas) handleClearAllCanvas();
        return null;
      }
      const masks = await getUserMasks();
      return masks;
    };

    setValidateApplyMask(() => validateApplyMask);
  }, [addDrawing, removeDrawing]);

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

  // Resizing logic
  // useEffect(() => {
  //   if (
  //     !selectedImage ||
  //     !canvasStackRef.current ||
  //     !addCanvasRef.current ||
  //     !removeCanvasRef.current
  //   )
  //     return;

  //   const updateCanvasSize = () => {
  //     // Account for device pixel ratio for sharp rendering
  //     const scale = window.devicePixelRatio;
  //     console.log("window.devicePixelRatio", scale);
  //     [(addCanvasRef, removeCanvasRef)].forEach((ref) => {
  //       if (!ref.current) return;
  //       // Scale context
  //       const ctx = ref.current.getContext("2d");
  //       ctx.scale(scale, scale);
  //     });
  //   };

  //   updateCanvasSize();
  //   window.addEventListener("resize", updateCanvasSize);
  //   return () => window.removeEventListener("resize", updateCanvasSize);
  // }, [selectedImage]);

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
  }, [opacitySam, pickedColorSam, showPreview]);

  // Update SAM mask when selected mask changes
  useEffect(() => {
    console.log("samMaskModalOpen", samMaskModalOpen);
    if (!samMaskModalOpen) return;

    console.log("Selected SAM mask changed:", selectedSamMask);
    if (samDrawing && selectedSamMask && !isPreviewingMask && !combinedMask) {
      samDrawing.useSelectedMask(selectedSamMask);
    }
  }, [selectedSamMask, combinedMask]);

  useEffect(() => {
    console.log("SAM Mask change from modal1");
    if (selectedSamMask && (samMaskModalOpen || confirmSamMaskChangeModalOpen)) {
      console.log("SAM Mask change from modal2");
      setSamMaskImage(selectedSamMask["mask"]);
      setSamMaskMask(selectedSamMask["masked"]);
      if (samDrawing) samDrawing.setNeedsRedraw(true);
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

  const getUserMasks = async () => {
    const base64ImageAdd = await addDrawing.userMaskBase64BAW();
    setBase64ImageAdd(base64ImageAdd);
    const base64ImageRemove = await removeDrawing.userMaskBase64BAW();
    setBase64ImageRemove(base64ImageRemove);
    // console.log("base64: base64ImageAdd", base64ImageAdd);
    // console.log("base64: base64ImageRemove", base64ImageRemove);
    return { base64ImageAdd, base64ImageRemove };
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

  const handleCancelSelectMask = (isChangingMask, initSelectedSamMask) => {
    if (!isChangingMask) {
      setSamMasks([]);
      setSelectedSamMask(null);
      setSamMaskImage(null);
      setSamMaskMask(null);
    } else {
      setSelectedSamMask(initSelectedSamMask);
      samDrawing.setNeedsRedraw(true);
      setIsChangingMask(false);
    }
    setSamMaskModalOpen(false);
  };

  const handleGenerateMask = async () => {
    setIsGenerateMaskBtnDisabled(true);
    setErrors((prev) => ({ ...prev, maskPrompt: "", initImage: "" }));
    setCombinedMask(null);
    setPreviewMask(null);
    setSamMaskImage(null);
    setSamMaskMask(null);
    if (handleClearAllCanvas) handleClearAllCanvas();
    if (dummySamMasks && dummySamMasks.length > 0) {
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
        setIsGeneratingMask
      );
      if (result.success) {
        await Promise.resolve();
        if (!result.data) throw new Error("Failed to generate mask");
        const { blended_images, masks, masked_images } = result.data;
        const samMasks = blended_images.map((blended_image, index) => ({
          id: index,
          blended: blended_images[index],
          mask: masks[index],
          masked: masked_images[index],
        }));
        // Upload SAM masks
        setStatusMessage("Uploading masks");
        const resultUpdateSamMasks = await updateDesignVersionSamMask(
          design.id,
          designVersion.id, //designVersionId,
          selectedImage.imageId, //designVersionImageId,
          samMasks,
          user,
          userDoc
        );
        if (!resultUpdateSamMasks.success) {
          showToast("error", "Failed to generate mask");
          return;
        }
        setStatusMessage("Upload masks completed");
        const images = resultUpdateSamMasks?.data || designVersionImages;
        const imageId = selectedImage?.imageId;
        const image = images.find((i) => i.imageId === imageId) ?? null;
        const newSamMasks = image?.masks?.samMasks ?? null;
        setSamMasks(newSamMasks);
        setSelectedSamMask(newSamMasks?.[0] ?? null);
        if (samDrawing) await samDrawing.useSelectedMask(newSamMasks?.[0] ?? null);
        setSamMaskImage(newSamMasks?.[0]?.mask);
        setSamMaskMask(newSamMasks?.[0]?.masked);
        if (samDrawing) samDrawing.setNeedsRedraw(true);
        setSamMaskModalOpen(true);
        setMaskPrompt("");
      } else {
        console.log(result.message);
        if (result.message !== "Invalid inputs.") showToast("error", result.message);
      }
    } catch (error) {
      console.log("Error generating masks: ", error.message);
      showToast("error", "Failed to generate mask");
      setIsGeneratingMask(false);
      setStatusMessage("");
    } finally {
      setIsGeneratingMask(false);
      setStatusMessage("");
      setIsGenerateMaskBtnDisabled(false);
    }
  };

  const validatePreviewMask = async () => {
    const isAddCanvasEmpty = addDrawing.isCanvasEmpty();
    const isRemoveCanvasEmpty = removeDrawing.isCanvasEmpty();
    if (isAddCanvasEmpty && isRemoveCanvasEmpty) {
      console.log("Both canvases are empty");
      setPreviewMask(samMaskMask);
      return null;
    }
    const masks = await getUserMasks();
    return masks;
  };

  const handlePreviewMask = async () => {
    try {
      setIsPreviewMaskBtnDisabled(true);
      await setShowPreview(true);
      const masks = await validatePreviewMask();
      if (!masks) {
        console.log("previewing mask - Using SAM mask only");
        return;
      } else {
        setBase64ImageAdd(masks.base64ImageAdd);
        setBase64ImageRemove(masks.base64ImageRemove);
      }
      await new Promise((resolve) => setTimeout(resolve, 0));

      console.log("previewing mask - combining masks");
      // console.log(`previewing mask - sam mask path: ${samMaskImage ? "true" : "false"}`);
      // console.log(`previewing mask - user mask add: ${base64ImageAdd ? "true" : "false"}`);
      // console.log(`previewing mask - user mask remove: ${base64ImageRemove ? "true" : "false"}`);
      console.log(`previewing mask - sam mask path: ${samMaskImage}`);
      console.log(`previewing mask - user mask add: ${base64ImageAdd}`);
      console.log(`previewing mask - user mask remove: ${base64ImageRemove}`);
      const result = await previewMaskAction(
        samMaskImage,
        masks?.base64ImageAdd || base64ImageAdd,
        masks?.base64ImageRemove || base64ImageRemove,
        selectedSamMask,
        setErrors,
        refineMaskOption,
        showPreview,
        setPreviewMask,
        setStatusMessage,
        setIsPreviewingMask,
        setCombinedMask
      );
      if (!result.success) {
        console.log(result.message);
        if (result.message !== "Invalid inputs.") showToast("error", result.message);
      }
    } catch (error) {
      console.log("Error previewing masks: ", error.message);
      showToast("error", "Failed to preview mask");
    } finally {
      setIsPreviewingMask(false);
      setStatusMessage("");
      setIsPreviewMaskBtnDisabled(false);
    }
  };

  const handleApplyMask = async () => {
    setIsApplyMaskBtnDisabled(true);
    await setShowPreview(true);
    if (!validateApplyMask) return;
    const masks = await validateApplyMask();
    if (!masks) {
      console.log("Using SAM mask only");
      return;
    } else {
      setBase64ImageAdd(masks.base64ImageAdd);
      setBase64ImageRemove(masks.base64ImageRemove);
    }
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      let combinedMaskData;
      if (!combinedMask) {
        console.log("applying mask - inside if");
        const result = await previewMaskAction(
          samMaskImage,
          masks?.base64ImageAdd || base64ImageAdd,
          masks?.base64ImageRemove || base64ImageRemove,
          selectedSamMask,
          setErrors,
          refineMaskOption,
          false, // showPreview to not set previewMask
          setPreviewMask,
          setStatusMessage,
          setIsPreviewingMask,
          setCombinedMask
        );
        if (result.success) {
          // Upload Combined masks
          setStatusMessage("Uploading images");
          combinedMaskData = {
            samMaskImage: result?.data?.mask?.url || "",
            samMaskMask: result?.data?.masked_image?.url || "",
          };
          console.log("combinedMaskData", combinedMaskData);
        } else {
          console.log(result.message);
          if (result.message !== "Invalid inputs.") showToast("error", result.message);
        }
      } else {
        console.log("applying mask - inside else");
        setIsPreviewingMask(true);
        setStatusMessage("Uploading images");
        combinedMaskData = {
          samMaskImage: combinedMask?.mask?.url || "",
          samMaskMask: combinedMask?.masked_image?.url || "",
        };
        console.log("applying mask - combinedMaskData", combinedMaskData);
      }
      const resultUpdateCombinedMask = await updateDesignVersionCombinedMask(
        design.id,
        designVersion.id, //designVersionId,
        selectedImage.imageId, //designVersionImageId,
        combinedMaskData,
        user,
        userDoc
      );
      if (!resultUpdateCombinedMask.success) {
        showToast("error", "Failed to apply mask");
        return;
      }
      setStatusMessage("Upload complete");
      const images = resultUpdateCombinedMask?.data || designVersionImages;
      const imageId = selectedImage?.imageId;
      const image = images.find((i) => i.imageId === imageId) ?? null;
      const newSamMaskImage =
        image?.masks?.combinedMask?.samMaskImage || samMasks?.[0]?.mask || null;
      const newSamMaskMask =
        image?.masks?.combinedMask?.samMaskMask ||
        samMasks?.[0]?.masked ||
        "/img/transparent-image.png";
      console.log("applying mask - setSamMaskImage", newSamMaskImage);
      console.log("applying mask - newSamMaskMask", newSamMaskMask);
      setSamMaskImage(newSamMaskImage);
      setSamMaskMask(newSamMaskMask);
      setCombinedMask(null);
      setPreviewMask(null);
      if (samDrawing) samDrawing.setNeedsRedraw(true);
      if (handleClearAllCanvas) handleClearAllCanvas();
    } catch (error) {
      console.log("Error applying masks: ", error.message);
      showToast("error", "Failed to apply mask");
    } finally {
      setIsPreviewingMask(false);
      setStatusMessage("");
      setIsApplyMaskBtnDisabled(false);
    }
  };

  useEffect(() => {
    // Do not update if generating, previewing, or applying becaus eit's already handled and avoid overriding
    if (isPreviewingMask || isGeneratingMask) return;
    console.log("select mask canvas - designVersion", designVersion);
    console.log("select mask canvas - designVersionImages", designVersionImages);
    console.log("select mask canvas - selectedImage", selectedImage);
    if (!designVersion && !designVersionImages && !selectedImage) return;
    const imageId = selectedImage?.imageId;
    if (!imageId) {
      console.warn("selectedImage.imageId is missing.");
      return;
    }

    // Populate SAM mask variables
    const image = designVersionImages.find((i) => i.imageId === imageId) ?? null;
    const samMasks = image?.masks?.samMasks ?? null;
    setSamMasks(samMasks);
    setSelectedSamMask(samMasks?.[0] ?? null);
    console.log("select mask canvas - image", image);
    console.log("select mask canvas - samMasks", samMasks);
    console.log("select mask canvas - samMasks[0]", samMasks?.[0] ?? null);

    // Populate combined mask variables
    if (image?.masks?.combinedMask?.samMaskImage && image?.masks?.combinedMask?.samMaskMask)
      setHasCombinedMask(true);
    else setHasCombinedMask(false);
    const samMaskImage =
      image?.masks?.combinedMask?.samMaskImage?.trim() || samMasks?.[0]?.mask?.trim() || null;
    const samMaskMask =
      image?.masks?.combinedMask?.samMaskMask?.trim() ||
      samMasks?.[0]?.masked?.trim() ||
      "/img/transparent-image.png";
    console.log("select mask canvas - samMasks?.[0]?.masked", samMasks?.[0]?.masked);
    console.log("select mask canvas - samMasks?.[0]?.mask", samMasks?.[0]?.mask);
    setSamMaskImage(samMaskImage);
    setSamMaskMask(samMaskMask);
    if (samDrawing) samDrawing.setNeedsRedraw(true);
    console.log("select mask canvas - samMaskImage", samMaskImage);
    console.log("select mask canvas - samMaskMask", samMaskMask);
  }, [designVersion, designVersionImages]);

  useEffect(() => {
    console.log("changing - samMaskMask", samMaskMask);
    console.log("changing - samMaskImage", samMaskImage);
  }, [samMaskMask, samMaskImage]);

  useEffect(() => {
    if (showPreview && previewMask && samDrawing) {
      samDrawing.setNeedsRedraw(true);
    }
  }, [showPreview, previewMask]);

  return (
    <Box sx={canvasStyles.canvasContainer} ref={containerRef}>
      {/* Controls */}
      <Box sx={canvasStyles.controls}>
        <div className="topMaskActions">
          {/* Mask Prompt */}{" "}
          <div className="maskPromptCont">
            <DelayedTooltip title="Type objects in the image to mask" delay={1000}>
              <TextField
                value={maskPrompt}
                onChange={(e) => {
                  setMaskPrompt(e.target.value);
                  clearFieldError("maskPrompt");
                }}
                placeholder="Type objects in the image to mask (ex. 'bed', 'lamp', 'walls')"
                size="small"
                helperText={errors?.maskPrompt || generationErrors?.maskPrompt}
                variant="outlined"
                inputProps={textFieldInputProps}
                sx={{
                  ...textFieldStyles,
                  flexGrow: 1,
                  "& input": {
                    ...textFieldStyles["& input"],
                    padding: 0,
                  },
                  "& .MuiOutlinedInput-root": {
                    ...textFieldStyles["& .MuiOutlinedInput-root"],
                    padding: "11.8px 146px 11.8px 14px",
                  },
                  "& .MuiFormHelperText-root": {
                    ...textFieldStyles["& .MuiFormHelperText-root"],
                    textAlign: "center",
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
              disabled={isGenerateMaskBtnDisabled}
              sx={{
                ...gradientButtonStyles,
                minWidth: "133px",
                height: "42.6px",
                borderRadius: "0px 8px 8px 0px",
                marginLeft: "-145px !important",
                marginTop: "2.5px !important",
                opacity: isGenerateMaskBtnDisabled ? "0.5" : "1",
                cursor: isGenerateMaskBtnDisabled ? "default" : "pointer",
                "&:hover": {
                  backgroundImage: !isGenerateMaskBtnDisabled && "var(--gradientButtonHover)",
                },
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
              className="generateMaskButton"
            >
              Generate Mask
            </Button>
            <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
              <h6>Show me a guide</h6>
              <TooltipWithClickAway
                open={showGuide}
                setOpen={setShowGuide}
                tooltipClickLocked={showGuideLocked}
                setTooltipClickLocked={setShowGuideLocked}
                title={
                  <DescriptionTooltip
                    image="/img/mask-guide.gif"
                    description="Quick masking guide"
                  />
                }
                className="helpTooltip showGuide"
              >
                <div style={{ display: "flex" }}>
                  <HelpOutlineIcon sx={{ color: "var(--iconDark)", transform: "scale(0.9)" }} />
                </div>
              </TooltipWithClickAway>
            </div>

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
                  minWidth="222.8px"
                  width="30%"
                  className="maskTypeOptionsButton"
                />
                {/* Refine Mask Option */}
                <ToggleButton
                  label="Refine mask option"
                  value={refineMaskOption}
                  handleToggle={() => setRefineMaskOption(!refineMaskOption)}
                  valuesMap={refineMaskOptionValuesMap}
                  minWidth="222.8px"
                  width="30%"
                  className="maskTypeOptionsButton"
                />
                {/* Preview visibility */}
                <ToggleButton
                  label="Preview visibility"
                  value={showPreview}
                  handleToggle={() => setShowPreview(!showPreview)}
                  valuesMap={visibilityValuesMap}
                  minWidth="222.8px"
                  width="30%"
                  className="maskTypeOptionsButton"
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
                    minWidth="162.5px"
                    width="25%"
                    className="canvasModeAndVisibilityButton"
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
                    minWidth="162.5px"
                    width="25%"
                    className="canvasModeAndVisibilityButton"
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
                    minWidth="162.5px"
                    width="25%"
                    className="canvasModeAndVisibilityButton"
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
                    minWidth="162.5px"
                    width="25%"
                    height="46.68px"
                    isOneLine={true}
                    className="canvasModeAndVisibilityButton"
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
                    {selectedSamMask && samMasks && (
                      <ToggleButton
                        label="Selected mask"
                        value={selectedSamMask.id}
                        handleToggle={() => {
                          if (selectedSamMask && samMasks) {
                            setIsChangingMask(true);
                            setSamMaskModalOpen(true);
                          } else showToast("error", "Generate a mask first");
                        }}
                        valuesMap={selectedSamMaskValuesMap}
                        minWidth="162.5px"
                        width="50%"
                        height="46.68px"
                        className="samMaskControlsButton"
                        hasTootltip={true}
                        tooltipTitle="Change generated mask"
                        tooltipDelay={1000}
                      />
                    )}
                    <ToggleButton
                      label="Mask color"
                      value={true}
                      handleToggle={() => {
                        setPickedColorCanvas("sam");
                        setPickColorModalOpen(true);
                      }}
                      valuesMap={getSelectedColorValuesMap("sam")}
                      minWidth="162.5px"
                      width="50%"
                      className="samMaskControlsButton"
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
                  width: "128px",
                  borderRadius: "8px",
                  padding: "4px 16px 8px 12px",
                  opacity: isPreviewMaskBtnDisabled ? "0.5" : "1",
                  cursor: isPreviewMaskBtnDisabled ? "default" : "pointer",
                  "&:hover": {
                    backgroundImage: !isPreviewMaskBtnDisabled && "var(--gradientButtonHover)",
                  },
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
            <img
              ref={initImageRef || "/img/transparent-image.png"}
              src={selectedImage.link}
              style={styles.baseImage}
              alt=""
            />
            <div ref={samCanvasRef} style={styles.samCanvas}>
              <img
                src={samMaskMask || "/img/transparent-image.png"}
                alt=""
                style={styles.samMaskImage}
              />
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
                  onClick={() => {
                    setShowPreview(true);
                    handleApplyMask();
                  }}
                  disabled={isApplyMaskBtnDisabled}
                  sx={{
                    ...gradientButtonStyles,
                    width: "128px",
                    borderRadius: "8px",
                    padding: "4px 16px 8px 12px",
                    opacity: isApplyMaskBtnDisabled ? "0.5" : "1",
                    cursor: isApplyMaskBtnDisabled ? "default" : "pointer",
                    "&:hover": {
                      backgroundImage: !isApplyMaskBtnDisabled && "var(--gradientButtonHover)",
                    },
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
              <img
                src={selectedImage.link || "/img/transparent-image.png"}
                style={styles.previewBaseImage}
                alt=""
              />
              <div ref={previewCanvasRef} style={styles.previewMask}>
                <img
                  src={previewMask || "/img/transparent-image.png"}
                  style={styles.previewMaskImage}
                  alt=""
                />
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
          handleCancelSelectMask={handleCancelSelectMask}
          samMasks={samMasks}
          samMaskMask={samMaskMask}
          selectedSamMask={selectedSamMask}
          setSelectedSamMask={setSelectedSamMask}
          setSamMaskMask={setSamMaskMask}
          isChangingMask={isChangingMask}
          hasCombinedMask={hasCombinedMask}
          setConfirmSamMaskChangeModalOpen={setConfirmSamMaskChangeModalOpen}
          option={option}
          setOption={setOption}
          setSamMaskImage={setSamMaskImage}
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
          closeSamMaskModal={() => setSamMaskModalOpen(false)}
          setSelectedSamMask={setSelectedSamMask}
          option={option}
          setSamMaskImage={setSamMaskImage}
        />
      )}

      {(isGeneratingMask || isPreviewingMask) && (
        <GeneratingOverlay statusMessage={statusMessage} progress="" eta="" />
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
  height = "fit-content",
  isOneLine = false,
  hasTootltip = false,
  tooltipTitle = "",
  tooltipDelay = 1000,
  className = "",
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
      }}
      className={`toggleButton ${className}`}
    >
      {hasTootltip ? (
        <DelayedTooltip title={tooltipTitle} delay={tooltipDelay}>
          <div className="toggleButtonContent">
            <div className="toggleButtonText">
              <span className="toggleButtonTextLabel">{label}</span>
              <span
                className="toggleButtonTextValue"
                style={{ marginTop: isOneLine ? "-4px" : "" }}
              >
                {valuesMap[value]?.label || ""}
              </span>
            </div>
            <div className="toggleButtonIcon">{valuesMap[value]?.icon}</div>
          </div>
        </DelayedTooltip>
      ) : (
        <div className="toggleButtonContent">
          <div className="toggleButtonText">
            <span className="toggleButtonTextLabel">{label}</span>
            <span className="toggleButtonTextValue" style={{ marginTop: isOneLine ? "-4px" : "" }}>
              {valuesMap[value]?.label || ""}
            </span>
          </div>
          <div className="toggleButtonIcon">{valuesMap[value]?.icon}</div>
        </div>
      )}
    </Button>
  );
};

function PickColorModalPaperComponent(props) {
  return (
    <Draggable handle="#draggable-color-picker-dialog" cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper {...props} />
    </Draggable>
  );
}

function SamMaskModalPaperComponent(props) {
  return (
    <Draggable handle="#draggable-sam-mask-dialog" cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper {...props} />
    </Draggable>
  );
}

// Modal for picking color
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
      sx={{
        ...dialogStyles,
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        height: "fit-content",
        width: "fit-content",
      }}
      PaperComponent={PickColorModalPaperComponent}
      disableScrollLock={true}
      container={document.querySelector(".workspace")}
      aria-labelledby="draggable-color-picker-dialog"
      slots={{
        backdrop: () => null,
      }}
      PaperProps={{
        elevation: 8,
      }}
    >
      <DialogTitle
        sx={{
          ...dialogTitleStyles,
          padding: "10px 12px 10px 6px",
          cursor: "move",
          userSelect: "none",
        }}
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

const ConfirmSamMaskChangeModal = ({
  isOpen,
  onClose,
  handleSelectedMask,
  closeSamMaskModal,
  setSelectedSamMask,
  option,
  setSamMaskImage,
}) => {
  const onSubmit = () => {
    setSelectedSamMask(option);
    setSamMaskImage(option.mask);
    handleSelectedMask();
    closeSamMaskModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} sx={{ ...dialogStyles, alignItems: "center" }}>
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
          Confirm change of the generated mask
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
      <DialogActions sx={{ ...dialogActionsStyles, width: "90%" }}>
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

const SamMaskModal = ({
  isOpen,
  onClose,
  handleCancelSelectMask,
  samMasks,
  samMaskMask,
  selectedSamMask,
  setSelectedSamMask,
  setSamMaskMask,
  isChangingMask,
  hasCombinedMask,
  setConfirmSamMaskChangeModalOpen,
  option,
  setOption,
  setSamMaskImage,
}) => {
  const [initSelectedSamMask, setInitSelectedSamMask] = useState(null);

  const onSubmit = () => {
    if (hasCombinedMask) {
      setConfirmSamMaskChangeModalOpen(true);
    } else {
      setSelectedSamMask(option);
      onClose();
    }
  };

  const handleClose = () => {
    handleCancelSelectMask(isChangingMask, initSelectedSamMask);
  };

  const handleSelectOption = useCallback((option) => {
    setOption(option);
    setSamMaskMask(option.masked);
    setSamMaskImage(option.mask);
  }, []);

  useEffect(() => {
    setInitSelectedSamMask(selectedSamMask);
    setOption(selectedSamMask);
  }, []);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      sx={{
        ...dialogStyles,
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        height: "fit-content",
        width: "fit-content",
      }}
      PaperComponent={SamMaskModalPaperComponent}
      disableScrollLock={true}
      container={document.querySelector(".workspace")}
      aria-labelledby="draggable-sam-mask-dialog"
      slots={{
        backdrop: () => null,
      }}
      PaperProps={{
        elevation: 8,
      }}
    >
      <DialogTitle
        sx={{
          ...dialogTitleStyles,
          cursor: "move",
          userSelect: "none",
        }}
        id="draggable-sam-mask-dialog"
      >
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
      <DialogContent sx={{ ...dialogContentStyles, width: "auto" }}>
        <Typography variant="body1" sx={{ marginBottom: "20px", textAlign: "center" }}>
          Select a mask generated from your prompt to apply to the image
        </Typography>
        <Box sx={styles.maskOptionCont}>
          {samMasks.map((option, index) => (
            <Box
              key={index}
              onClick={() => handleSelectOption(option)}
              sx={{
                ...styles.maskOption,
                background:
                  samMaskMask === option.masked
                    ? "var(--gradientFontLessYellow)"
                    : "var(--inputBg)",
                "&:hover": {
                  background:
                    samMaskMask === option.masked
                      ? "var(--gradientFontLessYellowHover)"
                      : "var(--inputBgBrighter)",
                },
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  marginBottom: "10px",
                  textAlign: "center",
                  margin: "10px",
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                }}
              >
                {index + 1}
              </Typography>
              <div className="content sam-masks">
                <img src={`${option.blended}`} alt="" />
                <img src={`${option.mask}`} alt="" />
                <img src={`${option.masked}`} alt="" />
              </div>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={dialogActionsStyles}>
        <Button fullWidth variant="contained" onClick={onSubmit} sx={gradientButtonStyles}>
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
    background: "var(--gradientButton)",
    backgroundHover: "var(--gradientButtonHover)",
  },
  1: {
    label: "Option 2",
    icon: <ChangeCircleRoundedIcon sx={{ color: "var(--color-white)" }} />,
    background: "var(--gradientButton)",
    backgroundHover: "var(--gradientButtonHover)",
  },
  2: {
    label: "Option 3",
    icon: <ChangeCircleRoundedIcon sx={{ color: "var(--color-white)" }} />,
    background: "var(--gradientButton)",
    backgroundHover: "var(--gradientButtonHover)",
  },
};

// Canvas Mode
const canvasModeValuesMap = {
  true: {
    label: "Add to mask",
    color: "var(--always-white)",
    icon: <AddCircleRoundedIcon sx={{ color: "var(--always-white)" }} />,
    backgroundColor: "var(--green)",
    backgroundColorHover: "var(--greenHover)",
  },
  false: {
    label: "Remove from mask",
    color: "var(--always-white)",
    icon: <RemoveCircleRoundedIcon sx={{ color: "var(--always-white)" }} />,
    backgroundColor: "var(--red)",
    backgroundColorHover: "var(--redHover)",
  },
};

// Refine Mask Option
const refineMaskOptionValuesMap = {
  true: {
    label: "Add first then remove",
    color: "var(--always-white)",
    icon: <AddCircleRoundedIcon sx={{ color: "var(--always-white)" }} />,
    backgroundColor: "var(--green)",
    backgroundColorHover: "var(--greenHover)",
  },
  false: {
    label: "Remove first then add",
    color: "var(--always-white)",
    icon: <RemoveCircleRoundedIcon sx={{ color: "var(--always-white)" }} />,
    backgroundColor: "var(--red)",
    backgroundColorHover: "var(--redHover)",
  },
};

// Brush Mode
const brushModeValuesMap = {
  true: {
    label: "Draw",
    color: "var(--always-white)",
    icon: <BrushRoundedIcon sx={{ color: "var(--always-white)" }} />,
    backgroundColor: "var(--green)",
    backgroundColorHover: "var(--greenHover)",
  },
  false: {
    label: "Erase",
    color: "var(--always-white)",
    icon: <EraseIconWhite />,
    backgroundColor: "var(--red)",
    backgroundColorHover: "var(--redHover)",
  },
};

// Visibility
const visibilityValuesMap = {
  true: {
    label: "Visible",
    color: "var(--always-white)",
    icon: <ViewIconWhite />,
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
    label: "Clear canvas",
    color: "var(--always-white)",

    icon: <DeleteIconWhite />,
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
  maskOptionCont: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  maskOption: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    cursor: "pointer",
    padding: "3px",
    background: "var(--gradientFontLessYellow)",
    borderRadius: "10px",
    "&:hover": {
      background: "var(--gradientFontLessYellowHover)",
    },
    "& .content": {
      backgroundColor: "var(--nav-card-modal)",
      width: "100%",
      height: "100%",
      borderRadius: "8px",
      display: "flex",
      flexDirection: "row",
    },
    "& img": {
      width: "100%",
      height: "150px",
    },
  },
};

// const dummySamMasks = [
//   {
//     id: 0,
//     blended: "../../test-img/masks/d3b1d166-1d13-4541-8ad0-f81ab9b6e7c7.png",
//     mask: "../../test-img/masks/20f7c60f-e94c-45f7-9473-f4bb98902864.png",
//     masked: "../../test-img/masks/f1627810-d96a-4b04-94e7-29931ee8184c.png",
//   },
//   {
//     id: 1,
//     blended: "../../test-img/masks/abd4bbe6-4e46-415c-bc3e-8550b7209808.png",
//     mask: "../../test-img/masks/7e5417fa-f706-4aac-9e33-d0e0fa819949.png",
//     masked: "../../test-img/masks/3931fca2-3b27-40c1-9f78-e49274274900.png",
//   },
//   {
//     id: 2,
//     blended: "../../test-img/masks/44b2a203-644f-4650-9dc1-16fe22638fb6.png",
//     mask: "../../test-img/masks/7a3ac909-7b91-45a2-9d1d-a6f43a7c3ba0.png",
//     masked: "../../test-img/masks/187dd26a-f865-42af-9baa-41972ad32e4c.png",
//   },
// ];

const dummySamMasks = [];
