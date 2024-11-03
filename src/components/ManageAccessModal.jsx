import React, { useState, useEffect, useRef } from "react";
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
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import EmailInput from "./EmailInput";
import { Avatar } from "@mui/material";
import {
  EditorIcon,
  CommenterIcon,
  ViewerIcon as DesignViewerIcon,
  RestrictedIcon,
  AnyoneWithLinkIcon,
} from "../pages/DesignSpace/svg/DesignAccessIcons";
import {
  ContributorIcon,
  ContentManagerIcon,
  ManagerIcon,
  ViewerIcon as ProjectViewerIcon,
} from "../pages/ProjectSpace/svg/ProjectAccessIcons";
import { showToast, stringAvatarColor, stringAvatarInitials } from "../functions/utils";
import { useSharedProps } from "../contexts/SharedPropsContext";

const ManageAcessModal = ({
  isOpen,
  onClose,
  handleAccessChange,
  isDesign,
  object,
  isViewCollab,
}) => {
  const { users } = useSharedProps();
  // object is design if isDesign is true, else it is project
  const [roles, setRoles] = useState([]);
  // Design: 0 for viewer, 1 for editor (default), 2 for commenter, 3 for owner
  // Project: 0 for viewer, 1 for contributor (default), 2 for content manager, 3 for manager
  const [initEmailsWithRole, setInitEmailsWithRole] = useState([]);
  const [emailsWithRole, setEmailsWithRole] = useState([]);
  const [generalAccessSetting, setGeneralAccessSetting] = useState(0); //0 for Restricted (default), 1 for Anyone with the link
  const [generalAccessRole, setGeneralAccessRole] = useState(0);
  const [generalAccessRoles, setGeneralAccessRoles] = useState([]);
  // Design: 0 for viewer (default), 1 for editor, 2 for commenter, 3 for owner
  // Project: 0 for viewer (default), 1 for contributor, 2 for content manager, 3 for manager

  const [error, setError] = useState("");
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [hideLabels, setHideLabels] = useState(false);
  const labelWidth = isDesign ? 185 - 90 : 200 - 90;
  const [prevWidth, setPrevWidth] = useState(window.innerWidth);
  const contentRef = useRef(null);

  // For testing
  const dummyUsers = [
    { userId: "1", username: "Guest 1", email: "em1@g.com", role: 3, roleLabel: "Owner" },
    { userId: "2", username: "Guest 2", email: "em1@g.com", role: 1, roleLabel: "Editor" },
    { userId: "3", username: "Guest 3", email: "em1@g.com", role: 1, roleLabel: "Editor" },
    { userId: "4", username: "Guest 4", email: "em1@g.com", role: 1, roleLabel: "Editor" },
    { userId: "5", username: "Guest 5", email: "em1@g.com", role: 1, roleLabel: "Editor" },
    { userId: "6", username: "Guest 6", email: "em2@g.com", role: 2, roleLabel: "Commenter" },
    { userId: "7", username: "Guest 7", email: "em2@g.com", role: 2, roleLabel: "Commenter" },
    { userId: "8", username: "Guest 8", email: "em2@g.com", role: 2, roleLabel: "Commenter" },
    { userId: "9", username: "Guest 9", email: "em3@g.com", role: 0, roleLabel: "Viewer" },
    { userId: "10", username: "Guest 10", email: "em3@g.com", role: 0, roleLabel: "Viewer" },
  ];

  // Close/Cancel button function
  const handleClose = () => {
    setError("");
    setInitEmailsWithRole([]);
    setEmailsWithRole([]);
    onClose();
  };

  // Save button function
  const onSubmit = async () => {
    const result = await handleAccessChange(object, initEmailsWithRole, emailsWithRole);
    if (!result.success) {
      if (result.message === "No email addresses changed") setError(result.message);
      else showToast("error", result.message);
      return;
    }
    showToast("success", result.message);
    handleClose();
  };

  // Initialize collaborators
  useEffect(() => {
    if (!isOpen || !users) return;

    if (isDesign) {
      const design = object;
      setRoles([
        { value: 1, label: "Editor", icon: <EditorIcon /> },
        { value: 2, label: "Commenter", icon: <CommenterIcon /> },
        { value: 0, label: "Viewer", icon: <DesignViewerIcon /> },
      ]);
      setGeneralAccessRoles([
        { value: 0, label: "Viewer", icon: <DesignViewerIcon /> },
        { value: 2, label: "Commenter", icon: <CommenterIcon /> },
        { value: 1, label: "Editor", icon: <EditorIcon /> },
      ]);
      setGeneralAccessSetting(design?.designSettings?.generalAccessSetting ?? 0);
      setGeneralAccessRole(design?.designSettings?.generalAccessRole ?? 0);

      // Initialize arrays to store collaborator data
      const collaborators = [];

      // Add owner
      const ownerUser = users.find((user) => user.id === design.owner);
      if (ownerUser) {
        collaborators.push({
          userId: design.owner,
          username: ownerUser.username ?? `${ownerUser.firstName} ${ownerUser.lastName}`,
          email: ownerUser.email,
          role: 3,
          roleLabel: "Owner",
        });
      }

      // Add editors
      design.editors?.forEach((editorId) => {
        const editorUser = users.find((user) => user.id === editorId);
        if (editorUser) {
          collaborators.push({
            userId: editorId,
            username: editorUser.username ?? `${editorUser.firstName} ${editorUser.lastName}`,
            email: editorUser.email,
            role: 1,
            roleLabel: "Editor",
          });
        }
      });

      // Add commenters
      design.commenters?.forEach((commenterId) => {
        const commenterUser = users.find((user) => user.id === commenterId);
        if (commenterUser) {
          collaborators.push({
            userId: commenterId,
            username:
              commenterUser.username ?? `${commenterUser.firstName} ${commenterUser.lastName}`,
            email: commenterUser.email,
            role: 2,
            roleLabel: "Commenter",
          });
        }
      });

      // Add viewers
      design.viewers?.forEach((viewerId) => {
        const viewerUser = users.find((user) => user.id === viewerId);
        if (viewerUser) {
          collaborators.push({
            userId: viewerId,
            username: viewerUser.username ?? `${viewerUser.firstName} ${viewerUser.lastName}`,
            email: viewerUser.email,
            role: 0,
            roleLabel: "Viewer",
          });
        }
      });

      setInitEmailsWithRole(collaborators);
      setEmailsWithRole(collaborators);
    } else {
      const project = object;
      setRoles([
        { value: 1, label: "Contributor", icon: <ContributorIcon /> },
        { value: 2, label: "Content Manager", icon: <ContentManagerIcon /> },
        { value: 3, label: "Manager", icon: <ManagerIcon /> },
        { value: 0, label: "Viewer", icon: <ProjectViewerIcon /> },
      ]);
      setGeneralAccessRoles([
        { value: 0, label: "Viewer", icon: <ProjectViewerIcon /> },
        { value: 1, label: "Contributor", icon: <ContributorIcon /> },
        { value: 2, label: "Content Manager", icon: <ContentManagerIcon /> },
      ]);
      setGeneralAccessSetting(project?.projectSettings?.generalAccessSetting ?? 0);
      setGeneralAccessRole(project?.projectSettings?.generalAccessRole ?? 0);

      // Initialize arrays to store collaborator data
      const collaborators = [];

      // Add managers
      project.managers?.forEach((managerId) => {
        const managerUser = users.find((user) => user.id === managerId);
        if (managerUser) {
          collaborators.push({
            userId: managerId,
            username: managerUser.username ?? `${managerUser.firstName} ${managerUser.lastName}`,
            email: managerUser.email,
            role: 3,
            roleLabel: "Manager",
          });
        }
      });

      // Add content managers
      project.contentManagers?.forEach((contentManagerId) => {
        const contentManagerUser = users.find((user) => user.id === contentManagerId);
        if (contentManagerUser) {
          collaborators.push({
            userId: contentManagerId,
            username:
              contentManagerUser.username ??
              `${contentManagerUser.firstName} ${contentManagerUser.lastName}`,
            email: contentManagerUser.email,
            role: 2,
            roleLabel: "Content Manager",
          });
        }
      });

      // Add contributors
      project.contributors?.forEach((contributorId) => {
        const contributorUser = users.find((user) => user.id === contributorId);
        if (contributorUser) {
          collaborators.push({
            userId: contributorId,
            username:
              contributorUser.username ??
              `${contributorUser.firstName} ${contributorUser.lastName}`,
            email: contributorUser.email,
            role: 1,
            roleLabel: "Contributor",
          });
        }
      });

      // Add viewers
      project.viewers?.forEach((viewerId) => {
        const viewerUser = users.find((user) => user.id === viewerId);
        if (viewerUser) {
          collaborators.push({
            userId: viewerId,
            username: viewerUser.username ?? `${viewerUser.firstName} ${viewerUser.lastName}`,
            email: viewerUser.email,
            role: 0,
            roleLabel: "Viewer",
          });
        }
      });

      setInitEmailsWithRole(collaborators);
      setEmailsWithRole(collaborators);
    }
  }, [isOpen, users, object]);

  const getAccessRoleText = (generalAccessRole) => {
    if (isDesign) {
      switch (generalAccessRole) {
        case 1:
          return "an editor";
        case 2:
          return "a commenter";
        default:
          return "a viewer";
      }
    } else {
      switch (generalAccessRole) {
        case 1:
          return "a contributor";
        case 2:
          return "a content manager";
        default:
          return "a viewer";
      }
    }
  };

  const checkOverflow = () => {
    if (contentRef.current) {
      const { scrollWidth, clientWidth } = contentRef.current;
      const currentWidth = window.innerWidth;

      // Debugging
      // console.log(`IF scrollWidth > clientWidth: ${scrollWidth} > ${clientWidth}`);
      // console.log(`ELSE IF scrollWidth === clientWidth: ${scrollWidth} === ${clientWidth}`);
      // console.log(
      //   `ELSE IF -> IF hideLabels && scrollWidth + labelWidth > currentWidth: ${hideLabels} && ${scrollWidth} + ${labelWidth} > ${currentWidth}`
      // );
      // console.log(`isOverflowing: ${isOverflowing}; hideLabels: ${hideLabels}`);

      if (scrollWidth > clientWidth) {
        if (!isOverflowing) {
          setIsOverflowing(true);
          setHideLabels(true);
        }
      } else if (scrollWidth === clientWidth) {
        setIsOverflowing(false);
        if (scrollWidth + labelWidth > currentWidth) {
          setHideLabels(false);
        }
      } else {
        if (isOverflowing) {
          setIsOverflowing(false);
          setHideLabels(false);
        }
      }

      if (hideLabels && scrollWidth + labelWidth <= currentWidth) {
        setHideLabels(false);
      }

      setPrevWidth(currentWidth);
    }
  };

  // Check overflow
  useEffect(() => {
    checkOverflow();
    const handleResize = () => checkOverflow();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) checkOverflow();
  }, [isOpen, generalAccessRole, emailsWithRole]);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "#2E2E32",
          borderRadius: "20px",
          width: "90%",
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "var(--nav-card-modal)",
          color: "var(--color-white)",
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--inputBg)",
          fontWeight: "bold",
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            color: "var(--color-white)",
            position: "absolute",
            right: 8,
            top: 8,
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
        {isViewCollab ? "View collaborators" : "Manage Access"}
      </DialogTitle>

      <DialogContent
        ref={contentRef}
        sx={{
          backgroundColor: "var(--nav-card-modal)", // Content background color
          color: "var(--color-white)", // Text color in the content
          width: "auto",
          padding: "0px",

          "& .MuiDialog-paper": {
            width: "100%",
          },
        }}
      >
        <div>
          <Typography
            variant="body1"
            sx={{ marginTop: "10px", padding: "15px 20px", fontWeight: "bold" }}
          >
            People with access
          </Typography>
          <div style={{ overflow: "auto", maxHeight: "50vh" }}>
            {initEmailsWithRole.map((user) => {
              //initEmailsWithRole to dummyUsers, emailsWithRole to dummyUsers
              const currentUser = emailsWithRole.find((u) => u.userId === user.userId);
              const managerCount = emailsWithRole.filter((u) => u.role === 3).length;

              // Determine if select should be disabled
              const isDisabled = isDesign
                ? currentUser?.role === 3 // Disable for design owner
                : currentUser?.role === 3 && managerCount <= 1; // Disable for last project manager

              return (
                <div className="drawerUser" key={user.userId}>
                  <Avatar
                    sx={{
                      width: 50,
                      height: 50,
                      marginRight: "6px",
                      marginTop: "auto",
                      marginBottom: "auto",
                      border: "3px solid var(--brightFont)",
                      ...stringAvatarColor(user.username),
                    }}
                    children={stringAvatarInitials(user.username)}
                    src={""}
                  >
                    {user.username.charAt(0)}
                  </Avatar>
                  <div
                    style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}
                  >
                    <Typography variant="body1" style={{ fontWeight: "bold" }}>
                      {user.username}
                    </Typography>
                    <Typography
                      variant="caption"
                      style={{ fontSize: "0.75rem", lineHeight: "1.5" }}
                    >
                      {user.email}
                    </Typography>
                    <Typography
                      variant="caption"
                      style={{ fontSize: "0.75rem", lineHeight: "1.5" }}
                    >
                      {currentUser?.roleLabel}
                    </Typography>
                  </div>
                  {!isViewCollab && (
                    <Select
                      value={currentUser?.role ?? 1} // editor (design) or contributor (project)
                      onChange={(e) => {
                        const newRole = e.target.value;
                        const roleLabel = roles.find((r) => r.value === newRole)?.label;

                        // Update emailsWithRole while preserving at least one manager for projects
                        setEmailsWithRole((prev) => {
                          const updatedRoles = prev.map((u) =>
                            u.userId === user.userId ? { ...u, role: newRole, roleLabel } : u
                          );

                          // Check if we're removing the last manager in a project
                          if (!isDesign && currentUser?.role === 3 && newRole !== 3) {
                            const remainingManagers = updatedRoles.filter((u) => u.role === 3);
                            if (remainingManagers.length === 0) {
                              // Prevent the change if it would remove the last manager
                              return prev;
                            }
                          }

                          return updatedRoles;
                        });
                      }}
                      disabled={isDisabled}
                      sx={{
                        ...(isDisabled ? selectStylesDisabled : selectStyles),
                        marginLeft: "auto",
                        width: hideLabels ? "90px" : isDesign ? "185px" : "200px",
                        height: "100%",
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            borderRadius: "10px",
                            "& .MuiMenu-list": {
                              padding: 0,
                            },
                          },
                        },
                      }}
                    >
                      {roles.map((roleOption) => (
                        <MenuItem
                          key={roleOption.value}
                          value={roleOption.value}
                          sx={menuItemStyles}
                        >
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <div style={{ marginRight: "10px", display: "flex" }}>
                              {roleOption.icon}
                            </div>
                            {!hideLabels && <div>{roleOption.label}</div>}
                          </div>
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                </div>
              );
            })}
          </div>
          <Typography
            variant="body1"
            sx={{ marginTop: "15px", padding: "15px 20px", fontWeight: "bold" }}
          >
            General Access
          </Typography>

          <div className="drawerUser" style={{ gap: "0px" }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                margin: "auto 16px auto 0px",
                background: "var(--gradientButton)",
              }}
              src={""}
            >
              {generalAccessSetting === 0 ? <RestrictedIcon /> : <AnyoneWithLinkIcon />}
            </Avatar>
            {isViewCollab ? (
              <div>
                <Typography variant="body1" style={{ fontWeight: "bold" }}>
                  {generalAccessSetting === 0 ? "Restricted" : "Anyone with link"}
                </Typography>
                <Typography variant="caption">
                  {generalAccessSetting === 0
                    ? "Only collaborators have access"
                    : `Anyone on the Internet can access as ${getAccessRoleText(
                        generalAccessRole
                      )}`}
                </Typography>
              </div>
            ) : (
              <>
                <Select
                  value={generalAccessSetting}
                  onChange={(e) => setGeneralAccessSetting(parseInt(e.target.value, 10))}
                  sx={{
                    ...selectStyles,
                    flexGrow: 1,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderTopRightRadius: "0px",
                      borderBottomRightRadius: "0px",
                      borderTopLeftRadius: "10px",
                      borderBottomLeftRadius: "10px",
                      border: "2px solid var(--borderInput)",
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: "10px",
                        "& .MuiMenu-list": {
                          padding: 0,
                        },
                      },
                    },
                  }}
                >
                  <MenuItem
                    value={0}
                    sx={{
                      ...menuItemStyles,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <Typography variant="body1" style={{ fontWeight: "bold" }}>
                      Restricted&nbsp;
                    </Typography>
                    <Typography variant="caption">Only collaborators have access</Typography>
                  </MenuItem>
                  <MenuItem
                    value={1}
                    sx={{
                      ...menuItemStyles,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <Typography variant="body1" style={{ fontWeight: "bold" }}>
                      Anyone with link&nbsp;
                    </Typography>
                    <Typography variant="caption">Anyone on the Internet can access</Typography>
                  </MenuItem>
                </Select>
                <Select
                  value={generalAccessRole}
                  onChange={(e) => setGeneralAccessRole(parseInt(e.target.value, 10))}
                  sx={{
                    ...selectStyles,
                    marginLeft: "-2px",
                    width: hideLabels ? "90px" : isDesign ? "185px" : "200px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderTopRightRadius: "10px",
                      borderBottomRightRadius: "10px",
                      borderTopLeftRadius: "0px",
                      borderBottomLeftRadius: "0px",
                      border: "2px solid var(--borderInput)",
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: "10px",
                        "& .MuiMenu-list": {
                          padding: 0,
                        },
                      },
                    },
                  }}
                >
                  {generalAccessRoles.map((roleOption) => (
                    <MenuItem key={roleOption.value} value={roleOption.value} sx={menuItemStyles}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div style={{ marginRight: "10px", display: "flex" }}>
                          {roleOption.icon}
                        </div>
                        {!hideLabels && <div>{roleOption.label}</div>}
                      </div>
                    </MenuItem>
                  ))}
                </Select>
              </>
            )}
          </div>
        </div>
      </DialogContent>
      {isViewCollab ? (
        <div style={{ height: "18px", backgroundColor: "var(--nav-card-modal)" }}></div>
      ) : (
        <DialogActions
          sx={{ backgroundColor: "var(  --nav-card-modal)", margin: "0px", padding: "18px" }}
        >
          <Button
            fullWidth
            variant="contained"
            onClick={onSubmit}
            sx={{
              background: "var(--gradientButton)",
              borderRadius: "20px",
              color: "var(--color-white)",
              fontWeight: "bold",
              textTransform: "none",
              "&:hover": {
                background: "var(--gradientButtonHover)",
              },
            }}
          >
            Save
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleClose}
            sx={{
              color: "var(--color-white)",
              background: "transparent",
              border: "2px solid transparent",
              borderRadius: "20px",
              backgroundImage: "var(--lightGradient), var(--gradientButton)",
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
              fontWeight: "bold",
              textTransform: "none",
            }}
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
      )}
    </Dialog>
  );
};

export default ManageAcessModal;

const selectStyles = {
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--borderInput)",
    borderWidth: 2,
    borderRadius: "10px",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--borderInput)",
  },
  "& .MuiSelect-select": {
    color: "var(--color-white)",
  },
  "& .MuiSelect-select.MuiInputBase-input": {
    padding: "12px 40px 12px 20px",
  },
  "& .MuiSelect-icon": {
    color: "var(--color-white)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--borderInput)",
  },
};

const selectStylesDisabled = {
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
    borderWidth: 2,
    borderRadius: "10px",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
  },
  "& .MuiSelect-select": {
    color: "var(--color-white)",
  },
  "& .MuiSelect-select.MuiInputBase-input": {
    padding: "12px 40px 12px 20px",
  },
  "& .MuiSelect-icon": {
    color: "var(--color-white)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
  },
  "&.Mui-disabled": {
    backgroundColor: "transparent",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "transparent",
    },
    "& .MuiSelect-icon": {
      color: "transparent",
    },
    "& .MuiSelect-select": {
      color: "transparent",
    },
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
