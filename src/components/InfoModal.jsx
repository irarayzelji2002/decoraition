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

const InfoModal = ({ isOpen, onClose }) => {
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
          color: "whitesmoke", // Set title text color to white
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ color: "whitesmoke", marginRight: 1 }} // Set icon color to white
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ color: "whitesmoke" }}>
          {" "}
          {/* Set info text color to white */}
          Info
        </Typography>
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: "var(  --nav-card-modal)", // Content background color
          color: "var(--color-white)", // Text color in the content
        }}
      >
        <div className="image-frame">
          <img src={"../../img/logoWhitebg.png"} alt="design preview" className="image-preview" />
        </div>
        <Typography variant="body1">Here is some information about the item.</Typography>
      </DialogContent>
      <DialogActions
        sx={{ backgroundColor: "var(  --nav-card-modal)", margin: "10px" }} // Actions background color
      >
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
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
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InfoModal;
