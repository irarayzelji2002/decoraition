import React from "react";
import { MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";

const ChangeModeMenu = ({ onClose, onBackToMenu }) => {
  const handleClose = () => {
    onClose();
    //resett values
  };
  return (
    <>
      <MenuItem onClick={onBackToMenu}>
        <ListItemIcon>
          <ArrowBackIosNewRoundedIcon sx={{ color: "var(--color-white)" }} />
        </ListItemIcon>
        <ListItemText primary="Change Mode" />
      </MenuItem>
      <MenuItem onClick={handleClose}>
        <ListItemText primary="Editing" />
      </MenuItem>
      <MenuItem onClick={handleClose}>
        <ListItemText primary="Commenting" />
      </MenuItem>
      <MenuItem onClick={handleClose}>
        <ListItemText primary="Viewing" />
      </MenuItem>
    </>
  );
};

export default ChangeModeMenu;
