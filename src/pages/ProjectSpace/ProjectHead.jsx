import React, { useState } from "react";
import { IconButton, Menu, TextField } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { toast } from "react-toastify";
import ShareIcon from "@mui/icons-material/Share";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { signOut } from "firebase/auth";
import ChangeModeMenu from "../../components/ChangeModeMenu.jsx";
import CopyLinkModal from "../../components/CopyLinkModal.jsx";
import DefaultMenu from "../../components/DefaultMenu.jsx";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal.jsx";
import DownloadModal from "../../components/DownloadModal.jsx";
import InfoModal from "../../components/InfoModal.jsx";
import RenameModal from "../../components/RenameModal.jsx";
import RestoreModal from "../../components/RestoreModal.jsx";
import ShareModal from "../../components/ShareModal.jsx";
import ManageAccessModal from "../../components/ManageAccessModal.jsx";
import ShareMenu from "../../components/ShareMenu.jsx";
import MakeCopyModal from "../../components/MakeCopyModal.jsx";
import ShareConfirmationModal from "../../components/ShareConfirmationModal.jsx";
import "../../css/design.css";
import { useEffect } from "react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebase.js";
import DrawerComponent from "../Homepage/DrawerComponent.jsx";
import { useNavigate } from "react-router-dom";
import { useHandleNameChange, useProjectDetails } from "./backend/ProjectDetails";
import { useParams } from "react-router-dom";
import { showToast } from "../../functions/utils.js";
import { handleDeleteProject } from "../Homepage/backend/HomepageActions.jsx";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import { handleNameChange } from "./backend/ProjectDetails";

function ProjectHead({ project }) {
  const { user, userDoc, handleLogout } = useSharedProps();

  const [anchorEl, setAnchorEl] = useState(null);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isChangeModeMenuOpen, setIsChangeModeMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isManageAccessModalOpen, setIsManageAccessModalOpen] = useState(false);
  const [isViewCollabModalOpen, setIsViewCollabModalOpen] = useState(false);
  const [isViewCollab, setIsViewCollab] = useState(true);
  const [isShareConfirmationModalOpen, setIsShareConfirmationModalOpen] = useState(false);
  const [isCopyLinkModalOpen, setIsCopyLinkModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newName, setNewName] = useState(project?.projectName ?? "Untitled Project");
  const [isEditingName, setIsEditingName] = useState(false);

  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [newCollaborator, setNewCollaborator] = useState("");
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [username, setUsername] = useState("");
  const [designs, setDesigns] = useState([]);
  const [userId, setUserId] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const { projectId } = useParams();

  const navigate = useNavigate();

  useProjectDetails(projectId, setUserId, setProjectData, setNewName);

  useEffect(() => {
    // Find access level of the user (to display Manage Access/View Collaborators in ShareMenu)
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
  }, [project, user, userDoc]);

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
    navigate(`/details/project/${projectId}`);
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
    if (isEditingName) {
      handleNameChange();
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode", !darkMode);
  };
  const handleSettings = () => {
    navigate(`/settings/project/${projectId}`);
  };

  // Rename Modal Action
  const handleRename = (newName) => {
    if (project.projectName === newName.trim()) {
      return { success: false, message: "Name is the same as the current name." };
    }
    const result = handleNameChange(projectId, newName, user, setIsEditingName);
    if (result.success) {
      handleClose();
      handleCloseRenameModal();
      return { success: true, message: "Project name updated successfully" };
    } else {
      return { success: false, message: "Failed to update project name" };
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

  return (
    <div className={`designHead stickyMenu ${menuOpen ? "darkened" : ""}`}>
      <DrawerComponent isDrawerOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="left">
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
            <TextField
              placeholder="Design Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleBlur();
                  e.target.blur();
                }
              }}
              autoFocus
              onBlur={handleBlur}
              variant="outlined"
              className="headTitleInput"
              fullWidth
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
          ) : (
            <span onClick={handleInputClick} className="headTitleInput" style={{ height: "20px" }}>
              {projectData?.name || "Untitled"}
            </span>
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
        >
          <ShareIcon onClick={handleOpenShareModal} />
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
              onOpenManageAccessModal={handleOpenManageAccessModal}
              onOpenManageAccessModalView={handleOpenViewCollabModal}
              isViewCollab={isViewCollab}
            />
          ) : isChangeModeMenuOpen ? (
            <ChangeModeMenu onClose={handleClose} onBackToMenu={handleBackToMenu} />
          ) : (
            <DefaultMenu
              isDesign={false}
              onOpenShareModal={handleShareClick}
              onCopyLink={handleCopyLink}
              onSetting={handleSettings}
              onOpenDownloadModal={handleOpenDownloadModal}
              onOpenRenameModal={handleOpenRenameModal}
              onDelete={handleOpenDeleteModal}
              onOpenInfoModal={handleOpenInfoModal}
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
        handleShare={() => {}}
        isDesign={false}
        object={project}
      />
      <ManageAccessModal
        isOpen={isManageAccessModalOpen}
        onClose={handleCloseManageAccessModal}
        handleSave={() => {}}
        isDesign={false}
        object={project}
        isViewCollab={false}
      />
      <ManageAccessModal
        isOpen={isViewCollabModalOpen}
        onClose={handleCloseViewCollabModal}
        handleAccessChange={() => {}}
        isDesign={true}
        object={project}
        isViewCollab={true}
      />
      <ShareConfirmationModal
        isOpen={isShareConfirmationModalOpen}
        onClose={handleCloseShareConfirmationModal}
        collaborators={collaborators}
      />
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
        handleDelete={() => handleDeleteProject(userDoc.id, projectId, navigate)}
        isDesign={false}
        object={project}
      />
      {/* Details */}
      <InfoModal isOpen={isInfoModalOpen} onClose={handleCloseInfoModal} />
    </div>
  );
}

export default ProjectHead;
