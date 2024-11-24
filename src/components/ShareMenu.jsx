import React from "react";
import { MenuItem, ListItemIcon, ListItemText, styled } from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { showToast } from "../functions/utils";

const CustomMenuItem = styled(MenuItem)({
  minHeight: "2.6rem !important",
  "&:hover": {
    backgroundColor: "var(--iconBg)",
  },
  "&:focus": {
    backgroundColor: "var(--iconBg)",
  },
});

const ShareMenu = ({
  onClose,
  onBackToMenu,
  onOpenShareModal,
  onOpenManageAccessModal,
  onOpenManageAccessModalView,
  isViewCollab,
  isFromMenu = true,
  isHomepage = false,
  isDrawer = false,
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
    <div className={`${isHomepage ? "shareMenuHome" : ""} ${isDrawer ? "drawer" : ""}`}>
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
    </div>
  );
};

export default ShareMenu;
