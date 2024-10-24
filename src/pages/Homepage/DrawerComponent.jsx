import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import {
  fetchUserDesigns,
  fetchUserProjects,
  handleCreateDesign,
  handleCreateProject,
  handleDeleteDesign,
  handleDeleteProject,
  handleViewChange,
  toggleDarkMode,
  toggleMenu,
  formatDate,
} from "./backend/HomepageActions";

import {
  Drawer,
  IconButton,
  Typography,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import NotificationsIcon from "@mui/icons-material/Notifications";
import HomeIcon from "@mui/icons-material/Home";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import FolderIcon from "@mui/icons-material/Folder";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ArrowBackIos } from "@mui/icons-material";
import { fetchUserData, fetchDesigns, fetchProjects } from "./backend/HomepageFunctions.jsx";
import { DesignIcn, Home, LogoutIcn, ProjectIcn, SettingsIcn } from "./svg/DesignSvg.jsx";

const DrawerComponent = ({ isDrawerOpen, onClose }) => {
  const navigate = useNavigate();

  const {
    user,
    userDoc,
    handleLogout,
    designs,
    userDesigns,
    userDesignVersions,
    projects,
    userProjects,
  } = useSharedProps();
  const initDarkMode = userDoc?.theme === 0 ? true : false;
  const [userDesignsLatest, setUserDesignsLatest] = useState([]);
  const [userProjectsLatest, setUserProjectsLatest] = useState([]);
  const [darkMode, setDarkMode] = useState(initDarkMode);
  const [showOptions, setShowOptions] = useState(false);
  const [username, setUsername] = useState("");
  const [activeItem, setActiveItem] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const optionsRef = useRef(null);

  // Sorting designs by latest modifiedAt
  useEffect(() => {
    const designsByLatest = [...userDesigns].sort((a, b) => {
      return b.modifiedAt.toMillis() - a.modifiedAt.toMillis();
    });
    setUserDesignsLatest(designsByLatest);
  }, [designs, userDesigns]);

  // Sorting projects by latest modifiedAt
  useEffect(() => {
    const projectsByLatest = [...userProjects].sort((a, b) => {
      return b.modifiedAt.toMillis() - a.modifiedAt.toMillis();
    });
    setUserProjectsLatest(projectsByLatest);
  }, [projects, userProjects]);

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const handleClickOutside = (event) => {
    if (optionsRef.current && !optionsRef.current.contains(event.target)) {
      setActiveItem(null);
      setActiveGroup(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getDesignImage = (designId) => {
    // Get the design
    const fetchedDesign = userDesigns.find((design) => design.id === designId);
    if (!fetchedDesign || !fetchedDesign.history || fetchedDesign.history.length === 0) {
      return "";
    }

    // Get the latest designVersionId
    const latestDesignVersionId = fetchedDesign.history[fetchedDesign.history.length - 1];
    const fetchedLatestDesignVersion = userDesignVersions.find(
      (designVer) => designVer.id === latestDesignVersionId
    );
    if (
      !fetchedLatestDesignVersion ||
      !fetchedLatestDesignVersion.images ||
      fetchedLatestDesignVersion.images.length === 0
    ) {
      return "";
    }

    // Return the first image's link from the fetched design version
    return fetchedLatestDesignVersion.images[0].link;
  };

  const getProjectImage = (projectId) => {
    // Get the project
    const fetchedProject = userProjects.find((project) => project.id === projectId);
    if (!fetchedProject || fetchedProject.designIds.length === 0) {
      return "";
    }

    // Get the latest designId (the last one in the designIds array)
    const latestDesignId = fetchedProject.designIds[fetchedProject.designIds.length - 1];

    // Return the design image by calling getDesignImage
    return getDesignImage(latestDesignId);
  };

  return (
    <Drawer
      anchor="left"
      open={isDrawerOpen}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "80%", sm: "25%" },
          backgroundColor: darkMode ? "var(--bgMain)" : "var(--nav-card-modal )",
          color: darkMode ? "white" : "black",
          padding: "20px",
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
            marginBottom: "20px",
            spaceBetween: "space-between",
          }}
        >
          <ArrowBackIos onClick={onClose} />
          <h2
            className="navName"
            style={{
              fontSize: "1.75em",
              marginTop: "-16px",
              width: "60%",
            }}
          >
            DecorAItion
          </h2>
          <IconButton
            sx={{ color: "white", marginLeft: "6px" }}
            onClick={() => toggleDarkMode(user, userDoc?.id, darkMode, setDarkMode)}
          >
            {darkMode ? (
              <DarkModeIcon sx={{ color: "var(--color-white)" }} />
            ) : (
              <LightModeIcon sx={{ color: "var(--color-black)" }} />
            )}
          </IconButton>
          <IconButton sx={{ color: "white" }}>
            <NotificationsIcon sx={{ color: "var(--color-white)" }} />
          </IconButton>
        </div>
      </div>

      <div className="drawerUser">
        <Avatar
          sx={{
            width: 56,
            height: 56,
            marginBottom: "10px",
          }}
          src={userDoc?.profilePic || ""}
        >
          {userDoc?.username ? userDoc?.username.charAt(0).toUpperCase() : ""}
        </Avatar>
        <div>
          <Typography variant="body1" style={{ fontWeight: "bold" }}>
            {userDoc?.username || "Guest"}
          </Typography>
          <Typography variant="caption">{userDoc?.email || "No email"}</Typography>
        </div>
      </div>
      <List>
        <ListItem onClick={() => navigate("/homepage")} sx={{ cursor: "pointer" }}>
          <ListItemIcon>
            <Home />
          </ListItemIcon>
          <ListItemText primary="Home" />
        </ListItem>

        <ListItem onClick={() => navigate("/seeAllDesigns")} sx={{ cursor: "pointer" }}>
          <ListItemIcon>
            <DesignIcn />
          </ListItemIcon>
          <ListItemText primary="Design" />
        </ListItem>
        <ListItem onClick={() => navigate("/seeAllProjects")} sx={{ cursor: "pointer" }}>
          <ListItemIcon>
            <ProjectIcn />
          </ListItemIcon>
          <ListItemText primary="Projects" />
        </ListItem>
        <Divider sx={{ backgroundColor: "gray", my: 2 }} />
        <Typography
          variant="body2"
          sx={{
            paddingLeft: 2,
            marginBottom: 1,
            fontWeight: "bold",
            opacity: 0.8,
          }}
        >
          Recent Designs
        </Typography>

        {userDesignsLatest.length > 0 ? (
          userDesignsLatest.slice(0, 3).map((design, index) => (
            <ListItem
              key={design.id}
              button
              onClick={() =>
                navigate(`/design/${design.id}`, {
                  state: { designId: design.id },
                })
              }
            >
              <div className="miniThumbnail">
                <img src={getDesignImage(design.id)} alt="" />
              </div>
              <ListItemText primary={design.name} />
              <IconButton
                edge="end"
                aria-label="more"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent the ListItem onClick from firing
                  setActiveItem(index);
                  setActiveGroup("design");
                }}
              >
                <MoreHorizIcon sx={{ color: darkMode ? "white" : "black" }} />
              </IconButton>
              {activeItem === index && activeGroup === "design" && (
                <div ref={optionsRef} className="dropdown-menu">
                  <div
                    className="dropdown-item"
                    onClick={() =>
                      navigate(`/design/${design.id}`, {
                        state: { designId: design.id },
                      })
                    }
                  >
                    <span className="icon"></span> Open
                  </div>
                  <div className="dropdown-item">
                    <span className="icon"></span> Share
                  </div>
                  <div className="dropdown-item">
                    <span className="icon"></span> Copy Link
                  </div>
                  <div className="dropdown-item">
                    <span className="icon"></span> Make a copy
                  </div>
                  <div className="dropdown-item">
                    <span className="icon"></span> Rename
                  </div>
                  <div className="dropdown-item">
                    <span className="icon"></span> Delete
                  </div>
                  <div className="dropdown-item">
                    <span className="icon"></span> Details
                  </div>
                </div>
              )}
            </ListItem>
          ))
        ) : (
          <ListItem>
            <ListItemText primary="No recent designs" />
          </ListItem>
        )}

        <Divider sx={{ backgroundColor: "gray", my: 2 }} />
        <Typography
          variant="body2"
          sx={{
            paddingLeft: 2,
            marginBottom: 1,
            fontWeight: "bold",
            opacity: 0.8,
          }}
        >
          Recent Projects
        </Typography>

        {userProjectsLatest.length > 0 ? (
          userProjectsLatest.slice(0, 3).map((project, index) => (
            <ListItem
              key={project.id}
              button
              onClick={() =>
                navigate(`/project/${project.id}`, {
                  state: { projectId: project.id },
                })
              }
            >
              <div className="miniThumbnail">
                <img src={getProjectImage(project.id)} alt="Thumbnail" />
              </div>
              <ListItemText primary={project.name} />
              <IconButton
                edge="end"
                aria-label="more"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent the ListItem onClick from firing
                  setActiveItem(index);
                  setActiveGroup("project");
                }}
              >
                <MoreHorizIcon sx={{ color: darkMode ? "white" : "black" }} />
              </IconButton>
              {activeItem === index && activeGroup === "project" && (
                <div ref={optionsRef} className="dropdown-menu">
                  <div
                    className="dropdown-item"
                    onClick={() =>
                      navigate(`/project/${project.id}`, {
                        state: { projectId: project.id },
                      })
                    }
                  >
                    <span className="icon"></span> Open
                  </div>
                  <div className="dropdown-item">
                    <span className="icon"></span> Share
                  </div>
                  <div className="dropdown-item">
                    <span className="icon"></span> Copy Link
                  </div>
                  <div className="dropdown-item">
                    <span className="icon"></span> Rename
                  </div>
                  <div className="dropdown-item">
                    <span className="icon"></span> Delete
                  </div>
                  <div className="dropdown-item">
                    <span className="icon"></span> Details
                  </div>
                </div>
              )}
            </ListItem>
          ))
        ) : (
          <ListItem>
            <ListItemText primary="No recent designs" />
          </ListItem>
        )}

        <Divider sx={{ backgroundColor: "gray", my: 2 }} />

        {/* Settings Menu Item */}
        <ListItem button onClick={() => navigate("/settings")}>
          <ListItemIcon>
            <SettingsIcn />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
        <ListItem button onClick={() => handleLogout(navigate)}>
          <ListItemIcon>
            <LogoutIcn />
          </ListItemIcon>
          <ListItemText primary="Sign Out" />
        </ListItem>
      </List>

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

export default DrawerComponent;
