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

const CopyLinkModal = ({ isOpen, onClose }) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "var(  --nav-card-modal)", // Change this to your desired background color
          borderRadius: "20px", // Change this to your desired border radius
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "var(  --nav-card-modal)",
          color: "var(--color-white)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconButton onClick={onClose} sx={{ color: "var(--color-white)", marginRight: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        Link Copied
      </DialogTitle>
      <DialogContent sx={{ backgroundColor: "var(--nav-card-modal)", color: "var(--color-white)" }}>
        <Typography variant="body1">The link has been copied to your clipboard.</Typography>
      </DialogContent>
      <DialogActions sx={{ backgroundColor: "var(  --nav-card-modal)" }}>
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            background: "var(--gradientButton)",
            borderRadius: "20px",
            color: "var(--color-white)",
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

export default CopyLinkModal;
