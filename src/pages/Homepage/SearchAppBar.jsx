import React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import { stringAvatarColor, stringAvatarInitials } from "../../functions/utils.js";
import DelayedTooltip from "../../components/DelayedTooltip.jsx";
import NotifTab from "./NotifTab";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import DrawerComponent from "./DrawerComponent";
import { Drawer } from "@mui/material";
import InputBase from "@mui/material/InputBase";
import MenuIcon from "@mui/icons-material/Menu";
import Paper from "@mui/material/Paper";
import SearchIcon from "@mui/icons-material/Search";
import Badge from "@mui/material/Badge";
import Avatar from "@mui/material/Avatar";
import NotificationsIcon from "@mui/icons-material/Notifications";

const SearchAppBar = ({ onMenuClick, onSearchChange, searchQuery }) => {
  const { userDoc } = useSharedProps();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchPlaceholder, setSearchPlaceholder] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [accountTooltipOpen, setAccountTooltipOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith("/homepage")) {
      setSearchPlaceholder("Search your designs or projects");
    } else if (location.pathname.startsWith("/seeAllDesigns")) {
      setSearchPlaceholder("Search your designs");
    } else if (location.pathname.startsWith("/seeAllProjects")) {
      setSearchPlaceholder("Search your projects");
    } else {
      setSearchPlaceholder("Search...");
    }
  }, []);

  const handleSearch = (event) => {
    onSearchChange(event.target.value); // Pass the search value to the parent
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "";
  };

  const handleMenuClick = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleNotifClick = () => {
    setIsNotifOpen(true);
  };

  const handleNotifClose = () => {
    setIsNotifOpen(false);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="sticky"
        sx={{
          zIndex: 1200,
          backgroundColor: "transparent",
          boxShadow: "none",
          paddingTop: "10px",
          paddingBottom: "10px",
        }}
      >
        <Toolbar sx={{ backgroundColor: "transparent" }}>
          <IconButton
            size="large"
            edge="start"
            color="var(--color-white)"
            aria-label="open drawer"
            sx={{ mr: 0.2, backgroundColor: "transparent" }}
            onClick={handleMenuClick} // Open drawer on click
          >
            <MenuIcon sx={{ color: "var(--color-white)" }} />
          </IconButton>
          <DrawerComponent isDrawerOpen={isDrawerOpen} onClose={handleDrawerClose} />

          <Paper
            component="form"
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              marginRight: "12px",
              borderRadius: "24px",
              backgroundColor: "var(--inputBg)",
              transition: "width 0.3s ease-in-out",
            }}
          >
            <IconButton
              type="button"
              sx={{ p: "10px", color: "var(--color-white)" }}
              aria-label="search"
            >
              <SearchIcon sx={{ color: "var(--color-white)" }} />
            </IconButton>
            <InputBase
              placeholder={searchPlaceholder}
              onChange={(e) => onSearchChange(e.target.value)}
              value={searchQuery}
              onFocus={handleFocus}
              onBlur={handleBlur}
              sx={{ ml: 1, flex: 1, color: "var(--color-white)", padding: "5px 10px 5px 0px" }}
              inputProps={{ "aria-label": "search google maps" }}
            />
          </Paper>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                marginRight: 2,
                "@media (max-width: 380px)": {
                  display: "none",
                },
              }}
            >
              <Badge
                onClick={handleNotifClick}
                sx={{
                  cursor: "pointer",
                  "& .MuiBadge-badge": {
                    backgroundColor: "var(--color-secondary)", // Optional: to set the badge color
                    color: "white", // Optional: to set the text color inside the badge
                  },
                }}
                badgeContent={2}
              >
                <NotificationsIcon sx={{ color: "var(--color-white)" }} />
              </Badge>
            </Box>
            <NotifTab isNotifOpen={isNotifOpen} onClose={handleNotifClose} />
            <Box
              sx={{
                color: "var(--color-white)",
                marginRight: 1,
                fontSize: "1em",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                maxWidth: "150px",
                "@media (max-width: 768px)": {
                  display: "none",
                },
              }}
            >
              {userDoc?.username || "Guest"}
            </Box>
            <IconButton onClick={() => navigate("/settings")} sx={{ p: 0 }}>
              <DelayedTooltip
                title="Account"
                delay={1000}
                open={accountTooltipOpen}
                setOpen={setAccountTooltipOpen}
              >
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
                  }}
                >
                  <Avatar
                    src={userDoc?.profilePic ? userDoc?.profilePic : ""}
                    sx={{
                      height: 39,
                      width: 39,
                      borderRadius: "50%",
                      border: "2.5px solid transparent",
                      boxShadow: "0 0 0 2.5px var(--gradientButton)",
                      "& .MuiAvatar-img": {
                        borderRadius: "50%",
                      },
                      ...stringAvatarColor(userDoc?.username),
                    }}
                    children={stringAvatarInitials(userDoc?.username)}
                  />
                </Box>
              </DelayedTooltip>
            </IconButton>
          </div>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default SearchAppBar;
