import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  handleCreateDesign,
  handleCreateProject,
  handleDeleteDesign,
  handleDeleteProject,
  toggleMenu,
  formatDate,
} from "./backend/HomepageActions";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import FolderIcon from "@mui/icons-material/Folder";
import ImageIcon from "@mui/icons-material/Image";
import SearchAppBar from "./SearchAppBar.jsx";
import DesignIcon from "../../components/DesignIcon.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../css/homepage.css";
import "../../css/design.css";
import ProjectIcon from "./svg/ProjectIcon.jsx";
import DesignSvg from "./svg/DesignSvg.jsx";
import Loading from "../../components/Loading.jsx";

function Homepage({ ...sharedProps }) {
  const navigate = useNavigate();

  const user = sharedProps.user;
  const designs = sharedProps.designs;
  const setDesigns = sharedProps.setDesigns;
  const projects = sharedProps.projects;
  const setProjects = sharedProps.setProjects;

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDesigns, setFilteredDesigns] = useState([]);

  const handleCreateDesignClick = () => handleCreateDesign(user.uid, navigate);
  const handleCreateProjectClick = () => handleCreateProject(user.uid, navigate);
  const handleDeleteDesignClick = (designId) => handleDeleteDesign(designId, setDesigns);
  const handleDeleteProjectClick = (projectId) => handleDeleteProject(projectId, setProjects);

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = designs.filter((design) =>
        design.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDesigns(results);
    } else {
      setFilteredDesigns([]); // Clear search results when no query
    }
  }, [searchQuery, designs]);

  return (
    <div className={`homepage ${menuOpen ? "darkened" : ""}`}>
      <ToastContainer />
      {menuOpen && (
        <div className="overlay" onClick={() => toggleMenu(menuOpen, setMenuOpen)}></div>
      )}

      <SearchAppBar
        user={user}
        onMenuClick={() => setDrawerOpen(true)}
        onSearchChange={setSearchQuery}
      />

      <div className={`content ${isDrawerOpen ? "dimmed" : ""}`}>
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
              onClick={() => handleCreateDesign(navigate, setDesigns)}
            >
              Create a design
            </button>
            <button
              className="project-button"
              onClick={() => handleCreateProject(navigate, setProjects)}
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
              <div className="layout" style={{ marginBottom: "100px" }}>
                {filteredDesigns.length > 0 ? (
                  filteredDesigns.slice(0, 3).map((design) => (
                    <DesignIcon
                      key={design.id}
                      name={design.name}
                      designId={design.id}
                      lastAccessed={design.lastAccessed}
                      onDelete={() => handleDeleteDesign(design.id, setDesigns)}
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
              {designs.length > 0 ? (
                designs.slice(0, 6).map((design) => (
                  <DesignIcon
                    key={design.id}
                    name={design.name}
                    designId={design.id}
                    lastAccessed={design.lastAccessed}
                    onDelete={() => handleDeleteDesign(design.id, setDesigns)}
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
              {projects.length > 0 ? (
                projects.slice(0, 6).map((project) => (
                  <DesignIcon
                    key={project.id}
                    name={project.name}
                    designId={project.id}
                    lastAccessed={project.lastAccessed}
                    onDelete={() => handleDeleteDesign(project.id, setProjects)}
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
                  onClick={() => handleCreateProject(navigate, setProjects)}
                >
                  <FolderIcon className="icon" />
                </div>
              </div>
              <div className="small-button-container">
                <span className="small-button-text">Create a Design</span>
                <div
                  className="small-circle-button"
                  onClick={() => handleCreateDesign(navigate, setDesigns)}
                >
                  <ImageIcon className="icon" />
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
