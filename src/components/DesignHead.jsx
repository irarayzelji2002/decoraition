import React, { useState } from "react";
import { IconButton, Menu } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CommentIcon from "@mui/icons-material/Comment";
import ShareIcon from "@mui/icons-material/Share";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { signOut } from "firebase/auth";
import ChangeModeMenu from "./ChangeModeMenu.jsx";
import CopyLinkModal from "./CopyLinkModal.jsx";
import DefaultMenu from "./DefaultMenu.jsx";
import DeleteConfirmationModal from "./DeleteConfirmationModal.jsx";
import DownloadModal from "./DownloadModal.jsx";
import InfoModal from "./InfoModal.jsx";
import RenameModal from "./RenameModal.jsx";
import RestoreModal from "./RestoreModal.jsx";
import ShareModal from "./ShareModal.jsx";
import ShareMenu from "./ShareMenu.jsx";
import MakeCopyModal from "./MakeCopyModal.jsx";
import ShareConfirmationModal from "./ShareConfirmationModal.jsx";
import "../css/design.css";
import { auth } from "../firebase.js";
import DrawerComponent from "../pages/Homepage/DrawerComponent.jsx";
import Version from "../pages/DesignSpace/Version.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useParams, useLocation } from "react-router-dom";
import { showToast } from "../functions/utils.js";
import {
  handleNameChange,
  handleRestoreDesignVersion,
  handleCopyDesign,
  handleDownloadDesign,
} from "../pages/DesignSpace/backend/DesignActions.jsx";
import { handleDeleteDesign } from "../pages/Homepage/backend/HomepageActions.jsx";
import { useSharedProps } from "../contexts/SharedPropsContext.js";

function DesignHead({ toggleComments, setIsSidebarOpen, design }) {
  const { user, userDoc, handleLogout } = useSharedProps();

  const [anchorEl, setAnchorEl] = useState(null);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isChangeModeMenuOpen, setIsChangeModeMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isShareConfirmationModalOpen, setIsShareConfirmationModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newName, setNewName] = useState(design?.designName ?? "Untitled Design");
  const [isEditingName, setIsEditingName] = useState(false);

  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isMakeCopyModalOpen, setIsMakeCopyModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [newCollaborator, setNewCollaborator] = useState("");
  const [isSecondPage, setIsSecondPage] = useState(false);
  const [role, setRole] = useState("Editor");
  const [notifyPeople, setNotifyPeople] = useState(true);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { designId } = useParams();

  const navigate = useNavigate();
  const location = useLocation();
  const isDesignPath = location.pathname.includes("/design");

  const handleNotifClick = () => {
    setIsNotifOpen(true);
  };

  const handleNotifClose = () => {
    setIsNotifOpen(false);
  };

  const handleEditNameToggle = () => {
    setIsEditingName((prev) => !prev);
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setIsShareMenuOpen(false);
    setIsChangeModeMenuOpen(false);
  };

  const handleShareClick = () => {
    setIsShareMenuOpen(true);
  };

  const handleChangeModeClick = () => {
    setIsChangeModeMenuOpen(true);
  };

  const handleBackToMenu = () => {
    setIsShareMenuOpen(false);
    setIsChangeModeMenuOpen(false);
  };

  const handleOpenShareModal = () => {
    setIsShareModalOpen(true);
    handleClose();
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
    setIsSecondPage(false);
  };

  const handleAddCollaborator = () => {
    if (newCollaborator.trim() !== "") {
      setCollaborators([...collaborators, newCollaborator]);
      setNewCollaborator("");
    }
  };

  const handleNext = () => {
    setIsSecondPage(true);
  };

  const handleShareProject = () => {
    if (collaborators.length > 0) {
      setIsShareModalOpen(false);
      setIsShareConfirmationModalOpen(true);
    }
  };

  const handleCloseShareConfirmationModal = () => {
    setIsShareConfirmationModalOpen(false);
  };

  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleDelete = () => {
    console.log("Item deleted");
    handleCloseDeleteModal();
  };

  const handleOpenDownloadModal = () => {
    setIsDownloadModalOpen(true);
  };

  const handleCloseDownloadModal = () => {
    setIsDownloadModalOpen(false);
  };

  const handleOpenRenameModal = () => {
    setIsRenameModalOpen(true);
  };

  const handleCloseRenameModal = () => {
    setIsRenameModalOpen(false);
  };

  const handleOpenRestoreModal = () => {
    setIsRestoreModalOpen(true);
  };

  const handleCloseRestoreModal = () => {
    setIsRestoreModalOpen(false);
  };

  const handleOpenMakeCopyModal = () => {
    setIsMakeCopyModalOpen(true);
  };

  const handleCloseMakeCopyModal = () => {
    setIsMakeCopyModalOpen(false);
  };

  const handleOpenInfoModal = () => {
    navigate(`/details/design/${design.id}`);
  };

  const handleCloseInfoModal = () => {
    // setIsInfoModalOpen(false);
  };
  const handleInputClick = () => {
    // Enable edit mode when the input is clicked
    handleEditNameToggle();
  };

  const handleBlur = () => {
    // Save the name when the user clicks away from the input field
    if (!isEditingName) {
      return;
    }
    if (design.designName === newName.trim()) {
      handleEditNameToggle();
      return;
    }
    handleNameChange(design.id, newName, user, setIsEditingName);
  };

  // Download Modal Action
  const handleDownload = async (design, category, designVersionId, type) => {
    if (!designVersionId) {
      return { success: false, message: "Select a version to download" };
    }
    if (!type) {
      return { success: false, message: "Select a file type" };
    }
    try {
      const result = await handleDownloadDesign(design, category, designVersionId, type, user);
      if (result.success) {
        handleClose();
        handleCloseDownloadModal();
        return { success: true, message: "Design downloaded" };
      } else {
        return { success: false, message: "Failed to download design" };
      }
    } catch (error) {
      console.error("Error downloading design:", error);
      return { success: false, message: "Failed to download design" };
    }
  };

  // Make a Copy Modal Action
  const handleCopy = async (design, designVersionId, shareWithCollaborators = false) => {
    if (!designVersionId) {
      return { success: false, message: "Select a version to copy" };
    }
    try {
      const result = await handleCopyDesign(design, designVersionId, shareWithCollaborators, user);
      if (result.success) {
        handleClose();
        handleCloseMakeCopyModal();
        return { success: true, message: "Design copied" };
      } else {
        return { success: false, message: "Failed to copy design" };
      }
    } catch (error) {
      console.error("Error copying design:", error);
      return { success: false, message: "Failed to copy design" };
    }
  };

  // Restore Modal Action
  const handleRestore = async (design, designVersionId) => {
    if (!designVersionId) {
      return { success: false, message: "Select a version to restore" };
    }
    try {
      const result = await handleRestoreDesignVersion(design, designVersionId, user);
      if (result.success) {
        handleClose();
        handleCloseRestoreModal();
        return { success: true, message: "Design restored" };
      } else {
        return { success: false, message: "Failed to restore design" };
      }
    } catch (error) {
      console.error("Error restoring design:", error);
      return { success: false, message: "Failed to restore design" };
    }
  };

  // Rename Modal Action
  const handleRename = async (newName) => {
    if (design.designName === newName.trim()) {
      return { success: false, message: "Name is the same as the current name." };
    }
    try {
      const result = await handleNameChange(design.id, newName, user, setIsEditingName);
      console.log("result", result);
      if (result.success) {
        handleClose();
        handleCloseRenameModal();
        return { success: true, message: "Design name updated successfully" };
      } else {
        return { success: false, message: "Failed to update design name" };
      }
    } catch (error) {
      console.error("Error updating design name:", error);
      return { success: false, message: "Failed to update design name" };
    }
  };

  // Copy Link Action
  const handleCopyLink = async () => {
    try {
      const currentLink = window.location.href; // Get the current URL
      await navigator.clipboard.writeText(currentLink);
      showToast("success", "Link copied to clipboard!");
      handleClose();
    } catch (err) {
      showToast("error", "Failed to copy link.");
      console.error("Failed to copy: ", err);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode", !darkMode);
  };

  const handleSettings = () => {
    navigate(`/settings/design/${design.id}`);
  };

  return (
    <div className={`designHead stickyMenu`}>
      <DrawerComponent
        isDrawerOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        toggleDarkMode={toggleDarkMode}
        handleLogout={handleLogout}
        darkMode={darkMode}
      />
      <Version isDrawerOpen={isNotifOpen} onClose={handleNotifClose} />
      <div className="left">
        <IconButton
          size="large"
          edge="start"
          color="var(--color-white)"
          aria-label="open drawer"
          onClick={setDrawerOpen}
          sx={{ backgroundColor: "transparent", marginTop: "6px" }}
        >
          <MenuIcon sx={{ color: "var(--color-white)" }} />
        </IconButton>
        <div className="design-name-section">
          {isEditingName ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.target.blur();
                  handleBlur();
                }
              }}
              onBlur={handleBlur}
              autoFocus // Automatically focus on the input when in edit mode
              className="headTitleInput"
            />
          ) : (
            <span onClick={handleInputClick} className="headTitleInput" style={{ height: "20px" }}>
              {design?.designName ?? "Untitled Design"}
            </span>
          )}
        </div>
      </div>
      <div className="right">
        {isDesignPath && (
          <IconButton onClick={toggleComments}>
            <CommentIcon sx={{ color: "var(--color-white)" }} />
          </IconButton>
        )}
        <IconButton>
          <ShareIcon sx={{ color: "var(--color-white)" }} onClick={handleOpenShareModal} />
        </IconButton>
        <IconButton onClick={handleClick}>
          <MoreVertIcon sx={{ color: "var(--color-white)" }} />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            style: {
              backgroundColor: "#27262C",
              color: "white",
              minWidth: "200px",
            },
          }}
        >
          {isShareMenuOpen ? (
            <ShareMenu
              onClose={handleClose}
              onBackToMenu={handleBackToMenu}
              onOpenShareModal={handleOpenShareModal}
            />
          ) : isChangeModeMenuOpen ? (
            <ChangeModeMenu onClose={handleClose} onBackToMenu={handleBackToMenu} />
          ) : (
            <DefaultMenu
              isDesign={true}
              onComment={toggleComments} // design only
              onOpenShareModal={handleShareClick}
              onCopyLink={handleCopyLink}
              setIsSidebarOpen={handleNotifClick} // design only
              onSetting={handleSettings}
              onChangeMode={handleChangeModeClick} // design only
              onOpenDownloadModal={handleOpenDownloadModal}
              onOpenMakeCopyModal={handleOpenMakeCopyModal} // design only
              onOpenRestoreModal={handleOpenRestoreModal} // design only
              onOpenRenameModal={handleOpenRenameModal}
              onDelete={handleOpenDeleteModal}
              onOpenInfoModal={handleOpenInfoModal}
            />
          )}
        </Menu>
      </div>
      {/* Comment (No Modal) */}
      {/* Share */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleCloseShareModal}
        onAddCollaborator={handleAddCollaborator}
        onNext={handleNext}
        onShareProject={handleShareProject}
        collaborators={collaborators}
        newCollaborator={newCollaborator}
        isSecondPage={isSecondPage}
        role={role}
        notifyPeople={notifyPeople}
      />
      <ShareConfirmationModal
        isOpen={isShareConfirmationModalOpen}
        onClose={handleCloseShareConfirmationModal}
        collaborators={collaborators}
      />
      {/* Copy Link (No Modal) */}
      {/* History */}
      {/* Settings (No Modal) */}
      {/* Change Mode */}
      {/* Download */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={handleCloseDownloadModal}
        isDesign={true}
        object={design}
      />
      {/* Make a Copy */}
      <MakeCopyModal
        isOpen={isMakeCopyModalOpen}
        onClose={handleCloseMakeCopyModal}
        handleCopy={handleCopy}
        design={design}
      />
      {/* Restore */}
      {design.history && design.history.length > 1 && (
        <RestoreModal
          isOpen={isRestoreModalOpen}
          onClose={handleCloseRestoreModal}
          handleRestore={handleRestore}
          design={design}
        />
      )}
      {/* Rename */}
      <RenameModal
        isOpen={isRenameModalOpen}
        onClose={handleCloseRenameModal}
        handleRename={handleRename}
        isDesign={true}
        object={design}
      />
      {/* Delete */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        handleDelete={() => handleDeleteDesign(userDoc.id, design.id, navigate)}
        isDesign={true}
        object={design}
      />
      {/* Details */}
      <InfoModal isOpen={isInfoModalOpen} onClose={handleCloseInfoModal} />
    </div>
  );
}

export default DesignHead;
