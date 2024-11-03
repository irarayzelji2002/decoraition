import React from "react";
import { MenuItem, ListItemIcon, ListItemText, styled } from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ContentCopy from "@mui/icons-material/ContentCopy";
import { toast } from "react-toastify";
import { showToast } from "../functions/utils";

const CustomMenuItem = styled(MenuItem)({
  minHeight: "2.6rem !important",
});

const ShareMenu = ({
  onClose,
  onBackToMenu,
  onOpenShareModal,
  onOpenManageAccessModal,
  onOpenManageAccessModalView,
  isViewCollab,
  isFromMenu = true,
}) => {
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
      <CustomMenuItem
        onClick={onBackToMenu}
        sx={{ borderBottom: "1px solid var(--inputBg)", fontWeight: "bold" }}
      >
        <ListItemIcon>
          {isFromMenu ? (
            <ArrowBackIosNewRoundedIcon sx={{ color: "var(--color-white)" }} />
          ) : (
            <CloseRoundedIcon sx={{ color: "var(--color-white)" }} />
          )}
        </ListItemIcon>
        <ListItemText primary="Share" />
      </CustomMenuItem>
      {!isViewCollab && ( // Only show for editors/owners
        <CustomMenuItem onClick={onOpenShareModal}>
          <ListItemText primary="Add Collaborators" />
        </CustomMenuItem>
      )}
      <CustomMenuItem
        onClick={isViewCollab ? onOpenManageAccessModalView : onOpenManageAccessModal}
      >
        <ListItemText primary={isViewCollab ? "View collaborators" : "Manage Access"} />
      </CustomMenuItem>
      {!isViewCollab && ( // Only show for editors/owners since manage access is shown above
        <CustomMenuItem onClick={onOpenManageAccessModalView}>
          <ListItemText primary="View collaborators" />
        </CustomMenuItem>
      )}
      <CustomMenuItem onClick={handleCopyLink}>
        <ListItemText primary="Copy Link" />
      </CustomMenuItem>
    </>
  );
};

export default ShareMenu;
