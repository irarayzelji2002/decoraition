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

const DeleteConfirmationModal = ({ isOpen, onClose, onDelete }) => {
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
          color: "var(--color-white)", // Set title text color to white
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ color: "var(--color-white)", marginRight: 1 }} // Set icon color to white
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ color: "var(--color-white)" }}>
          {" "}
          Confirm Delete
        </Typography>
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: "var(  --nav-card-modal)", // Content background color
          color: "var(--color-white)", // Text color in the content
        }}
      >
        <Typography variant="body1">
          Are you sure you want to delete this item?
          <br />
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions
        sx={{ backgroundColor: "var(--nav-card-modal)", margin: "10px" }} // Actions background color
      >
        <Button
          fullWidth
          variant="contained"
          onClick={onDelete}
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
          onClick={onClose}
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
