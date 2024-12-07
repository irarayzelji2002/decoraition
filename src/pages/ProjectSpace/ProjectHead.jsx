import React, { useState, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import { IconButton, Menu, TextField } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { ShareIcon } from "../../components/svg/DefaultMenuIcons.jsx";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ChangeModeMenu from "../../components/ChangeModeMenu.jsx";
import DefaultMenu from "../../components/DefaultMenu.jsx";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal.jsx";
import DownloadModal from "../../components/DownloadModal.jsx";
import InfoModal from "../../components/InfoModal.jsx";
import RenameModal from "../../components/RenameModal.jsx";
import ShareModal from "../../components/ShareModal.jsx";
import ManageAccessModal from "../../components/ManageAccessModal.jsx";
import ShareMenu from "../../components/ShareMenu.jsx";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase";
import { onSnapshot, doc, getDoc } from "firebase/firestore";
import ShareConfirmationModal from "../../components/ShareConfirmationModal.jsx";
import "../../css/design.css";
import { useEffect } from "react";
import DrawerComponent from "../Homepage/DrawerComponent.jsx";
import { useNavigate } from "react-router-dom";
import {
  handleAddCollaborators,
  handleAccessChange as handleAccessChangeProject,
  useHandleNameChange,
  useProjectDetails,
  handleDeleteDesign,
} from "./backend/ProjectDetails";
import { showToast } from "../../functions/utils.js";
import { handleMoveProjectToTrash } from "../Homepage/backend/HomepageActions.jsx";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import { handleNameChange } from "./backend/ProjectDetails";
import { useNetworkStatus } from "../../hooks/useNetworkStatus.js";
import deepEqual from "deep-equal";
import _ from "lodash";
import { highlightName } from "../../components/DesignHead.jsx";

function ProjectHead({ project, changeMode = "Viewing", setChangeMode }) {
  const { user, userDoc, handleLogout, notificationUpdate } = useSharedProps();
  const { projectId } = useParams();
  const isOnline = useNetworkStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const navigateFrom = location.pathname;

  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorElShare, setAnchorElShare] = useState(null);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

  const [isChangeModeMenuOpen, setIsChangeModeMenuOpen] = useState(false);
  const [isChangeModeVisible, setIsChangeModeVisible] = useState(false);
  const [role, setRole] = useState(null); //0 for viewer (default), 1 for editor, 2 for commenter, 3 for owner

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isManageAccessModalOpen, setIsManageAccessModalOpen] = useState(false);
  const [isViewCollabModalOpen, setIsViewCollabModalOpen] = useState(false);
  const [isViewCollab, setIsViewCollab] = useState(true);
  const [isShareConfirmationModalOpen, setIsShareConfirmationModalOpen] = useState(false);
  const [shouldOpenViewCollab, setShouldOpenViewCollab] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);

  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDownloadVisible, setIsDownloadVisible] = useState(false);

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isRenameVisible, setIsRenameVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [newCollaborator, setNewCollaborator] = useState("");
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!project || !user || !userDoc) return;

    let newRole = 0;

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

    setNewName(project?.projectName ?? "Untitled Project");
    // Set role and all dependent flags
    setRole(newRole);
    setIsViewCollab(newRole < 3);
    setIsChangeModeVisible(newRole > 0);
    setIsRenameVisible((newRole === 2 || newRole === 3) && changeMode === "Managing");
    setIsDeleteVisible(newRole === 3 && changeMode === "Managing");
    // Set visibility based on project settings
    setIsDownloadVisible(!!project?.projectSettings?.allowDownload || newRole > 0);

    handleDefaultChangeMode(newRole);
  }, [project, user, userDoc, changeMode]);

  useEffect(() => {
    console.log("ProjectHead - changeMode role:", role);
    console.log("ProjectHead - changeMode:", changeMode);
  }, [role, changeMode]);

  const handleDefaultChangeMode = (role) => {
    if (!role) return;
    if (role === 3) {
      if (!location?.state?.changeMode) setChangeMode("Managing");
    } else if (role === 2) {
      if (!location?.state?.changeMode || location?.state?.changeMode === "Managing")
        setChangeMode("Managing Content");
    } else if (role === 1) {
      if (
        !location?.state?.changeMode ||
        location?.state?.changeMode === "Managing" ||
        location?.state?.changeMode === "Managing Content"
      )
        setChangeMode("Contributing");
    } else if (role === 0) {
      if (
        !location?.state?.changeMode ||
        location?.state?.changeMode === "Managing" ||
        location?.state?.changeMode === "Managing Content" ||
        location?.state?.changeMode === "Contributing"
      )
        setChangeMode("Viewing");
    }
  };

  useEffect(() => {
    handleDefaultChangeMode(role);
  }, [role]);

  useEffect(() => {
    if (shouldOpenViewCollab && !isManageAccessModalOpen) {
      setIsViewCollabModalOpen(true);
      setShouldOpenViewCollab(false);
    }
  }, [shouldOpenViewCollab, isManageAccessModalOpen]);

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

  const handleCloseShare = () => {
    setAnchorElShare(null);
    setIsShareMenuOpen(false);
  };

  const handleShareClick = (event) => {
    console.log("Share clicked");
    console.log("anchorEl", anchorEl);
    setAnchorElShare(event.currentTarget);
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
  };

  const handleOpenManageAccessModal = () => {
    setIsManageAccessModalOpen(true);
    handleClose();
  };

  const handleCloseManageAccessModal = () => {
    setIsManageAccessModalOpen(false);
  };

  const handleOpenViewCollabModal = () => {
    setIsViewCollabModalOpen(true);
    handleClose();
  };

  const handleCloseViewCollabModal = () => {
    setIsViewCollabModalOpen(false);
  };

  const handleAddCollaborator = () => {
    if (newCollaborator.trim() !== "") {
      setCollaborators([...collaborators, newCollaborator]);
      setNewCollaborator("");
    }
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
    handleClose();
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleOpenDownloadModal = () => {
    setIsDownloadModalOpen(true);
    handleClose();
  };

  const handleCloseDownloadModal = () => {
    setIsDownloadModalOpen(false);
  };

  const handleOpenRenameModal = () => {
    setIsRenameModalOpen(true);
    handleClose();
  };

  const handleCloseRenameModal = () => {
    setIsRenameModalOpen(false);
  };

  const handleOpenInfoModal = () => {
    handleClose();
    navigate(`/details/project/${projectId}`, {
      state: { navigateFrom: navigateFrom },
    });
  };

  const handleCloseInfoModal = () => {
    // setIsInfoModalOpen(false);
  };
  const handleInputClick = () => {
    // Enable edit mode when the input is clicked
    handleEditNameToggle();
  };

  // Rename Navbar Action
  const handleBlur = async () => {
    // Save the name when the user clicks away from the input field
    if (!isEditingName) {
      return;
    }
    const result = await handleRename(newName);
    if (!result.success) showToast("error", result.message);
    else showToast("success", result.message);
    setIsEditingName(false);
  };

  // Add Collaborators Modal Action
  const handleShare = async (project, emails, role, message, notifyPeople = false) => {
    if (emails.length === 0) {
      return { success: false, message: "No email addresses added" };
    }
    if (role < 0 || role > 4) {
      return { success: false, message: "Select a valid role" };
    }
    try {
      const result = await handleAddCollaborators(
        project,
        emails,
        role,
        message,
        notifyPeople,
        user,
        userDoc
      );
      if (result.success) {
        handleClose();
        handleCloseShareModal();
        return { success: true, message: "Project shared to collaborators" };
      } else {
        return { success: false, message: "Failed to share project to collaborators" };
      }
    } catch (error) {
      console.error("Error sharing project:", error);
      return { success: false, message: "Failed to share project to collaborators" };
    }
  };

  // Manage Access Modal Action
  const handleAccessChange = async (
    project,
    initEmailsWithRole,
    emailsWithRole,
    generalAccessSetting,
    generalAccessRole
  ) => {
    if (
      deepEqual(initEmailsWithRole, emailsWithRole) &&
      generalAccessSetting === project?.projectSettings?.generalAccessSetting &&
      generalAccessRole === project?.projectSettings?.generalAccessRole
    ) {
      return { success: false, message: "Nothing changed" };
    }
    try {
      const result = await handleAccessChangeProject(
        project,
        initEmailsWithRole,
        emailsWithRole,
        generalAccessSetting,
        generalAccessRole,
        user,
        userDoc
      );
      if (result.success) {
        handleClose();
        handleCloseManageAccessModal();
        return { success: true, message: "Project access changed" };
      } else {
        return { success: false, message: "Failed to change access of project" };
      }
    } catch (error) {
      console.error("Error changing access of project:", error);
      return { success: false, message: "Failed to change access of project" };
    }
  };

  const handleShowViewCollab = useCallback(() => {
    setShouldOpenViewCollab(true);
    handleCloseManageAccessModal();
    setTimeout(() => {
      setIsViewCollabModalOpen(true);
    }, 100);
  }, []);

  // Rename Modal Action
  const handleRename = async (newName) => {
    if (project.projectName === newName.trim()) {
      return { success: false, message: "Name is the same as the current name." };
    }
    const result = await handleNameChange(projectId, newName, user, userDoc, setIsEditingName);
    if (result.success) {
      setNewName(newName);
      return { success: true, message: "Project name updated successfully" };
    } else {
      return { success: false, message: "Failed to update project name" };
    }
  };

  // Delete Modal Action
  const handleDelete = async () => {
    const result = await handleMoveProjectToTrash(user, userDoc, project.id);
    if (!result.success) {
      showToast("error", "Failed to move project to trash");
    }
    showToast("success", "Project moved to trash");
    navigate("/trash", {
      state: { navigateFrom: navigateFrom, tab: "Projects", projectId: project.id },
    });
    handleCloseDeleteModal();
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

  // Navigate to settings
  const handleSettings = () => {
    navigate(`/settings/project/${projectId}`, {
      state: { navigateFrom: navigateFrom },
    });
  };

  // Notification highlight
  const highlightProjectName = (projectName) => {
    console.log("project head - attempting to highlight project name");
    const nameElement = document.querySelector(".project-name");
    console.log("project head - found nameElement:", nameElement);

    if (nameElement) {
      nameElement.scrollIntoView({ behavior: "smooth" });
      nameElement.classList.add("highlight-animation");
      setTimeout(() => {
        nameElement.classList.remove("highlight-animation");
      }, 3000);
    } else {
      console.log("project head - nameElement not found in DOM, retrying in 500ms");
      setTimeout(() => {
        const retryElement = document.querySelector(".project-name");
        console.log("project head - retry found nameElement:", retryElement);
        if (retryElement) {
          retryElement.scrollIntoView({ behavior: "smooth" });
          retryElement.classList.add("highlight-animation");
          setTimeout(() => {
            retryElement.classList.remove("highlight-animation");
          }, 3000);
        }
      }, 500);
    }
  };

  useEffect(() => {
    const handleNotificationActions = async () => {
      console.log("notif (project head) - handleNotificationActions called - project:", project);
      if (!project) return;

      const pendingActions = localStorage.getItem("pendingNotificationActions");
      console.log("notif (project head) - pendingActions from localStorage:", pendingActions);

      if (pendingActions) {
        try {
          const parsedActions = JSON.parse(pendingActions);
          console.log("notif (project head) - parsed pendingActions:", parsedActions);

          const { actions, references, timestamp, completed, type, title } = parsedActions;

          const uniqueCompleted = completed.reduce((acc, current) => {
            const x = acc.find((item) => item.index === current.index);
            if (!x) return acc.concat([current]);
            return acc;
          }, []);

          for (const [index, action] of actions.entries()) {
            console.log("notif (project head) - Processing action:", action, "at index:", index);

            const isAlreadyCompleted = uniqueCompleted.some((c) => c.index === index);
            if (isAlreadyCompleted) {
              console.log(`notif (project head) - Action at index ${index} already completed`);
              continue;
            }

            const previousActionsCompleted =
              uniqueCompleted.filter((c) => c.index < index).length === index;
            console.log(
              "notif (project head) - previousActionsCompleted:",
              previousActionsCompleted
            );

            if (action === "Highlight project name" && previousActionsCompleted) {
              highlightProjectName(project.projectName);
              uniqueCompleted.push({ action, index, timestamp });
              localStorage.setItem(
                "pendingNotificationActions",
                JSON.stringify({
                  actions,
                  references,
                  timestamp,
                  completed: uniqueCompleted,
                  type,
                  title,
                })
              );
            } else if (action === "Open view collaborators modal" && previousActionsCompleted) {
              setIsViewCollabModalOpen(true);
              uniqueCompleted.push({ action, index, timestamp });
              localStorage.setItem(
                "pendingNotificationActions",
                JSON.stringify({
                  actions,
                  references,
                  timestamp,
                  completed: uniqueCompleted,
                  type,
                  title,
                })
              );
            }

            if (index === actions.length - 1 && uniqueCompleted.length === actions.length) {
              console.log(
                "notif (project head) - Removing pendingNotificationActions from localStorage"
              );
              localStorage.removeItem("pendingNotificationActions");
            }
          }
        } catch (error) {
          console.error("Error processing notification actions:", error);
        }
      }
    };

    handleNotificationActions();
  }, [project, notificationUpdate]);

  return (
    <div className={`designHead stickyMenu ${menuOpen ? "darkened" : ""}`}>
      <DrawerComponent
        isDrawerOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        isNotifOpen={isNotifOpen}
        setIsNotifOpen={setIsNotifOpen}
      />
      <div className="left" style={{ width: "calc(100% - 88px)" }}>
        <IconButton
          size="large"
          edge="start"
          color="var(--color-white)"
          aria-label="open drawer"
          onClick={setDrawerOpen}
          sx={{
            backgroundColor: "transparent",
            margin: "3px 5px 3px -5px",
            "&:hover": {
              backgroundColor: "var(--iconButtonHover)",
            },
            "& .MuiTouchRipple-root span": {
              backgroundColor: "var(--iconButtonActive)",
            },
          }}
        >
          <MenuIcon sx={{ color: "var(--color-white)" }} />
        </IconButton>
        <div className="design-name-section">
          {isEditingName ? (
            <>
              <TextField
                placeholder="Project Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.target.blur();
                  }
                }}
                autoFocus
                onBlur={handleBlur}
                variant="outlined"
                className="headTitleInput headTitle"
                fullWidth
                inputProps={{ maxLength: 20 }}
                sx={{
                  backgroundColor: "transparent",
                  input: { color: "var(--color-white)" },
                  padding: "0px",
                  marginTop: "3px",
                  "& .MuiOutlinedInput-root": {
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    padding: "8px 15px",
                    borderRadius: "8px",
                    "& fieldset": {
                      borderColor: "var( --borderInput)",
                    },
                    "&:hover fieldset": {
                      borderColor: "var( --borderInput)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "var(--borderInputBrighter)",
                    },
                    "& input": {
                      padding: 0,
                    },
                  },
                }}
              />
              {newName?.length >= 20 && (
                <div style={{ color: "var(--errorText)", fontSize: "0.8rem", marginTop: "5px" }}>
                  Character limit reached!
                </div>
              )}
            </>
          ) : (
            <div onClick={handleInputClick} className="navhead project-name">
              <span className="headTitleInput" style={{ height: "20px" }}>
                {project?.projectName || "Untitled Project"}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="right">
        <IconButton
          sx={{
            color: "var(--color-white)",
            "&:hover": {
              backgroundColor: "var(--iconButtonHover)",
            },
            "& .MuiTouchRipple-root span": {
              backgroundColor: "var(--iconButtonActive)",
            },
          }}
          onClick={handleShareClick}
        >
          <ShareIcon />
        </IconButton>
        <IconButton
          sx={{
            color: "var(--color-white)",
            "&:hover": {
              backgroundColor: "var(--iconButtonHover)",
            },
            "& .MuiTouchRipple-root span": {
              backgroundColor: "var(--iconButtonActive)",
            },
          }}
          onClick={handleClick}
        >
          <MoreVertIcon />
        </IconButton>
        {!isOnline && (
          <div className="offline-bar">You are offline. Please check your internet connection.</div>
        )}
        {anchorEl === null && isShareMenuOpen && (
          <Menu
            anchorEl={anchorElShare}
            open={Boolean(anchorElShare)}
            onClose={handleCloseShare}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  overflow: "hidden",
                  filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                  mt: 1.5,
                  backgroundColor: "var(--nav-card-modal)",
                  color: "var(--color-white)",
                  minWidth: "220px",
                  top: "62px !important",
                  right: "0px !important",
                  left: "auto !important",
                  borderTopLeftRadius: "0px",
                  borderTopRightRadius: "0px",
                  borderBottomLeftRadius: "10px",
                  borderBottomRightRadius: "0px",
                  "& .MuiList-root": {
                    overflow: "hidden",
                  },
                },
              },
            }}
            MenuListProps={{
              sx: {
                color: "var(--color-white)",
                padding: "0px !important",
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <ShareMenu
              onClose={handleCloseShare}
              onBackToMenu={handleCloseShare}
              onOpenShareModal={handleOpenShareModal}
              onOpenManageAccessModal={handleOpenManageAccessModal}
              onOpenManageAccessModalView={handleOpenViewCollabModal}
              isViewCollab={isViewCollab}
              isFromMenu={false}
            />
          </Menu>
        )}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                overflow: "hidden",
                filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                mt: 1.5,
                backgroundColor: "var(--nav-card-modal)",
                color: "var(--color-white)",
                minWidth: "220px",
                top: "62px !important",
                right: "0px !important",
                left: "auto !important",
                borderTopLeftRadius: "0px",
                borderTopRightRadius: "0px",
                borderBottomLeftRadius: "10px",
                borderBottomRightRadius: "0px",
                "& .MuiList-root": {
                  overflow: "hidden",
                },
              },
            },
          }}
          MenuListProps={{
            sx: {
              color: "var(--color-white)",
              padding: "0px !important",
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          {isShareMenuOpen ? (
            <ShareMenu
              onClose={handleClose}
              onBackToMenu={handleBackToMenu}
              onOpenShareModal={handleOpenShareModal}
              onOpenManageAccessModal={handleOpenManageAccessModal}
              onOpenManageAccessModalView={handleOpenViewCollabModal}
              isViewCollab={isViewCollab}
            />
          ) : isChangeModeMenuOpen ? (
            <ChangeModeMenu
              onClose={handleClose}
              onBackToMenu={handleBackToMenu}
              role={role}
              changeMode={changeMode}
              setChangeMode={setChangeMode}
              isDesign={false}
            />
          ) : (
            <DefaultMenu
              isDesign={false}
              onOpenShareModal={handleShareClick}
              onCopyLink={handleCopyLink}
              onSetting={handleSettings}
              onChangeMode={handleChangeModeClick}
              changeMode={changeMode}
              onOpenDownloadModal={handleOpenDownloadModal}
              onOpenRenameModal={handleOpenRenameModal}
              onDelete={handleOpenDeleteModal}
              onOpenInfoModal={handleOpenInfoModal}
              projectSettingsVisibility={{
                isDownloadVisible,
                isRenameVisible,
                isDeleteVisible,
                isChangeModeVisible,
              }}
            />
          )}
        </Menu>
      </div>
      {/* Share */}
      {/* <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleCloseShareModal}
        onAddCollaborator={handleAddCollaborator}
        onShareProject={handleShareProject}
        collaborators={collaborators}
        newCollaborator={newCollaborator}
        isDesign={false}
      /> */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleCloseShareModal}
        handleShare={handleShare}
        isDesign={false}
        object={project}
        onShowViewCollab={handleShowViewCollab}
      />
      <ManageAccessModal
        isOpen={isManageAccessModalOpen}
        onClose={handleCloseManageAccessModal}
        handleAccessChange={handleAccessChange}
        isDesign={false}
        object={project}
        isViewCollab={false}
        onShowViewCollab={handleShowViewCollab}
      />
      <ManageAccessModal
        isOpen={isViewCollabModalOpen}
        onClose={handleCloseViewCollabModal}
        handleAccessChange={() => {}}
        isDesign={false}
        object={project}
        isViewCollab={true}
      />
      {/* <ShareConfirmationModal
        isOpen={isShareConfirmationModalOpen}
        onClose={handleCloseShareConfirmationModal}
        collaborators={collaborators}
      /> */}
      {/* Copy Link (No Modal) */}
      {/* Settings (No Modal) */}
      {/* Download */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={handleCloseDownloadModal}
        isDesign={false}
        object={project}
      />
      {/* Rename */}
      <RenameModal
        isOpen={isRenameModalOpen}
        onClose={handleCloseRenameModal}
        handleRename={handleRename}
        isDesign={false}
        object={project}
      />
      {/* Delete */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        handleDelete={handleDelete}
        isDesign={false}
        object={project}
      />
      {/* Details */}
      <InfoModal isOpen={isInfoModalOpen} onClose={handleCloseInfoModal} />
    </div>
  );
}

export default ProjectHead;
