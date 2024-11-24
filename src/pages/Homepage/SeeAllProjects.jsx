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
import { Box, Button, IconButton } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import { AddIcon } from "../../components/svg/DefaultMenuIcons.jsx";
import {
  ArrowForwardIosRounded as ArrowForwardIosRoundedIcon,
  ArrowBackIosRounded as ArrowBackIosRoundedIcon,
} from "@mui/icons-material";
import {
  handleDeleteProject,
  handleViewChange,
  formatDate,
  formatDateLong,
  getUsernames,
} from "./backend/HomepageActions";
import { HorizontalIcon, ListIcon, TiledIcon } from "../ProjectSpace/svg/ExportIcon.jsx";
import { iconButtonStyles } from "./DrawerComponent.jsx";
import { gradientButtonStyles } from "../DesignSpace/PromptBar.jsx";
import { AddProject } from "../DesignSpace/svg/AddImage.jsx";
import { circleButtonStyles } from "./Homepage.jsx";

export default function SeeAllProjects() {
  const navigate = useNavigate();
  const { user, users, userDoc, projects, userProjects, isDarkMode } = useSharedProps();

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

  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState("");
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  const [sortBy, setSortBy] = useState("none");
  const [order, setOrder] = useState("none");

  const [isProjectButtonDisabled, setIsProjectButtonDisabled] = useState(false);

  const loadProjectDataForView = async () => {
    if (userProjects.length > 0) {
      try {
        setLoadingProjects(true);

        // Sort projects by latest modified date
        const projectsByLatest = [...userProjects].sort(
          (a, b) => b.modifiedAt?.toMillis() - a.modifiedAt?.toMillis()
        );

        // Filter projects based on search query
        const filteredProjects = projectsByLatest.filter((project) =>
          project.projectName?.toLowerCase()?.includes(searchQuery?.trim()?.toLowerCase())
        );
        setFilteredProjects(filteredProjects);

        // Process projects and fetch manager usernames
        const tableData = await Promise.all(
          filteredProjects.map(async (project) => {
            const managersId = project?.managers || [];
            let projectManagers = [];

            try {
              // Use getUsernames function to fetch usernames
              projectManagers = (project?.managers || []).map(
                (id) => users?.find((user) => user?.id === id)?.username || ""
              );
            } catch (error) {
              console.error(`Error fetching manager usernames for project ${project.id}:`, error);
            }

            return {
              ...project,
              managersId,
              managers: projectManagers.join(", "),
              formattedCreatedAt: formatDate(project?.createdAt),
              createdAtTimestamp: project.createdAt?.toMillis(),
              formattedModifiedAt: formatDate(project?.modifiedAt),
              modifiedAtTimestamp: project.modifiedAt?.toMillis(),
            };
          })
        );

        setFilteredProjectsForTable(tableData);
        setOwners([]);
      } catch (error) {
        console.error("Error loading project data:", error);
      } finally {
        setLoadingProjects(false);
      }
    } else {
      setFilteredProjects([]);
      setFilteredProjectsForTable([]);
      setOwners([]);
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadProjectDataForView();
    };
    loadData();
  }, []);

  const handleOwnerChange = (owner) => {
    setSelectedOwner(owner);
    applyFilters(searchQuery, owner, dateRange);
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    applyFilters(searchQuery, selectedOwner, range);
  };

  const applyFilters = (searchQuery, owner, dateRange) => {
    let filteredProjects = userProjects.filter((project) => {
      const matchesSearchQuery = project.projectName
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());
      const matchesOwner = owner ? project.owner === owner : true;
      const matchesDateRange =
        dateRange.start && dateRange.end
          ? project.modifiedAt.toMillis() >= new Date(dateRange.start).getTime() &&
            project.modifiedAt.toMillis() <= new Date(dateRange.end).getTime()
          : true;
      return matchesSearchQuery && matchesOwner && matchesDateRange;
    });

    // Sorting logic for tiled view
    filteredProjects.sort((a, b) => b.modifiedAt.toMillis() - a.modifiedAt.toMillis());

    if (sortBy && sortBy !== "none" && order && order !== "none") {
      filteredProjects = filteredProjects.sort((a, b) => {
        let comparison = 0;
        if (sortBy === "name") {
          comparison = a.projectName.localeCompare(b.projectName);
        } else if (sortBy === "created") {
          comparison = a.createdAt.toMillis() - b.createdAt.toMillis();
        } else if (sortBy === "modified") {
          comparison = a.modifiedAt.toMillis() - b.modifiedAt.toMillis();
        }
        return order === "ascending" ? comparison : -comparison;
      });
    }

    setFilteredProjects(filteredProjects);
    setPage(1);
  };

  useEffect(() => {
    const loadData = async () => {
      await loadProjectDataForView();
    };
    loadData();
  }, [projects, userProjects, searchQuery, selectedOwner, dateRange]);

  useEffect(() => {
    setView(userDoc.layoutSettings.projectsListProjects ?? 0);
  }, [userDoc]);

  useEffect(() => {
    setLoadingProjects(true);
    if (filteredProjects.length > 0) {
      // Set number of pages
      const totalPages = Math.ceil(filteredProjects.length / 18);
      setTotalPages(totalPages);

      // Set contents of the page
      const itemsPerPage = 18;
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

  useEffect(() => {
    applyFilters(searchQuery, selectedOwner, dateRange);
  }, [projects, userProjects, searchQuery, selectedOwner, dateRange, sortBy, order]);

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

  const handleCreateProjectWithLoading = async () => {
    setIsProjectButtonDisabled(true);
    // Your create project logic here
    setIsProjectButtonDisabled(false);
  };

  return (
    <>
      <SearchAppBar onSearchChange={(value) => setSearchQuery(value)} searchQuery={searchQuery} />
      <div className="bg" style={{ background: "none", paddingBottom: "50px" }}>
        <div className="dropdown-container">
          {view === 0 && (
            <Dropdowns
              owners={owners}
              onOwnerChange={handleOwnerChange}
              onDateRangeChange={handleDateRangeChange}
              sortBy={sortBy}
              order={order}
              onSortByChange={setSortBy}
              onOrderChange={setOrder}
              isDesign={false}
            />
          )}
        </div>
        {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}

        <section className="recent-section">
          <div className="recent-projects">
            <div className="separator see-all">
              <h2>{`${searchQuery ? "Searched " : ""}Projects`}</h2>
              <div style={{ marginLeft: "auto", display: "inline-flex", marginBottom: "10px" }}>
                {filteredProjects.length > 0 && (
                  <div>
                    <IconButton
                      onClick={() =>
                        handleViewChange(
                          user,
                          userDoc.id,
                          userDoc.layoutSettings,
                          "projectsListProjects",
                          setView
                        )
                      }
                      sx={{
                        ...iconButtonStyles,
                        padding: "10px",
                        margin: "0px 5px",
                        borderRadius: "8px",
                        backgroundColor: view === 0 ? "var(--nav-card-modal)" : "transparent",
                        "@media (max-width: 366px)": {
                          padding: "8px",
                        },
                      }}
                    >
                      <TiledIcon />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        handleViewChange(
                          user,
                          userDoc.id,
                          userDoc.layoutSettings,
                          "projectsListProjects",
                          setView
                        )
                      }
                      sx={{
                        ...iconButtonStyles,
                        padding: "10px",
                        margin: "0px 5px",
                        borderRadius: "8px",
                        backgroundColor: view === 1 ? "var(--nav-card-modal)" : "transparent",
                        "@media (max-width: 366px)": {
                          padding: "8px",
                        },
                      }}
                    >
                      <ListIcon />
                    </IconButton>
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
                        <div key={project.id} className="layoutBox">
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

        {/* Pagination Section */}
        {totalPages > 0 && (
          <div className="pagination-controls">
            {/* Previous Page Button */}
            <IconButton onClick={handlePreviousPage} disabled={page === 1} sx={iconButtonStyles}>
              <ArrowBackIosRoundedIcon
                sx={{ color: page === 1 ? "var(--inputBg)" : "var(--color-white)" }}
              />
            </IconButton>

            {/* Map over an array to create pagination buttons */}
            {Array.from({ length: totalPages }, (_, index) => (
              <Button
                key={index + 1}
                onClick={() => handlePageClick(index + 1)}
                sx={{
                  ...gradientButtonStyles,
                  aspectRatio: "1/1",
                  color: "var(--color-white)",
                  background:
                    page === index + 1
                      ? "var(--gradientButton) !important"
                      : "var(--iconBg) !important",

                  minWidth: page === index + 1 ? "40px" : "36.5px",
                  "&:hover": {
                    background:
                      page === index + 1
                        ? "var(--gradientButtonHover) !important"
                        : "var(--iconBgHover) !important",
                  },
                }}
              >
                {index + 1}
              </Button>
            ))}

            {/* Next Page Button */}
            <IconButton
              onClick={handleNextPage}
              disabled={page === totalPages}
              sx={iconButtonStyles}
            >
              <ArrowForwardIosRoundedIcon
                sx={{ color: page === totalPages ? "var(--inputBg)" : "var(--color-white)" }}
              />
            </IconButton>
          </div>
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
        <div className={`circle-button ${menuOpen ? "rotate" : ""} add`} onClick={toggleMenu}>
          {menuOpen ? <AddIcon /> : <AddIcon />}
        </div>
      </div>
    </>
  );
}
