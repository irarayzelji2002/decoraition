import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  styled,
} from "@mui/material";
import {
  ArrowForwardIosRounded as ArrowForwardIosRoundedIcon,
  ArrowBackIosRounded as ArrowBackIosRoundedIcon,
  KeyboardArrowDownRounded as KeyboardArrowDownRoundedIcon,
  CloseRounded,
} from "@mui/icons-material";
import SearchAppBar from "../Homepage/SearchAppBar.jsx";
import "../../css/homepage.css";
import "../../css/seeAll.css";
import Loading from "../../components/Loading.jsx";
import Dropdowns from "../../components/Dropdowns.jsx";
import DesignIcon from "../../components/DesignIcon.jsx";
import ProjectOptionsHome from "../../components/ProjectOptionsHome.jsx";
import HomepageTable from "../Homepage/HomepageTable.jsx";
import {
  handleViewChange,
  formatDate,
  formatDateLong,
  getUsernames,
} from "../Homepage/backend/HomepageActions";
import { TiledIcon, ListIcon } from "../ProjectSpace/svg/ExportIcon.jsx";
import { iconButtonStyles } from "../Homepage/DrawerComponent.jsx";
import { gradientButtonStyles, outlinedButtonStyles } from "../DesignSpace/PromptBar.jsx";
import {
  dialogStyles,
  dialogTitleStyles,
  dialogContentStyles,
  dialogActionsStyles,
} from "../../components/RenameModal";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import { showToast } from "../../functions/utils.js";
import { emptyTrash } from "../Homepage/backend/HomepageActions.jsx";

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

  const [anchorEl, setAnchorEl] = useState(null);
  const [isEmptyTrashModalOpen, setIsEmptyTrashModalOpen] = useState(false);
  const [clickedEmptyTrashOption, setClickedEmptyTrashOption] = useState("");
  const [isDeleteBtnDisabled, setIsDeleteBtnDisabled] = useState(false);

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

  const handleEmptyTrashMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleEmptyTrashMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenEmptyTrashModal = (option) => {
    setClickedEmptyTrashOption(option);
    setIsEmptyTrashModalOpen(true);
    handleEmptyTrashMenuClose();
  };

  const handleCloseEmptyTrashModal = () => {
    setClickedEmptyTrashOption("");
    setIsEmptyTrashModalOpen(false);
  };

  const handleEmptyTrash = async (option) => {
    setIsDeleteBtnDisabled(true);
    try {
      console.log("Trash - Starting trash deletion...");
      const userDeletedDesignsIds = userDeletedDesigns.map((design) => design.id);
      const userDeletedProjectsIds = userDeletedProjects.map((project) => project.id);
      const result = await emptyTrash(user, userDoc, {
        designs: option === "designs" || option === "all" ? userDeletedDesignsIds : [],
        projects: option === "projects" || option === "all" ? userDeletedProjectsIds : [],
      });
      console.log("Trash - Empty trash result:", result);
      if (!result.success) {
        console.log("Trash - Empty trash failed, showing error toast");
        showToast("error", "Failed to empty trash");
        return;
      }
      console.log("Trash - Empty trash succeeded, showing success toast");
      showToast("success", "Trash emptied succeesfully");
      handleCloseEmptyTrashModal();
    } finally {
      setIsDeleteBtnDisabled(false);
    }
  };

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
        <div className="dropdown-container fromTrash">
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
              <h2>{`${searchQuery ? "Searched in " : ""} ${selectedTab} Trash`}</h2>
              <div style={{ marginLeft: "auto", display: "inline-flex", marginBottom: "10px" }}>
                {(filteredDesigns.length > 0 || filteredProjects.length > 0) && (
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
                  onClick={handleEmptyTrashMenuOpen}
                >
                  <span style={{ marginRight: "5px", marginLeft: "5px" }}>Empty Trash</span>
                  <KeyboardArrowDownRoundedIcon
                    sx={{
                      color: "var(--brightFont) !important",
                      transform: !anchorEl ? "rotate(0deg)" : "rotate(180deg)",
                    }}
                  />
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleEmptyTrashMenuClose}
                  slotProps={{
                    paper: {
                      elevation: 0,
                      sx: {
                        overflow: "hidden",
                        filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                        mt: 1.5,
                        backgroundColor: "var(--nav-card-modal)",
                        color: "var(--color-white)",
                        minWidth: "190px",
                        borderTopLeftRadius: "0px",
                        borderTopRightRadius: "0px",
                        borderBottomLeftRadius: "10px",
                        borderBottomRightRadius: "10px",
                        "& .MuiList-root": {
                          overflow: "hidden",
                        },
                      },
                    },
                  }}
                  MenuListProps={{
                    sx: {
                      color: "var(--color-white)",
                      padding: "0px !important",
                    },
                  }}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  {selectedTab === "Designs" && (
                    <CustomMenuItem onClick={() => handleOpenEmptyTrashModal("designs")}>
                      <ListItemText
                        primary="Empty designs trash"
                        sx={{ color: "var(--color-white)" }}
                      />
                    </CustomMenuItem>
                  )}
                  {selectedTab === "Projects" && (
                    <CustomMenuItem onClick={() => handleOpenEmptyTrashModal("projects")}>
                      <ListItemText
                        primary="Empty projects trash"
                        sx={{ color: "var(--color-white)" }}
                      />
                    </CustomMenuItem>
                  )}
                  <CustomMenuItem onClick={() => handleOpenEmptyTrashModal("all")}>
                    <ListItemText primary="Empty all trash" sx={{ color: "var(--color-white)" }} />
                  </CustomMenuItem>
                </Menu>
                <EmptyTrashModal
                  isOpen={isEmptyTrashModalOpen}
                  onClose={handleCloseEmptyTrashModal}
                  option={clickedEmptyTrashOption}
                  handleDelete={() => handleEmptyTrash(clickedEmptyTrashOption)}
                  isDeleteBtnDisabled={isDeleteBtnDisabled}
                />
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

const CustomMenuItem = styled(MenuItem)({
  minHeight: "2.6rem !important",
  "&:hover": {
    backgroundColor: "var(--iconBg)",
  },
  "&:focus": {
    backgroundColor: "var(--iconBg)",
  },
});

// Empty trash confirmation modal
const EmptyTrashModal = ({ isOpen, onClose, option, handleDelete, isDeleteBtnDisabled }) => {
  const onSubmit = () => {
    handleDelete();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} sx={dialogStyles}>
      <DialogTitle sx={dialogTitleStyles}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: "bold",
            fontSize: "1.15rem",
            flexGrow: 1,
            maxWidth: "80%",
            whiteSpace: "normal",
          }}
        >
          Empty {option} trash
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            ...iconButtonStyles,
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          <CloseRounded />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={dialogContentStyles}>
        <Typography variant="body1" sx={{ marginBottom: "10px", textAlign: "center" }}>
          Are you sure you want to empty all trashed{" "}
          {option !== "all" ? option : "designs and projects"}?
        </Typography>
        <Typography
          variant="body1"
          sx={{
            marginBottom: "10px",
            textAlign: "center",
            fontSize: "0.875rem",
            fontWeight: "400",
            color: "var(--greyText)",
          }}
        >
          This will permanently delete{" "}
          {option === "designs"
            ? "all trashed designs. You and each design's editors"
            : option === "projects"
            ? "all trashed projects. Each project's managers"
            : option === "all" &&
              "all trashed designs and projects. Each design and project's collaborators"}{" "}
          will not be able to restore it anymore after deletion.
        </Typography>
      </DialogContent>
      <DialogActions sx={dialogActionsStyles}>
        <Button
          fullWidth
          variant="contained"
          onClick={onSubmit}
          sx={{
            ...gradientButtonStyles,
            opacity: isDeleteBtnDisabled ? "0.5" : "1",
            cursor: isDeleteBtnDisabled ? "default" : "pointer",
            "&:hover": {
              backgroundImage: !isDeleteBtnDisabled && "var(--gradientButtonHover)",
            },
          }}
          disabled={isDeleteBtnDisabled}
        >
          Yes
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={outlinedButtonStyles}
          onMouseOver={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButtonHover)")
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
          }
        >
          No
        </Button>
      </DialogActions>
    </Dialog>
  );
};
