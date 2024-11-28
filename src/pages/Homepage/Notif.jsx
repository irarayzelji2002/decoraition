import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Avatar, Box, IconButton, ListItemIcon, ListItemText } from "@mui/material";
import {
  SettingsBackupRestoreRounded as ReopenIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";
import { FaCircle } from "react-icons/fa";
import { showToast, stringAvatarColor, stringAvatarInitials } from "../../functions/utils.js";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import { iconButtonStyles } from "./DrawerComponent.jsx";
import { CheckIconSmallGradient } from "../DesignSpace/svg/AddColor.jsx";
import { DeleteIcon } from "../../components/svg/DefaultMenuIcons.jsx";
import { CustomMenuItem } from "../DesignSpace/CommentContainer.jsx";
import { formatDateDetail } from "./backend/HomepageActions.jsx";

function Notif({ notif }) {
  const navigate = useNavigate();
  const { user, users, userDoc, notificationUpdate, setNotificationUpdate } = useSharedProps();

  // Notification data
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isReadInApp, setIsReadInApp] = useState(false);
  const [senderUsername, setSenderUsername] = useState("");
  const [senderProfilePic, setSenderProfilePic] = useState("");
  const [timeDiff, setTimeDiff] = useState("");
  const [notifClickDisabled, setNotifClickDisabled] = useState(false);

  const [showOptions, setShowOptions] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const senderUser = users.find((user) => user.id === notif.notifBy);
    const senderProfilePic = senderUser?.profilePic || "";
    const senderUsername = senderUser?.username || "";

    setType(notif.type);
    setTitle(notif.title);
    setContent(notif.content);
    setIsReadInApp(notif.isReadInApp);
    setSenderUsername(senderUsername);
    setSenderProfilePic(senderProfilePic);
    setTimeDiff(formatDateDetail(notif.createdAt) || "");
  }, [notif, users]);

  const toggleOptions = () => {
    setShowOptions((prev) => !prev);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowOptions(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!isReadInApp) await handleChangeNotifReadStatus();

    const currentPath = window.location.pathname;
    const targetPath = notification.navigateTo;

    if (notification.actions.length === 0) return;
    if (currentPath === targetPath) {
      // Store actions without navigating
      localStorage.setItem(
        "pendingNotificationActions",
        JSON.stringify({
          actions: notification.actions,
          references: notification.references,
          completed: [],
          timestamp: Date.now(),
          type: notification.type,
          title: notification.title,
          content: notification.content,
          isReadInApp: notification.isReadInApp,
        })
      );
      console.log("notif - setItem same path", {
        actions: notification.actions,
        references: notification.references,
        type: notification.type,
        completed: [],
        timestamp: Date.now(),
      });
      // Trigger re-render by updating state instead of reloading
      setNotificationUpdate((prev) => prev + 1);
    } else {
      // Store actions and references in localStorage
      localStorage.setItem(
        "pendingNotificationActions",
        JSON.stringify({
          actions: notification.actions,
          references: notification.references,
          completed: [],
          timestamp: Date.now(),
          type: notification.type,
          title: notification.title,
          content: notification.content,
          isReadInApp: notification.isReadInApp,
        })
      );
      console.log("notif - setItem diff path", {
        actions: notification.actions,
        references: notification.references,
        type: notification.type,
        completed: [],
        timestamp: Date.now(),
      });
      // Navigate to the specified path
      navigate(notification.navigateTo);
    }
  };

  const handleChangeNotifReadStatus = async () => {
    // Call changeNotifReadStatus
    setNotifClickDisabled(true);
    const result = await changeNotifReadStatus(notif.id, isReadInApp, user, userDoc);
    console.log("notif - change notif status", result);
    if (!result.success) {
      showToast("error", result.message);
      return;
    }
    showToast("success", result.message);
    setNotifClickDisabled(false);
    if (isReadInApp) toggleOptions();
  };

  const changeNotifReadStatus = async (notifId, isReadInApp, user, userDoc) => {
    try {
      console.log("notif - change status passed data", { notifId, isReadInApp, user, userDoc });
      const response = await axios.put(
        `/api/notification/${notifId}/change-notif-status`,
        { userId: userDoc.id, status: isReadInApp },
        {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        }
      );
      if (response.status === 200) {
        return {
          success: true,
          message: `Notification marked as ${!isReadInApp ? "read" : "unread"}`,
        };
      }
    } catch (error) {
      console.error(
        `Error marking notification as ${!isReadInApp ? "read" : "unread"}:`,
        error?.response?.data?.error || error.message
      );
      return {
        success: false,
        message:
          error?.response?.data?.error ||
          `Failed to mark notification as ${!isReadInApp ? "read" : "unread"}`,
      };
    }
  };

  const handleDeleteNotif = async () => {
    // Call deleteNotif
    const result = await deleteNotif(notif.id, user, userDoc);
    console.log("notif - delete notif result", result);
    if (!result.success) {
      showToast("error", result.message);
      return;
    }
    showToast("success", result.message);
    toggleOptions();
  };

  const deleteNotif = async (notifId, user, userDoc) => {
    console.log("notif - delete notif passed data", { notifId, user, userDoc });
    try {
      const response = await axios.post(
        `/api/notification/${notifId}/delete-notif`,
        { userId: userDoc.id },
        {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        }
      );
      if (response.status === 200) {
        return { success: true, message: "Notification deleted successfully" };
      }
    } catch (error) {
      console.error("Error deleting notification:", error?.response?.data?.error || error.message);
      return {
        success: false,
        message: error?.response?.data?.error || "Failed to delete notification",
      };
    }
  };

  return (
    <div>
      <div
        className={`notif-box ${!isReadInApp && "unread"} ${
          notifClickDisabled && "notif-disabled"
        }`}
        style={{ cursor: notif?.actions?.length === 0 && isReadInApp ? "auto" : "pointer" }}
        onClick={() => (!notifClickDisabled ? handleNotificationClick(notif) : {})}
      >
        <div className="hoverOverlay"></div>
        {!isReadInApp && <FaCircle className="unreadCircle" />}
        <div className="profile-section">
          <div className="profile-info">
            <Box
              sx={{
                width: 42,
                height: 42,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--gradientButton)",
                borderRadius: "50%",
                padding: "2.5px",
                marginRight: "15px",
              }}
            >
              <Avatar
                src={userDoc?.profilePic ? userDoc?.profilePic : ""}
                sx={{
                  height: 41.5,
                  width: 41.5,
                  borderRadius: "50%",
                  boxShadow: "0 0 0 2.5px var(--gradientButton)",
                  "& .MuiAvatar-img": {
                    borderRadius: "50%",
                  },
                  "& svg": {
                    marginTop: "10px",
                  },
                  ...stringAvatarColor(senderUsername),
                }}
                children={stringAvatarInitials(senderUsername)}
              />
            </Box>
            <div className="user-details">
              <span className="notifTitle">{title}</span>
              <span className="notifContent">
                {senderUsername ? (
                  <>
                    <strong>{`From ${senderUsername}: `}</strong>
                    <span>{content}</span>
                  </>
                ) : (
                  <>
                    <span>{content}</span>
                  </>
                )}
              </span>
              <span className="notifDate">{timeDiff}</span>
            </div>
          </div>
          <div
            className="profile-status"
            style={{
              marginLeft: "4px",
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            {!isReadInApp ? (
              <IconButton
                sx={{
                  ...iconButtonStyles,
                  padding: "8px",
                  margin: "0px !important",
                  width: "38px",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChangeNotifReadStatus();
                }}
              >
                <CheckIconSmallGradient />
              </IconButton>
            ) : (
              <IconButton
                edge="end"
                aria-label="more"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOptions();
                }}
                sx={{ ...iconButtonStyles, margin: "0px !important" }}
              >
                <MoreHorizIcon />
              </IconButton>
            )}

            {showOptions && (
              <div
                className="dropdown-menu notif-menu"
                style={{
                  position: "absolute",
                  top: "0",
                  marginTop: "10px",
                }}
              >
                <CustomMenuItem
                  className="dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChangeNotifReadStatus();
                  }}
                >
                  <ListItemIcon>
                    <ReopenIcon className="notificon" sx={{ color: "var(--color-white)" }} />
                  </ListItemIcon>
                  <ListItemText primary="Mark as unread" sx={{ color: "var(--color-white)" }} />
                </CustomMenuItem>
                <CustomMenuItem
                  className="dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotif();
                  }}
                >
                  <ListItemIcon>
                    <DeleteIcon className="icon" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Delete notification"
                    sx={{ color: "var(--color-white)" }}
                  />
                </CustomMenuItem>
              </div>
            )}
          </div>
        </div>

        <div className=""></div>
      </div>
    </div>
  );
}

export default Notif;
