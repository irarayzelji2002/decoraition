import React from "react";
import { MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const ChangeModeMenu = ({ onClose, onBackToMenu }) => {
  return (
    <>
      <MenuItem onClick={onBackToMenu}>
        <ListItemIcon>
          <ArrowBackIcon sx={{ color: "var(--color-white)" }} />
        </ListItemIcon>
        <ListItemText primary="Change Mode" />
      </MenuItem>
      <MenuItem onClick={onClose}>
        <ListItemText primary="Editing" />
      </MenuItem>
      <MenuItem onClick={onClose}>
        <ListItemText primary="Commenting" />
      </MenuItem>
      <MenuItem onClick={onClose}>
        <ListItemText primary="Viewing" />
      </MenuItem>
    </>
  );
};

export default ChangeModeMenu;
