import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { DeleteForeverIcon, RestoreIcon } from "../../components/svg/DefaultMenuIcons";
import { CloseRounded, MoreVert as MoreVertIcon } from "@mui/icons-material";
import {
  dialogStyles,
  dialogTitleStyles,
  dialogContentStyles,
  dialogActionsStyles,
} from "../../components/RenameModal";
import { gradientButtonStyles, outlinedButtonStyles } from "../DesignSpace/PromptBar";
import {
  formatDateDetailComma,
  handleDeleteDesign,
  handleDeleteProject,
  handleRestoreDesign,
  handleRestoreProject,
} from "../Homepage/backend/HomepageActions";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { showToast } from "../../functions/utils";

function TrashOptions({
  isDesign,
  id,
  object,
  isTable = false,
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
  const { user, userDoc } = useSharedProps();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const optionsRef = useRef(null);

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
    }
  };

  const openDeleteModal = (e) => {
    if (e) e.stopPropagation();
    setShowDeleteModal(true);
  };
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    toggleOptions(id);
  };

  const handleRestore = async (id) => {
    if (isDesign) {
      const result = await handleRestoreDesign(user, userDoc, id);
      if (!result.success) {
        showToast("error", "Failed to restore design");
      }
      showToast("success", "Design restored");
      navigate("/seeAllDesigns", {
        state: { navigateFrom: navigateFrom, designId: id },
      });
    } else {
      const result = await handleRestoreProject(user, userDoc, id);
      if (!result.success) {
        showToast("error", "Failed to restore project");
      }
      showToast("success", "Project restored");
      navigate("/seeAllProjects", {
        state: { navigateFrom: navigateFrom, projectId: id },
      });
    }
  };

  const handleDelete = async () => {
    if (isDesign) {
      const result = await handleDeleteDesign(user, userDoc, id);
      if (!result.success) {
        showToast("error", "Failed to delete design");
      }
      showToast("success", "Design deleted");
      closeDeleteModal();
    } else {
      const result = await handleDeleteProject(user, userDoc, id);
      if (!result.success) {
        showToast("error", "Failed to delete project");
      }
      showToast("success", "Project deleted");
      closeDeleteModal();
    }
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
        {optionsState.showOptions && optionsState.selectedId === id && (
          <div
            ref={optionsRef}
            className={`dropdown-menu ${isTable ? "table" : ""}`}
            style={{
              position: "absolute",
              top: isTable ? "0" : "0",
              marginTop: isTable ? "0" : "10px",
            }}
          >
            <div
              className="dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                handleRestore(id);
              }}
            >
              <div className="icon">
                <RestoreIcon style={{ fontSize: 20 }} className="icon" />
              </div>
              Restore
            </div>
            <div className="dropdown-item" onClick={(e) => openDeleteModal(e)}>
              <div className="icon">
                <DeleteForeverIcon style={{ fontSize: 20 }} className="icon" />
              </div>
              Delete permanently
            </div>
          </div>
        )}
      </div>

      {/* Delete */}
      <ConfirmDeleteForeverModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        handleDelete={handleDelete}
        isDesign={isDesign}
        object={object}
      />
    </>
  );
}

export default TrashOptions;

// Delete confirmation modal
const ConfirmDeleteForeverModal = ({
  isOpen,
  onClose,
  object,
  isDesign,
  handleDelete,
  isDeleteBtnDisabled,
}) => {
  const onSubmit = () => {
    handleDelete();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} sx={dialogStyles}>
      <DialogTitle sx={dialogTitleStyles}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: "bold",
            fontSize: "1.15rem",
            flexGrow: 1,
            maxWidth: "80%",
            whiteSpace: "normal",
          }}
        >
          Delete {isDesign ? "design" : "project"} permanently
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            ...iconButtonStyles,
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          <CloseRounded />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={dialogContentStyles}>
        <Typography variant="body1" sx={{ marginBottom: "10px", textAlign: "center" }}>
          Are you sure you want to delete your{" "}
          {isDesign ? `design "${object?.designName}"` : `project "${object?.projectName}"`} trashed{" "}
          {formatDateDetailComma(object?.deletedAt)?.includes(",") ? "at " : ""}$
          {formatDateDetailComma(object?.deletedAt)} permanently?
        </Typography>
      </DialogContent>
      <DialogActions sx={dialogActionsStyles}>
        <Button
          fullWidth
          variant="contained"
          onClick={onSubmit}
          sx={{
            ...gradientButtonStyles,
            opacity: isDeleteBtnDisabled ? "0.5" : "1",
            cursor: isDeleteBtnDisabled ? "default" : "pointer",
            "&:hover": {
              backgroundImage: !isDeleteBtnDisabled && "var(--gradientButtonHover)",
            },
          }}
          disabled={isDeleteBtnDisabled}
        >
          Yes
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={outlinedButtonStyles}
          onMouseOver={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButtonHover)")
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
          }
        >
          No
        </Button>
      </DialogActions>
    </Dialog>
  );
};
