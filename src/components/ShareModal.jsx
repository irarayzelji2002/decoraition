import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  Divider,
  IconButton,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import EmailInput from "./EmailInput";
import { Avatar } from "@mui/material";
import { showToast } from "../functions/utils";
import { iconButtonStyles } from "../pages/Homepage/DrawerComponent";
import { gradientButtonStyles, outlinedButtonStyles } from "../pages/DesignSpace/PromptBar";
import {
  dialogStyles,
  dialogTitleStyles,
  dialogContentStyles,
  dialogActionsStyles,
} from "./RenameModal";
import { CheckboxIcon, CheckboxCheckedIcon } from "./svg/SharedIcons";
import { useSharedProps } from "../contexts/SharedPropsContext";

const ShareModal = ({
  isOpen,
  onClose,
  handleShare,
  isDesign,
  object,
  onShowViewCollab = () => {},
}) => {
  // object is design if isDesign is true, else it is project
  const { users, isDarkMode } = useSharedProps();
  const [roles, setRoles] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  // Design: 0 for viewer, 1 for editor (default), 2 for commenter, 3 for owner
  // Project: 0 for viewer, 1 for contributor (default), 2 for content manager, 3 for manager

  const [emails, setEmails] = useState([]);
  const [role, setRole] = useState(1);
  const [message, setMessage] = useState("");
  const [messageCharCount, setMessageCharCount] = useState(0);
  const maxChars = 1000;
  const [notifyPeople, setNotifyPeople] = useState(false);

  const [error, setError] = useState("");
  const [isShareBtnDisabled, setIsShareBtnDisabled] = useState(false);

  // Initialize collaborators
  useEffect(() => {
    if (!isOpen || !users) return;

    if (isDesign) {
      const design = object;
      const collaborators = [];

      // Add owner
      const ownerUser = users.find(
        (user) => user.id === design.owner || user.id === design.ownerId
      );
      if (ownerUser) collaborators.push(ownerUser);
      // Add editors
      design.editors?.forEach((editorId) => {
        const editorUser = users.find((user) => user.id === editorId);
        if (editorUser) collaborators.push(editorUser);
      });
      // Add commenters
      design.commenters?.forEach((commenterId) => {
        const commenterUser = users.find((user) => user.id === commenterId);
        if (commenterUser) {
          collaborators.push(commenterUser);
        }
      });
      // Add viewers
      design.viewers?.forEach((viewerId) => {
        const viewerUser = users.find((user) => user.id === viewerId);
        if (viewerUser) {
          collaborators.push(viewerUser);
        }
      });
      console.log("share - collaborators", collaborators);
      setCollaborators(collaborators);
    } else {
      const project = object;
      const collaborators = [];

      // Add managers
      project.managers?.forEach((managerId) => {
        const managerUser = users.find((user) => user.id === managerId);
        if (managerUser) collaborators.push(managerUser);
      });
      // Add content managers
      project.contentManagers?.forEach((contentManagerId) => {
        const contentManagerUser = users.find((user) => user.id === contentManagerId);
        if (contentManagerUser) collaborators.push(contentManagerUser);
      });
      // Add contributors
      project.contributors?.forEach((contributorId) => {
        const contributorUser = users.find((user) => user.id === contributorId);
        if (contributorUser) collaborators.push(contributorUser);
      });
      // Add viewers
      project.viewers?.forEach((viewerId) => {
        const viewerUser = users.find((user) => user.id === viewerId);
        if (viewerUser) collaborators.push(viewerUser);
      });
      setCollaborators(collaborators);
    }
  }, [isOpen, users, object, isDesign]);

  const handleInputChange = (event) => {
    const value = event.target.value;
    setMessage(value);
    setMessageCharCount(value.length);
  };

  const handleClose = () => {
    setEmails([]);
    setRole(1);
    setMessage("");
    setMessageCharCount(0);
    setNotifyPeople(false);
    setError("");
    onClose();
  };

  const onSubmit = async () => {
    setIsShareBtnDisabled(true);
    try {
      if (emails.length === 0) {
        setError("No email addresses added");
        return;
      }
      const result = await handleShare(object, emails, role, message, notifyPeople);
      console.log("sharedata", { object, emails, role, message, notifyPeople });
      if (!result.success) {
        if (result.message === "No email addresses added" || result.message === "Select a role")
          setError(result.message);
        else showToast("error", result.message);
        return;
      }
      showToast("success", result.message);
    } finally {
      setIsShareBtnDisabled(false);
      if (onShowViewCollab) {
        setEmails([]);
        setRole(1);
        setMessage("");
        setMessageCharCount(0);
        setNotifyPeople(false);
        setError("");
        onShowViewCollab();
      } else {
        handleClose();
      }
    }
  };

  useEffect(() => {
    if (isDesign)
      setRoles([
        { value: 1, label: "Editor" },
        { value: 2, label: "Commenter" },
        { value: 0, label: "Viewer" },
      ]);
    else
      setRoles([
        { value: 1, label: "Contributor" },
        { value: 2, label: "Content Manager" },
        { value: 3, label: "Manager" },
        { value: 0, label: "Viewer" },
      ]);
  }, []);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "#2E2E32",
          borderRadius: "20px",
          width: "90%",
          minHeight: "100px",
          maxHeight: "80vh",
          overflowY: "hidden",
        },
      }}
    >
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
          Add Collaborators
        </Typography>
        <IconButton
          onClick={handleClose}
          sx={{
            ...iconButtonStyles,
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          ...dialogContentStyles,
          width: "auto",
          padding: 0,
          marginTop: 0,
          minHeight: "50px",
          maxHeight: "60vh",
          overflowY: "auto",
          "& .MuiDialog-paper": {
            width: "100%",
          },
        }}
      >
        <div style={{ width: "auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <EmailInput
              emails={emails}
              setEmails={setEmails}
              error={error}
              setError={setError}
              collaborators={collaborators}
            />
          </div>
          <Divider sx={{ backgroundColor: "grey" }} />

          <div
            style={{
              display: "flex",
            }}
          >
            <Select
              value={role}
              onChange={(e) => setRole(parseInt(e.target.value, 10))}
              sx={selectStyles}
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: "0px",
                    "& .MuiMenu-list": {
                      padding: 0,
                    },
                  },
                },
              }}
              IconComponent={(props) => (
                <KeyboardArrowDownRoundedIcon sx={{ color: "var(--color-white) !important" }} />
              )}
            >
              {roles.map((roleOption) => (
                <MenuItem key={roleOption.value} value={roleOption.value} sx={menuItemStyles}>
                  {roleOption.label}
                </MenuItem>
              ))}
            </Select>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              <Checkbox
                checked={notifyPeople}
                onChange={(e) => setNotifyPeople(e.target.checked)}
                sx={{
                  color: "var(--color-white)",
                  "&.Mui-checked": {
                    color: "var(--brightFont)",
                  },
                  borderRadius: "50%",
                  "& .MuiSvgIcon-root": {
                    fontSize: 28,
                  },
                  "&:hover": {
                    backgroundColor: "var(--iconButtonHover)",
                  },
                  "&:active": {
                    backgroundColor: "var(--iconButtonActive)",
                  },
                }}
                icon={<CheckboxIcon />}
                checkedIcon={<CheckboxCheckedIcon />}
              />
              <p
                style={{
                  color: "var(--color-white)",
                  marginLeft: "3px",
                }}
              >
                Notify People
              </p>
            </div>
          </div>

          <Divider sx={{ backgroundColor: "grey" }} />

          <TextField
            multiline
            minRows={1}
            variant="standard"
            placeholder={notifyPeople ? "Add a message" : "Enable notify people to add a message"}
            inputProps={{ maxLength: maxChars }}
            value={message}
            onChange={handleInputChange}
            disabled={!notifyPeople}
            sx={{
              padding: "15px",
              display: "flex",
              backgroundColor: "transparent",
              "& .MuiInput-root": {
                color: "var(--color-white)",
              },
              "& .MuiInput-underline:before": {
                borderBottom: "none",
              },
              "& .MuiInput-underline:after": {
                borderBottom: "none",
              },
              "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                borderBottom: "none",
              },
              "& .MuiInput-input.Mui-disabled": {
                WebkitTextFillColor: isDarkMode
                  ? "rgba(255,255,255,0.8) !important"
                  : "rgba(0,0,0,0.8) !important",
                opacity: 1,
                borderBottom: "none",
              },
              "& .MuiInput-underline.Mui-disabled:before": {
                borderBottom: "none",
              },
              "& .MuiInputBase-input": {
                minHeight: "125px !important",
              },
            }}
            slotProps={{
              input: {
                disableUnderline: true,
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: "var(--color-white)",
              margin: "0px 20px 0px 0px",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            {messageCharCount}/{maxChars}
          </Typography>
        </div>
      </DialogContent>
      <DialogActions
        sx={{ ...dialogActionsStyles, margin: "0px", marginBottom: 0, padding: "18px" }}
      >
        <Button
          fullWidth
          variant="contained"
          onClick={onSubmit}
          sx={{
            ...gradientButtonStyles,
            opacity: isShareBtnDisabled ? "0.5" : "1",
            cursor: isShareBtnDisabled ? "default" : "pointer",
            "&:hover": {
              backgroundImage: !isShareBtnDisabled && "var(--gradientButtonHover)",
            },
          }}
          disabled={isShareBtnDisabled}
        >
          Share
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={handleClose}
          sx={outlinedButtonStyles}
          onMouseOver={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButtonHover)")
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
          }
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareModal;

const selectStyles = {
  width: "50%",
  backgroundColor: "transparent",
  borderRadius: "0px",
  paddingBottom: "0px",
  borderRight: "1px solid var(--borderInput)",
  "& .MuiSelect-select": { color: "var(--color-white)" },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent !important",
  },
  "& .MuiOutlinedInput-root": {
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "transparent !important",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "transparent !important",
    },
  },
  "& .MuiSelect-root": {
    "&:focus": {
      backgroundColor: "transparent",
      outline: "none",
      boxShadow: "none !important",
    },
  },
  "&.Mui-focused .MuiSelect-select": {
    backgroundColor: "transparent",
    boxShadow: "none",
  },
  "& .MuiSvgIcon-root": {
    color: "var(--color-white)",
    marginRight: "8px",
  },
};

const menuItemStyles = {
  color: "var(--color-white)",
  backgroundColor: "var(--dropdown)",
  transition: "all 0.3s ease",
  display: "block",
  minHeight: "auto",
  "&:hover": {
    backgroundColor: "var(--dropdownHover) !important",
  },
  "&.Mui-selected": {
    backgroundColor: "var(--dropdownSelected) !important",
    color: "var(--color-white)",
    fontWeight: "bold",
  },
  "&.Mui-selected:hover": {
    backgroundColor: "var(--dropdownSelectedHover) !important",
  },
};
