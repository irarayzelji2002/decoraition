import React, { useState } from "react";
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

const ImportDesignModal = ({
  open,
  onClose,
  userDesignsWithoutProject,
  selectedDesignId,
  setSelectedDesignId,
  handleConfirmImport,
}) => {
  const { user } = useSharedProps();
  const [error, setError] = useState("");

  const handleClose = () => {
    onClose();
    setSelectedDesignId("");
    setError("");
  };

  const onSubmit = async () => {
    if (!selectedDesignId) {
      setError("Please select a design to import");
      return;
    }
    const result = await handleConfirmImport(selectedDesignId);
    if (!result.success) {
      showToast("error", result.message);
      return;
    }
    showToast("success", "Design imported successfully");
    handleClose();
  };

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
          Import a Design
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
          Select a design to import
        </Typography>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <FormControl sx={formControlStyles}>
            <Select
              labelId="select-design-label"
              id="select-design"
              value={selectedDesignId}
              onChange={(e) => setSelectedDesignId(e.target.value)}
              sx={{
                color: "var(--color-white)",
                "&.Mui-checked": {
                  color: "var(--color-white)",
                },

                "&:hover": {
                  backgroundColor: "var(--iconButtonHover)",
                },
                "&:active": {
                  backgroundColor: "var(--iconButtonActive)",
                },
              }}
            >
              {userDesignsWithoutProject.map((design) => (
                <MenuItem key={design.id} value={design.id} sx={menuItemStyles}>
                  {design.designName}
                </MenuItem>
              ))}
            </Select>
            {error && <div className="error-text">{error}</div>}
          </FormControl>
        </div>
      </DialogContent>
      <DialogActions sx={dialogActionsStyles}>
        <Button fullWidth variant="contained" onClick={onSubmit} sx={gradientButtonStyles}>
          Confirm
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

const selectStyles = {
  // ...existing code...
};

const menuItemStyles = {
  color: "var(--color-white)",
};
