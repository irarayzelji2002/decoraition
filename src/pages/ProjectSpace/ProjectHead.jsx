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

function ProjectHead({ designName }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isChangeModeMenuOpen, setIsChangeModeMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isShareConfirmationModalOpen, setIsShareConfirmationModalOpen] = useState(false);
  const [isCopyLinkModalOpen, setIsCopyLinkModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [newCollaborator, setNewCollaborator] = useState("");
  const [isSecondPage, setIsSecondPage] = useState(false);
  const [role, setRole] = useState("Editor");
  const [notifyPeople, setNotifyPeople] = useState(true);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [tempName, setTempName] = useState(designName);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [designs, setDesigns] = useState([]);
  const [userId, setUserId] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [newName, setNewName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const { projectId } = useParams();

  const navigate = useNavigate();

  useProjectDetails(projectId, setUserId, setProjectData, setNewName);
  const handleNameChange = useHandleNameChange(newName, userId, projectId, setIsEditingName);

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
    setIsInfoModalOpen(true);
  };

  const handleCloseInfoModal = () => {
    setIsInfoModalOpen(false);
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
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigate("/");
      })
      .catch((error) => {
        console.error("Sign-out error:", error);
      });
  };
  const handleSettings = () => {
    navigate(`/projSetting/${projectId}`);
  };

  const handleCopyLink = () => {
    const currentLink = window.location.href; // Get the current URL
    navigator.clipboard
      .writeText(currentLink)
      .then(() => {
        toast.success("Link copied to clipboard!", {
          className: "custom-toast-success", // Apply custom success class
        }); // Show toast notification
      })
      .catch((err) => {
        toast.error("Failed to copy link.", {
          className: "custom-toast-success", // Apply custom success class
        }); // Show error toast notification
        console.error("Failed to copy: ", err);
      });
  };

  return (
    <div className={`designHead stickyMenu ${menuOpen ? "darkened" : ""}`}>
      <DrawerComponent
        isDrawerOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        toggleDarkMode={toggleDarkMode}
        handleLogout={handleLogout}
        handleSettings={handleSettings}
        darkMode={darkMode}
        username={username}
        userEmail={user ? user.email : ""}
        designs={designs}
      />
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
              project={true}
              onClose={handleClose}
              onCopyLink={handleCopyLink}
              onOpenDownloadModal={handleOpenDownloadModal}
              onOpenRenameModal={handleOpenRenameModal}
              onSetting={handleSettings}
              onOpenInfoModal={handleOpenInfoModal}
              onOpenShareModal={handleShareClick}
              onDelete={handleOpenDeleteModal}
              onChangeMode={handleChangeModeClick}
            />
          )}
        </Menu>
      </div>
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
      <CopyLinkModal isOpen={isCopyLinkModalOpen} onClose={handleCloseCopyLinkModal} />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={handleDelete}
      />
      <DownloadModal isOpen={isDownloadModalOpen} onClose={handleCloseDownloadModal} />
      <RenameModal isOpen={isRenameModalOpen} onClose={handleCloseRenameModal} />
      <RestoreModal isOpen={isRestoreModalOpen} onClose={handleCloseRestoreModal} />
      <InfoModal isOpen={isInfoModalOpen} onClose={handleCloseInfoModal} />
    </div>
  );
}

export default ProjectHead;
