import React from "react";
import { Dialog, DialogTitle, DialogContent, Typography, Button, IconButton } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const ShareConfirmationModal = ({ isOpen, onClose, collaborators }) => {
  const handleClose = () => {
    onClose();
    //resett values
  };

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle
        sx={{
          backgroundColor: "var(--nav-card-modal)",
          color: "var(--color-white)",
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
        Share Success
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: "var(--nav-card-modal)",
          color: "var(--color-white)",
        }}
      >
        <Typography variant="body1" sx={{ marginBottom: "16px" }}>
          The following people have been added as collaborators:
        </Typography>
        <ul>
          {collaborators.map((collaborator, index) => (
            <li key={index}>{collaborator}</li>
          ))}
        </ul>
        <Button fullWidth variant="contained" color="primary" onClick={handleClose}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ShareConfirmationModal;
