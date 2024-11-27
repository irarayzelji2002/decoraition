import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Drawer, Button, Typography, IconButton, Tabs, Tab } from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { ArrowBackIosRounded as ArrowBackIosRoundedIcon } from "@mui/icons-material";
import Notif from "./Notif";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { iconButtonStyles } from "./DrawerComponent";
import { showToast } from "../../functions/utils";
import { selectStyles } from "../DesignSpace/DesignSettings";

const NotifTab = ({ isNotifOpen, onClose }) => {
  // State to handle dark mode
  const { user, userDoc, users, notifications, userNotifications, isDarkMode } = useSharedProps();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState(() => ["all"]); // all selected
  // Available filters: all, mention, comment, reply, project-update, design-update
  const [loading, setLoading] = useState(true);
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    // if all Notifs are loaded in <Notif />, set loading to false
    setLoading(false);
  }, [userNotifications]);

  const handleFilter = (event, newFilters) => {
    setFilters(newFilters);
  };

  const handleMarkAllAsRead = async () => {
    // Call markAllAsRead
    const result = await markAllAsRead(user, userDoc);
    if (!result.success) {
      showToast("error", result.message);
      return;
    }
    showToast("success", result.message);
  };

  const markAllAsRead = async (user, userDoc) => {
    console.log("notif - mark all read notif passed data", { user, userDoc });
    try {
      const response = await axios.put(
        `/api/notification/mark-all-as-read`,
        { userId: userDoc.id },
        {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        }
      );
      if (response.status === 200) {
        return { success: true, message: "All notifications marked as read" };
      }
    } catch (error) {
      console.error(
        "Error marking all notifications as read:",
        error?.response?.data?.error || error.message
      );
      return {
        success: false,
        message: error?.response?.data?.error || "Failed to mark all notifications as read",
      };
    }
  };

  return (
    <Drawer
      anchor="left"
      open={Boolean(isNotifOpen)}
      onClose={onClose}
      sx={{
        zIndex: "1000",
        "& .MuiDrawer-paper": {
          width: { xs: "100%", sm: "75%", md: "40%", xl: "30%" },
          minWidth: "350px",
          backgroundColor: isDarkMode ? "var(--bgMain)" : "var(--nav-card-modal )",
          color: isDarkMode ? "white" : "black",
          padding: "0",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        },
        "& .MuiDrawer-paper::-webkit-scrollbar": {
          display: "none",
        },
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            spaceBetween: "space-between",
            padding: "20px 10px 0px",
          }}
        >
          <IconButton
            sx={{
              ...iconButtonStyles,
              marginLeft: "-5px",
            }}
            onClick={onClose}
          >
            <ArrowBackIosRoundedIcon />
          </IconButton>
          <h2
            style={{
              color: "var(--color-white)",
              fontSize: "1.25em",
              width: "auto",
              flexGrow: "1",
              textAlign: "left",
              marginLeft: "10px",
            }}
          >
            Notifications
          </h2>
          {/* <h3 className="mark-read">Mark all as read</h3> */}
          <Button
            sx={{
              ...iconButtonStyles,
              padding: "8px 15px",
              width: "auto",
              textTransform: "none",
              borderRadius: "20px",
              backgroundColor: "transparent",
            }}
            onClick={handleMarkAllAsRead}
          >
            <Typography
              sx={{
                fontSize: "0.95rem",
                fontWeight: "bold",
                color: "transparent",
                backgroundImage: "var(--gradientFont)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
              }}
            >
              Mark all as read
            </Typography>
          </Button>
        </div>
        <ToggleButtonGroup
          value={filters}
          onChange={handleFilter}
          aria-label="filter notifications"
          sx={filterButtonGroupStyles}
        >
          <ToggleButton sx={filterButtonStyles} value="all" aria-label="all">
            All
          </ToggleButton>
          <ToggleButton sx={filterButtonStyles} value="mention" aria-label="mention">
            Mentions
          </ToggleButton>
          <ToggleButton sx={filterButtonStyles} value="comment" aria-label="comment">
            Comments
          </ToggleButton>
          <ToggleButton sx={filterButtonStyles} value="reply" aria-label="reply">
            Replies
          </ToggleButton>
          <ToggleButton sx={filterButtonStyles} value="design-update" aria-label="design-update">
            Designs
          </ToggleButton>
          <ToggleButton sx={filterButtonStyles} value="project-update" aria-label="project-update">
            Projects
          </ToggleButton>
        </ToggleButtonGroup>
        {/* Filtered Notifications */}
        {/* help me add logic to filter notifications based on type here */}
        <div>
          {userNotifications
            // .filter((notif) => notif.isReadInApp === false)
            .map((notif) => {
              return <Notif notif={notif} setLoading={setLoading} />;
            })}
        </div>
      </div>
    </Drawer>
  );
};

export default NotifTab;

export const filterButtonGroupStyles = {
  // help me add styles
  flexWrap: "wrap",
  justifyContent: "start",
  display: "flex",
  gap: "20px !important",
  margin: "10px 10px 15px 10px",
};

export const filterButtonStyles = {
  // help me add styles, this is similar to the appearance of selectStyles/textFieldStyles
  color: "var(--color-white)",
  backgroundColor: "transparent",
  border: "2px solid var(--borderInput)",
  borderRadius: "10px !important",
  textTransform: "none",
  "&:hover": {
    borderColor: "var(--iconBgHover)",
  },
  "&.Mui-selected": {
    backgroundColor: "var(--iconBg)",
    color: "var(--gradientButton)", // not working linear-gradient
    border: "2px solid var(--gradientButton)", // not working linear-gradient
  },
};
