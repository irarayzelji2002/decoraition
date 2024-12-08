import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  TextField,
  Box,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { styled } from "@mui/material";
import { useSharedProps } from "../contexts/SharedPropsContext";
import { showToast } from "../functions/utils";
import { iconButtonStyles } from "../pages/Homepage/DrawerComponent";
import { gradientButtonStyles, outlinedButtonStyles } from "../pages/DesignSpace/PromptBar";
import {
  dialogStyles,
  dialogTitleStyles,
  dialogContentStyles,
  dialogActionsStyles,
} from "./RenameModal";
import {
  HelpOutline,
  KeyboardArrowDownRounded as KeyboardArrowDownRoundedIcon,
} from "@mui/icons-material";
import { getDesignImage } from "../pages/DesignSpace/backend/DesignActions";
import { CustomMenuItem } from "../pages/DesignSpace/CommentContainer";
import { formatDateLong } from "../pages/Homepage/backend/HomepageActions";
import { priceTextFieldStyles } from "../pages/DesignSpace/AddItem";
import { importDesignToProject } from "../pages/ProjectSpace/backend/ProjectDetails";
import {
  menuItemStyles,
  textFieldInputProps,
  textFieldStyles,
} from "../pages/DesignSpace/DesignSettings";
import { DescriptionTooltip } from "./CustomTooltip";
import TooltipWithClickAway from "./TooltipWithClickAway";

const ImportDesignModal = ({ open, onClose, project }) => {
  const { user, userDoc, users, designs, userDesigns, designVersions, userDesignVersions } =
    useSharedProps();
  const [inputValue, setInputValue] = useState("");
  const [originalDesignOptions, setOriginalDesignOptions] = useState([]);
  const [designOptions, setDesignOptions] = useState([]);

  const [selectedDesignId, setSelectedDesignId] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [designOptionClicked, setDesignOptionClicked] = useState(null);
  const [openDesignOptions, setOpenDesignOptions] = useState(false);
  const [error, setError] = useState("");
  const [isImportBtnDisabled, setIsImportBtnDisabled] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [infoTooltipClickLocked, setInfoTooltipClickLocked] = useState(false);

  const selectDesignRef = useRef(null);

  // Modify handleInputChange
  const handleInputChange = (event) => {
    const value = event.target.value;
    setInputValue(value);
    if (value.trim()) {
      filterDesignOptions(value);
      setOpenDesignOptions(true);
    } else {
      setDesignOptions(originalDesignOptions);
      setOpenDesignOptions(false);
    }
  };

  useEffect(() => {
    setOriginalDesignOptions(userDesigns);
    setDesignOptions(userDesigns);
  }, [userDesigns]);

  const calculateMatchScore = (design, searchText) => {
    const search = searchText.toLowerCase();

    const designName = design?.designName.toLowerCase();
    const ownerUser = users.find((user) => user.id === design.owner);
    const ownerUsername = ownerUser?.username.toLowerCase();
    const ownerFirstName = ownerUser?.firstName.toLowerCase();
    const ownerLastName = ownerUser?.lastName.toLowerCase();
    const ownerFullname = `${ownerFirstName} ${ownerLastName}`;
    const ownerEmail = ownerUser?.email.toLowerCase();
    const createdAt = formatDateLong(design.createdAt).toLowerCase();
    const modifiedAt = formatDateLong(design.createdAt).toLowerCase();

    // Exact matches get highest priority
    if (designName === search) return 100;
    if (designName.startsWith(search)) return 95;
    if (designName?.includes(search)) return 90;

    if (modifiedAt === search) return 85;
    if (createdAt === search) return 80;
    if (ownerUsername === search) return 75;
    if (ownerFullname === search) return 70;
    if (ownerFirstName === search) return 65;
    if (ownerLastName === search) return 60;
    if (ownerEmail === search) return 58;

    if (modifiedAt.startsWith(search)) return 55;
    if (createdAt.startsWith(search)) return 50;
    if (ownerUsername.startsWith(search)) return 45;
    if (ownerFullname.startsWith(search)) return 40;
    if (ownerFirstName.startsWith(search)) return 35;
    if (ownerLastName.startsWith(search)) return 30;
    if (ownerEmail.startsWith(search)) return 28;

    if (modifiedAt?.includes(search)) return 25;
    if (createdAt?.includes(search)) return 20;
    if (ownerUsername?.includes(search)) return 15;
    if (ownerFullname?.includes(search)) return 10;
    if (ownerFirstName?.includes(search)) return 5;
    if (ownerLastName?.includes(search)) return 3;
    if (ownerEmail?.includes(search)) return 2;

    return 0;
  };

  const filterDesignOptions = (input) => {
    console.log("input", input);
    if (input?.trim()) {
      const filtered = originalDesignOptions
        // First filter out designs that are already in project or selected
        .filter(
          (design) =>
            !project?.designs?.includes(design.id) && // not in project
            design.id !== selectedDesignId // not currently selected
        )
        .map((design) => ({
          ...design,
          score: calculateMatchScore(design, input.trim()),
        }))
        .filter((design) => design.score > 0)
        .sort((a, b) => b.score - a.score);
      setDesignOptions(filtered);
      setOpenDesignOptions(filtered.length > 0);
    } else {
      // When no input, show all designs except those in project and selected
      const filtered = originalDesignOptions.filter(
        (design) => !project?.designs?.includes(design.id) && design.id !== selectedDesignId
      );
      setDesignOptions(filtered);
      setOpenDesignOptions(false);
    }
  };

  const handleKeyDown = (event) => {
    // Handle arrow keys for navigation
    if (openDesignOptions && designOptions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev < designOptions.length - 1 ? prev + 1 : prev));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }
    }

    if (event.key === "Enter") {
      event.preventDefault();
      // If there are filtered options, set selected design if there's a selection, otherwise use first option
      if (openDesignOptions && designOptions.length > 0) {
        const selectedDesign = selectedIndex >= 0 ? designOptions[selectedIndex] : designOptions[0];
        setSelectedDesignId(selectedDesign.id);
        setSelectedIndex(-1);
        setOpenDesignOptions(false);
        setInputValue("");
        return;
      }
    } else {
      filterDesignOptions(inputValue);
    }

    if (error) setError("");
  };

  const handleClose = () => {
    onClose();
    setSelectedDesignId("");
    setError("");
  };

  const handleImportDesign = async () => {
    if (!selectedDesignId) {
      setError("Please select a design to import");
      return;
    }
    // Check if design is already in project
    if (project?.designs?.includes(selectedDesignId)) {
      setError("This design is already in the project");
      return;
    }
    setIsImportBtnDisabled(true);
    try {
      const result = await importDesignToProject(project.id, selectedDesignId, user, userDoc);
      if (!result.success) {
        showToast("error", result.message);
        return;
      }
      showToast("success", "Design imported successfully");
      setSelectedDesignId("");
      handleClose();
    } finally {
      setIsImportBtnDisabled(false);
    }
  };

  useEffect(() => {
    console.log("clicked design:", designOptionClicked);
    if (designOptionClicked) {
      setSelectedDesignId(designOptionClicked.id);
      setSelectedIndex(-1);
      setOpenDesignOptions(false);
      setInputValue("");
    }
  }, [designOptionClicked]);

  return (
    <Dialog open={open} onClose={handleClose} sx={dialogStyles}>
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
          Import a design
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
      <DialogContent
        sx={{
          ...dialogContentStyles,
          minHeight: "300px",
          justifyContent: "start",
        }}
      >
        <Typography variant="body1" sx={{ margin: "3px 0px 7px 0px" }}>
          Select a design to import
          <TooltipWithClickAway
            open={showInfoTooltip}
            setOpen={setShowInfoTooltip}
            tooltipClickLocked={infoTooltipClickLocked}
            setTooltipClickLocked={setInfoTooltipClickLocked}
            title={
              <DescriptionTooltip description="Search a design by typing in the searchbox below, then select from the options. You can type a design name, modified date, created date or owner's details." />
            }
            className="helpTooltip inPromptBar"
          >
            <HelpOutline sx={{ color: "var(--iconDark)", transform: "scale(0.9)" }} />
          </TooltipWithClickAway>
        </Typography>
        <div style={{ display: "flex", justifyContent: "center", flexDirection: "column" }}>
          <TextField // Input field at the top
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search a design"
            sx={{ ...textFieldStyles, width: "100%" }}
            InputProps={textFieldInputProps}
            inputProps={{ maxLength: 100 }}
          />
          {error && <div className="error-text">{error}</div>}
          <div style={{ position: "relative", width: "100%" }}>
            {openDesignOptions && designOptions.length > 0 && (
              <Paper
                ref={selectDesignRef}
                sx={{
                  position: "absolute",
                  zIndex: 1000,
                  maxHeight: "200px",
                  overflow: "auto",
                  width: "100%",
                  backgroundColor: "var(--iconBg)",
                  boxShadow: "-4px 4px 10px rgba(0, 0, 0, 0.2)",
                  borderRadius: "10px",
                }}
              >
                {designOptions.slice(0, 10).map((design, index) => (
                  <CustomMenuItem
                    key={design.id}
                    onClick={() => setDesignOptionClicked(design)}
                    selected={index === selectedIndex}
                    sx={{ ...menuItemStyles }}
                  >
                    <DesignInfoTooltip
                      design={design}
                      designs={designs}
                      userDesigns={userDesigns}
                      designVersions={designVersions}
                      userDesignVersions={userDesignVersions}
                      users={users}
                    />
                  </CustomMenuItem>
                ))}
              </Paper>
            )}
          </div>
          {selectedDesignId &&
            (() => {
              const selectedDesign = originalDesignOptions.find(
                (design) => design.id === selectedDesignId
              );

              if (!selectedDesign) {
                return (
                  <div style={{ marginTop: "20px" }}>
                    <Typography variant="body1" sx={{ marginBottom: "10px", fontWeight: "bold" }}>
                      Selected design
                    </Typography>
                    <Typography variant="body2" sx={{ color: "var(--color-quaternary)" }}>
                      Design not found. Please select another design.
                    </Typography>
                  </div>
                );
              }

              return (
                <div style={{ marginTop: "20px" }}>
                  <Typography variant="body1" sx={{ marginBottom: "10px", fontWeight: "bold" }}>
                    Selected design
                  </Typography>
                  <DesignInfoBox
                    design={selectedDesign}
                    designs={designs}
                    userDesigns={userDesigns}
                    userDesignVersions={userDesignVersions}
                    designVersions={designVersions}
                    users={users}
                  />
                </div>
              );
            })()}
        </div>
      </DialogContent>
      <DialogActions sx={dialogActionsStyles}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleImportDesign}
          sx={{
            ...gradientButtonStyles,
            opacity: isImportBtnDisabled ? "0.5" : "1",
            cursor: isImportBtnDisabled ? "default" : "pointer",
            "&:hover": {
              backgroundImage: !isImportBtnDisabled && "var(--gradientButtonHover)",
            },
          }}
          disabled={isImportBtnDisabled}
        >
          Import design
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

export default ImportDesignModal;

const formControlStyles = {
  width: "100%",
  backgroundColor: "var(--nav-card-modal)",
  color: "var(--color-white)",
  borderRadius: "8px",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "var( --borderInput)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--bright-grey) !important",
  },
  "& .MuiSvgIcon-root": {
    color: "var(--color-white)", // Set the arrow color to white
  },
};

export const DesignInfoTooltip = ({
  design,
  designs,
  userDesigns,
  designVersions,
  userDesignVersions,
  users,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: "5px",
    }}
  >
    <Box sx={{ wdith: "45px", height: "45px", marginRight: "20px" }}>
      <div className="select-image-preview" style={{ margin: "0" }}>
        <img
          src={
            getDesignImage(
              design.id,
              designs,
              userDesigns,
              designVersions,
              userDesignVersions,
              0
            ) || "/img/transparent-image.png"
          }
          alt=""
        />
      </div>
    </Box>
    <Box sx={{ flexGrow: "1", minWidth: 0 }}>
      <Typography
        sx={{
          color: "var(--color-white)",
          fontSize: "0.875rem",
          fontWeight: "bold",
          wordBreak: "break-all",
          overflow: "visible",
        }}
      >
        {design?.designName || "Untitled Design"}
      </Typography>
      <Typography
        sx={{
          color: "var(--color-white)",
          fontSize: "0.7rem",
          wordBreak: "break-all",
          overflow: "visible",
        }}
      >
        {users.find((user) => user.id === design.owner)?.username || "Unknown User"}
      </Typography>
      <Typography
        sx={{
          color: "var(--color-white)",
          fontSize: "0.7rem",
          wordBreak: "break-all",
          overflow: "visible",
        }}
      >
        {`Modified: ${formatDateLong(design.modifiedAt)}`}
      </Typography>
      <Typography
        sx={{
          color: "var(--color-white)",
          fontSize: "0.7rem",
          wordBreak: "break-all",
          overflow: "visible",
        }}
      >
        {`Created: ${formatDateLong(design.createdAt)}`}
      </Typography>
    </Box>
  </Box>
);

export const DesignInfoBox = ({
  design,
  designs,
  userDesigns,
  designVersions,
  userDesignVersions,
  users,
  className = "",
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0",
    }}
    className={className}
  >
    <Box sx={{ marginRight: "20px" }}>
      <div className="select-image-preview" style={{ margin: "0", width: "63px", height: "63px" }}>
        <img
          src={
            getDesignImage(
              design.id,
              designs,
              userDesigns,
              designVersions,
              userDesignVersions,
              0
            ) || "/img/transparent-image.png"
          }
          alt=""
        />
      </div>
    </Box>
    <Box sx={{ flexGrow: "1", minWidth: 0 }}>
      <Typography
        sx={{
          color: "var(--color-white)",
          fontSize: "0.875rem",
          fontWeight: "bold",
          wordBreak: "break-all",
          overflow: "visible",
        }}
      >
        {design?.designName || "Untitled Design"}
      </Typography>
      <Typography
        sx={{
          color: "var(--color-white)",
          fontSize: "0.7rem",
          wordBreak: "break-all",
          overflow: "visible",
        }}
      >
        {users.find((user) => user.id === design.owner)?.username || "Unknown User"}
      </Typography>
      <Typography
        sx={{
          color: "var(--color-white)",
          fontSize: "0.7rem",
          wordBreak: "break-all",
          overflow: "visible",
        }}
      >
        {`Modified: ${formatDateLong(design.modifiedAt)}`}
      </Typography>
      <Typography
        sx={{
          color: "var(--color-white)",
          fontSize: "0.7rem",
          wordBreak: "break-all",
          overflow: "visible",
        }}
      >
        {`Created: ${formatDateLong(design.createdAt)}`}
      </Typography>
    </Box>
  </Box>
);
