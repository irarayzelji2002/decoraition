import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { MenuItem, ListItemIcon, ListItemText, styled } from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";

const CustomMenuItem = styled(MenuItem)({
  minHeight: "2.6rem !important",
});

const ChangeModeMenu = ({
  onClose,
  onBackToMenu,
  role = 0,
  changeMode,
  setChangeMode = () => {},
}) => {
  const location = useLocation();
  const isDesignPath = location.pathname.startsWith("/design");

  const handleClose = (mode) => {
    if (changeMode !== mode) setChangeMode(mode);
    onClose();
  };
  return (
    <>
      <CustomMenuItem
        onClick={onBackToMenu}
        sx={{ borderBottom: "1px solid var(--inputBg)", fontWeight: "bold" }}
      >
        <ListItemIcon>
          <ArrowBackIosNewRoundedIcon sx={{ color: "var(--color-white)" }} />
        </ListItemIcon>
        <ListItemText primary="Change Mode" />
      </CustomMenuItem>
      {(role === 1 || role === 3) && ( // editor/owner
        <CustomMenuItem onClick={() => handleClose("Editing")}>
          <ListItemText primary="Editing" />
        </CustomMenuItem>
      )}
      {(role === 1 || role === 2 || role === 3) && isDesignPath && (
        // editor/commenter/owner
        <CustomMenuItem onClick={() => handleClose("Commenting")}>
          <ListItemText primary="Commenting" />
        </CustomMenuItem>
      )}
      {(role === 0 || role === 1 || role === 2 || role === 3) && ( // viewer/editor/commenter/owner
        <CustomMenuItem onClick={() => handleClose("Viewing")}>
          <ListItemText primary="Viewing" />
        </CustomMenuItem>
      )}
    </>
  );
};

export default ChangeModeMenu;
