import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  IconButton,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Menu, styled } from "@mui/material";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import { formatDateDetailComma } from "../pages/Homepage/backend/HomepageActions";
import { fetchVersionDetails } from "../pages/DesignSpace/backend/DesignActions";
import { useSharedProps } from "../contexts/SharedPropsContext";
import { showToast } from "../functions/utils";
import Version from "../pages/DesignSpace/Version";
import { iconButtonStyles } from "../pages/Homepage/DrawerComponent";
import { gradientButtonStyles, outlinedButtonStyles } from "../pages/DesignSpace/PromptBar";
import {
  dialogStyles,
  dialogTitleStyles,
  dialogContentStyles,
  dialogActionsStyles,
} from "./RenameModal";
import { CheckboxIcon, CheckboxCheckedIcon } from "./svg/SharedIcons";
import {
  selectStyles,
  selectStylesDisabled,
  menuItemStyles,
} from "../pages/DesignSpace/DesignSettings";

const MakeCopyModal = ({ isOpen, onClose, handleCopy, design }) => {
  const { user } = useSharedProps();
  const [selectedDesignVersionId, setSelectedDesignVersionId] = useState("");
  const [selectedDesignVersionDate, setSelectedDesignVersionDate] = useState("");
  const [shareWithCollaborators, setShareWithCollaborators] = useState(false);
  const [versionDetails, setVersionDetails] = useState([]);
  const [error, setError] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleClose = () => {
    onClose();
    setSelectedDesignVersionId("");
    setSelectedDesignVersionDate("");
    setVersionDetails([]);
    setShareWithCollaborators(false);
  };

  const onSubmit = async () => {
    const result = await handleCopy(design, selectedDesignVersionId, shareWithCollaborators);
    if (!result.success) {
      if (result.message === "Select a version to copy") setError(result.message);
      else showToast("error", result.message);
      return;
    }
    showToast(
      "success",
      `Design copied${
        selectedDesignVersionDate ? ` from version on ${selectedDesignVersionDate}` : ""
      }`
    );
    handleClose();
  };

  const handleSelect = (selectedId) => {
    setSelectedDesignVersionId(selectedId);
    // Find the matching version and set its formatted date
    if (selectedId) {
      const selectedVersion = versionDetails.find((version) => version.id === selectedId);
      if (selectedVersion) {
        setSelectedDesignVersionDate(formatDateDetailComma(selectedVersion.createdAt));
      }
    } else {
      setSelectedDesignVersionDate("");
    }
  };

  useEffect(() => {
    const getVersionDetails = async () => {
      if (design?.history && design.history.length > 0) {
        const result = await fetchVersionDetails(design, user);
        if (!result.success) {
          console.error("Error:", result.message);
          setSelectedDesignVersionId("");
          setVersionDetails([]);
          return;
        }
        let versionDetails = result.versionDetails;
        versionDetails = versionDetails.reverse();
        setVersionDetails(versionDetails);
        const latestVersion = versionDetails[0];
        if (latestVersion) {
          setSelectedDesignVersionId(latestVersion.id);
          setSelectedDesignVersionDate(formatDateDetailComma(latestVersion.createdAt));
        }
      }
    };

    getVersionDetails();
  }, [design, user]);

  return (
    <>
      <Version
        isDrawerOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        design={design}
        isHistory={false}
        handleSelect={handleSelect}
        title="Select a version to copy"
      />
      <Dialog open={isOpen} onClose={handleClose} sx={dialogStyles}>
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
            Make a copy
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
            Select a version to copy
            <IconButton onClick={() => setIsHistoryOpen(true)}>
              <OpenInFullRoundedIcon
                sx={{ color: "var(--color-white)", fontSize: "1.2rem", marginLeft: "20px" }}
              />
            </IconButton>
          </Typography>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <FormControl sx={formControlStyles}>
              <Select
                labelId="date-modified-select-label"
                id="date-modified-select"
                value={selectedDesignVersionId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  handleSelect(selectedId);
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      borderRadius: "10px",
                      "& .MuiMenu-list": {
                        padding: 0,
                      },
                    },
                  },
                }}
                IconComponent={(props) => (
                  <KeyboardArrowDownRoundedIcon sx={{ color: "var(--color-white) !important" }} />
                )}
                sx={selectStyles}
              >
                {/* <MenuItem value="" sx={menuItemStyles}>
                <em>None</em>
              </MenuItem>
              <MenuItem sx={menuItemStyles} value="versionId">
                <ListItemIcon>
                  <div className="select-image-preview">
                    <img src="" alt="" />
                  </div>
                </ListItemIcon>
                <Typography variant="inherit">December 25, 2021, 12:00 PM</Typography>
              </MenuItem> */}
                {versionDetails.map((version) => (
                  <MenuItem key={version.id} sx={menuItemStyles} value={version.id}>
                    <div className="select-image-preview">
                      <img src={version.imagesLink[0]} alt="" />
                    </div>
                    <Typography variant="inherit">
                      {formatDateDetailComma(version.createdAt)}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
              {error && <div className="error-text">{error}</div>}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={shareWithCollaborators}
                    onChange={(e) => setShareWithCollaborators(e.target.checked)}
                    sx={{
                      color: "var(--color-white)",
                      "&.Mui-checked": {
                        color: "var(--brightFont)",
                      },
                      borderRadius: "50%",
                      "& .MuiSvgIcon-root": {
                        fontSize: 28,
                      },
                      "&:hover": {
                        backgroundColor: "var(--iconButtonHover)",
                      },
                      "&:active": {
                        backgroundColor: "var(--iconButtonActive)",
                      },
                    }}
                    icon={<CheckboxIcon />}
                    checkedIcon={<CheckboxCheckedIcon />}
                  />
                }
                label="Share with collaborators"
                sx={{
                  color: "var(--color-white)",
                  "& .MuiTypography-root": {
                    marginLeft: "3px",
                  },
                }}
              />
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions sx={dialogActionsStyles}>
          {/* Make Copy Button */}
          <Button fullWidth variant="contained" onClick={onSubmit} sx={gradientButtonStyles}>
            Make a copy
          </Button>

          {/* Cancel Button */}
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
    </>
  );
};

export default MakeCopyModal;

const StyledMenu = styled(Menu)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "var(--nav-card-modal)",
    color: "var(--color-white)",
    borderRadius: "12px",
    padding: 0,
    margin: 0,
    border: "none",
    overflow: "hidden",
  },
  "& .MuiList-root": {
    padding: 0,
  },
  "& .MuiMenuItem-root": {
    "&.Mui-selected": {
      backgroundColor: "transparent", // Custom background color for selected item
      "&:hover": {
        backgroundColor: "transparent", // Custom hover color for selected item
      },
    },
    "&:focus": {
      outline: "none",
      boxShadow: "none", // Remove blue outline effect
    },
  },
}));

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
