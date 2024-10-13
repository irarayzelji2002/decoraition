import React from "react";
import { useEffect, useState } from "react";
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
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { fetchUserData } from "./backend/HomepageActions";
import SettingsIcon from "@mui/icons-material/Settings";
import Badge from "@mui/material/Badge";
import Avatar from "@mui/material/Avatar";
import NotificationsIcon from "@mui/icons-material/Notifications";

const SearchAppBar = ({ onMenuClick, onSearchChange, searchQuery }) => {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const handleAuthChange = async (user) => {
      if (user) {
        setUser(user);
        await fetchUserData(user, setUsername, setUser);
      } else {
        setUser(null);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, handleAuthChange);

    return () => unsubscribeAuth();
  }, []);
  const handleSearch = (event) => {
    onSearchChange(event.target.value); // Pass the search value to the parent
  };
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "";
  };

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleMenuClick = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
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
        }}
      >
        <Toolbar sx={{ backgroundColor: "transparent" }}>
          <IconButton
            size="large"
            edge="start"
            color="var(--color-white)"
            aria-label="open drawer"
            sx={{ mr: 2, backgroundColor: "transparent" }}
            onClick={handleMenuClick} // Open drawer on click
          >
            <MenuIcon sx={{ color: "var(--color-white)" }} />
          </IconButton>

          <Drawer anchor="left" open={isDrawerOpen} onClose={handleDrawerClose}>
            <DrawerComponent isDrawerOpen={isDrawerOpen} onClose={handleDrawerClose} />
          </Drawer>

          <Paper
            component="form"
            sx={{
              p: "2px 4px",
              display: "flex",
              alignItems: "center",
              width: isFocused ? "60%" : "50%",
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
              placeholder="Search..."
              onChange={handleSearch}
              value={searchQuery}
              onFocus={handleFocus}
              onBlur={handleBlur}
              sx={{ ml: 1, flex: 1, color: "var(--color-white)" }}
              inputProps={{ "aria-label": "search google maps" }}
            />
          </Paper>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ marginRight: 2 }}>
            <SettingsIcon sx={{ color: "var(--color-white)" }} />
          </Box>
          <Box sx={{ marginRight: 2 }}>
            <Badge
              sx={{
                "& .MuiBadge-badge": {
                  backgroundColor: "var(--color-secondary)", // Optional: to set the badge color
                  color: "white", // Optional: to set the text color inside the badge
                },
              }}
              badgeContent={2}
            >
              <NotificationsIcon />
            </Badge>
          </Box>
          <Box
            sx={{
              color: "var(--color-white)",
              marginRight: 1,

              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {username || "Guest"}
          </Box>
          {user?.profilePicture ? (
            <Box
              component="img"
              sx={{
                height: 40,
                width: 40,
                borderRadius: "50%",
                marginLeft: "auto",
                marginRight: "12px",
                border: "2px solid var(--brightFont)",
              }}
              alt="User Profile Picture"
              src={user.profilePicture}
            />
          ) : (
            <Avatar
              sx={{
                height: 40,
                width: 40,
                borderRadius: "50%",
                marginLeft: "auto",
                marginRight: "12px",
                background: "var(--gradientButton)",
                border: "2px solid var(--brightFont)",
                color: "white", // Optional: to set the text color inside the avatar
              }}
            >
              {username ? getInitial(username) : ""}
            </Avatar>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default SearchAppBar;
