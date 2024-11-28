import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { MenuItem, ListItemIcon, ListItemText, styled } from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import { CheckIcon } from "../pages/DesignSpace/svg/AddColor";

const CustomMenuItem = styled(MenuItem)({
  minHeight: "2.6rem !important",
  "&:hover": {
    backgroundColor: "var(--iconBg)",
  },
  "&:focus": {
    backgroundColor: "var(--iconBg)",
  },
});

const ChangeModeMenu = ({
  onClose,
  onBackToMenu,
  role = 0,
  changeMode,
  setChangeMode = () => {},
  isDesign = false,
}) => {
  const location = useLocation();
  const isDesignPath = location.pathname.startsWith("/design");

  // In ChangeModeMenu.jsx
  const handleClose = (mode) => {
    if (mode !== changeMode) {
      console.log("Changing mode to:", mode);
      setChangeMode(mode);
      setTimeout(() => {
        onClose();
      }, 0);
    } else {
      onClose();
    }
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
      {isDesign ? (
        <>
          {(role === 1 || role === 3) && ( // editor/owner
            <CustomMenuItem onClick={() => handleClose("Editing")}>
              <ListItemText primary="Editing" sx={listItemTextStyles} />
              {changeMode === "Editing" && (
                <ListItemIcon sx={listItemIconEndStyles}>
                  <CheckIcon />
                </ListItemIcon>
              )}
            </CustomMenuItem>
          )}
          {(role === 1 || role === 2 || role === 3) && isDesignPath && (
            // editor/commenter/owner
            <CustomMenuItem onClick={() => handleClose("Commenting")}>
              <ListItemText primary="Commenting" sx={listItemTextStyles} />
              {changeMode === "Commenting" && (
                <ListItemIcon sx={listItemIconEndStyles}>
                  <CheckIcon />
                </ListItemIcon>
              )}
            </CustomMenuItem>
          )}
          {(role === 0 || role === 1 || role === 2 || role === 3) && ( // viewer/editor/commenter/owner
            <CustomMenuItem onClick={() => handleClose("Viewing")}>
              <ListItemText primary="Viewing" sx={listItemTextStyles} />
              {changeMode === "Viewing" && (
                <ListItemIcon sx={listItemIconEndStyles}>
                  <CheckIcon />
                </ListItemIcon>
              )}
            </CustomMenuItem>
          )}
        </>
      ) : (
        <>
          {role === 3 && ( // manager
            <CustomMenuItem onClick={() => handleClose("Managing")}>
              <ListItemText primary="Managing" sx={listItemTextStyles} />
              {changeMode === "Managing" && (
                <ListItemIcon sx={listItemIconEndStyles}>
                  <CheckIcon />
                </ListItemIcon>
              )}
            </CustomMenuItem>
          )}
          {(role === 2 || role === 3) && (
            // content manager/manager
            <CustomMenuItem onClick={() => handleClose("Managing Content")}>
              <ListItemText primary="Managing Content" sx={listItemTextStyles} />
              {changeMode === "Managing Content" && (
                <ListItemIcon sx={listItemIconEndStyles}>
                  <CheckIcon />
                </ListItemIcon>
              )}
            </CustomMenuItem>
          )}
          {(role === 1 || role === 2 || role === 3) && (
            // contributor/content manager/manager
            <CustomMenuItem onClick={() => handleClose("Contributing")}>
              <ListItemText primary="Contributing" sx={listItemTextStyles} />
              {changeMode === "Contributing" && (
                <ListItemIcon sx={listItemIconEndStyles}>
                  <CheckIcon />
                </ListItemIcon>
              )}
            </CustomMenuItem>
          )}
          {(role === 0 || role === 1 || role === 2 || role === 3) && (
            // viewer/contributor/content manager/manager
            <CustomMenuItem onClick={() => handleClose("Viewing")}>
              <ListItemText primary="Viewing" sx={listItemTextStyles} />
              {changeMode === "Viewing" && (
                <ListItemIcon sx={listItemIconEndStyles}>
                  <CheckIcon />
                </ListItemIcon>
              )}
            </CustomMenuItem>
          )}
        </>
      )}
    </>
  );
};

export default ChangeModeMenu;

export const listItemIconEndStyles = {
  display: "flex",
  flexShrink: "1",
  marginLeft: "10px",
  minWidth: "18px !important",
};

export const listItemTextStyles = { display: "flex", flexGrow: "1" };
