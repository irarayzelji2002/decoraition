import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import SearchAppBar from "../Homepage/SearchAppBar.jsx";
import "../../css/homepage.css";
import "../../css/seeAll.css";
import Loading from "../../components/Loading.jsx";
import Dropdowns from "../../components/Dropdowns.jsx";
import DesignIcon from "../../components/DesignIcon.jsx";
import ProjectOptionsHome from "../../components/ProjectOptionsHome.jsx";
import HomepageTable from "../Homepage/HomepageTable.jsx";
import {
  ArrowForwardIosRounded as ArrowForwardIosRoundedIcon,
  ArrowBackIosRounded as ArrowBackIosRoundedIcon,
} from "@mui/icons-material";
import {
  handleViewChange,
  formatDate,
  formatDateLong,
  getUsernames,
} from "../Homepage/backend/HomepageActions";
import { TiledIcon, ListIcon } from "../ProjectSpace/svg/ExportIcon.jsx";
import { Box, Button, IconButton, Typography } from "@mui/material";
import { iconButtonStyles } from "../Homepage/DrawerComponent.jsx";
import { gradientButtonStyles } from "../DesignSpace/PromptBar.jsx";

export default function Trash() {
  const {
    user,
    users,
    userDoc,
    deletedDesigns,
    userDeletedDesigns,
    deletedProjects,
    userDeletedProjects,
    isDarkMode,
  } = useSharedProps();
  const location = useLocation();
  const navigateTo =
    location.state?.navigateFrom ||
    (location.state?.tab ? `/seeAll${location.state.tab}` : "/homepage");
  const navigateFrom = location.pathname;

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDesigns, setFilteredDesigns] = useState([]);
  const [displayedDesigns, setDisplayedDesigns] = useState([]);
  const [filteredDesignsForTable, setFilteredDesignsForTable] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [displayedProjects, setDisplayedProjects] = useState([]);
  const [filteredProjectsForTable, setFilteredProjectsForTable] = useState([]);

  const [view, setView] = useState(userDoc.layoutSettings.designsListDesigns ?? 0); //0 for tiled view, 1 for list view
  const [loadingDesigns, setLoadingDesigns] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState("");
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [sortBy, setSortBy] = useState("none");
  const [order, setOrder] = useState("none");

  const [selectedTab, setSelectedTab] = useState("Designs");
  const [optionsState, setOptionsState] = useState({
    showOptions: false,
    selectedId: null,
  });

  useEffect(() => {
    if (location?.state) {
      setSelectedTab(location.state?.tab || "Designs");
    }
  }, [location?.state]);

  const loadDesignDataForView = async () => {
    if (userDeletedDesigns.length > 0) {
      try {
        setLoadingDesigns(true);

        // Sort designs by latest modified date
        const designsByLatest = [...userDeletedDesigns].sort(
          (a, b) => b?.deletedAt?.toMillis() - a?.deletedAt?.toMillis()
        );

        // Filter designs based on search query
        const filteredDesigns = designsByLatest.filter((design) =>
          design.designName?.toLowerCase()?.includes(searchQuery?.trim()?.toLowerCase())
        );
        setFilteredDesigns(filteredDesigns);

        // Process table data
        const tableData = await Promise.all(
          filteredDesigns.map(async (design) => ({
            ...design,
            ownerId: design.owner,
            owner: users?.find((user) => user?.id === design?.owner)?.username || "",
            formattedModifiedAt: formatDate(design?.deletedAt),
            modifiedAtTimestamp: design?.deletedAt?.toMillis(),
          }))
        );

        console.log("Trash - designs tableData", tableData);
        setFilteredDesignsForTable(tableData);
        setOwners([]);
      } catch (error) {
        console.error("Error loading design data:", error);
      } finally {
        setLoadingDesigns(false);
      }
    } else {
      setFilteredDesigns([]);
      setFilteredDesignsForTable([]);
      setOwners([]);
      setLoadingDesigns(false);
    }
  };

  const loadProjectDataForView = async () => {
    if (userDeletedProjects.length > 0) {
      try {
        setLoadingProjects(true);

        // Sort projects by latest modified date
        const projectsByLatest = [...userDeletedProjects].sort(
          (a, b) => b?.deletedAt?.toMillis() - a?.deletedAt?.toMillis()
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
              formattedModifiedAt: formatDate(project?.deletedAt),
              modifiedAtTimestamp: project?.deletedAt?.toMillis(),
            };
          })
        );

        console.log("Trash - projects tableData", tableData);
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
      if (selectedTab === "Designs") await loadDesignDataForView();
      else if (selectedTab === "Projects") await loadProjectDataForView();
    };
    loadData();
  }, [userDeletedDesigns, userDeletedProjects]);

  const handleOwnerChange = (owner) => {
    setSelectedOwner(owner);
    applyFilters(searchQuery, owner, dateRange);
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    applyFilters(searchQuery, selectedOwner, range);
  };

  const applyFilters = (searchQuery, owner, dateRange) => {
    if (selectedTab === "Designs") {
      let filteredDesigns = userDeletedDesigns.filter((design) => {
        const matchesSearchQuery = design.designName
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());
        const matchesOwner = owner ? design.owner === owner : true;
        const matchesDateRange =
          dateRange.start && dateRange.end
            ? design?.deletedAt.toMillis() >= new Date(dateRange.start).getTime() &&
              design?.deletedAt.toMillis() <= new Date(dateRange.end).getTime()
            : true;
        return matchesSearchQuery && matchesOwner && matchesDateRange;
      });

      // sorting logic for tiled view
      filteredDesigns.sort((a, b) => b?.deletedAt.toMillis() - a?.deletedAt.toMillis());

      if (sortBy && sortBy !== "none" && order && order !== "none") {
        filteredDesigns = filteredDesigns.sort((a, b) => {
          let comparison = 0;
          if (sortBy === "name") {
            comparison = a.designName.localeCompare(b.designName);
          } else if (sortBy === "owner") {
            comparison = users
              .find((user) => user.id === a.owner)
              ?.username.localeCompare(users.find((user) => user.id === b.owner)?.username);
          } else if (sortBy === "deleted") {
            comparison = a?.deletedAt.toMillis() - b?.deletedAt.toMillis();
          }
          return order === "ascending" ? comparison : -comparison;
        });
      }

      setFilteredDesigns(filteredDesigns);
      setPage(1); // Reset to the first page after filtering
    } else if (selectedTab === "Projects") {
      let filteredProjects = userDeletedProjects.filter((project) => {
        const matchesSearchQuery = project.projectName
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());
        const matchesOwner = owner ? project.owner === owner : true;
        const matchesDateRange =
          dateRange.start && dateRange.end
            ? project?.deletedAt.toMillis() >= new Date(dateRange.start).getTime() &&
              project?.deletedAt.toMillis() <= new Date(dateRange.end).getTime()
            : true;
        return matchesSearchQuery && matchesOwner && matchesDateRange;
      });

      // Sorting logic for tiled view
      filteredProjects.sort((a, b) => b?.deletedAt.toMillis() - a?.deletedAt.toMillis());

      if (sortBy && sortBy !== "none" && order && order !== "none") {
        filteredProjects = filteredProjects.sort((a, b) => {
          let comparison = 0;
          if (sortBy === "name") {
            comparison = a.projectName.localeCompare(b.projectName);
          } else if (sortBy === "deleted") {
            comparison = a?.deletedAt.toMillis() - b?.deletedAt.toMillis();
          }
          return order === "ascending" ? comparison : -comparison;
        });
      }

      setFilteredProjects(filteredProjects);
      setPage(1);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (selectedTab === "Designs") await loadDesignDataForView();
      else if (selectedTab === "Projects") await loadProjectDataForView();
    };
    loadData();
  }, [
    deletedDesigns,
    deletedProjects,
    selectedTab,
    userDeletedDesigns,
    searchQuery,
    selectedOwner,
    dateRange,
  ]);

  useEffect(() => {
    applyFilters(searchQuery, selectedOwner, dateRange);
  }, [
    deletedDesigns,
    userDeletedDesigns,
    deletedProjects,
    userDeletedProjects,
    searchQuery,
    selectedOwner,
    dateRange,
    sortBy,
    order,
  ]);

  useEffect(() => {
    if (selectedTab === "Designs") {
      setLoadingDesigns(true);
      if (filteredDesigns.length > 0) {
        // Set number of pages
        const totalPages = Math.ceil(filteredDesigns.length / 18);
        setTotalPages(totalPages);

        // Set contents of the page
        const itemsPerPage = 18;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedDesigns = filteredDesigns.slice(startIndex, endIndex);
        setDisplayedDesigns(paginatedDesigns);
      } else {
        setTotalPages(0);
        setDisplayedDesigns([]);
      }
      setLoadingDesigns(false);
    } else if (selectedTab === "Projects") {
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
    }
  }, [filteredDesigns, filteredProjects, selectedTab, page]);

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

  const handleTabChange = useCallback((tab) => setSelectedTab(tab), []);

  return (
    <>
      <SearchAppBar onSearchChange={(value) => setSearchQuery(value)} searchQuery={searchQuery} />

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          paddingLeft: "15px",
          paddingRight: "15px",
          borderBottom: "1px solid var(--inputBg)",
        }}
      >
        {["Designs", "Projects"].map((tab) => (
          <Typography
            key={tab}
            onClick={() => handleTabChange(tab)}
            sx={{
              fontSize: 18,
              fontWeight: "bold",
              textTransform: "none",
              cursor: "pointer",
              padding: 1,
              paddingTop: 2,
              paddingBottom: 2,
              marginBottom: "1px",
              position: "relative",
              width: "20%",
              minWidth: "125px",
              textAlign: "center",

              // Apply gradient border bottom if active
              "&::after": {
                content: '""',
                position: "absolute",
                left: 0,
                right: 0,
                bottom: "-2px",
                height: "4px",
                background: selectedTab === tab ? "var(--gradientFont)" : "transparent",
                borderRadius: "0px",
              },

              color: selectedTab === tab ? "transparent" : "var(--color-white)",
              backgroundImage: selectedTab === tab ? "var(--gradientFont)" : "none",
              backgroundClip: selectedTab === tab ? "text" : "unset",
              WebkitBackgroundClip: selectedTab === tab ? "text" : "unset",

              "&:focus, &:active": {
                outline: "none",
                backgroundColor: "transparent",
              },

              "@media (max-width: 350px)": {
                justifyContent: "center",
              },
            }}
          >
            {tab}
          </Typography>
        ))}
      </Box>

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
              isDesign={true}
              isTrash={true}
            />
          )}
        </div>

        <section className="recent-section">
          <div className="recent-designs">
            <div className="separator see-all">
              <h2>{`${searchQuery ? "Searched in " : ""}Trash`}</h2>
              <div style={{ marginLeft: "auto", display: "inline-flex", marginBottom: "10px" }}>
                {filteredDesigns.length > 0 && (
                  <div>
                    <IconButton
                      onClick={() =>
                        handleViewChange(
                          user,
                          userDoc.id,
                          userDoc.layoutSettings,
                          "designsListDesigns",
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
                          "designsListDesigns",
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
                <Button
                  variant="text"
                  className="seeAll"
                  sx={{ ...iconButtonStyles, textTransform: "none", borderRadius: "20px" }}
                >
                  Empty Trash
                </Button>
              </div>
            </div>

            <div style={{ width: "100%" }}>
              {selectedTab === "Designs" ? (
                !loadingDesigns ? (
                  displayedDesigns.length > 0 ? (
                    view === 0 ? (
                      <div className="layout">
                        {displayedDesigns.map((design) => (
                          <div key={design.id} className="layoutBox">
                            <DesignIcon
                              id={design.id}
                              name={design.designName}
                              designId={design.id}
                              design={design}
                              owner={design.owner}
                              deletedAt={formatDateLong(design?.deletedAt)}
                              isTrash={true}
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
                          isHomepage={false}
                          page={page}
                          isTrash={true}
                          optionsState={optionsState}
                          setOptionsState={setOptionsState}
                        />
                      </div>
                    )
                  ) : (
                    <div className="no-content">
                      <img
                        src={`/img/design-placeholder${!isDarkMode ? "-dark" : ""}.png`}
                        alt="No designs yet"
                      />
                      <p>No designs in trash.</p>
                    </div>
                  )
                ) : (
                  <Loading />
                )
              ) : selectedTab === "Projects" && !loadingProjects ? (
                displayedProjects.length > 0 ? (
                  view === 0 ? (
                    <div className="layout">
                      {displayedProjects.map((project) => (
                        <div key={project.id} className="layoutBox">
                          <ProjectOptionsHome
                            id={project.id}
                            name={project.projectName}
                            project={project}
                            managers={(async () => {
                              const usernames = getUsernames(project.managers);
                              return usernames.then((usernames) => {
                                if (usernames.length > 3) {
                                  return usernames.slice(0, 3).join(", ") + ", and more";
                                }
                                return usernames.join(", ");
                              });
                            })()}
                            deletedAt={formatDateLong(project?.deletedAt)}
                            isTrash={true}
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
                        isTrash={true}
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
                    <p>No projects in trash.</p>
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
                sx={{ color: page === 1 ? "var(--disabledButton)" : "var(--color-white)" }}
              />
            </IconButton>

            <div className="pagination-controls pages">
              {/* Map over an array to create pagination buttons */}
              {Array.from({ length: totalPages }, (_, index) => (
                <Button
                  key={index + 1}
                  onClick={() => handlePageClick(index + 1)}
                  sx={{
                    ...gradientButtonStyles,
                    aspectRatio: "1/1",
                    color: page === index + 1 ? "var(--always-white)" : "var(--color-white)",
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
            </div>

            {/* Next Page Button */}
            <IconButton
              onClick={handleNextPage}
              disabled={page === totalPages}
              sx={iconButtonStyles}
            >
              <ArrowForwardIosRoundedIcon
                sx={{ color: page === totalPages ? "var(--disabledButton)" : "var(--color-white)" }}
              />
            </IconButton>
          </div>
        )}
      </div>
    </>
  );
}
