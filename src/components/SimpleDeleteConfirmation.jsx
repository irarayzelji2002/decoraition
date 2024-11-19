import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  IconButton,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { iconButtonStyles } from "../pages/Homepage/DrawerComponent";
import {
  dialogStyles,
  dialogTitleStyles,
  dialogContentStyles,
  dialogActionsStyles,
} from "./RenameModal";
import { gradientButtonStyles, outlinedButtonStyles } from "../pages/DesignSpace/PromptBar";

const SimpleDeleteConfirmation = ({ open, handleClose, handleDelete }) => {
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
          Delete
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
          Are you sure you want to delete this item?
        </Typography>
      </DialogContent>
      <DialogActions sx={dialogActionsStyles}>
        <Button fullWidth onClick={handleClose} sx={outlinedButtonStyles}>
          Cancel
        </Button>
        <Button fullWidth onClick={handleDelete} sx={gradientButtonStyles}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SimpleDeleteConfirmation;
