import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import SearchAppBar from "./SearchAppBar.jsx";
import "../../css/homepage.css";
import "../../css/seeAll.css";
import Loading from "../../components/Loading.jsx";
import Dropdowns from "../../components/Dropdowns.jsx";
import ProjectOptionsHome from "../../components/ProjectOptionsHome.jsx";
import HomepageTable from "./HomepageTable.jsx";
import { Button } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import {
  handleDeleteProject,
  handleViewChange,
  formatDate,
  formatDateLong,
  getUsernames,
} from "./backend/HomepageActions";
import { HorizontalIcon, ListIcon } from "../ProjectSpace/svg/ExportIcon.jsx";

export default function SeeAllProjects() {
  const navigate = useNavigate();
  const { user, userDoc, projects, userProjects } = useSharedProps();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [displayedProjects, setDisplayedProjects] = useState([]);
  const [filteredProjectsForTable, setFilteredProjectsForTable] = useState([]);

  const [view, setView] = useState(userDoc.layoutSettings.projectsListProjects ?? 0); //0 for tiled view, 1 for list view
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [optionsState, setOptionsState] = useState({
    showOptions: false,
    selectedId: null,
  });

  const loadProjectDataForView = async () => {
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
          const managers = await getUsernames(managersId);

          return {
            ...project,
            managersId,
            managers: managers.join(", "),
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
  };

  useEffect(() => {
    const loadData = async () => {
      await loadProjectDataForView();
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await loadProjectDataForView();
    };
    loadData();
  }, [projects, userProjects, searchQuery]);

  useEffect(() => {
    setView(userDoc.layoutSettings.projectsListProjects ?? 0);
  }, [userDoc]);

  useEffect(() => {
    setLoadingProjects(true);
    if (filteredProjects.length > 0) {
      // Set number of pages
      const totalPages = Math.ceil(filteredProjects.length / 25);
      setTotalPages(totalPages);

      // Set contents of the page
      const itemsPerPage = 25;
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedProjects = filteredProjects.slice(startIndex, endIndex);
      setDisplayedProjects(paginatedProjects);
    } else {
      setTotalPages(0);
      setDisplayedProjects([]);
    }
    setLoadingProjects(false);
  }, [filteredProjects, page]);

  const handlePageClick = (pageNumber) => {
    setPage(pageNumber);
    window.scrollTo(0, 0);
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      handlePageClick(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      handlePageClick(page + 1);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleModal = () => {
    // Your modal toggle logic here
  };

  return (
    <>
      <SearchAppBar onSearchChange={(value) => setSearchQuery(value)} searchQuery={searchQuery} />
      <div className="bg">
        <div className="dropdown-container">
          <Dropdowns />
        </div>
        {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}

        <section className="recent-section">
          <div className="recent-projects">
            <div className="separator">
              <div className="title">Projects</div>
              <div style={{ marginLeft: "auto", display: "inline-flex" }}>
                {filteredProjects.length > 0 && (
                  <div>
                    <Button
                      className="gradient-from-none"
                      onClick={() =>
                        handleViewChange(
                          user,
                          userDoc.id,
                          userDoc.layoutSettings,
                          "projectsListProjects",
                          setView
                        )
                      }
                    >
                      {view === 0 ? <ListIcon /> : <HorizontalIcon />}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ width: "100%" }}>
              {!loadingProjects ? (
                displayedProjects.length > 0 ? (
                  view === 0 ? (
                    <div className="layout">
                      {displayedProjects.map((project) => (
                        <div key={project.id} style={{ width: "100%" }}>
                          <ProjectOptionsHome
                            id={project.id}
                            name={project.projectName}
                            project={project}
                            onOpen={() =>
                              navigate(`/project/${project.id}`, {
                                state: { projectId: project.id },
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
                      <HomepageTable
                        isDesign={false}
                        data={filteredProjectsForTable}
                        isHomepage={false}
                        page={page}
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

        {/* Pagination Section */}
        {totalPages > 0 && (
          <div className="pagination-controls">
            {/* Previous Page Button */}
            <button onClick={handlePreviousPage} className="pagination-arrow" disabled={page === 1}>
              &lt;
            </button>

            {/* Map over an array to create pagination buttons */}
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                className={`pagination-button ${page === index + 1 ? "active" : ""}`}
                onClick={() => handlePageClick(index + 1)}
              >
                {index + 1}
              </button>
            ))}

            {/* Next Page Button */}
            <button
              onClick={handleNextPage}
              className="pagination-arrow"
              disabled={page === totalPages}
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      <div className="circle-button-container" style={{ bottom: "30px" }}>
        {menuOpen && (
          <div className="small-buttons">
            <div className="small-button-container" onClick={toggleModal}>
              <span className="small-button-text">Create a Project</span>
              <div className="small-circle-button">
                <FolderIcon className="icon" />
              </div>
            </div>
            <div
              className="small-button-container"
              // onClick={() =>
              //   projectId
              //     ? navigate(`/addItem/${projectId}/${projectId}/project`)
              //     : navigate(`/addItem/${projectId}`)
              // }
            ></div>
          </div>
        )}
        <div className={`circle-button ${menuOpen ? "rotate" : ""}`} onClick={toggleMenu}>
          {menuOpen ? <CloseIcon /> : <AddIcon />}
        </div>
      </div>
    </>
  );
}
