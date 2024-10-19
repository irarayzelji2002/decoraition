import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import { showToast } from "../../functions/utils.js";
import {
  fetchUserDesigns,
  fetchUserProjects,
  handleLogout,
  handleCreateDesign,
  handleCreateProject,
  handleDeleteDesign,
  handleDeleteProject,
  handleViewChange,
  toggleDarkMode,
  toggleMenu,
  formatDate,
} from "./backend/HomepageActions";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import FolderIcon from "@mui/icons-material/Folder";
import ImageIcon from "@mui/icons-material/Image";
import SearchAppBar from "./SearchAppBar.jsx";
import DesignIcon from "../../components/DesignIcon.jsx";
import ProjectOptionsHome from "../../components/ProjectOptionsHome.jsx";
import "../../css/homepage.css";
import "../../css/design.css";
import ProjectIcon from "./svg/ProjectIcon.jsx";
import DesignSvg from "./svg/DesignSvg.jsx";
import Loading from "../../components/Loading.jsx";
import { AddDesign, AddProject } from "../DesignSpace/svg/AddImage.jsx";

function Homepage() {
  const navigate = useNavigate();
  const {
    user,
    userDoc,
    designs,
    setDesigns,
    projects,
    setProjects,
    userDesigns,
    setUserDesigns,
    userProjects,
    setUserProjects,
  } = useSharedProps();

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDesigns, setFilteredDesigns] = useState([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = userDesigns.filter((design) =>
        design.designName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDesigns(results);
    } else {
      setFilteredDesigns([]); // Clear search results when no query
    }
  }, [searchQuery, userDesigns]);

  return (
    <div className={`homepage ${menuOpen ? "darkened" : ""}`}>
      {menuOpen && (
        <div className="overlay" onClick={() => toggleMenu(menuOpen, setMenuOpen)}></div>
      )}

      <SearchAppBar
        onMenuClick={() => setDrawerOpen(true)}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
      />

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
              onClick={() => handleCreateDesign(userDoc.id, navigate, setDesigns)}
            >
              Create a design
            </button>
            <button
              className="project-button"
              onClick={() => handleCreateProject(userDoc.id, navigate, setProjects)}
            >
              Create a project
            </button>
          </div>
        </div>

        <div className="recent-designs">
          {searchQuery && <h2>Search Results</h2>}
          {searchQuery && (
            <div
              style={{
                display: "flex",
                textAlign: "left",
                width: "100%",
                marginLeft: "20px",
              }}
            >
              <div className="recent-designs">
                <div className="layout">
                  {filteredDesigns.length > 0 ? (
                    filteredDesigns.slice(0, 3).map((design) => (
                      <DesignIcon
                        key={design.id}
                        name={design.designName}
                        designId={design.id}
                        lastAccessed={design.lastAccessed}
                        onDelete={() =>
                          handleDeleteDesign(userDoc.id, design.id, navigate, setDesigns)
                        }
                        onOpen={() =>
                          navigate(`/design/${design.id}`, {
                            state: {
                              designId: design.id,
                            },
                          })
                        }
                      />
                    ))
                  ) : (
                    <div className="no-content">
                      <p>No designs found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <section className="recent-section">
          <div className="recent-designs">
            <div className="separator">
              <DesignSvg />
              <h2>Recent Designs</h2>{" "}
              <Link to="/seeAllDesigns" className="seeAll" style={{ marginLeft: "auto" }}>
                See All
              </Link>
            </div>

            <div className="layout">
              {userDesigns.length > 0 ? (
                userDesigns.slice(0, 6).map((design) => (
                  <DesignIcon
                    key={design.id}
                    name={design.designName}
                    designId={design.id}
                    lastAccessed={design.lastAccessed}
                    onDelete={() => handleDeleteDesign(userDoc.id, design.id, navigate, setDesigns)}
                    onOpen={() =>
                      navigate(`/design/${design.id}`, {
                        state: { designId: design.id },
                      })
                    }
                  />
                ))
              ) : (
                <div className="no-content">
                  <img src="/img/design-placeholder.png" alt="No designs yet" />
                  <p>No designs yet. Start creating.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="recent-section">
          <div className="recent-designs">
            <div className="separator">
              <ProjectIcon />
              <h2>Recent Projects</h2>{" "}
              <Link to="/seeAllProjects" className="seeAll" style={{ marginLeft: "auto" }}>
                See All
              </Link>
            </div>

            <div className="layout">
              {userProjects.length > 0 ? (
                userProjects.slice(0, 6).map((project) => (
                  <ProjectOptionsHome
                    key={project.id}
                    name={project.projectName}
                    designId={project.id}
                    lastAccessed={project.lastAccessed}
                    onDelete={() =>
                      handleDeleteProject(
                        userDoc.id,
                        project.id,
                        setProjects,
                        navigate,
                        setProjects
                      )
                    }
                    onOpen={() =>
                      navigate(`/project/${project.id}`, {
                        state: {
                          projectId: project.id,
                        },
                      })
                    }
                  />
                ))
              ) : (
                <div className="no-content">
                  <img src="/img/design-placeholder.png" alt="No designs yet" />
                  <p>No designs yet. Start creating.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="circle-button-container">
          {menuOpen && (
            <div className="small-buttons">
              <div className="small-button-container">
                <span className="small-button-text">Create a Project</span>
                <div
                  className="small-circle-button"
                  onClick={() => handleCreateProject(userDoc.id, navigate, setProjects)}
                >
                  <AddProject />
                </div>
              </div>
              <div className="small-button-container">
                <span className="small-button-text">Create a Design</span>
                <div
                  className="small-circle-button"
                  onClick={() => handleCreateDesign(userDoc.id, navigate, setDesigns)}
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
