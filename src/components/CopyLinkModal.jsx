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

const CopyLinkModal = ({ isOpen, onClose }) => {
  const handleClose = () => {
    onClose();
    //resett values
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
        Link Copied
      </DialogTitle>
      <DialogContent sx={{ backgroundColor: "var(--nav-card-modal)", color: "var(--color-white)" }}>
        <Typography variant="body1">The link has been copied to your clipboard.</Typography>
      </DialogContent>
      <DialogActions sx={{ backgroundColor: "var(  --nav-card-modal)", margin: "10px" }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleClose}
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
