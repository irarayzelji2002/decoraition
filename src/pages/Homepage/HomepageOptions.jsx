import React, { useState, useRef, useEffect, useCallback } from "react";
import "../../css/homepage.css";
import { useNavigate, useLocation } from "react-router-dom";
import { showToast } from "../../functions/utils";
import { handleMoveDesignToTrash, handleMoveProjectToTrash } from "./backend/HomepageActions";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import {
  handleNameChange as handleNameChangeDesign,
  handleCopyDesign,
  handleAddCollaborators as handleAddCollaboratorsDesign,
  handleAccessChange as handleAccessChangeDesign,
} from "../DesignSpace/backend/DesignActions.jsx";
import {
  handleNameChange as handleNameChangeProject,
  handleAddCollaborators as handleAddCollaboratorsProject,
  handleAccessChange as handleAccessChangeProject,
} from "../ProjectSpace/backend/ProjectDetails.jsx";

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
import {
  isOwnerDesign,
  isOwnerEditorDesign,
  isOwnerEditorCommenterDesign,
  isCollaboratorDesign,
} from "../DesignSpace/Design.jsx";
import {
  isManagerProject,
  isManagerContentManagerProject,
  isManagerContentManagerContributorProject,
  isCollaboratorProject,
} from "../ProjectSpace/Project.jsx";

import {
  CopyLinkIcon,
  ShareIcon,
  SettingsIcon,
  MakeACopyIcon,
  RenameIcon,
  DownloadIcon,
  DeleteIcon,
  DetailsIcon,
  RestoreIcon,
} from "../../components/svg/DefaultMenuIcons";

import { OpenInNew as OpenInNewIcon } from "@mui/icons-material";
import deepEqual from "deep-equal";

function HomepageOptions({
  isDesign,
  id,
  object, // design or project object
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
  const location = useLocation();
  const navigateFrom = location.pathname;

  const { appURL, user, userDoc } = useSharedProps();
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showManageAccessModal, setShowManageAccessModal] = useState(false);
  const [showViewCollabModal, setShowViewCollabModal] = useState(false);
  const [shouldOpenViewCollab, setShouldOpenViewCollab] = useState(false);
  const [isViewCollab, setIsViewCollab] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCopyLinkModal, setShowCopyLinkModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const optionsRef = useRef(null);

  const [role, setRole] = useState(0);
  const [isDownloadVisible, setIsDownloadVisible] = useState(false);
  const [isRenameVisible, setIsRenameVisible] = useState(false);
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [isMakeCopyVisible, setIsMakeCopyVisible] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isRestoreVisible, setIsRestoreVisible] = useState(false);

  useEffect(() => {
    if (!object || !user || !userDoc) return;
    let newRole = 0;

    if (isDesign) {
      const design = object;
      // First check if restricted access
      if (design?.designSettings?.generalAccessSetting === 0) {
        // Only check explicit roles
        if (userDoc.id === design.owner) newRole = 3;
        else if (design.editors?.includes(userDoc.id)) newRole = 1;
        else if (design.commenters?.includes(userDoc.id)) newRole = 2;
        else if (design.viewers?.includes(userDoc.id)) newRole = 0;
      } else {
        // Anyone with link - check both explicit roles and general access
        if (userDoc.id === design.owner) newRole = 3;
        else if (
          design.editors?.includes(userDoc.id) ||
          design?.designSettings?.generalAccessRole === 1
        )
          newRole = 1;
        else if (
          design.commenters?.includes(userDoc.id) ||
          design?.designSettings?.generalAccessRole === 2
        )
          newRole = 2;
        else newRole = design?.designSettings?.generalAccessRole ?? 0;
      }
      // Set role and all dependent flags
      setRole(newRole);
      setIsViewCollab(newRole === 0 || newRole === 2);
      if (design.history && design.history.length > 0)
        setIsRestoreVisible(newRole === 1 || newRole === 3);
      setIsRenameVisible(newRole === 1 || newRole === 3);
      setIsDeleteVisible(newRole === 3);
      // Set visibility based on design settings
      setIsDownloadVisible(
        !!design?.designSettings?.allowDownload || newRole === 1 || newRole === 3
      );
      setIsHistoryVisible(
        !!design?.designSettings?.allowViewHistory || newRole === 1 || newRole === 3
      );
      setIsMakeCopyVisible(!!design?.designSettings?.allowCopy || newRole === 1 || newRole === 3);
    } else {
      const project = object;
      // First check if restricted access
      if (project?.projectSettings?.generalAccessSetting === 0) {
        // Only check explicit roles
        if (project.managers?.includes(userDoc.id)) newRole = 3;
        else if (project.contentManager?.includes(userDoc.id)) newRole = 2;
        else if (project.contributors?.includes(userDoc.id)) newRole = 1;
        else if (project.viewers?.includes(userDoc.id)) newRole = 0;
      } else {
        // Anyone with link - check both explicit roles and general access
        if (project.managers?.includes(userDoc.id)) newRole = 3;
        else if (
          project.contentManager?.includes(userDoc.id) ||
          project?.projectSettings?.generalAccessRole === 2
        )
          newRole = 2;
        else if (
          project.contributors?.includes(userDoc.id) ||
          project?.projectSettings?.generalAccessRole === 1
        )
          newRole = 1;
        else newRole = project?.projectSettings?.generalAccessRole ?? 0;
      }

      // Set role and all dependent flags
      setRole(newRole);
      setIsViewCollab(newRole !== 3);
      setIsRenameVisible(newRole === 2 || newRole === 3);
      setIsDeleteVisible(newRole === 3);
      // Set visibility based on project settings
      setIsDownloadVisible(!!project?.projectSettings?.allowDownload || newRole > 0);
    }
  }, [object, user, userDoc, isDesign]);

  useEffect(() => {
    if (shouldOpenViewCollab && !showManageAccessModal) {
      setShowViewCollabModal(true);
      setShouldOpenViewCollab(false);
    }
  }, [shouldOpenViewCollab, showManageAccessModal]);

  const handleToggleOptions = (id) => {
    setClickedId(id);
    if (clickedId === id) {
      setClickedId(null);
    }
  };

  const handleClickOutside = (event) => {
    if (
      optionsRef.current &&
      !optionsRef.current.contains(event.target) &&
      !event.target.closest(".MuiDialog-root")
    ) {
      toggleOptions(id);
      setIsShareMenuOpen(false);
    }
  };

  // Share Functions
  const openShareModal = (e) => {
    if (e) e.stopPropagation();
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    toggleOptions(id);
  };

  const openManageAccessModal = (e) => {
    if (e) e.stopPropagation();
    setShowManageAccessModal(true);
  };

  const closeManageAccessModal = () => {
    setShowManageAccessModal(false);
    toggleOptions(id);
  };

  const openViewCollabModal = (e) => {
    if (e) e.stopPropagation();
    setShowViewCollabModal(true);
  };

  const closeViewCollabModal = () => {
    setShowViewCollabModal(false);
    toggleOptions(id);
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
    navigate(`/settings/${isDesign ? "design" : "project"}/${id}`, {
      state: { navigateFrom: navigateFrom },
    });
  };

  // Download Functions
  const openDownloadModal = (e) => {
    if (e) e.stopPropagation();
    setShowDownloadModal(true);
  };

  const closeDownloadModal = () => {
    setShowDownloadModal(false);
    toggleOptions(id);
  };

  // Add Collaborators Modal Action
  const handleShare = async (object, emails, role, message, notifyPeople = false) => {
    if (emails.length === 0) {
      return { success: false, message: "No email addresses added" };
    }
    if (role < 0 || role > 4) {
      return { success: false, message: "Select a valid role" };
    }
    try {
      let result;
      if (isDesign) {
        result = await handleAddCollaboratorsDesign(
          object,
          emails,
          role,
          message,
          notifyPeople,
          user,
          userDoc
        );
      } else {
        result = await handleAddCollaboratorsProject(
          object,
          emails,
          role,
          message,
          notifyPeople,
          user,
          userDoc
        );
      }
      if (result.success) {
        closeShareModal();
        return {
          success: true,
          message: `${isDesign ? "Design" : "Project"} shared to collaborators`,
        };
      } else {
        return {
          success: false,
          message: `Failed to share ${isDesign ? "design" : "project"} to collaborators`,
        };
      }
    } catch (error) {
      console.error(`Error sharing ${isDesign ? "design" : "project"}:`, error);
      return {
        success: false,
        message: `Failed to share ${isDesign ? "design" : "project"} to collaborators`,
      };
    }
  };

  // Manage Access Modal Action
  const handleAccessChange = async (
    object,
    initEmailsWithRole,
    emailsWithRole,
    generalAccessSetting,
    generalAccessRole
  ) => {
    // If no roles have changed, return early
    if (isDesign) {
      if (
        deepEqual(initEmailsWithRole, emailsWithRole) &&
        generalAccessSetting === object?.designSettings?.generalAccessSetting &&
        generalAccessRole === object?.designSettings?.generalAccessRole
      ) {
        return { success: false, message: "Nothing changed" };
      }
    } else {
      if (
        deepEqual(initEmailsWithRole, emailsWithRole) &&
        generalAccessSetting === object?.projectSettings?.generalAccessSetting &&
        generalAccessRole === object?.projectSettings?.generalAccessRole
      ) {
        return { success: false, message: "Nothing changed" };
      }
    }

    try {
      let result;
      if (isDesign) {
        result = await handleAccessChangeDesign(
          object,
          initEmailsWithRole,
          emailsWithRole,
          generalAccessSetting,
          generalAccessRole,
          user,
          userDoc
        );
      } else {
        result = await handleAccessChangeProject(
          object,
          initEmailsWithRole,
          emailsWithRole,
          generalAccessSetting,
          generalAccessRole,
          user,
          userDoc
        );
      }
      if (result.success) {
        closeManageAccessModal();
        return {
          success: true,
          message: `${isDesign ? "Design" : "Project"} access changed`,
        };
      } else {
        return {
          success: false,
          message: `Failed to change access of ${isDesign ? "design" : "project"}`,
        };
      }
    } catch (error) {
      console.error(`Error changing access of ${isDesign ? "design" : "project"}`, error);
      return {
        success: false,
        message: `Failed to change access of ${isDesign ? "design" : "project"}`,
      };
    }
  };

  const handleShowViewCollab = useCallback(() => {
    setShouldOpenViewCollab(true);
    closeShareModal();
    setTimeout(() => {
      setShowViewCollabModal(true);
    }, 100);
  }, []);

  // Make a Copy Functions
  const openCopyModal = (e) => {
    if (e) e.stopPropagation();
    setShowCopyModal(true);
  };

  const closeCopyModal = () => {
    setShowCopyModal(false);
    toggleOptions(id);
  };

  // Make a Copy Modal Action
  const handleCopy = async (design, designVersionId, shareWithCollaborators = false) => {
    if (!designVersionId) {
      return { success: false, message: "Select a version to copy" };
    }
    try {
      const result = await handleCopyDesign(
        design,
        designVersionId,
        shareWithCollaborators,
        user,
        userDoc
      );
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

  // Restore Functions (scrap)

  // Rename Functions
  const openRenameModal = (e) => {
    if (e) e.stopPropagation();
    setShowRenameModal(true);
  };

  const closeRenameModal = () => {
    setShowRenameModal(false);
    toggleOptions(id);
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
      let result;
      if (isDesign) {
        result = await handleNameChangeDesign(object.id, newName, user, userDoc, setIsEditingName);
      } else {
        result = await handleNameChangeProject(object.id, newName, user, userDoc, setIsEditingName);
      }
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
  const openDeleteModal = (e) => {
    if (e) e.stopPropagation();
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    toggleOptions(id);
  };

  const handleDelete = async () => {
    if (isDesign) {
      const result = await handleMoveDesignToTrash(user, userDoc, id);
      if (!result.success) {
        showToast("error", "Failed to move design to trash");
      }
      showToast("success", "Design moved to trash");
      navigate("/trash", {
        state: { navigateFrom: navigateFrom, tab: "Designs", designId: id },
      });
      closeDeleteModal();
    } else {
      const result = await handleMoveProjectToTrash(user, userDoc, id);
      if (!result.success) {
        showToast("error", "Failed to move project to trash");
      }
      showToast("success", "Project moved to trash");
      navigate("/trash", {
        state: { navigateFrom: navigateFrom, tab: "Projects", projectId: id },
      });
      closeDeleteModal();
    }
  };

  // Info Functions
  const handleOpenInfoModal = () => {
    navigate(`/details/${isDesign ? "design" : "project"}/${id}`, {
      state: { navigateFrom: navigateFrom },
    });
  };

  const handleCloseInfoModal = () => {
    // setIsInfoModalOpen(false);
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* Options button */}
      <div className={isTable ? "options-table" : "options"} data-options>
        {!isTable && (
          <h3 className="selectOption">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
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
              isHomepage={true}
              isDrawer={isDrawer}
              isThumbnail={!isTable && !isDrawer}
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
                <div className="icon">
                  <ShareIcon style={{ fontSize: 20 }} />
                </div>
                Share
              </div>
              <div className="dropdown-item" onClick={handleCopyLink}>
                <div className="icon">
                  <CopyLinkIcon style={{ fontSize: 20 }} className="icon" />
                </div>
                Copy Link
              </div>
              <div className="dropdown-item" onClick={handleSettings}>
                <div className="icon">
                  <SettingsIcon style={{ fontSize: 20 }} className="icon" />
                </div>
                Settings
              </div>
              {!((isDrawer || isTable) && isDownloadVisible) && (
                <div className="dropdown-item" onClick={(e) => openDownloadModal(e)}>
                  <div className="icon">
                    <DownloadIcon style={{ fontSize: 20 }} className="icon" />
                  </div>
                  Download
                </div>
              )}
              {!(isDrawer || isTable) && isDesign && isMakeCopyVisible && (
                <div className="dropdown-item" onClick={(e) => openCopyModal(e)}>
                  <div className="icon">
                    <MakeACopyIcon style={{ fontSize: 20 }} className="icon" />
                  </div>
                  Make a copy
                </div>
              )}
              {/* {!(isDrawer || isTable) && isDesign && isRestoreVisible && (
                <div className="dropdown-item" onClick={() => {}}>
                  <div className="icon">
                    <RestoreIcon style={{ fontSize: 20 }} className="icon" />
                  </div>
                  Restore
                </div>
              )} */}
              {isRenameVisible && (
                <div className="dropdown-item" onClick={(e) => openRenameModal(e)}>
                  <div className="icon">
                    <RenameIcon style={{ fontSize: 20 }} className="icon" />
                  </div>
                  Rename
                </div>
              )}
              {isDeleteVisible && (
                <div className="dropdown-item" onClick={(e) => openDeleteModal(e)}>
                  <div className="icon">
                    <DeleteIcon style={{ fontSize: 20 }} className="icon" />
                  </div>
                  Delete
                </div>
              )}
              <div className="dropdown-item" onClick={handleOpenInfoModal}>
                <div className="icon">
                  <DetailsIcon style={{ fontSize: 20 }} className="icon" />
                </div>
                Details
              </div>
            </div>
          ))}
      </div>

      {/* Share */}
      <ShareModal
        isOpen={showShareModal}
        onClose={closeShareModal}
        handleShare={handleShare}
        isDesign={isDesign}
        object={object}
        onShowViewCollab={handleShowViewCollab}
      />
      <ManageAccessModal
        isOpen={showManageAccessModal}
        onClose={closeManageAccessModal}
        handleAccessChange={handleAccessChange}
        isDesign={isDesign}
        object={object}
        isViewCollab={false}
        onShowViewCollab={handleShowViewCollab}
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
        handleDelete={handleDelete}
        isDesign={isDesign}
        object={object}
      />
      {/* Details */}
      <InfoModal isOpen={isInfoModalOpen} onClose={handleCloseInfoModal} />
    </>
  );
}

export default HomepageOptions;
