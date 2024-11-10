// SelectMaskCanvas.jsx
import React, { useState, useRef, useEffect } from "react";
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
} from "@mui/material";
import {
  CloseRounded as CloseRoundedIcon,
  AddCircleRounded as AddCircleRoundedIcon,
  RemoveCircleRounded as RemoveCircleRoundedIcon,
  ChangeCircleRounded as ChangeCircleRoundedIcon,
  BrushRounded as BrushRoundedIcon,
} from "@mui/icons-material";
import { ViewIcon, UnviewIcon, EraseIcon } from "../../components/svg/DefaultMenuIcons";
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
import { showToast } from "../../functions/utils";

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
    padding: "10px",
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

function SelectMaskCanvas({ selectedImage, onMaskSelect }) {
  // Canvas refs
  const addCanvasRef = useRef(null);
  const removeCanvasRef = useRef(null);
  const samCanvasRef = useRef(null);
  const previewCanvasRef = useRef(null);

  // States
  const [canvasMode, setCanvasMode] = useState("add");
  const [showPreview, setShowPreview] = useState(false);
  const [samMaskDialogOpen, setSamMaskDialogOpen] = useState(false);
  const [maskPrompt, setMaskPrompt] = useState("");
  const [samMasks, setSamMasks] = useState([]);
  const [selectedSamMask, setSelectedSamMask] = useState(null);

  // Brush controls
  const [brushSize, setBrushSize] = useState(20);
  const [selectedColor, setSelectedColor] = useState("#7543FF");
  const [opacity, setOpacity] = useState(0.5);
  const [brushMode, setBrushMode] = useState("draw"); // "draw" or "erase"
  const [maskVisibility, setMaskVisibility] = useState(true);

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

  useEffect(() => {
    initializeCanvases();
  }, [selectedImage]);

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
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = brushSize;
    ctx.globalAlpha = opacity;
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
      setSamMaskDialogOpen(true);
    } catch (error) {
      console.error("Error generating mask:", error);
    }
  };

  return (
    <Box sx={canvasStyles.canvasContainer}>
      {/* Controls */}
      <Box sx={canvasStyles.controls}>
        {/* Canvas Mode */}
        <FormControlLabel
          control={
            <Switch
              checked={canvasMode === "add"}
              onChange={(e) => setCanvasMode(e.target.checked ? "add" : "remove")}
              color="warning"
              sx={switchStyles}
            />
          }
          label={canvasMode === "add" ? "Add to Mask" : "Remove from Mask"}
        />

        {/* Mask Prompt */}
        <TextField
          value={maskPrompt}
          onChange={(e) => setMaskPrompt(e.target.value)}
          placeholder="Enter mask prompt"
          size="small"
          helperText={errors?.maskPrompt}
          variant="outlined"
          fullWidth
          inputProps={textFieldInputProps}
          sx={textFieldStyles}
        />

        <Button variant="contained" onClick={handleGenerateMask}>
          Generate Mask
        </Button>

        <IconButton onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? <UnviewIcon /> : <ViewIcon />}
        </IconButton>

        <Slider
          value={brushSize}
          onChange={(e, value) => setBrushSize(value)}
          min={5}
          max={50}
          valueLabelDisplay="auto"
          aria-label="Brush size"
        />

        <input
          type="color"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
        />

        <Slider
          value={opacity}
          onChange={(e, value) => setOpacity(value)}
          min={0}
          max={1}
          step={0.1}
          valueLabelDisplay="auto"
          aria-label="Opacity"
        />
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
      <Dialog
        open={samMaskDialogOpen}
        onClose={() => setSamMaskDialogOpen(false)}
        sx={dialogStyles}
      >
        <DialogTitle sx={dialogTitleStyles}>
          <Typography variant="h6">Select SAM Mask</Typography>
          <IconButton onClick={() => setSamMaskDialogOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={dialogContentStyles}>
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
          <Button variant="contained" onClick={() => setSamMaskDialogOpen(false)}>
            Apply Selected Mask
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SelectMaskCanvas;

const ToggleInput = ({ label, value, handleToggle, valuesMap }) => {
  return (
    <TextField
      label=""
      value={valuesMap[value]?.label || ""}
      disabled
      fullWidth
      margin="normal"
      sx={{
        marginTop: "10px",
        marginBottom: "10px",
        backgroundColor: "transparent",
        input: { color: "var(--color-white)", fontWeight: "bold" },
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderColor: "transparent",
            borderWidth: "0px",
          },
          "&:hover fieldset": {
            borderColor: "transparent",
            borderWidth: "0px",
          },
          "&.Mui-focused fieldset": {
            borderColor: "transparent",
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
            <IconButton onClick={handleToggle}>{valuesMap[value]?.icon}</IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};

const ToggleButton = ({ label, value, handleToggle, valuesMap }) => {
  return (
    <Button
      variant="contained"
      onClick={handleToggle}
      sx={{ ...gradientButtonStyles, minWidth: "200px" }}
    >
      <span style={{ fontWeight: "bold" }}>{label}</span>
      <span>{valuesMap[value]?.label || ""}</span>
      <div>{valuesMap[value]?.icon}</div>
    </Button>
  );
};

// VALUES MAPS
// Selected Mask
const selectedSamMaskValuesMap = {
  null: {
    label: "None",
    icon: <ChangeCircleRoundedIcon sx={{ color: "var(--color-white)" }} />,
  },
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
  null: {
    label: "None",
    icon: <ChangeCircleRoundedIcon sx={{ color: "var(--color-white)" }} />,
  },
  0: {
    label: "Add to Mask",
    icon: <AddCircleRoundedIcon sx={{ color: "var(--color-white)" }} />,
  },
  1: {
    label: "Remove from Mask",
    icon: <RemoveCircleRoundedIcon sx={{ color: "var(--color-white)" }} />,
  },
};

// Refine Mask Option
const refineMaskOptionValuesMap = {
  null: {
    label: "Add",
    icon: <AddCircleRoundedIcon sx={{ color: "var(--color-white)" }} />,
  },
  0: {
    label: "Add first then remove",
    icon: <AddCircleRoundedIcon sx={{ color: "var(--color-white)" }} />,
  },
  1: {
    label: "Remove first then add",
    icon: <RemoveCircleRoundedIcon sx={{ color: "var(--color-white)" }} />,
  },
};

// Brush Mode
const brushModeValuesMap = {
  null: {
    label: "Draw",
    icon: <BrushRoundedIcon sx={{ color: "var(--color-white)" }} />,
  },
  0: {
    label: "Draw",
    icon: <BrushRoundedIcon sx={{ color: "var(--color-white)" }} />,
  },
  1: {
    label: "Erase",
    icon: <EraseIcon />,
  },
};

// Visibility
const visibilityValuesMap = {
  null: {
    label: "Visible",
    icon: <ViewIcon />,
  },
  0: {
    label: "Visible",
    icon: <ViewIcon />,
  },
  1: {
    label: "Hidden",
    icon: <UnviewIcon />,
  },
};
