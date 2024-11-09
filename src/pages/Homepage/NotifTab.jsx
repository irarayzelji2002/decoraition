import React, { useState, useEffect, useRef } from "react";
import { Drawer, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Tabs, Tab } from "@mui/material";
import { ArrowBackIos } from "@mui/icons-material";
import Notif from "./Notif";

const NotifTab = ({ isNotifOpen, onClose }) => {
  // State to handle dark mode
  const [darkMode, setDarkMode] = useState(true);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Drawer
      anchor="left"
      open={Boolean(isNotifOpen)}
      onClose={onClose}
      sx={{
        zIndex: "13001",
        "& .MuiDrawer-paper": {
          width: { xs: "90%", sm: "50%", md: "35%", lg: "25%" },
          minWidth: "300px",
          backgroundColor: darkMode ? "var(--bgMain)" : "var(--nav-card-modal )",
          color: darkMode ? "white" : "black",
          padding: "20px 0px 20px 0px",
          height: "calc(100% - 40px)",
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
          }}
        >
          <ArrowBackIos onClick={onClose} />
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
        </Tabs>{" "}
        {activeTab === 0 && (
          <>
            <Notif />
            <Notif />
            <Notif />
          </>
        )}
        {activeTab === 1 && (
          <>
            <Notif />
            <Notif />
          </>
        )}
      </div>
      <Button
        onClick={onClose}
        sx={{
          color: darkMode ? "white" : "black",
          mt: 2,
          marginBottom: "36px",
        }}
      >
        Close
      </Button>
    </Drawer>
  );
};

export default NotifTab;
