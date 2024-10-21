import React, { useState, useRef, useEffect } from "react";
import "../css/homepage.css";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import CopyLinkModal from "./CopyLinkModal";
import RenameModal from "./RenameModal";
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

function DesignIcon({ name, designId, onOpen, onDelete }) {
  const [showOptions, setShowOptions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCopyLinkModal, setShowCopyLinkModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const optionsRef = useRef(null);

  // Toggle the visibility of options
  const toggleOptions = () => {
    setShowOptions((prev) => !prev);
  };

  const openShareModal = () => {
    setShowShareModal(true);
    setShowOptions(false);
  };

  const openCopyModal = () => {
    setShowCopyModal(true);
    setShowOptions(false);
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setShowOptions(false); // Close options when modal opens
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleDelete = () => {
    onDelete(designId);
    closeDeleteModal();
  };

  const openCopyLinkModal = () => {
    // Simulate copying the link (may implement actual copy logic here)
    navigator.clipboard.writeText(`https://yourapp.com/designs/${designId}`);
    setShowCopyLinkModal(true);
    setShowOptions(false); // Close options when modal opens
  };

  const handleClickOutside = (event) => {
    if (optionsRef.current && !optionsRef.current.contains(event.target)) {
      setShowOptions(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const closeCopyLinkModal = () => {
    setShowCopyLinkModal(false);
  };

  const openRenameModal = () => {
    setShowRenameModal(true);
    setShowOptions(false); // Close options when modal opens
  };

  const closeRenameModal = () => {
    setShowRenameModal(false);
  };

  return (
    <div className="iconFrame">
      {/* Options button */}
      <div className="options" onClick={toggleOptions}>
        <h3 className="selectOption">
          <center>&#8942;</center>
        </h3>
        {showOptions && (
          <div ref={optionsRef} className="dropdown-menu">
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
            <div className="dropdown-item" onClick={openCopyModal}>
              <FileCopyIcon style={{ fontSize: 20 }} className="icon" />
              Make a copy
            </div>
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

      {/* TO DO: Add Share Modal */}

      {/* TO DO: Make a copy Modal */}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onDelete={handleDelete}
      />

      {/* Copy Link Modal */}
      <CopyLinkModal isOpen={showCopyLinkModal} onClose={closeCopyLinkModal} />

      {/* Rename Modal */}
      <RenameModal isOpen={showRenameModal} onClose={closeRenameModal} />

      {/* Design image */}
      <img
        src={"/img/Room1.png"}
        className="pic"
        alt="Design"
        onClick={onOpen}
        style={{ objectFit: "cover", objectPosition: "top left" }}
      />

      {/* Design title */}
      <div width="100%" style={{ textAlign: "start" }}>
        <h3 className="titleDesign">{name}</h3>
        <span className="dateModified">Modified on September 1, 2022</span>
      </div>
    </div>
  );
}

export default DesignIcon;
