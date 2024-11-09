import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { showToast } from "../functions/utils";
import { iconButtonStyles } from "../pages/Homepage/DrawerComponent";
import { gradientButtonStyles, outlinedButtonStyles } from "../pages/DesignSpace/PromptBar";
import {
  dialogStyles,
  dialogTitleStyles,
  dialogContentStyles,
  dialogActionsStyles,
} from "./RenameModal";

const DeleteConfirmationModal = ({ isOpen, onClose, handleDelete, isDesign, object }) => {
  // if isDesign is true, object is a design object, else it is a project object
  const initConfirmText = isDesign
    ? object?.designName ?? "Untitled Design"
    : object?.projectName ?? "Untitled Project";
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async () => {
    if (confirmText !== initConfirmText) {
      setError("Incorrect value entered");
      return;
    }
    const result = await handleDelete();
    if (!result.success) {
      setError(result.message);
      return;
    }
    handleClose();
  };

  const handleClose = () => {
    setError("");
    setConfirmText("");
    onClose();
    console.log("confirmText", confirmText);
  };

  return (
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
          Enter "{initConfirmText}" to confirm deletion
        </Typography>
        <TextField
          placeholder={initConfirmText}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          helperText={error}
          variant="outlined"
          fullWidth
          sx={{
            backgroundColor: "var(  --nav-card-modal)",
            input: { color: "var(--color-white)" }, //placehold color
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "var( --borderInput)",
              },
              "&:hover fieldset": {
                borderColor: "var( --borderInput)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "var(--borderInputBrighter)",
              },
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={dialogActionsStyles}>
        <Button fullWidth variant="contained" onClick={onSubmit} sx={gradientButtonStyles}>
          Delete
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

export default DeleteConfirmationModal;
