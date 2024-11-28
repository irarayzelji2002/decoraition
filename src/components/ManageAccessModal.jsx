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
  Box,
  CircularProgress,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import EmailInput from "./EmailInput";
import { Avatar } from "@mui/material";
import {
  EditorIcon,
  CommenterIcon,
  ViewerIcon as DesignViewerIcon,
  RestrictedIcon,
  AnyoneWithLinkIcon,
  NoAccessIcon,
} from "../pages/DesignSpace/svg/DesignAccessIcons";
import {
  ContributorIcon,
  ContentManagerIcon,
  ManagerIcon,
  ViewerIcon as ProjectViewerIcon,
} from "../pages/ProjectSpace/svg/ProjectAccessIcons";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import { showToast, stringAvatarColor, stringAvatarInitials } from "../functions/utils";
import { useSharedProps } from "../contexts/SharedPropsContext";
import {
  dialogStyles,
  dialogTitleStyles,
  dialogContentStyles,
  dialogActionsStyles,
} from "./RenameModal";
import { iconButtonStyles } from "../pages/Homepage/DrawerComponent";
import { gradientButtonStyles, outlinedButtonStyles } from "../pages/DesignSpace/PromptBar";
import { selectStyles, selectStylesDisabled } from "../pages/DesignSpace/DesignSettings";
import { DeleteIconGradient } from "./svg/DefaultMenuIcons";
import { HelpOutline } from "@mui/icons-material";
import { TooltipWithClickAwayMenuItem } from "./TooltipWithClickAway";
import { DescriptionTooltip } from "./CustomTooltip";
import Loading from "./Loading";

const ManageAcessModal = ({
  isOpen,
  onClose,
  handleAccessChange,
  isDesign,
  object,
  isViewCollab,
  onShowViewCollab = () => {},
}) => {
  const { users, notificationUpdate } = useSharedProps();
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
  const [isSaveBtnDisabled, setIsSaveBtnDisabled] = useState(false);
  const contentRef = useRef(null);
  const [isWrapped, setIsWrapped] = useState(false);
  const [showLabelTooltip, setShowLabelTooltip] = useState(false);
  const [labelTooltipClickLocked, setLabelTooltipClickLocked] = useState(false);
  const [currentHoveredRole, setCurrentHoveredRole] = useState(null); // {role: number, userId: string} or null
  const [isCollaboratorsLoaded, setIsCollaboratorsLoaded] = useState(false);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        console.log("Current width:", width);
        setIsWrapped(width < 634);
      }
    });

    const currentContainer = contentRef.current;
    if (currentContainer) {
      observer.observe(currentContainer);
      // Initial check
      setIsWrapped(currentContainer.offsetWidth < 634);
    }

    return () => {
      if (currentContainer) {
        observer.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    console.log("is wrapped", isWrapped);
  }, [isWrapped]);

  // Close/Cancel button function
  const handleClose = () => {
    setError("");
    setInitEmailsWithRole([]);
    setEmailsWithRole([]);
    onClose();
  };

  // Save button function
  const onSubmit = async () => {
    setIsSaveBtnDisabled(true);
    try {
      const filteredEmailsWithRole = emailsWithRole.filter((u) => u.role !== 4);
      console.log("manage access - onSubmit full data", {
        object,
        initEmailsWithRole,
        filteredEmailsWithRole,
        generalAccessSetting,
        generalAccessRole,
      });
      // Compare the arrays to see what's being removed
      const removedUsers = initEmailsWithRole.filter(
        (initUser) =>
          !filteredEmailsWithRole.some((filteredUser) => filteredUser.userId === initUser.userId)
      );
      console.log("manage access - onSubmit Users being removed:", removedUsers);

      const result = await handleAccessChange(
        object,
        initEmailsWithRole,
        filteredEmailsWithRole,
        generalAccessSetting,
        generalAccessRole
      );
      if (!result.success) {
        if (result.message === "No email addresses changed") {
          setError(result.message);
          showToast("error", result.message);
        } else showToast("error", result.message);
        return;
      }
      showToast("success", result.message);
    } finally {
      setIsSaveBtnDisabled(false);
      setError("");
      setInitEmailsWithRole([]);
      setEmailsWithRole([]);
      console.log("manage access - onShowViewCollab:", onShowViewCollab);
      if (onShowViewCollab) {
        onShowViewCollab();
      } else {
        handleClose();
      }
    }
  };

  // Initialize collaborators
  useEffect(() => {
    if (!isOpen || !users) return;

    if (isDesign) {
      const design = object;
      setRoles([
        { value: 1, label: "Editor", icon: <EditorIcon /> },
        { value: 2, label: "Commenter", icon: <CommenterIcon /> },
        { value: 3, label: "Owner", icon: <ManagerIcon /> },
        { value: 0, label: "Viewer", icon: <DesignViewerIcon /> },
        { value: 4, label: "No Access", icon: <NoAccessIcon /> },
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
          profilePic: ownerUser.profilePic,
        });
      }

      // Add editors
      if (design.editors && Array.isArray(design.editors)) {
        design.editors?.forEach((editorId) => {
          const editorUser = users.find((user) => user.id === editorId);
          if (editorUser) {
            collaborators.push({
              userId: editorId,
              username: editorUser.username ?? `${editorUser.firstName} ${editorUser.lastName}`,
              email: editorUser.email,
              role: 1,
              roleLabel: "Editor",
              profilePic: editorUser.profilePic,
            });
          }
        });
      }

      // Add commenters
      if (design.commenters && Array.isArray(design.commenters)) {
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
              profilePic: commenterUser.profilePic,
            });
          }
        });
      }

      // Add viewers
      if (design.viewers && Array.isArray(design.viewers)) {
        design.viewers?.forEach((viewerId) => {
          const viewerUser = users.find((user) => user.id === viewerId);
          if (viewerUser) {
            collaborators.push({
              userId: viewerId,
              username: viewerUser.username ?? `${viewerUser.firstName} ${viewerUser.lastName}`,
              email: viewerUser.email,
              role: 0,
              roleLabel: "Viewer",
              profilePic: viewerUser.profilePic,
            });
          }
        });
      }

      setInitEmailsWithRole(collaborators);
      setEmailsWithRole(collaborators);
      console.log("manage access - collaborators:", collaborators);
    } else {
      const project = object;
      setRoles([
        { value: 1, label: "Contributor", icon: <ContributorIcon /> },
        { value: 2, label: "Content Manager", icon: <ContentManagerIcon /> },
        { value: 3, label: "Manager", icon: <ManagerIcon /> },
        { value: 0, label: "Viewer", icon: <ProjectViewerIcon /> },
        { value: 4, label: "No Access", icon: <NoAccessIcon /> },
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
      if (project.managers && Array.isArray(project.managers)) {
        project.managers.forEach((managerId) => {
          const managerUser = users.find((user) => user.id === managerId);
          if (managerUser) {
            collaborators.push({
              userId: managerId,
              username: managerUser.username || `${managerUser.firstName} ${managerUser.lastName}`,
              email: managerUser.email,
              role: 3,
              roleLabel: "Manager",
            });
          }
        });
      }

      // Add content managers
      if (project.contentManagers && Array.isArray(project.contentManagers)) {
        project.contentManagers.forEach((contentManagerId) => {
          const contentManagerUser = users.find((user) => user.id === contentManagerId);
          if (contentManagerUser) {
            collaborators.push({
              userId: contentManagerId,
              username:
                contentManagerUser.username ||
                `${contentManagerUser.firstName} ${contentManagerUser.lastName}`,
              email: contentManagerUser.email,
              role: 2,
              roleLabel: "Content Manager",
            });
          }
        });
      }

      // Add contributors
      if (project.contributors && Array.isArray(project.contributors)) {
        project.contributors.forEach((contributorId) => {
          const contributorUser = users.find((user) => user.id === contributorId);
          if (contributorUser) {
            collaborators.push({
              userId: contributorId,
              username:
                contributorUser.username ||
                `${contributorUser.firstName} ${contributorUser.lastName}`,
              email: contributorUser.email,
              role: 1,
              roleLabel: "Contributor",
            });
          }
        });
      }

      // Add viewers
      if (project.viewers && Array.isArray(project.viewers)) {
        project.viewers.forEach((viewerId) => {
          const viewerUser = users.find((user) => user.id === viewerId);
          if (viewerUser) {
            collaborators.push({
              userId: viewerId,
              username: viewerUser.username || `${viewerUser.firstName} ${viewerUser.lastName}`,
              email: viewerUser.email,
              role: 0,
              roleLabel: "Viewer",
            });
          }
        });
      }

      setInitEmailsWithRole(collaborators);
      setEmailsWithRole(collaborators);
      console.log("manage access - collaborators:", collaborators);
    }

    setIsCollaboratorsLoaded(true);
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
      const width = contentRef.current.offsetWidth;
      console.log("Window resize - width:", width);
      const isNewWrapped = width < 634;
      setIsWrapped(isNewWrapped);

      const { scrollWidth, clientWidth } = contentRef.current;
      const currentWidth = window.innerWidth;

      // Debugging
      // console.log(`IF scrollWidth > clientWidth: ${scrollWidth} > ${clientWidth}`);
      // console.log(`ELSE IF scrollWidth === clientWidth: ${scrollWidth} === ${clientWidth}`);
      // console.log(
      //   `ELSE IF -> IF hideLabels && scrollWidth + labelWidth > currentWidth: ${hideLabels} && ${scrollWidth} + ${labelWidth} > ${currentWidth}`
      // );
      // console.log(`isOverflowing: ${isOverflowing}; hideLabels: ${hideLabels}`);

      if (isNewWrapped) {
        if (!isOverflowing) {
          setIsOverflowing(true);
          setHideLabels(true);
        }
      } else if (!isNewWrapped) {
        setIsOverflowing(false);
        setHideLabels(false);
      } else {
        if (isOverflowing) {
          setIsOverflowing(false);
          setHideLabels(false);
        }
      }

      if (hideLabels && !isNewWrapped) {
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

  useEffect(() => {
    console.log("manage access - initEmailsWithRole:", initEmailsWithRole);
  }, [initEmailsWithRole]);
  useEffect(() => {
    console.log("manage access - emailsWithRole:", emailsWithRole);
  }, [emailsWithRole]);
  useEffect(() => {
    console.log("manage access - isCollaboratorsLoaded", isCollaboratorsLoaded);
  }, [isCollaboratorsLoaded]);

  // Notification highlight
  const highlightUserInModal = (userId) => {
    console.log("manage access - attempting to highlight userId:", userId);
    // Remove the extra quote in the element ID
    const userElement = document.getElementById(`drawerUser-${userId}`);
    console.log("manage access - found userElement:", userElement);

    if (userElement) {
      userElement.scrollIntoView({ behavior: "smooth" });
      userElement.classList.add("highlight-animation");
      setTimeout(() => {
        userElement.classList.remove("highlight-animation");
      }, 3000);
    } else {
      console.log("manage access - userElement not found in DOM, retrying in 500ms");
      // Add a retry mechanism
      setTimeout(() => {
        const retryElement = document.getElementById(`drawerUser-${userId}`);
        console.log("manage access - retry found userElement:", retryElement);
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
      console.log(
        "handleNotificationActions called - isCollaboratorsLoaded:",
        isCollaboratorsLoaded,
        "isOpen:",
        isOpen
      );
      if (!isCollaboratorsLoaded || !isOpen) return;

      const pendingActions = localStorage.getItem("pendingNotificationActions");
      console.log("manage access - pendingActions from localStorage:", pendingActions);

      if (pendingActions) {
        try {
          const parsedActions = JSON.parse(pendingActions);
          console.log("manage access - parsed pendingActions:", parsedActions);

          const { actions, references, timestamp, completed } = parsedActions;

          // Filter out duplicate completed actions
          const uniqueCompleted = completed.reduce((acc, current) => {
            const x = acc.find((item) => item.index === current.index);
            if (!x) {
              return acc.concat([current]);
            } else {
              return acc;
            }
          }, []);

          for (const [index, action] of actions.entries()) {
            console.log("manage access - Processing action:", action, "at index:", index);

            // Check if this action is already completed
            const isAlreadyCompleted = uniqueCompleted.some((c) => c.index === index);
            if (isAlreadyCompleted) {
              console.log(`manage access - Action at index ${index} already completed`);
              continue;
            }

            // Check if all previous actions are completed
            const previousActionsCompleted =
              uniqueCompleted.filter((c) => c.index < index).length === index;
            console.log("manage access - previousActionsCompleted:", previousActionsCompleted);

            if (action === "Highlight user id" && previousActionsCompleted) {
              const userId = references?.userId;
              console.log("manage access - Found userId to highlight:", userId);

              if (userId) {
                highlightUserInModal(userId);
              }

              uniqueCompleted.push({ action, index, timestamp });
              localStorage.setItem(
                "pendingNotificationActions",
                JSON.stringify({ actions, references, timestamp, completed: uniqueCompleted })
              );

              if (index === actions.length - 1) {
                console.log(
                  "manage access - Removing pendingNotificationActions from localStorage"
                );
                localStorage.removeItem("pendingNotificationActions");
              }
            }
          }
        } catch (error) {
          console.error("Error processing notification actions:", error);
        }
      }
    };

    handleNotificationActions();
  }, [isCollaboratorsLoaded, isOpen, notificationUpdate]);

  return (
    <Dialog open={isOpen} onClose={handleClose} sx={dialogStyles}>
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
          {isViewCollab ? "View collaborators" : "Manage Access"}
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
        ref={contentRef}
        sx={{
          ...dialogContentStyles,
          width: "auto",
          padding: "0px",
          marginTop: 0,
          minWidth: "50vw",
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
            {isCollaboratorsLoaded ? (
              <>
                {initEmailsWithRole.map((user) => {
                  //initEmailsWithRole to dummyUsers, emailsWithRole to dummyUsers
                  const currentUser = emailsWithRole.find((u) => u.userId === user.userId);
                  const managerCount = emailsWithRole.filter((u) => u.role === 3).length;

                  // Determine if select should be disabled
                  const isDisabled = isDesign
                    ? currentUser?.role === 3 // Disable for design owner
                    : currentUser?.role === 3 && managerCount <= 1; // Disable for last project manager

                  return (
                    <div className="drawerUser" key={user.userId} id={`drawerUser-${user.userId}`}>
                      <div style={{ marginRight: "6px", marginTop: "auto", marginBottom: "auto" }}>
                        <Box
                          sx={{
                            width: 53,
                            height: 53,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "var(--gradientButton)",
                            borderRadius: "50%",
                            padding: "3px",
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 53,
                              height: 53,
                              borderRadius: "50%",
                              boxShadow: "0 0 0 3px var(--gradientButton)",
                              "& .MuiAvatar-img": {
                                borderRadius: "50%",
                              },
                              ...stringAvatarColor(user.username),
                            }}
                            children={stringAvatarInitials(user.username)}
                            src={user.profilePic ?? ""}
                          />
                        </Box>
                      </div>
                      <div
                        className="drawerUserDetails"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
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
                          {`${!isViewCollab ? "Previous role: " : ""}${user.roleLabel}`}
                        </Typography>
                      </div>
                      {!isViewCollab && (
                        <Select
                          value={currentUser?.role ?? 1}
                          onChange={(e) => {
                            const newRole = parseInt(e.target.value, 10);
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
                            width: hideLabels ? "90px" : isDesign ? "188px" : "230px",
                            height: "100%",
                            "&.Mui-disabled": {
                              ...selectStylesDisabled["&.Mui-disabled"],
                              "& .MuiSelect-select": {
                                ...selectStylesDisabled["&.Mui-disabled"]["& .MuiSelect-select"],
                                padding: "12px 40px 12px 20px",
                                opacity: 0,
                              },
                            },
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                borderRadius: "10px",
                                "& .MuiMenu-list": {
                                  padding: 0,
                                },
                                "& .MuiMenuItem-root[aria-disabled='true']": {
                                  display: "none",
                                },
                              },
                            },
                          }}
                          IconComponent={(props) => (
                            <KeyboardArrowDownRoundedIcon
                              sx={{ color: "var(--color-white) !important" }}
                            />
                          )}
                          renderValue={(selected) => {
                            const selectedRole = roles.find((role) => role.value === selected);
                            return (
                              <div style={{ display: "flex", alignItems: "center" }}>
                                <div style={{ marginRight: "10px", display: "flex" }}>
                                  {selectedRole?.icon}
                                </div>
                                {!isWrapped && <div>{selectedRole?.label}</div>}
                              </div>
                            );
                          }}
                        >
                          {roles.map((roleOption) => (
                            <MenuItem
                              key={roleOption.value}
                              value={roleOption.value}
                              sx={menuItemStyles}
                              disabled={isDesign ? roleOption.value === 3 : false}
                            >
                              <div style={{ display: "flex", alignItems: "center" }}>
                                <div style={{ marginRight: "10px", display: "flex" }}>
                                  {roleOption.icon}
                                </div>
                                {!isWrapped ? (
                                  <div>{roleOption.label}</div>
                                ) : (
                                  <TooltipWithClickAwayMenuItem
                                    open={
                                      showLabelTooltip &&
                                      currentHoveredRole?.role === roleOption.value &&
                                      currentHoveredRole?.userId === user.userId
                                    }
                                    setOpen={(value) => {
                                      setShowLabelTooltip(value);
                                      if (!value) setCurrentHoveredRole(null);
                                    }}
                                    tooltipClickLocked={labelTooltipClickLocked}
                                    setTooltipClickLocked={setLabelTooltipClickLocked}
                                    title={
                                      <DescriptionTooltip
                                        description={roleOption.label}
                                        minWidth={isDesign ? "100px" : "150px"}
                                      />
                                    }
                                    className="helpTooltip inMenuItem"
                                    onMouseEnter={() => {
                                      setCurrentHoveredRole({
                                        role: roleOption.value,
                                        userId: user.userId,
                                      });
                                    }}
                                    onMouseLeave={() => {
                                      if (!labelTooltipClickLocked) setCurrentHoveredRole(null);
                                    }}
                                  >
                                    <HelpOutline
                                      sx={{ color: "var(--iconDark)", transform: "scale(0.9)" }}
                                    />
                                  </TooltipWithClickAwayMenuItem>
                                )}
                              </div>
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              <GradientCircularLoading />
            )}
          </div>
          <Typography
            variant="body1"
            sx={{ marginTop: "15px", padding: "15px 20px", fontWeight: "bold" }}
          >
            General Access
          </Typography>
          <div className="drawerUserLong">
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
              <div style={{ flexGrow: "1", width: "100%" }}>
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
              <div style={{ display: "flex", flexGrow: "1", width: "100%", flexWrap: "wrap" }}>
                <Select
                  className="drawerUserDetails"
                  value={generalAccessSetting}
                  onChange={(e) => setGeneralAccessSetting(parseInt(e.target.value, 10))}
                  sx={{
                    ...selectStyles,
                    flexGrow: 1,
                    minWidth: isWrapped ? "100%" : "300px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderTopLeftRadius: "10px",
                      borderTopRightRadius:
                        generalAccessSetting === 0
                          ? "10px"
                          : generalAccessSetting === 1 && isWrapped
                          ? "10px"
                          : "0px",
                      borderBottomLeftRadius:
                        generalAccessSetting === 0
                          ? "10px"
                          : generalAccessSetting === 1 && isWrapped
                          ? "0px"
                          : "10px",
                      borderBottomRightRadius:
                        generalAccessSetting === 0 ? "10px" : generalAccessSetting === 1 && "0px",
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
                  IconComponent={(props) => (
                    <KeyboardArrowDownRoundedIcon sx={{ color: "var(--color-white) !important" }} />
                  )}
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
                {generalAccessSetting === 1 && (
                  <Select
                    value={generalAccessRole}
                    onChange={(e) => setGeneralAccessRole(parseInt(e.target.value, 10))}
                    sx={{
                      ...selectStyles,
                      marginLeft: isWrapped ? "0px" : "-2px",
                      width: isWrapped ? "100%" : isDesign ? "200px" : "230px",
                      maxWidth: isWrapped ? "100%" : "unset",
                      marginTop: isWrapped ? "-1px" : "0px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderTopLeftRadius: isWrapped ? "0px" : "0px",
                        borderTopRightRadius: isWrapped ? "0px" : "10px",
                        borderBottomLeftRadius: isWrapped ? "10px" : "0px",
                        borderBottomRightRadius: isWrapped ? "10px" : "10px",
                        border: "2px solid var(--borderInput)",
                        borderTop: isWrapped
                          ? "2px solid transparent"
                          : "2px solid var(--borderInput)",
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
                    IconComponent={(props) => (
                      <KeyboardArrowDownRoundedIcon
                        sx={{ color: "var(--color-white) !important" }}
                      />
                    )}
                  >
                    {generalAccessRoles.map((roleOption) => (
                      <MenuItem key={roleOption.value} value={roleOption.value} sx={menuItemStyles}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div style={{ marginRight: "10px", display: "flex" }}>
                            {roleOption.icon}
                          </div>
                          <div>{roleOption.label}</div>
                        </div>
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      {isViewCollab ? (
        <div style={{ height: "18px", backgroundColor: "var(--nav-card-modal)" }}></div>
      ) : (
        <DialogActions
          sx={{ ...dialogActionsStyles, margin: "0px", marginBottom: 0, padding: "18px" }}
        >
          <Button
            fullWidth
            variant="contained"
            onClick={onSubmit}
            sx={{
              ...gradientButtonStyles,
              opacity: isSaveBtnDisabled ? "0.5" : "1",
              cursor: isSaveBtnDisabled ? "default" : "pointer",
              "&:hover": {
                backgroundImage: !isSaveBtnDisabled && "var(--gradientButtonHover)",
              },
            }}
            disabled={isSaveBtnDisabled}
          >
            Save
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
      )}
    </Dialog>
  );
};

export default ManageAcessModal;

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

export const GradientCircularLoading = ({ size = 45 }) => {
  // 20 small, 45 large
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        padding: "20px 20px 10px 20px",
      }}
    >
      <svg width={0} height={0}>
        <defs>
          <linearGradient id="gradientFont" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#ea1179", stopOpacity: 1 }} />
            <stop offset="40%" style={{ stopColor: "#f36b24", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#faa652", stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>
      <CircularProgress
        variant="indeterminate"
        thickness={6}
        size={size}
        sx={{
          "& .MuiCircularProgress-circle": {
            stroke: "url(#gradientFont)",
            strokeLinecap: "round",
          },
        }}
      />
    </Box>
  );
};
