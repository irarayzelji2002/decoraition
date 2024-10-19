import React from "react";
import { Dialog, DialogTitle, DialogContent, Typography, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const ShareConfirmationModal = ({ isOpen, onClose, collaborators }) => {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle
        sx={{
          backgroundColor: "var(--nav-card-modal)",
          color: "var(--color-white)",
        }}
      >
        <ArrowBackIcon sx={{ color: "var(--color-white)" }} />
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
        <Button fullWidth variant="contained" color="primary" onClick={onClose}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ShareConfirmationModal;
