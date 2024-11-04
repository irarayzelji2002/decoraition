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
import { stringAvatarColor, stringAvatarInitials } from "../../functions/utils.js";
import HomepageOptions from "./HomepageOptions";

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
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import NotifTab from "./NotifTab";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ArrowBackIos } from "@mui/icons-material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import { fetchUserData, fetchDesigns, fetchProjects } from "./backend/HomepageFunctions.jsx";
import { DesignIcn, FAQ, Home, LogoutIcn, ProjectIcn, SettingsIcn } from "./svg/DesignSvg.jsx";

const DrawerComponent = ({ isDrawerOpen = false, onClose }) => {
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
    if (!fetchedProject || fetchedProject.designs.length === 0) {
      return "";
    }

    // Get the latest designId (the last one in the designIds array)
    const latestDesignId = fetchedProject.designs[fetchedProject.designs.length - 1];

    // Return the design image by calling getDesignImage
    return getDesignImage(latestDesignId);
  };

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleNotifClick = () => {
    setIsNotifOpen(true);
  };

  const handleNotifClose = () => {
    setIsNotifOpen(false);
  };

  const [clickedId, setClickedId] = useState("");
  const [optionsState, setOptionsState] = useState({
    showOptions: false,
    selectedId: null,
  });

  const toggleOptions = (id) => {
    setOptionsState((prev) => {
      if (prev.selectedId === id) {
        // If the same ID is clicked, close the options menu
        return { showOptions: false, selectedId: null };
      } else {
        // Open options for the new ID
        return { showOptions: true, selectedId: id };
      }
    });
  };

  useEffect(() => {
    toggleOptions(clickedId);
  }, [clickedId]);

  const handleOptionsClick = (id, event) => {
    event.stopPropagation();
    event.preventDefault();
    setClickedId(id);
    if (clickedId === id) {
      setClickedId(null);
    }
  };

  useEffect(() => {
    console.log("showOptions:", optionsState.showOptions, "; selectedId:", optionsState.selectedId);
  }, [optionsState]);

  return (
    <Drawer
      anchor="left"
      open={Boolean(isDrawerOpen)}
      onClose={onClose}
      sx={{
        zIndex: "13001",
        "& .MuiDrawer-paper": {
          width: { xs: "80%", sm: "25%" },
          minWidth: "300px",
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
              fontSize: "1.5em",
              marginTop: "-16px",
              width: "auto",
            }}
          >
            DecorAItion
          </h2>
          <IconButton
            sx={{ color: "white", marginLeft: "auto" }}
            onClick={() => toggleDarkMode(user, userDoc?.id, darkMode, setDarkMode)}
          >
            {darkMode ? (
              <DarkModeIcon sx={{ color: "var(--color-white)" }} />
            ) : (
              <LightModeIcon sx={{ color: "var(--color-black)" }} />
            )}
          </IconButton>
          <IconButton onClick={handleNotifClick} sx={{ color: "white" }}>
            <NotificationsIcon sx={{ color: "var(--color-white)" }} />
          </IconButton>
          <div>
            <NotifTab isNotifOpen={isNotifOpen} onClose={handleNotifClose} />
          </div>
        </div>
      </div>

      <div className="drawerUser">
        <Avatar
          sx={{
            width: 56,
            height: 56,
            marginBottom: "10px",
            border: "3px solid var(--brightFont)",
            ...stringAvatarColor(userDoc?.username),
          }}
          src={userDoc?.profilePic || ""}
          children={stringAvatarInitials(userDoc?.username)}
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
              <ListItemText primary={design.designName} />
              <IconButton
                edge="end"
                aria-label="more"
                onClick={() => handleOptionsClick(design.id)}
                sx={{ color: "var(--color-white)" }}
              >
                <MoreHorizIcon sx={{ color: darkMode ? "white" : "black" }} />
              </IconButton>
              {optionsState.showOptions && optionsState.selectedId === clickedId && (
                <HomepageOptions
                  isDesign={true}
                  isTable={true}
                  id={design.id}
                  onOpen={() =>
                    navigate(`/design/${design.id}`, {
                      state: { designId: design.id },
                    })
                  }
                  optionsState={optionsState}
                  setOptionsState={setOptionsState}
                  object={design}
                />
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
                <img src={getProjectImage(project.id)} alt="" />
              </div>
              <ListItemText primary={project.projectName} />
              <IconButton
                edge="end"
                aria-label="more"
                onClick={() => handleOptionsClick(project.id)}
              >
                <MoreHorizIcon sx={{ color: darkMode ? "white" : "black" }} />
              </IconButton>
              {optionsState.showOptions && optionsState.selectedId === clickedId && (
                <HomepageOptions
                  isDesign={false}
                  isTable={true}
                  id={project.id}
                  onOpen={() =>
                    navigate(`/project/${project.id}`, {
                      state: { projectId: project.id },
                    })
                  }
                  optionsState={optionsState}
                  setOptionsState={setOptionsState}
                  object={project}
                />
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
        {/* path to change? */}
        <ListItem onClick={() => navigate("/faq")} style={{ cursor: "pointer" }}>
          <ListItemIcon>
            <FAQ />
          </ListItemIcon>
          <ListItemText primary="FAQ" />
        </ListItem>
        <ListItem onClick={() => navigate("/settings")} style={{ cursor: "pointer" }}>
          <ListItemIcon>
            <SettingsIcn />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
        <ListItem onClick={() => handleLogout(navigate)} style={{ cursor: "pointer" }}>
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
