import React, { useState } from "react";
import { IconButton, Menu } from "@mui/material";
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
  const [isSecondPage, setIsSecondPage] = useState(false);
  const [role, setRole] = useState("Editor");
  const [notifyPeople, setNotifyPeople] = useState(true);
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

  const handleEditNameToggle = () => {
    setIsEditingName((prev) => !prev);
  };

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      onSnapshot(userRef, (doc) => {
        setUsername(doc.data().username);
      });
    }
  }, [user]);

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

  const handleCloseCopyLinkModal = () => {
    setIsCopyLinkModalOpen(false);
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

  const handleCloseRestoreModal = () => {
    setIsRestoreModalOpen(false);
  };

  const handleOpenInfoModal = () => {
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
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleBlur();
                  e.target.blur();
                }
              }}
              // onBlur={handleBlur} // Save when the input loses focus
              autoFocus // Automatically focus on the input when in edit mode
              className="headTitleInput"
            />
          ) : (
            <span onClick={handleInputClick} className="headTitleInput" style={{ height: "20px" }}>
              {projectData?.name || "Untitled"}
            </span>
          )}
        </div>
      </div>
      <div className="right">
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
