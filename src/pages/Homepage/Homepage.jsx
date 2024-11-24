import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import {
  handleCreateDesign,
  handleCreateProject,
  handleViewChange,
  toggleMenu,
  formatDate,
  formatDateLong,
  getUsername,
  getUsernames,
} from "./backend/HomepageActions";

import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { AddIcon } from "../../components/svg/DefaultMenuIcons.jsx";
import KeyboardDoubleArrowUpRoundedIcon from "@mui/icons-material/KeyboardDoubleArrowUpRounded";
import HomepageTable from "./HomepageTable.jsx";
import SearchAppBar from "./SearchAppBar.jsx";
import DesignIcon from "../../components/DesignIcon.jsx";
import ProjectOptionsHome from "../../components/ProjectOptionsHome.jsx";
import "../../css/homepage.css";
import "../../css/design.css";
import Loading from "../../components/Loading.jsx";
import { AddDesign, AddProject } from "../DesignSpace/svg/AddImage.jsx";
import { handleLogout } from "./backend/HomepageFunctions.jsx";
import { ListIcon, TiledIcon } from "../ProjectSpace/svg/ExportIcon.jsx";
import { iconButtonStyles } from "./DrawerComponent.jsx";
import { outlinedButtonStyles } from "../DesignSpace/PromptBar.jsx";
import { Box } from "@mui/material";

function Homepage() {
  const navigate = useNavigate();
  const { user, users, userDoc, designs, userDesigns, projects, userProjects, isDarkMode } =
    useSharedProps();

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

  const loadDesignDataForView = async () => {
    try {
      if (userDesigns?.length > 0) {
        setLoadingDesigns(true);
        setLoadingDesignsTable(true);

        const designsByLatest = [...userDesigns].sort(
          (a, b) => b.modifiedAt?.toMillis() - a.modifiedAt?.toMillis()
        );

        const filteredDesigns = designsByLatest.filter((design) =>
          design?.designName?.toLowerCase()?.includes(searchQuery?.trim()?.toLowerCase() || "")
        );

        setFilteredDesigns(filteredDesigns);
        console.log("filteredDesigns", filteredDesigns);
        setLoadingDesigns(false);

        console.log("filteredDesigns", filteredDesigns);

        const tableData = filteredDesigns.map((design) => ({
          ...design,
          ownerId: design?.owner,
          owner: users?.find((user) => user?.id === design?.owner)?.username || "",
          formattedCreatedAt: formatDate(design?.createdAt),
          createdAtTimestamp: design?.createdAt?.toMillis(),
          formattedModifiedAt: formatDate(design?.modifiedAt),
          modifiedAtTimestamp: design?.modifiedAt?.toMillis(),
        }));

        setFilteredDesignsForTable(tableData);
      } else {
        setFilteredDesigns([]);
        setFilteredDesignsForTable([]);
      }
    } catch (error) {
      console.error("Error in loadDesignDataForView:", error);
      setFilteredDesigns([]);
      setFilteredDesignsForTable([]);
    } finally {
      setLoadingDesigns(false);
      setLoadingDesignsTable(false);
    }
  };

  const loadProjectDataForView = async () => {
    try {
      if (userProjects?.length > 0) {
        setLoadingProjects(true);
        setLoadingProjectsTable(true);

        const projectsByLatest = [...userProjects].sort(
          (a, b) => b.modifiedAt?.toMillis() - a.modifiedAt?.toMillis()
        );

        const filteredProjects = projectsByLatest.filter((project) =>
          project?.projectName?.toLowerCase()?.includes(searchQuery?.trim()?.toLowerCase() || "")
        );

        setFilteredProjects(filteredProjects);
        setLoadingProjects(false);

        const tableData = filteredProjects.map((project) => {
          const projectManagers = (project?.managers || []).map(
            (id) => users?.find((user) => user?.id === id)?.username || ""
          );

          return {
            ...project,
            managersId: project?.managers,
            managers: projectManagers.join(", "),
            formattedCreatedAt: formatDate(project?.createdAt),
            createdAtTimestamp: project?.createdAt?.toMillis(),
            formattedModifiedAt: formatDate(project?.modifiedAt),
            modifiedAtTimestamp: project?.modifiedAt?.toMillis(),
          };
        });

        setFilteredProjectsForTable(tableData);
        setLoadingProjectsTable(false);
      } else {
        setFilteredProjects([]);
        setFilteredProjectsForTable([]);
      }
    } catch (error) {
      console.error("Error in loadProjectDataForView:", error);
      setFilteredProjects([]);
      setFilteredProjectsForTable([]);
    } finally {
      setLoadingProjects(false);
      setLoadingProjectsTable(false);
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
        const thresholdDesign = 8;
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
        const thresholdProject = 8;
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

  const handleCreateDesignWithLoading = async () => {
    setIsDesignButtonDisabled(true);
    await handleCreateDesign(user, userDoc.id, navigate);
    setIsDesignButtonDisabled(false);
  };

  const handleCreateProjectWithLoading = async () => {
    setIsProjectButtonDisabled(true);
    await handleCreateProject(user, userDoc.id, navigate);
    setIsProjectButtonDisabled(false);
  };

  return (
    <div className={`homepage ${menuOpen ? "darkened" : ""}`}>
      {menuOpen && (
        <div className="overlay" onClick={() => toggleMenu(menuOpen, setMenuOpen)}></div>
      )}

      <SearchAppBar onSearchChange={setSearchQuery} searchQuery={searchQuery} />

      <div className="recent-section" style={{ paddingBottom: "50px" }}>
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
              onClick={handleCreateDesignWithLoading}
              disabled={isDesignButtonDisabled}
              onMouseOver={(e) => {
                if (!isDesignButtonDisabled) {
                  e.target.style.backgroundImage = "var(--gradientButton)";
                  e.target.style.padding = "8px 18px";
                  e.target.style.border = "none";
                  e.target.style.color = "var(--always-white)";
                }
              }}
              onMouseOut={(e) => {
                if (!isDesignButtonDisabled) {
                  e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)";
                  e.target.style.border = "2px solid transparent";
                  e.target.style.padding = "6px 16px";
                  e.target.style.color = "var(--color-white)";
                }
              }}
              sx={{
                ...outlinedButtonStyles,
                fontSize: "0.95rem",
                transition: "none",
                opacity: isDesignButtonDisabled ? "0.5" : "1",
                cursor: isDesignButtonDisabled ? "default" : "pointer",
                "&:hover": {
                  backgroundImage: !isDesignButtonDisabled && "var(--gradientButton)",
                },
                "&.Mui-disabled": {
                  color: "var(--always-white)",
                },
              }}
            >
              Create a design
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateProjectWithLoading}
              disabled={isProjectButtonDisabled}
              onMouseOver={(e) => {
                if (!isProjectButtonDisabled) {
                  e.target.style.backgroundImage = "var(--gradientButton)";
                  e.target.style.padding = "8px 18px";
                  e.target.style.border = "none";
                  e.target.style.color = "var(--always-white)";
                }
              }}
              onMouseOut={(e) => {
                if (!isProjectButtonDisabled) {
                  e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)";
                  e.target.style.border = "2px solid transparent";
                  e.target.style.padding = "6px 16px";
                  e.target.style.color = "var(--color-white)";
                }
              }}
              sx={{
                ...outlinedButtonStyles,
                fontSize: "0.95rem",
                transition: "none",
                opacity: isProjectButtonDisabled ? "0.5" : "1",
                cursor: isProjectButtonDisabled ? "default" : "pointer",
                "&:hover": {
                  backgroundImage: !isProjectButtonDisabled && "var(--gradientButton)",
                },
                "&.Mui-disabled": {
                  color: "var(--always-white)",
                },
              }}
            >
              Create a project
            </Button>
          </div>
        </div>

        <section className="recent-section">
          <div className="recent-designs">
            <div className="separator">
              {/* <DesignSvg /> */}
              <h2 ref={recentDesignsRef}>{`${searchQuery ? "Searched" : "Recent"} Designs`}</h2>
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
                        <div key={design.id} className="layoutBox">
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
                    <img
                      src={`/img/design-placeholder${!isDarkMode ? "-dark" : ""}.png`}
                      alt="No designs yet"
                    />
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
            numToShowMoreDesign < filteredDesigns.length - thresholdDesign && (
              <Button
                variant="contained"
                onClick={() => setNumToShowMoreDesign(numToShowMoreDesign + thresholdDesign)}
                className="cancel-button show-more"
                sx={{
                  width: "200px",
                }}
              >
                Show more
              </Button>
            )}
          {filteredDesigns.length > thresholdDesign &&
          numToShowMoreDesign < filteredDesigns.length - thresholdDesign ? (
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
              className="cancel-button show-more"
              sx={{
                width: "200px",
              }}
            >
              Scroll to top
            </Button>
          )}
        </div>

        <section className="recent-section">
          <div className="recent-designs">
            <div className="separator">
              {/* <ProjectIcon /> */}
              <h2 ref={recentProjectsRef}>{`${searchQuery ? "Searched" : "Recent"} Projects`}</h2>
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
                        <div key={project.id} className="layoutBox">
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
                            managers={getUsernames(project.managers).then((usernames) => {
                              if (usernames.length > 3) {
                                return usernames.slice(0, 3).join(", ") + ", and more";
                              }
                              return usernames.join(", ");
                            })}
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
                    <img
                      src={`/img/design-placeholder${!isDarkMode ? "-dark" : ""}.png`}
                      alt="No projects yet"
                    />
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
            numToShowMoreProject < filteredProjects.length - thresholdProject && (
              <Button
                variant="contained"
                onClick={() => setNumToShowMoreProject(numToShowMoreProject + thresholdProject)}
                className="cancel-button show-more"
                sx={{
                  width: "200px",
                }}
              >
                Show more
              </Button>
            )}
          {filteredProjects.length > thresholdProject &&
          numToShowMoreProject < filteredProjects.length - thresholdProject ? (
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
              className="cancel-button show-more"
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
                <Box
                  onClick={handleCreateProjectWithLoading}
                  sx={{
                    ...circleButtonStyles,
                    opacity: isProjectButtonDisabled ? "0.5" : "1",
                    cursor: isProjectButtonDisabled ? "default" : "pointer",
                    "&:hover": {
                      backgroundImage: isProjectButtonDisabled
                        ? "var(--gradientCircle)"
                        : "var(--gradientCircleHover)",
                    },
                    "& svg": {
                      marginRight: "-2px",
                    },
                    "@media (max-width: 768px)": {
                      width: "50px",
                      height: "50px",
                    },
                  }}
                >
                  <AddProject />
                </Box>
              </div>
              <div className="small-button-container">
                <span className="small-button-text">Create a Design</span>
                <Box
                  onClick={handleCreateDesignWithLoading}
                  sx={{
                    ...circleButtonStyles,
                    opacity: isDesignButtonDisabled ? "0.5" : "1",
                    cursor: isDesignButtonDisabled ? "default" : "pointer",
                    "&:hover": {
                      backgroundImage: isDesignButtonDisabled
                        ? "var(--gradientCircle)"
                        : "var(--gradientCircleHover)",
                    },
                    "& svg": {
                      marginRight: "-2px",
                    },
                    "@media (max-width: 768px)": {
                      width: "50px",
                      height: "50px",
                    },
                  }}
                >
                  <AddDesign />
                </Box>
              </div>
            </div>
          )}
          <div
            className={`circle-button ${menuOpen ? "rotate" : ""} add`}
            onClick={() => toggleMenu(menuOpen, setMenuOpen)}
          >
            {menuOpen ? <AddIcon /> : <AddIcon />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Homepage;

export const circleButtonStyles = {
  backgroundImage: "var(--gradientCircle)",
  color: "var(--color-white)",
  borderRadius: "50%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  transition: "opacity 0.3s ease",
  width: "60px",
  height: "60px",
};
