import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const RenameModal = ({ isOpen, onClose }) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "var(  --nav-card-modal)", // Custom background color for the dialog
          borderRadius: "20px", // Custom border radius for the dialog
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "var(  --nav-card-modal)", // Title background color
          color: "var(--color-white)", // Title text color
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Make the ArrowBackIcon clickable by wrapping it in an IconButton */}
        <IconButton onClick={onClose} sx={{ color: "var(--color-white)", marginRight: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        Rename
      </DialogTitle>
      <DialogContent
        sx={{ backgroundColor: "var(  --nav-card-modal)", color: "whitesmoke" }} // Content background color
      >
        <TextField
          label="New Name"
          variant="outlined"
          fullWidth
          sx={{
            marginBottom: "16px",
            backgroundColor: "var(  --nav-card-modal)", // Input background color
            input: { color: "whitesmoke" }, // Input text color
            "& label": { color: "whitesmoke" }, // Label color
            "& label.Mui-focused": { color: "whitesmoke" }, // Focused label color
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "whitesmoke", // Border color
              },
              "&:hover fieldset": {
                borderColor: "whitesmoke", // Hover border color
              },
              "&.Mui-focused fieldset": {
                borderColor: "whitesmoke", // Focused border color
              },
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ backgroundColor: "var(  --nav-card-modal)" }}>
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            background: "var(--gradientButton)", // Gradient background
            borderRadius: "20px", // Button border radius
            color: "var(--color-white)", // Button text color
            fontWeight: "bold",
            textTransform: "none",
            "&:hover": {
              background: "var(--gradientButtonHover)", // Reverse gradient on hover
            },
          }}
        >
          Rename
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            background: "var(--gradientButton)", // Gradient background
            borderRadius: "20px", // Button border radius
            color: "var(--color-white)", // Button text color
            fontWeight: "bold",
            textTransform: "none",
            "&:hover": {
              background: "var(--gradientButtonHover)", // Reverse gradient on hover
            },
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameModal;
