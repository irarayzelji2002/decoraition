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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const RestoreModal = ({ isOpen, onClose }) => {
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
        <IconButton onClick={onClose} sx={{ color: "var(--color-white)", marginRight: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        Restore
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: "var(  --nav-card-modal)",
          color: "var(--color-white)",
        }}
      >
        <Typography variant="body1">Are you sure you want to restore this item?</Typography>
      </DialogContent>
      <DialogActions sx={{ backgroundColor: "var(  --nav-card-modal)" }}>
        {/* Restore Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            background: "var(--gradientButton )", // Gradient background
            borderRadius: "20px", // Button border radius
            color: "var(--color-white)", // Button text color
            fontWeight: "bold",
            textTransform: "none",
            "&:hover": {
              background: "var(--gradientButtonHover)", // Reverse gradient on hover
            },
          }}
        >
          Restore
        </Button>

        {/* Cancel Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            background: "transparent",
            border: "2px solid transparent",
            borderRadius: "20px",
            backgroundImage: "var(--lightGradient), var(--gradientButton)",
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
            fontWeight: "bold",
            textTransform: "none",
            color: "var(--color-white)",
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

export default RestoreModal;
