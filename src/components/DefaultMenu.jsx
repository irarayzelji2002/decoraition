import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MenuItem, ListItemIcon, ListItemText, styled } from "@mui/material";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import {
  CommentIcon,
  ShareIcon,
  CopyLinkIcon,
  HistoryIcon,
  SettingsIcon,
  ViewIcon,
  EditIcon,
  DownloadIcon,
  MakeACopyIcon,
  RestoreIcon,
  RenameIcon,
  DeleteIcon,
  DetailsIcon,
} from "./svg/DefaultMenuIcons";

const CustomMenuItem = styled(MenuItem)({
  minHeight: "2.6rem !important",
  "&:hover": {
    backgroundColor: "var(--iconBg)",
  },
  "&:focus": {
    backgroundColor: "var(--iconBg)",
  },
});

const DefaultMenu = ({
  isDesign,
  onComment,
  onCopyLink,
  onOpenDownloadModal,
  onOpenShareModal,
  onOpenRenameModal,
  onOpenRestoreModal,
  onOpenMakeCopyModal,
  onOpenInfoModal,
  onDelete,
  setIsSidebarOpen,
  onChangeMode,
  changeMode = "Viewing",
  onSetting,
  designSettingsVisibility = {
    isDownloadVisible: false,
    isHistoryVisible: false,
    isMakeCopyVisible: false,
    isRestoreVisible: false,
    isRenameVisible: false,
    isDeleteVisible: false,
    isChangeModeVisible: false,
  },
  projectSettingsVisibility = {
    isDownloadVisible: false,
    isRenameVisible: false,
    isDeleteVisible: false,
  },
  isSelectingMask = false,
}) => {
  const location = useLocation();
  const [isInDesign, setIsInDesign] = useState(false);
  const [changeModeIcon, setChangeModeIcon] = useState(null);

  useEffect(() => {
    if (location.pathname.startsWith("/design")) {
      setIsInDesign(true);
    }
  }, []);

  useEffect(() => {
    if (changeMode === "Editing") {
      setChangeModeIcon(<EditIcon sx={{ color: "var(--color-white)" }} />);
    } else if (changeMode === "Commenting") {
      setChangeModeIcon(<CommentIcon sx={{ color: "var(--color-white)" }} />);
    } else if (changeMode === "Viewing") {
      setChangeModeIcon(<ViewIcon sx={{ color: "var(--color-white)" }} />);
    }
  }, [changeMode]);
  return (
    <>
      {isDesign && !isSelectingMask && isInDesign && (
        <CustomMenuItem onClick={onComment}>
          <ListItemIcon>
            <CommentIcon sx={{ color: "var(--color-white)" }} />
          </ListItemIcon>
          <ListItemText primary="Comment" sx={{ color: "var(--color-white)" }} />
        </CustomMenuItem>
      )}
      <CustomMenuItem onClick={onOpenShareModal} sx={{ paddingRight: "10px" }}>
        <ListItemIcon>
          <ShareIcon sx={{ color: "var(--color-white)" }} />
        </ListItemIcon>
        <ListItemText primary="Share" sx={{ color: "var(--color-white)" }} />
        <KeyboardArrowRightRoundedIcon sx={{ color: "var(--color-white)", ml: "auto" }} />
      </CustomMenuItem>
      <CustomMenuItem onClick={onCopyLink}>
        <ListItemIcon>
          <CopyLinkIcon sx={{ color: "var(--color-white)" }} />
        </ListItemIcon>
        <ListItemText primary="Copy Link" sx={{ color: "var(--color-white)" }} />
      </CustomMenuItem>
      {isDesign && designSettingsVisibility.isHistoryVisible && (
        <CustomMenuItem onClick={setIsSidebarOpen}>
          <ListItemIcon>
            <HistoryIcon sx={{ color: "var(--color-white)" }} />
          </ListItemIcon>
          <ListItemText primary="History" sx={{ color: "var(--color-white)" }} />
        </CustomMenuItem>
      )}
      <CustomMenuItem onClick={onSetting}>
        <ListItemIcon>
          <SettingsIcon sx={{ color: "var(--color-white)" }} />
        </ListItemIcon>
        <ListItemText primary="Settings" sx={{ color: "var(--color-white)" }} />
      </CustomMenuItem>
      {isDesign && designSettingsVisibility.isChangeModeVisible && (
        <CustomMenuItem onClick={onChangeMode} sx={{ paddingRight: "10px" }}>
          <ListItemIcon>{changeModeIcon}</ListItemIcon>
          <ListItemText primary="Change Mode" sx={{ color: "var(--color-white)" }} />
          <KeyboardArrowRightRoundedIcon sx={{ color: "var(--color-white)", ml: "auto" }} />
        </CustomMenuItem>
      )}
      {((isDesign && designSettingsVisibility.isDownloadVisible) ||
        (!isDesign && projectSettingsVisibility.isDownloadVisible)) && (
        <CustomMenuItem onClick={onOpenDownloadModal}>
          <ListItemIcon>
            <DownloadIcon sx={{ color: "var(--color-white)" }} />
          </ListItemIcon>
          <ListItemText primary="Download" sx={{ color: "var(--color-white)" }} />
        </CustomMenuItem>
      )}
      {isDesign && designSettingsVisibility.isMakeCopyVisible && (
        <CustomMenuItem onClick={onOpenMakeCopyModal}>
          <ListItemIcon>
            <MakeACopyIcon sx={{ color: "var(--color-white)" }} />
          </ListItemIcon>
          <ListItemText primary="Make a Copy" sx={{ color: "var(--color-white)" }} />
        </CustomMenuItem>
      )}
      {isDesign && designSettingsVisibility.isRestoreVisible && (
        <CustomMenuItem onClick={onOpenRestoreModal}>
          <ListItemIcon>
            <RestoreIcon sx={{ color: "var(--color-white)" }} />
          </ListItemIcon>
          <ListItemText primary="Restore" sx={{ color: "var(--color-white)" }} />
        </CustomMenuItem>
      )}
      {((isDesign && designSettingsVisibility.isRenameVisible) ||
        (!isDesign && projectSettingsVisibility.isRenameVisible)) && (
        <CustomMenuItem onClick={onOpenRenameModal}>
          <ListItemIcon>
            <RenameIcon sx={{ color: "var(--color-white)" }} />
          </ListItemIcon>
          <ListItemText primary="Rename" sx={{ color: "var(--color-white)" }} />
        </CustomMenuItem>
      )}
      {((isDesign && designSettingsVisibility.isDeleteVisible) ||
        (!isDesign && projectSettingsVisibility.isDeleteVisible)) && (
        <CustomMenuItem onClick={onDelete}>
          <ListItemIcon>
            <DeleteIcon sx={{ color: "var(--color-white)" }} />
          </ListItemIcon>
          <ListItemText primary="Delete" sx={{ color: "var(--color-white)" }} />
        </CustomMenuItem>
      )}
      <CustomMenuItem onClick={onOpenInfoModal}>
        <ListItemIcon>
          <DetailsIcon sx={{ color: "var(--color-white)" }} />
        </ListItemIcon>
        <ListItemText primary="Details" sx={{ color: "var(--color-white)" }} />
      </CustomMenuItem>
    </>
  );
};

export default DefaultMenu;
