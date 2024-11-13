import React, { useState, useRef, useEffect } from "react";
import "../../css/homepage.css";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../functions/utils";
import { handleDeleteDesign, handleDeleteProject } from "./backend/HomepageActions";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import {
  handleNameChange as handleNameChangeDesign,
  handleCopyDesign,
} from "../DesignSpace/backend/DesignActions";
import { handleNameChange as handleNameChangeProject } from "../ProjectSpace/backend/ProjectDetails";

import ShareModal from "../../components/ShareModal";
import ManageAccessModal from "../../components/ManageAccessModal.jsx";
import ShareMenu from "../../components/ShareMenu";
import CopyLinkModal from "../../components/CopyLinkModal";
import DownloadModal from "../../components/DownloadModal";
import MakeCopyModal from "../../components/MakeCopyModal";
import RenameModal from "../../components/RenameModal";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import InfoModal from "../../components/InfoModal";

import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SettingsIcon from "@mui/icons-material/Settings";

import {
  OpenInNew as OpenInNewIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Link as LinkIcon,
  Share as ShareIcon,
  FileCopy as FileCopyIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import DriveFileRenameOutlineRoundedIcon from "@mui/icons-material/DriveFileRenameOutlineRounded";

function HomepageOptions({
  isDesign,
  id,
  object,
  onOpen,
  isTable = false,
  isDrawer = false,
  optionsState = {},
  setOptionsState = () => {},
  clickedId = "",
  setClickedId = () => {},
  toggleOptions = (id) => {
    setOptionsState((prev) => {
      const isSameId = prev.selectedId === id;
      const newShowOptions = !prev.showOptions || !isSameId;
      const newSelectedId = newShowOptions ? id : null;
      return {
        showOptions: newShowOptions,
        selectedId: newSelectedId,
      };
    });
  },
}) {
  const navigate = useNavigate();
  const { appURL, user, userDoc } = useSharedProps();
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showManageAccessModal, setShowManageAccessModal] = useState(false);
  const [showViewCollabModal, setShowViewCollabModal] = useState(false);
  const [isViewCollab, setIsViewCollab] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCopyLinkModal, setShowCopyLinkModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const optionsRef = useRef(null);

  useEffect(() => {
    // Find access level of the user (to display Manage Access/View Collaborators in ShareMenu)
    if (isDesign) {
      const design = object;
      if (!design || !user || !userDoc) return;

      // Check if user is owner or editor (manage access), then commenters and viewers (view only)
      if (userDoc.id === design.owner) {
        setIsViewCollab(false);
        return;
      }
      if (design.editors?.includes(userDoc.id)) {
        setIsViewCollab(false);
        return;
      }
      if (design.commenters?.includes(userDoc.id) || design.viewers?.includes(userDoc.id)) {
        setIsViewCollab(true);
        return;
      }
      setIsViewCollab(true);
    } else {
      const project = object;
      if (!project || !user || !userDoc) return;

      // Check if user is manager or content manager (manage access), then contributor and viewers (view only)
      if (project.managers?.includes(userDoc.id)) {
        setIsViewCollab(false);
        return;
      }
      if (project.contentManagers?.includes(userDoc.id)) {
        setIsViewCollab(false);
        return;
      }
      if (project.contributors?.includes(userDoc.id) || project.viewers?.includes(userDoc.id)) {
        setIsViewCollab(true);
        return;
      }
      setIsViewCollab(true);
    }
  }, [object, user, userDoc]);

  const handleToggleOptions = (id) => {
    setClickedId(id);
    if (clickedId === id) {
      setClickedId(null);
    }
  };

  const handleClickOutside = (event) => {
    if (optionsRef.current && !optionsRef.current.contains(event.target)) {
      toggleOptions(id);
      setIsShareMenuOpen(false);
    }
  };

  // Share Functions
  const openShareModal = () => {
    setShowShareModal(true);
    toggleOptions(id);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
  };

  const openManageAccessModal = () => {
    setShowManageAccessModal(true);
    toggleOptions(id);
  };

  const closeManageAccessModal = () => {
    setShowManageAccessModal(false);
  };

  const openViewCollabModal = () => {
    setShowViewCollabModal(true);
    toggleOptions(id);
  };

  const closeViewCollabModal = () => {
    setShowViewCollabModal(false);
  };

  // Copy Link Functions
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${appURL}/${isDesign ? "design" : "project"}/${id}`);
      showToast("success", "Link copied to clipboard!");
      toggleOptions(id);
    } catch (err) {
      showToast("error", "Failed to copy link.");
      console.error("Failed to copy: ", err);
    }
  };

  const closeCopyLinkModal = () => {
    setShowCopyLinkModal(false);
  };

  // Settings Fucntions
  const handleSettings = () => {
    navigate(`/settings/${isDesign ? "design" : "project"}/${id}`);
  };

  // Download Functions
  const openDownloadModal = () => {
    setShowDownloadModal(true);
    toggleOptions(id);
  };

  const closeDownloadModal = () => {
    setShowDownloadModal(false);
  };

  // Make a Copy Functions
  const openCopyModal = () => {
    setShowCopyModal(true);
    toggleOptions(id);
  };

  const closeCopyModal = () => {
    setShowCopyModal(false);
  };

  // Make a Copy Modal Action
  const handleCopy = async (design, designVersionId, shareWithCollaborators = false) => {
    if (!designVersionId) {
      return { success: false, message: "Select a version to copy" };
    }
    try {
      const result = await handleCopyDesign(design, designVersionId, shareWithCollaborators, user);
      if (result.success) {
        closeCopyModal();
        return { success: true, message: "Design copied" };
      } else {
        return { success: false, message: "Failed to copy design" };
      }
    } catch (error) {
      console.error("Error copying design:", error);
      return { success: false, message: "Failed to copy design" };
    }
  };

  // Rename Functions
  const openRenameModal = () => {
    setShowRenameModal(true);
    toggleOptions(id);
  };

  const closeRenameModal = () => {
    setShowRenameModal(false);
  };

  const handleRename = async (newName) => {
    if (isDesign) {
      if (object.designName === newName.trim()) {
        return { success: false, message: "Name is the same as the current name." };
      }
    } else {
      if (object.projectName === newName.trim()) {
        return { success: false, message: "Name is the same as the current name." };
      }
    }
    try {
      const result = (await isDesign)
        ? handleNameChangeDesign(object.id, newName, user, setIsEditingName)
        : handleNameChangeProject(object.id, newName, user, setIsEditingName);
      console.log("result", result);
      if (result.success) {
        closeRenameModal();
        return {
          success: true,
          message: `${isDesign ? "Design" : "Project"} name updated successfully`,
        };
      } else {
        return {
          success: false,
          message: `Failed to update ${isDesign ? "design" : "project"} name`,
        };
      }
    } catch (error) {
      console.error(`Error updating ${isDesign ? "design" : "project"} name:`, error);
      return {
        success: false,
        message: `Failed to update ${isDesign ? "design" : "project"} name`,
      };
    }
  };

  // Delete Functions
  const openDeleteModal = () => {
    setShowDeleteModal(true);
    toggleOptions(id);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleDelete = (userId, id, navigate) => {
    if (isDesign) handleDeleteDesign(userId, id, navigate);
    else handleDeleteProject(userId, id, navigate);
    closeDeleteModal();
  };

  // Info Functions
  const handleOpenInfoModal = () => {
    navigate(`/details/${isDesign ? "design" : "project"}/${id}`);
  };

  const handleCloseInfoModal = () => {
    // setIsInfoModalOpen(false);
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      console.log("is it a table" + isTable);
    };
  }, []);

  return (
    <>
      {/* Options button */}
      <div className={isTable ? "options-table" : "options"}>
        {!isTable && (
          <h3 className="selectOption">
            <IconButton
              onClick={() => {
                handleToggleOptions(id);
              }}
              sx={{ color: "var(--color-white)" }}
            >
              <MoreVertIcon style={{ fontSize: 20 }} />
            </IconButton>
          </h3>
        )}
        {optionsState.showOptions &&
          optionsState.selectedId === id &&
          (isShareMenuOpen ? (
            <ShareMenu
              onClose={() => setIsShareMenuOpen(false)}
              onBackToMenu={() => setIsShareMenuOpen(false)}
              onOpenShareModal={openShareModal}
              onOpenManageAccessModal={openManageAccessModal}
              onOpenManageAccessModalView={openViewCollabModal}
              isViewCollab={isViewCollab}
            />
          ) : (
            <div
              ref={optionsRef}
              className={`dropdown-menu ${isTable ? "table" : ""} ${isDrawer ? "drawer" : ""}`}
              style={{
                position: "absolute",

                top: isTable ? "0" : "0",
                marginTop: isTable ? "0" : "10px",
              }}
            >
              <div className="dropdown-item" onClick={onOpen}>
                <OpenInNewIcon style={{ fontSize: 20 }} className="icon" />
                Open
              </div>
              <div className="dropdown-item" onClick={() => setIsShareMenuOpen(true)}>
                <ShareIcon style={{ fontSize: 20 }} className="icon" />
                Share
              </div>
              <div className="dropdown-item" onClick={handleCopyLink}>
                <LinkIcon style={{ fontSize: 20 }} className="icon" />
                Copy Link
              </div>
              <div className="dropdown-item" onClick={handleSettings}>
                <SettingsIcon style={{ fontSize: 20 }} className="icon" />
                Settings
              </div>
              <div className="dropdown-item" onClick={openDownloadModal}>
                <DownloadIcon style={{ fontSize: 20 }} className="icon" />
                Download
              </div>
              {isDesign && (
                <div className="dropdown-item" onClick={openCopyModal}>
                  <FileCopyIcon style={{ fontSize: 20 }} className="icon" />
                  Make a copy
                </div>
              )}
              <div className="dropdown-item" onClick={openRenameModal}>
                <DriveFileRenameOutlineRoundedIcon style={{ fontSize: 20 }} className="icon" />
                Rename
              </div>
              <div className="dropdown-item" onClick={openDeleteModal}>
                <DeleteIcon style={{ fontSize: 20 }} className="icon" />
                Delete
              </div>
              <div className="dropdown-item" onClick={handleOpenInfoModal}>
                <InfoIcon style={{ fontSize: 20 }} className="icon" />
                Details
              </div>
            </div>
          ))}
      </div>

      {/* Share */}
      <ShareModal
        isOpen={showShareModal}
        onClose={closeShareModal}
        handleShare={() => {}}
        isDesign={isDesign}
        object={object}
      />
      <ManageAccessModal
        isOpen={showManageAccessModal}
        onClose={closeManageAccessModal}
        handleSave={() => {}}
        isDesign={isDesign}
        object={object}
        isViewCollab={false}
      />
      <ManageAccessModal
        isOpen={showViewCollabModal}
        onClose={closeViewCollabModal}
        handleAccessChange={() => {}}
        isDesign={isDesign}
        object={object}
        isViewCollab={true}
      />
      {/* Download */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={closeDownloadModal}
        isDesign={isDesign}
        object={object}
      />
      {/* Make a Copy */}
      <MakeCopyModal
        isOpen={showCopyModal}
        onClose={closeCopyModal}
        handleCopy={handleCopy}
        design={object}
      />
      {/* Rename */}
      <RenameModal
        isOpen={showRenameModal}
        onClose={closeRenameModal}
        handleRename={handleRename}
        isDesign={isDesign}
        object={object}
      />
      {/* Delete */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        handleDelete={() => handleDelete(userDoc.id, id, navigate)}
        isDesign={isDesign}
        object={object}
      />
      {/* Details */}
      <InfoModal isOpen={isInfoModalOpen} onClose={handleCloseInfoModal} />
    </>
  );
}

export default HomepageOptions;
