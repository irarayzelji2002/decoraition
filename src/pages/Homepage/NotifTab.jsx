import React, { useState, useEffect, useRef } from "react";
import { Drawer, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Tabs, Tab } from "@mui/material";
import { ArrowBackIos } from "@mui/icons-material";
import Notif from "./Notif";
import { useSharedProps } from "../../contexts/SharedPropsContext";

const NotifTab = ({ isNotifOpen, onClose }) => {
  // State to handle dark mode
  const { users, notifications, userNotifications, isDarkMode } = useSharedProps();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    // if all Notifs are loaded in <Notif />, set loading to false
    setLoading(false);
  }, [userNotifications]);

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
            padding: "20px 20px 0px 20px",
          }}
        >
          <ArrowBackIos style={{ color: "var(--color-white)" }} onClick={onClose} />
          <h2
            style={{
              color: "var(--color-white)",
              fontSize: "1.25em",
              width: "auto",
            }}
          >
            Notifications
          </h2>
          <h3 className="mark-read">Mark all as read</h3>
        </div>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          TabIndicatorProps={{
            style: {
              backgroundImage: "var(--gradientFont)", // Customize the indicator color
            },
          }}
        >
          <Tab
            sx={{
              fontWeight: "bold",
              textTransform: "none",
              color: activeTab === 0 ? "var(--brightFont)" : "var(--color-white)",

              "&.Mui-selected": {
                color: "transparent", // Hide the actual text color
                backgroundImage: "var(--gradientFont)", // Apply background image
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                fontWeight: "bold", // Optional: make text bold to stand out
              },
            }}
            label="All"
          />
          <Tab
            sx={{
              fontWeight: "bold",
              textTransform: "none",
              color: activeTab === 1 ? "var(--brightFont)" : "var(--color-white)",
              "&:focus": {
                outline: "none",
                backgroundColor: "transparent",
              },
              "&:active": {
                outline: "none",
                backgroundColor: "transparent",
              },

              "&.Mui-selected": {
                color: "transparent", // Hide the actual text color
                backgroundImage: "var(--gradientFont)", // Apply background image
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                fontWeight: "bold",
              },
            }}
            label="Mentions"
          />
        </Tabs>
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
