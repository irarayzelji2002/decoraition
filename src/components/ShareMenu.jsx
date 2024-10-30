import React from "react";
import { MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ContentCopy from "@mui/icons-material/ContentCopy";
import { toast } from "react-toastify";
import { showToast } from "../functions/utils";

const ShareMenu = ({ onClose, onBackToMenu, onOpenShareModal }) => {
  // Copy Link Action
  const handleCopyLink = async () => {
    try {
      const currentLink = window.location.href; // Get the current URL
      await navigator.clipboard.writeText(currentLink);
      showToast("success", "Link copied to clipboard!");
      onClose();
    } catch (err) {
      showToast("error", "Failed to copy link.");
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <>
      <MenuItem onClick={onBackToMenu}>
        <ListItemIcon>
          <ArrowBackIosNewRoundedIcon sx={{ color: "var(--color-white)" }} />
        </ListItemIcon>
        <ListItemText primary="Share" />
      </MenuItem>
      <MenuItem onClick={onOpenShareModal}>
        <ListItemText primary="Add Collaborators" />
      </MenuItem>
      <MenuItem onClick={onClose}>
        <ListItemText primary="Manage Access" />
      </MenuItem>
      <MenuItem onClick={handleCopyLink}>
        <ListItemText primary="Copy Link" />
      </MenuItem>
    </>
  );
};

export default ShareMenu;
