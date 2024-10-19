import React from "react";
import { MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopy from "@mui/icons-material/ContentCopy";
import { toast } from "react-toastify";
import { showToast } from "../functions/utils";

const ShareMenu = ({ onClose, onBackToMenu, onOpenShareModal }) => {
  const handleCopyLink = () => {
    const currentLink = window.location.href; // Get the current URL
    navigator.clipboard
      .writeText(currentLink)
      .then(() => {
        toast.success("Link copied to clipboard!", {
          className: "custom-toast-success", // Apply custom success class
        }); // Show toast notification
      })
      .catch((err) => {
        toast.error("Failed to copy link.", {
          className: "custom-toast-success", // Apply custom success class
        }); // Show error toast notification
        console.error("Failed to copy: ", err);
      });
    onClose(); // Close the menu after copying the link
  };

  return (
    <>
      <MenuItem onClick={onBackToMenu}>
        <ListItemIcon>
          <ArrowBackIcon sx={{ color: "var(--color-white)" }} />
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
        <ListItemIcon>
          <ContentCopy sx={{ color: "var(--color-white)" }} />
        </ListItemIcon>
        <ListItemText primary="Copy Link" />
      </MenuItem>
    </>
  );
};

export default ShareMenu;
