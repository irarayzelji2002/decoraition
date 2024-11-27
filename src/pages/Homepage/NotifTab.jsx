import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Drawer, Button, Typography, IconButton, Box, CircularProgress } from "@mui/material";
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
import Loading from "../../components/Loading";

const NotifTab = ({ isNotifOpen, onClose }) => {
  // State to handle dark mode
  const { user, userDoc, users, notifications, userNotifications, isDarkMode } = useSharedProps();
  const [filters, setFilters] = useState(() => ["all"]); // all selected
  // Available filters: all, mention, comment, reply, project-update, design-update
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const notifContainerRef = useRef(null);

  // Get notifications
  useEffect(() => {
    const loadNotifications = async () => {
      const allDataLoaded = userNotifications.every(
        (notif) => notif.type && notif.title && notif.content && notif.createdAt
      );
      setLoading(!allDataLoaded);
    };
    if (userNotifications?.length) {
      loadNotifications();
    }
  }, [userNotifications]);

  // FIletr states
  const handleFilter = (event, newFilters) => {
    setFilters(newFilters);
  };

  useEffect(() => {
    console.log("notif - filters changed", filters);
  }, [filters]);

  // Scroll event listener
  useEffect(() => {
    const container = notifContainerRef.current;
    const handleScroll = () => {
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        // Check if user has scrolled to bottom and there are more notifications to load
        if (
          scrollHeight - scrollTop - clientHeight < 50 &&
          !isLoadingMore &&
          userNotifications.length > displayLimit
        ) {
          setIsLoadingMore(true);
          // Simulate loading delay (remove this in production)
          setTimeout(() => {
            setDisplayLimit((prev) => prev + 10);
            setIsLoadingMore(false);
          }, 500);
        }
      }
    };
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [displayLimit, isLoadingMore, userNotifications.length]);

  const getFilteredNotifications = () => {
    // First, sort notifications by read status and date
    const sortedNotifications = [...userNotifications].sort((a, b) => {
      // Sort by read status first (unread first)
      if (a.isReadInApp !== b.isReadInApp) {
        return a.isReadInApp ? 1 : -1;
      }
      // Then sort by date (latest first)
      return b.createdAt?.toDate() - a.createdAt?.toDate();
    });

    // Apply filters
    const filteredNotifs = filters.includes("all")
      ? sortedNotifications
      : sortedNotifications.filter((notif) =>
          filters.some((filter) => {
            switch (filter) {
              case "mention":
                return notif.type === "mention";
              case "comment":
                return notif.type === "comment";
              case "design-update":
                return notif.type === "design-update";
              case "project-update":
                return notif.type === "project-update";
              default:
                return false;
            }
          })
        );

    // Return only the number of notifications up to the display limit
    return filteredNotifs.slice(0, displayLimit);
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
            <Typography>All</Typography>
          </ToggleButton>
          <ToggleButton sx={filterButtonStyles} value="mention" aria-label="mention">
            <Typography>Mentions</Typography>
          </ToggleButton>
          <ToggleButton sx={filterButtonStyles} value="comment" aria-label="comment">
            <Typography>Comments</Typography>
          </ToggleButton>
          <ToggleButton sx={filterButtonStyles} value="design-update" aria-label="design-update">
            <Typography> Designs</Typography>{" "}
          </ToggleButton>
          <ToggleButton sx={filterButtonStyles} value="project-update" aria-label="project-update">
            <Typography>Projects</Typography>
          </ToggleButton>
        </ToggleButtonGroup>
        {/* Filtered Notifications */}
        {/* help me add logic to filter notifications based on type here */}
        <Box
          ref={notifContainerRef}
          sx={{
            height: "calc(100vh - 200px)",
            overflowY: "auto",
          }}
        >
          {/* Init loading indicator */}
          {loading && <Loading />}
          {/* Notifications List */}
          {!loading &&
            getFilteredNotifications().map((notif) => <Notif key={notif.id} notif={notif} />)}
          {/* Loading indicator for more*/}
          {isLoadingMore && userNotifications.length > displayLimit && (
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
                size={20}
                sx={{
                  "& .MuiCircularProgress-circle": {
                    stroke: "url(#gradientFont)",
                    strokeLinecap: "round",
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </div>
    </Drawer>
  );
};

export default NotifTab;

export const filterButtonGroupStyles = {
  flexWrap: "wrap",
  justifyContent: "start",
  display: "flex",
  gap: "10px !important",
  padding: "10px",
  margin: "8px 0px",
  "& .MuiToggleButtonGroup-grouped": {
    margin: 0,
    border: "2px solid var(--borderInput)",
    "&:not(:first-of-type)": {
      borderLeft: "2px solid var(--borderInput)",
      marginLeft: 0,
    },
    "&:first-of-type": {
      borderTopLeftRadius: "10px !important",
      borderBottomLeftRadius: "10px !important",
    },
    "&:last-of-type": {
      borderTopRightRadius: "10px !important",
      borderBottomRightRadius: "10px !important",
    },
  },
};

export const filterButtonStyles = {
  color: "var(--color-white)",
  backgroundColor: "transparent",
  borderRadius: "10px !important",
  textTransform: "none",
  padding: "10px 16px",
  minWidth: "fit-content",
  "&:hover": {
    borderColor: "var(--borderInputBrighter)",
    backgroundColor: "var(--iconBg)",
  },
  "& .MuiTypography-root": {
    lineHeight: "1.2 !important",
    fontSize: "0.875rem",
  },
  "&.MuiTouchRipple-root": {
    borderRadius: "8px !important",
  },
  "&.Mui-selected": {
    position: "relative",
    background: "transparent",
    border: "2px solid transparent !important",
    backgroundImage: "var(--gradientButton)",
    backgroundOrigin: "border-box",
    boxShadow: "2px 1000px 1px var(--bgMain) inset",
    "&::before": {
      // Add gradient border using pseudo-element
      content: '""',
      position: "absolute",
      top: -2,
      left: -2,
      right: -2,
      bottom: -2,
      borderRadius: "10px",
      background: "var(--gradientButton)",
      zIndex: -1,
    },
    "& .MuiTypography-root": {
      background: "var(--gradientFont)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      fontWeight: "bold",
    },
    "&:hover": {
      boxShadow: "2px 1000px 1px var(--iconBg) inset",
    },
  },
};
