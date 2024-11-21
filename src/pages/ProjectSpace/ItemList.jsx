import React, { useState, useRef, useEffect } from "react";
import { Typography, IconButton } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  DeleteIcon,
  RenameIcon,
  DetailsIcon,
  CopyLinkIcon,
} from "../../components/svg/DefaultMenuIcons";
import { useNavigate } from "react-router-dom";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import CopyLinkModal from "../../components/CopyLinkModal";
import RenameModal from "../../components/RenameModal";

const ItemList = ({ design, projectId, handleDeleteDesign }) => {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCopyLinkModal, setShowCopyLinkModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const optionsRef = useRef(null);

  const handleClick = () => {
    navigate(`/design/${design.id}`, {
      state: { designId: design.id },
    });
  };

  const toggleOptions = (event) => {
    setShowOptions((prev) => !prev);
    setMenuPosition({ top: event.clientY, left: event.clientX });
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setShowOptions(false); // Close options when modal opens
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleDelete = () => {
    handleDeleteDesign(projectId, design.id);
    closeDeleteModal();
  };

  const openCopyLinkModal = () => {
    navigator.clipboard.writeText(`https://yourapp.com/designs/${design.id}`);
    setShowCopyLinkModal(true);
    setShowOptions(false); // Close options when modal opens
  };

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

  return (
    <div className="design-item" onClick={handleClick}>
      <div className="list-content">
        <Typography variant="h6" className="ellipsis-text" style={{ width: "20%" }}>
          {design.name}
        </Typography>
        <Typography variant="body2" className="ellipsis-text">
          Me
        </Typography>
        <Typography variant="body2" className="ellipsis-text">
          Dec 2, 2021
        </Typography>
        <Typography variant="body2" className="ellipsis-text">
          Dec 1, 2021
        </Typography>

        <IconButton
          onClick={(e) => {
            e.stopPropagation(); // Prevent the div click event
            toggleOptions(e); // Toggle the options menu
          }}
        >
          <MoreVertIcon sx={{ color: "var(--color-white)" }} />
        </IconButton>
        {showOptions && (
          <div
            ref={optionsRef}
            className="dropdown-menu"
            style={{ top: menuPosition.top, left: menuPosition.left - 200 }}
          >
            <div className="dropdown-item" onClick={handleClick}>
              <OpenInNewIcon style={{ fontSize: 20 }} className="icon" />
              Open
            </div>
            <div className="dropdown-item" onClick={openDeleteModal}>
              <DeleteIcon style={{ fontSize: 20 }} className="icon" />
              Delete
            </div>
            <div className="dropdown-item" onClick={openCopyLinkModal}>
              <CopyLinkIcon style={{ fontSize: 20 }} className="icon" />
              Copy Link
            </div>
            <div className="dropdown-item" onClick={openRenameModal}>
              <RenameIcon style={{ fontSize: 20 }} className="icon" />
              Rename
            </div>
            <div className="dropdown-item">
              <DetailsIcon style={{ fontSize: 20 }} className="icon" />
              Details
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
};

export default ItemList;
