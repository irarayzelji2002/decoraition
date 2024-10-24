import React, { useState, useEffect } from "react";
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
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import FolderIcon from "@mui/icons-material/Folder";
import ImageIcon from "@mui/icons-material/Image";
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

function Homepage() {
  const navigate = useNavigate();
  const { user, userDoc, designs, userDesigns, projects, userProjects } = useSharedProps();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDesigns, setFilteredDesigns] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filteredDesignsForTable, setFilteredDesignsForTable] = useState([]);
  const [filteredProjectsForTable, setFilteredProjectsForTable] = useState([]);

  const [viewForDesigns, setViewForDesigns] = useState(userDoc.layoutSettings.designsListHome ?? 0); //0 for tiled view, 1 for list view
  const [viewForProjects, setViewForProjects] = useState(
    userDoc.layoutSettings.projectsListHome ?? 0
  );
  const [loadingDesigns, setLoadingDesigns] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [numToShowMoreDesign, setNumToShowMoreDesign] = useState(0);
  const [numToShowMoreProject, setNumToShowMoreProject] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [optionsState, setOptionsState] = useState({
    showOptions: false,
    selectedId: null,
  });
  const [threshold, setThreshold] = useState(0);

  const loadDesignDataForView = async () => {
    setLoadingDesigns(true);
    if (userDesigns.length > 0) {
      const designsByLatest = [...userDesigns].sort((a, b) => {
        return b.modifiedAt.toMillis() - a.modifiedAt.toMillis();
      });

      const filteredDesigns = designsByLatest.filter((design) =>
        design.designName.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
      setFilteredDesigns(filteredDesigns);

      const tableData = await Promise.all(
        filteredDesigns.map(async (design) => {
          const username = await getUsername(design.owner);
          return {
            ...design,
            ownerId: design.owner,
            owner: username,
            formattedCreatedAt: formatDate(design.createdAt),
            createdAtTimestamp: design.createdAt.toMillis(),
            formattedModifiedAt: formatDate(design.modifiedAt),
            modifiedAtTimestamp: design.modifiedAt.toMillis(),
          };
        })
      );
      setFilteredDesignsForTable(tableData);
    } else {
      setFilteredDesigns([]);
      setFilteredDesignsForTable([]);
    }
    setLoadingDesigns(false);
  };

  const loadProjectDataForView = async () => {
    setLoadingProjects(true);
    if (userProjects.length > 0) {
      const projectsByLatest = [...userProjects].sort((a, b) => {
        return b.modifiedAt.toMillis() - a.modifiedAt.toMillis();
      });

      const filteredProjects = projectsByLatest.filter((project) =>
        project.projectName.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
      setFilteredProjects(filteredProjects);

      const tableData = await Promise.all(
        filteredProjects.map(async (project) => {
          const managersId = project.managers || [];
          const managers = await Promise.all(
            managersId.map(async (userId) => {
              const username = await getUsername(userId);
              return username;
            })
          );
          return {
            ...project,
            managersId,
            managers,
            formattedCreatedAt: formatDate(project.createdAt),
            createdAtTimestamp: project.createdAt.toMillis(),
            formattedModifiedAt: formatDate(project.modifiedAt),
            modifiedAtTimestamp: project.modifiedAt.toMillis(),
          };
        })
      );
      setFilteredProjectsForTable(tableData);
    } else {
      setFilteredProjects([]);
      setFilteredProjectsForTable([]);
    }
    setLoadingProjects(false);
  };

  useEffect(() => {
    loadDesignDataForView();
    loadProjectDataForView();

    if (viewForProjects === 0) {
      setThreshold(6);
    } else if (viewForProjects !== 1) {
      setThreshold(10);
    }
  }, []);

  useEffect(() => {
    loadDesignDataForView();
  }, [designs, userDesigns, searchQuery]);

  useEffect(() => {
    loadProjectDataForView();
  }, [projects, userProjects, searchQuery]);

  useEffect(() => {
    setViewForDesigns(userDoc.layoutSettings.designsListHome ?? 0);
    setViewForProjects(userDoc.layoutSettings.projectsListHome ?? 0);
  }, [userDoc]);

  useEffect(() => {
    if (viewForDesigns === 0) {
      // tiled view
      const remainder = numToShowMoreDesign % 6;
      if (remainder !== 0) {
        setNumToShowMoreDesign(numToShowMoreDesign - remainder + 6);
      }
    } else if (viewForDesigns !== 1) {
      // list view
      const remainder = numToShowMoreDesign % 10;
      if (remainder !== 0) {
        setNumToShowMoreDesign(numToShowMoreDesign - remainder + 10);
      }
    }
  }, [viewForDesigns]);

  useEffect(() => {
    if (viewForProjects === 0) {
      // tiled view
      const threshold = 6;
      setThreshold(threshold);
      const remainder = numToShowMoreProject % threshold;
      if (remainder !== 0) {
        setNumToShowMoreProject(numToShowMoreProject - remainder + threshold);
      }
    } else if (viewForProjects !== 1) {
      // list view
      const threshold = 10;
      setThreshold(threshold);
      const remainder = numToShowMoreProject % threshold;
      if (remainder !== 0) {
        setNumToShowMoreProject(numToShowMoreProject - remainder + threshold);
      }
    }
  }, [viewForProjects]);

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
                height: "100px",
                paddingTop: "18px",
                marginRight: "14px",
              }}
              src="/img/Logo-Colored.png"
              alt="logo"
            />
            <div>
              <h1 className="navName">DecorAItion</h1>
              <p className="navTagline">Forming ideas with generative AI</p>
            </div>
          </div>{" "}
          <div className="action-buttons">
            <button
              className="design-button"
              onClick={() => handleCreateDesign(user, userDoc.id, navigate)}
            >
              Create a design
            </button>
            <button
              className="project-button"
              onClick={() => handleCreateProject(user, userDoc.id, navigate)}
            >
              Create a project
            </button>
          </div>
        </div>

        <div className="recent-designs">{searchQuery && <h2>Search Results</h2>}</div>

        <section className="recent-section">
          <div className="recent-designs">
            <div className="separator">
              {/* <DesignSvg /> */}
              <h2>Recent Designs</h2>
              <div style={{ marginLeft: "auto", display: "inline-flex" }}>
                {filteredDesigns.length > 0 && (
                  <div>
                    <button
                      onClick={() =>
                        handleViewChange(
                          user,
                          userDoc.id,
                          userDoc.layoutSettings,
                          "designsListHome",
                          setViewForDesigns
                        )
                      }
                    >
                      {viewForDesigns === 0 ? "Tiled View" : "List View"}
                    </button>
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
                        <div key={design.id} style={{ width: "100%" }}>
                          <DesignIcon
                            id={design.id}
                            name={design.designName}
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
                      <HomepageTable
                        isDesign={true}
                        data={filteredDesignsForTable}
                        isHomepage={true}
                        numToShowMore={numToShowMoreDesign}
                        optionsState={optionsState}
                        setOptionsState={setOptionsState}
                      />
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
        {filteredDesigns.length > threshold + numToShowMoreDesign && (
          <Button
            fullWidth
            variant="contained"
            onClick={() => setNumToShowMoreDesign(numToShowMoreDesign + threshold)}
            sx={{
              background: "var(--gradientButton)",
              borderRadius: "20px",
              color: "var(--color-white)",
              fontWeight: "bold",
              textTransform: "none",
              "&:hover": {
                background: "var(--gradientButtonHover)",
              },
            }}
          >
            Show More
          </Button>
        )}

        <section className="recent-section">
          <div className="recent-designs">
            <div className="separator">
              {/* <ProjectIcon /> */}
              <h2>Recent Projects</h2>
              <div style={{ marginLeft: "auto", display: "inline-flex" }}>
                {filteredProjects.length > 0 && (
                  <div>
                    <button
                      onClick={() =>
                        handleViewChange(
                          user,
                          userDoc.id,
                          userDoc.layoutSettings,
                          "projectsListHome",
                          setViewForProjects
                        )
                      }
                    >
                      {viewForProjects === 0 ? "Tiled View" : "List View"}
                    </button>
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
                            onOpen={() =>
                              navigate(`/project/${project.id}`, {
                                state: {
                                  projectId: project.id,
                                },
                              })
                            }
                            managers={getUsernames(project.managers).then((usernames) =>
                              usernames.join(", ")
                            )}
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
                      <HomepageTable
                        isDesign={false}
                        data={filteredProjectsForTable}
                        isHomepage={true}
                        numToShowMore={numToShowMoreProject}
                        optionsState={optionsState}
                        setOptionsState={setOptionsState}
                      />
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
        {filteredProjects.length > threshold + numToShowMoreProject && (
          <Button
            fullWidth
            variant="contained"
            onClick={() => setNumToShowMoreProject(numToShowMoreProject + threshold)}
            sx={{
              background: "var(--gradientButton)",
              borderRadius: "20px",
              color: "var(--color-white)",
              fontWeight: "bold",
              textTransform: "none",
              "&:hover": {
                background: "var(--gradientButtonHover)",
              },
            }}
          >
            Show More
          </Button>
        )}

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
