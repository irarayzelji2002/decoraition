import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import { showToast } from "../../functions/utils.js";
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
  formatDateLong,
  getUsername,
  getUsernames,
} from "./backend/HomepageActions";

import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import FolderIcon from "@mui/icons-material/Folder";
import ImageIcon from "@mui/icons-material/Image";
import KeyboardDoubleArrowUpRoundedIcon from "@mui/icons-material/KeyboardDoubleArrowUpRounded";
import HomepageTable from "./HomepageTable.jsx";
import SearchAppBar from "./SearchAppBar.jsx";
import DesignIcon from "../../components/DesignIcon.jsx";
import ProjectOptionsHome from "../../components/ProjectOptionsHome.jsx";
import "../../css/homepage.css";
import "../../css/design.css";
import ProjectIcon from "./svg/ProjectIcon.jsx";
import DesignSvg from "./svg/DesignSvg.jsx";
import Loading from "../../components/Loading.jsx";
import { AddDesign, AddProject } from "../DesignSpace/svg/AddImage.jsx";
import { set } from "lodash";
import { handleLogout } from "./backend/HomepageFunctions.jsx";
import { HorizontalIcon, ListIcon, TiledIcon } from "../ProjectSpace/svg/ExportIcon.jsx";
import { iconButtonStyles } from "./DrawerComponent.jsx";
import { gradientButtonStyles, outlinedButtonStyles } from "../DesignSpace/PromptBar.jsx";

function Homepage() {
  const navigate = useNavigate();
  const { user, userDoc, designs, userDesigns, projects, userProjects } = useSharedProps();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDesigns, setFilteredDesigns] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filteredDesignsForTable, setFilteredDesignsForTable] = useState([]);
  const [filteredProjectsForTable, setFilteredProjectsForTable] = useState([]);

  const [viewForDesigns, setViewForDesigns] = useState(0); //0 for tiled view, 1 for list view
  const [viewForProjects, setViewForProjects] = useState(0);
  const [loadingDesigns, setLoadingDesigns] = useState(true);
  const [loadingDesignsTable, setLoadingDesignsTable] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingProjectsTable, setLoadingProjectsTable] = useState(true);

  const [numToShowMoreDesign, setNumToShowMoreDesign] = useState(0);
  const [numToShowMoreProject, setNumToShowMoreProject] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [optionsState, setOptionsState] = useState({
    showOptions: false,
    selectedId: null,
  });
  const [thresholdDesign, setThresholdDesign] = useState(0);
  const [thresholdProject, setThresholdProject] = useState(0);

  const [isDesignButtonDisabled, setIsDesignButtonDisabled] = useState(false);
  const [isProjectButtonDisabled, setIsProjectButtonDisabled] = useState(false);

  const usernameCache = new Map();

  const fetchUsernamesBatch = async (userIds) => {
    const uncachedUserIds = userIds.filter((id) => !usernameCache.has(id));
    if (uncachedUserIds.length > 0) {
      const usernames = await getUsernames(uncachedUserIds);
      uncachedUserIds.forEach((id, index) => {
        usernameCache.set(id, usernames[index]);
      });
    }
    return userIds.map((id) => usernameCache.get(id));
  };

  const managerCache = new Map();

  const fetchManagersBatch = async (managerIds) => {
    const uncachedManagerIds = managerIds.filter((id) => !managerCache.has(id));
    if (uncachedManagerIds.length > 0) {
      const managers = await getUsernames(uncachedManagerIds);
      uncachedManagerIds.forEach((id, index) => {
        managerCache.set(id, managers[index]);
      });
    }
    return managerIds.map((id) => managerCache.get(id));
  };

  const loadDesignDataForView = async () => {
    if (userDesigns.length > 0) {
      setLoadingDesigns(true);
      setLoadingDesignsTable(true);
      const designsByLatest = [...userDesigns].sort(
        (a, b) => b.modifiedAt.toMillis() - a.modifiedAt.toMillis()
      );

      const filteredDesigns = designsByLatest.filter((design) =>
        design.designName.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );

      setFilteredDesigns(filteredDesigns);
      console.log("filteredDesigns", filteredDesigns);
      setLoadingDesigns(false);

      console.log("filteredDesigns", filteredDesigns);
      const ownerIds = filteredDesigns.map((design) => design.owner);
      const usernames = await fetchUsernamesBatch(ownerIds);

      const tableData = filteredDesigns.map((design, index) => ({
        ...design,
        ownerId: design.owner,
        owner: usernames[index],
        formattedCreatedAt: formatDate(design.createdAt),
        createdAtTimestamp: design.createdAt.toMillis(),
        formattedModifiedAt: formatDate(design.modifiedAt),
        modifiedAtTimestamp: design.modifiedAt.toMillis(),
      }));

      setFilteredDesignsForTable(tableData);
    } else {
      setFilteredDesigns([]);
      setFilteredDesignsForTable([]);
    }

    setLoadingDesignsTable(false);
  };

  const loadProjectDataForView = async () => {
    if (userProjects.length > 0) {
      setLoadingProjects(true);
      setLoadingProjectsTable(true);
      const projectsByLatest = [...userProjects].sort(
        (a, b) => b.modifiedAt.toMillis() - a.modifiedAt.toMillis()
      );

      const filteredProjects = projectsByLatest.filter((project) =>
        project.projectName.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );

      setFilteredProjects(filteredProjects);
      setLoadingProjects(false);

      const managerIds = filteredProjects.flatMap((project) => project.managers || []);
      const managers = await fetchManagersBatch(managerIds);

      const tableData = filteredProjects.map((project) => {
        const projectManagers = (project.managers || []).map((id) => managerCache.get(id));
        return {
          ...project,
          managersId: project.managers,
          managers: projectManagers,
          formattedCreatedAt: formatDate(project.createdAt),
          createdAtTimestamp: project.createdAt.toMillis(),
          formattedModifiedAt: formatDate(project.modifiedAt),
          modifiedAtTimestamp: project.modifiedAt.toMillis(),
        };
      });

      setFilteredProjectsForTable(tableData);
      setLoadingProjectsTable(false);
    } else {
      setFilteredProjects([]);
      setFilteredProjectsForTable([]);
    }
  };

  const setThresholdAfterViewChange = (type) => {
    if (type === "designs") {
      if (viewForDesigns === 0) {
        // tiled view
        const thresholdDesign = 6;
        setThresholdDesign(thresholdDesign);
        const remainder = numToShowMoreDesign % thresholdDesign;
        if (numToShowMoreDesign >= remainder && remainder !== 0) {
          setNumToShowMoreDesign(numToShowMoreDesign - remainder + thresholdDesign);
        }
      } else if (viewForDesigns === 1) {
        // list view
        const thresholdDesign = 10;
        setThresholdDesign(thresholdDesign);
        const remainder = numToShowMoreDesign % thresholdDesign;
        if (numToShowMoreDesign >= remainder && remainder !== 0) {
          setNumToShowMoreDesign(numToShowMoreDesign - remainder + thresholdDesign);
        }
      }
    } else if (type === "projects") {
      if (viewForProjects === 0) {
        // tiled view
        const thresholdProject = 6;
        setThresholdProject(thresholdProject);
        const remainder = numToShowMoreProject % thresholdProject;
        if (numToShowMoreProject >= remainder && remainder !== 0) {
          setNumToShowMoreProject(numToShowMoreProject - remainder + thresholdProject);
        }
      } else if (viewForProjects === 1) {
        // list view
        const thresholdProject = 10;
        setThresholdProject(thresholdProject);
        const remainder = numToShowMoreProject % thresholdProject;
        if (numToShowMoreProject >= remainder && remainder !== 0) {
          setNumToShowMoreProject(numToShowMoreProject - remainder + thresholdProject);
        }
      }
    }
  };

  useEffect(() => {
    setThresholdAfterViewChange("designs");
    setThresholdAfterViewChange("projects");
  }, [filteredDesigns, filteredProjects]);

  useEffect(() => {
    loadDesignDataForView();
  }, [designs, userDesigns, searchQuery]);

  useEffect(() => {
    loadProjectDataForView();
  }, [projects, userProjects, searchQuery]);

  useEffect(() => {
    if (userDoc) {
      setViewForDesigns(userDoc.layoutSettings.designsListHome ?? 0);
      setViewForProjects(userDoc.layoutSettings.projectsListHome ?? 0);
    } else {
      handleLogout(navigate);
    }
  }, [userDoc]);

  useEffect(() => {
    setThresholdAfterViewChange("designs");
  }, [viewForDesigns]);

  useEffect(() => {
    setThresholdAfterViewChange("projects");
  }, [viewForProjects]);

  const recentDesignsRef = useRef(null);
  const recentProjectsRef = useRef(null);

  const scrollToRecentDesigns = () => {
    recentDesignsRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToRecentProjects = () => {
    recentProjectsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={`homepage ${menuOpen ? "darkened" : ""}`}>
      {menuOpen && (
        <div className="overlay" onClick={() => toggleMenu(menuOpen, setMenuOpen)}></div>
      )}

      <SearchAppBar onSearchChange={setSearchQuery} searchQuery={searchQuery} />

      <div className="recent-section">
        <div className="headerPlace">
          <div className="header">
            <img
              style={{
                height: "96px",
                marginRight: "14px",
              }}
              src="/img/Logo-Colored.png"
              alt="logo"
            />
            <div className="homepageHeader">
              <h1 className="navName">DecorAItion</h1>
              <p className="navTagline">Forming ideas with generative AI</p>
            </div>
          </div>{" "}
          <div className="action-buttons">
            <Button
              variant="contained"
              onClick={() => {
                setIsDesignButtonDisabled(true);
                handleCreateDesign(user, userDoc.id, navigate);
                setTimeout(() => {
                  setIsDesignButtonDisabled(false);
                }, 6000);
              }}
              disabled={isDesignButtonDisabled}
              sx={{ ...outlinedButtonStyles, fontSize: "0.95rem", transition: "none" }}
              onMouseOver={(e) => {
                e.target.style.backgroundImage = "var(--gradientButton)";
                e.target.style.padding = "8px 18px";
                e.target.style.border = "none";
                e.target.style.color = "var(--always-white)";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)";
                e.target.style.border = "2px solid transparent";
                e.target.style.padding = "6px 16px";
                e.target.style.color = "var(--color-white)";
              }}
            >
              Create a design
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setIsProjectButtonDisabled(true);
                handleCreateProject(user, userDoc.id, navigate);
                setTimeout(() => {
                  setIsProjectButtonDisabled(false);
                }, 6000);
              }}
              disabled={isProjectButtonDisabled}
              sx={{ ...outlinedButtonStyles, fontSize: "0.95rem", transition: "none" }}
              onMouseOver={(e) => {
                e.target.style.backgroundImage = "var(--gradientButton)";
                e.target.style.padding = "8px 18px";
                e.target.style.border = "none";
                e.target.style.color = "var(--always-white)";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)";
                e.target.style.border = "2px solid transparent";
                e.target.style.padding = "6px 16px";
                e.target.style.color = "var(--color-white)";
              }}
            >
              Create a project
            </Button>
          </div>
        </div>

        <div className="recent-designs">{searchQuery && <h2>Search Results</h2>}</div>

        <section className="recent-section">
          <div className="recent-designs">
            <div className="separator">
              {/* <DesignSvg /> */}
              <h2 ref={recentDesignsRef}>Recent Designs</h2>
              <div style={{ marginLeft: "auto", display: "inline-flex", marginBottom: "10px" }}>
                {filteredDesigns.length > 0 && (
                  <div className="homepageIconButtons">
                    <IconButton
                      onClick={() => {
                        setViewForDesigns(viewForDesigns === 0 ? 1 : 0); // Immediately update the state
                        handleViewChange(
                          user,
                          userDoc.id,
                          userDoc.layoutSettings,
                          "designsListHome",
                          setViewForDesigns
                        );
                      }}
                      sx={{
                        ...iconButtonStyles,
                        padding: "10px",
                        margin: "0px 5px",
                        borderRadius: "8px",
                        backgroundColor:
                          viewForDesigns === 0 ? "var(--nav-card-modal)" : "transparent",
                        "@media (max-width: 366px)": {
                          padding: "8px",
                        },
                      }}
                    >
                      <TiledIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setViewForDesigns(viewForDesigns === 0 ? 1 : 0); // Immediately update the state
                        handleViewChange(
                          user,
                          userDoc.id,
                          userDoc.layoutSettings,
                          "designsListHome",
                          setViewForDesigns
                        );
                      }}
                      sx={{
                        ...iconButtonStyles,
                        padding: "10px",
                        margin: "0px 5px",
                        borderRadius: "8px",
                        backgroundColor:
                          viewForDesigns === 1 ? "var(--nav-card-modal)" : "transparent",
                        "@media (max-width: 366px)": {
                          padding: "8px",
                        },
                      }}
                    >
                      <ListIcon />
                    </IconButton>
                  </div>
                )}
                <Link to="/seeAllDesigns" className="seeAll">
                  See All
                </Link>
              </div>
            </div>

            <div style={{ width: "100%" }}>
              {!loadingDesigns ? (
                filteredDesigns.length > 0 ? (
                  viewForDesigns === 0 ? (
                    <div className="layout">
                      {filteredDesigns.slice(0, 6 + numToShowMoreDesign).map((design) => (
                        <div
                          key={design.id}
                          style={{ width: "100%", display: "flex", justifyContent: "center" }}
                        >
                          <DesignIcon
                            id={design.id}
                            name={design.designName}
                            design={design}
                            onOpen={() =>
                              navigate(`/design/${design.id}`, {
                                state: { designId: design.id },
                              })
                            }
                            owner={getUsername(design.owner)}
                            createdAt={formatDateLong(design.createdAt)}
                            modifiedAt={formatDateLong(design.modifiedAt)}
                            optionsState={optionsState}
                            setOptionsState={setOptionsState}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ width: "100%" }}>
                      {!loadingDesignsTable ? (
                        <HomepageTable
                          isDesign={true}
                          data={filteredDesignsForTable}
                          isHomepage={true}
                          numToShowMore={numToShowMoreDesign}
                          optionsState={optionsState}
                          setOptionsState={setOptionsState}
                        />
                      ) : (
                        <Loading />
                      )}
                    </div>
                  )
                ) : (
                  <div className="no-content">
                    <img src="/img/design-placeholder.png" alt="No designs yet" />
                    <p>No designs yet. Start creating.</p>
                  </div>
                )
              ) : (
                <Loading />
              )}
            </div>
          </div>
        </section>
        <div style={{ display: "inline-flex", marginTop: "20px", position: "relative" }}>
          {filteredDesigns.length > thresholdDesign &&
            numToShowMoreDesign < filteredDesigns.length && (
              <Button
                variant="contained"
                onClick={() => setNumToShowMoreDesign(numToShowMoreDesign + thresholdDesign)}
                className="cancel-button"
                sx={{
                  width: "200px",
                }}
              >
                Show more
              </Button>
            )}
          {filteredDesigns.length > thresholdDesign &&
          numToShowMoreDesign < filteredDesigns.length ? (
            <IconButton
              onClick={() => scrollToRecentDesigns()}
              sx={{ ...iconButtonStyles, position: "absolute", right: "-50px" }}
            >
              <KeyboardDoubleArrowUpRoundedIcon
                sx={{ color: "var(--color-white)", transform: "scale(1.2)" }}
              />
            </IconButton>
          ) : (
            <Button
              variant="contained"
              onClick={() => scrollToRecentDesigns()}
              className="cancel-button"
              sx={{
                width: "200px",
              }}
            >
              Scroll to top
            </Button>
          )}
        </div>

        <section className="recent-section" style={{ marginBottom: "200px" }}>
          <div className="recent-designs">
            <div className="separator">
              {/* <ProjectIcon /> */}
              <h2 ref={recentProjectsRef}>Recent Projects</h2>
              <div style={{ marginLeft: "auto", display: "inline-flex", marginBottom: "10px" }}>
                {filteredProjects.length > 0 && (
                  <div className="homepageIconButtons">
                    <IconButton
                      onClick={() => {
                        setViewForProjects(viewForProjects === 0 ? 1 : 0); // Immediately update the state
                        handleViewChange(
                          user,
                          userDoc.id,
                          userDoc.layoutSettings,
                          "projectsListHome",
                          setViewForProjects
                        );
                      }}
                      sx={{
                        ...iconButtonStyles,
                        padding: "10px",
                        margin: "0px 5px",
                        borderRadius: "8px",
                        backgroundColor:
                          viewForProjects === 0 ? "var(--nav-card-modal)" : "transparent",
                        "@media (max-width: 366px)": {
                          padding: "8px",
                        },
                      }}
                    >
                      <TiledIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setViewForProjects(viewForProjects === 0 ? 1 : 0); // Immediately update the state
                        handleViewChange(
                          user,
                          userDoc.id,
                          userDoc.layoutSettings,
                          "projectsListHome",
                          setViewForProjects
                        );
                      }}
                      sx={{
                        ...iconButtonStyles,
                        padding: "10px",
                        margin: "0px 5px",
                        borderRadius: "8px",
                        backgroundColor:
                          viewForProjects === 1 ? "var(--nav-card-modal)" : "transparent",
                        "@media (max-width: 366px)": {
                          padding: "8px",
                        },
                      }}
                    >
                      <ListIcon />
                    </IconButton>
                  </div>
                )}
                <Link to="/seeAllProjects" className="seeAll">
                  See All
                </Link>
              </div>
            </div>

            <div style={{ width: "100%" }}>
              {!loadingProjects ? (
                filteredProjects.length > 0 ? (
                  viewForProjects === 0 ? (
                    <div className="layout">
                      {filteredProjects.slice(0, 6 + numToShowMoreProject).map((project) => (
                        <div key={project.id} style={{ width: "100%" }}>
                          <ProjectOptionsHome
                            id={project.id}
                            name={project.projectName}
                            project={project}
                            onOpen={() =>
                              navigate(`/project/${project.id}`, {
                                state: {
                                  projectId: project.id,
                                },
                              })
                            }
                            managers={(async () => {
                              const usernames = getUsernames(project.managers);
                              return usernames.then((usernames) => {
                                if (usernames.length > 3) {
                                  return usernames.slice(0, 3).join(", ") + ", and more";
                                }
                                return usernames.join(", ");
                              });
                            })()}
                            createdAt={formatDateLong(project.createdAt)}
                            modifiedAt={formatDateLong(project.modifiedAt)}
                            optionsState={optionsState}
                            setOptionsState={setOptionsState}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ width: "100%" }}>
                      {!loadingProjectsTable ? (
                        <HomepageTable
                          isDesign={false}
                          data={filteredProjectsForTable}
                          isHomepage={true}
                          numToShowMore={numToShowMoreProject}
                          optionsState={optionsState}
                          setOptionsState={setOptionsState}
                        />
                      ) : (
                        <Loading />
                      )}
                    </div>
                  )
                ) : (
                  <div className="no-content">
                    <img src="/img/project-placeholder.png" alt="No projects yet" />
                    <p>No projects yet. Start creating.</p>
                  </div>
                )
              ) : (
                <Loading />
              )}
            </div>
          </div>
        </section>
        <div style={{ display: "inline-flex", marginTop: "20px", position: "relative" }}>
          {filteredProjects.length > thresholdProject &&
            numToShowMoreProject < filteredProjects.length && (
              <Button
                variant="contained"
                onClick={() => setNumToShowMoreProject(numToShowMoreProject + thresholdProject)}
                className="cancel-button"
                sx={{
                  marginTop: "20px",
                  width: "80%",
                }}
              >
                Show more
              </Button>
            )}
          {filteredProjects.length > thresholdProject &&
          numToShowMoreProject < filteredProjects.length ? (
            <IconButton
              onClick={() => scrollToRecentProjects}
              sx={{ ...iconButtonStyles, position: "absolute", right: "-50px" }}
            >
              <KeyboardDoubleArrowUpRoundedIcon
                sx={{ color: "var(--color-white)", transform: "scale(1.2)" }}
              />
            </IconButton>
          ) : (
            <Button
              variant="contained"
              onClick={() => scrollToRecentProjects}
              className="cancel-button"
              sx={{
                width: "200px",
              }}
            >
              Scroll to top
            </Button>
          )}
        </div>

        <div className="circle-button-container" style={{ bottom: "30px" }}>
          {menuOpen && (
            <div className="small-buttons">
              <div className="small-button-container">
                <span className="small-button-text">Create a Project</span>
                <div
                  className="small-circle-button"
                  onClick={() => handleCreateProject(user, userDoc.id, navigate)}
                >
                  <AddProject />
                </div>
              </div>
              <div className="small-button-container">
                <span className="small-button-text">Create a Design</span>
                <div
                  className="small-circle-button"
                  onClick={() => handleCreateDesign(user, userDoc.id, navigate)}
                >
                  <AddDesign />
                </div>
              </div>
            </div>
          )}
          <div
            className={`circle-button ${menuOpen ? "rotate" : ""}`}
            onClick={() => toggleMenu(menuOpen, setMenuOpen)}
          >
            {menuOpen ? <CloseIcon /> : <AddIcon />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Homepage;
