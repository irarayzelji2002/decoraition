import React, { useState, useRef, useEffect } from "react";
import "../../css/homepage.css";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../functions/utils";
import { handleDeleteDesign, handleDeleteProject } from "./backend/HomepageActions";
import { useSharedProps } from "../../contexts/SharedPropsContext";

import ShareModal from "../../components/ShareModal";
import CopyLinkModal from "../../components/CopyLinkModal";
import MakeCopyModal from "../../components/MakeCopyModal";
import RenameModal from "../../components/RenameModal";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import InfoModal from "../../components/InfoModal";

import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import {
  OpenInNew as OpenInNewIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Link as LinkIcon,
  Share as ShareIcon,
  FileCopy as FileCopyIcon,
} from "@mui/icons-material";
import DriveFileRenameOutlineRoundedIcon from "@mui/icons-material/DriveFileRenameOutlineRounded";

function HomepageOptions({
  isDesign,
  id,
  onOpen,
  isTable = false,
  optionsState = {},
  setOptionsState = () => {},
  clickedId,
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
  const { appURL, userDoc } = useSharedProps();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCopyLinkModal, setShowCopyLinkModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const optionsRef = useRef(null);

  const handleToggleOptions = (id) => {
    setClickedId(id);
    if (clickedId === id) {
      setClickedId(null);
    }
  };

  const handleClickOutside = (event) => {
    if (optionsRef.current && !optionsRef.current.contains(event.target)) {
      toggleOptions(id);
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

  // Copy Link Functions
  const openCopyLinkModal = () => {
    navigator.clipboard.writeText(`${appURL}/${isDesign ? "design" : "project"}/${id}`);
    showToast("success", "Link copied to clipboard");
    // setShowCopyLinkModal(true);
    toggleOptions(id);
  };

  const closeCopyLinkModal = () => {
    setShowCopyLinkModal(false);
  };

  // Make a Copy Functions
  const openCopyModal = () => {
    setShowCopyModal(true);
    toggleOptions(id);
  };

  const closeCopyModal = () => {
    setShowCopyModal(false);
  };

  // Rename Functions
  const openRenameModal = () => {
    setShowRenameModal(true);
    toggleOptions(id);
  };

  const closeRenameModal = () => {
    setShowRenameModal(false);
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

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
        {optionsState.showOptions && optionsState.selectedId === id && (
          <div
            ref={optionsRef}
            className="dropdown-menu"
            style={{
              marginRight: isTable ? "-50px" : !isTable ? "-10px" : "",
              marginTop: isTable ? "6px" : !isTable ? "10px" : "",
              top: !isTable ? "100%" : "",
            }}
          >
            <div className="dropdown-item" onClick={onOpen}>
              <OpenInNewIcon style={{ fontSize: 20 }} className="icon" />
              Open
            </div>
            <div className="dropdown-item" onClick={openShareModal}>
              <ShareIcon style={{ fontSize: 20 }} className="icon" />
              Share
            </div>
            <div className="dropdown-item" onClick={openCopyLinkModal}>
              <LinkIcon style={{ fontSize: 20 }} className="icon" />
              Copy Link
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
            <div className="dropdown-item">
              <InfoIcon style={{ fontSize: 20 }} className="icon" />
              Details
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ShareModal isOpen={showShareModal} onClose={closeShareModal} />

      <CopyLinkModal isOpen={showCopyLinkModal} onClose={closeCopyModal} />

      <MakeCopyModal isOpen={showCopyModal} onClose={closeCopyLinkModal} />

      <RenameModal isOpen={showRenameModal} onClose={closeRenameModal} />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onDelete={() => handleDelete(userDoc.id, id, navigate)}
      />
    </>
  );
}

export default HomepageOptions;
