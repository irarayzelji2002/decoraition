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
    <Dialog
      open={isOpen}
      onClose={handleClose}
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "var(--nav-card-modal)",
          borderRadius: "20px",
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "var(--nav-card-modal)",
          color: "var(--color-white)",
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--inputBg)",
          fontWeight: "bold",
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            color: "var(--color-white)",
            position: "absolute",
            right: 8,
            top: 8,
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
        <Typography variant="h6" sx={{ color: "var(--color-white)" }}>
          Delete
        </Typography>
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: "var(  --nav-card-modal)", // Content background color
          color: "var(--color-white)", // Text color in the content
          marginTop: "20px",
        }}
      >
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
                borderColor: "var(--brightFont)",
              },
            },
          }}
        />
      </DialogContent>
      <DialogActions
        sx={{ backgroundColor: "var(--nav-card-modal)", margin: "10px" }} // Actions background color
      >
        <Button
          fullWidth
          variant="contained"
          onClick={onSubmit}
          sx={{
            background: "var(--gradientButton)",
            borderRadius: "20px",
            color: "var(--color-white)", // Button text color
            fontWeight: "bold",
            textTransform: "none",
            "&:hover": {
              background: "var(--gradientButtonHover)",
            },
          }}
        >
          Delete
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={handleClose}
          sx={{
            color: "var(--color-white)",
            background: "transparent",
            border: "2px solid transparent",
            borderRadius: "20px",
            backgroundImage: "var(--lightGradient), var(--gradientButton)",
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
            fontWeight: "bold",
            textTransform: "none",
          }}
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
