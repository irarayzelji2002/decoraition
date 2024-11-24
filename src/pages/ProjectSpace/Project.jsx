import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { onSnapshot, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  Paper,
  IconButton,
  InputBase,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Search as SearchIcon,
  CloseRounded as CloseRoundedIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  ArrowForwardIosRounded,
  ArrowBackIosRounded,
} from "@mui/icons-material";
import { AddIcon } from "../../components/svg/DefaultMenuIcons";
import { showToast } from "../../functions/utils";
import Modal from "../../components/Modal";
import ProjectSpace from "./ProjectSpace";
import Loading from "../../components/Loading";
import DesignIcon from "../../components/DesignIcon";
import Dropdowns from "../../components/Dropdowns";
import "../../css/seeAll.css";
import "../../css/project.css";
import {
  handleCreateDesign as handleCreateDesignBackend,
  fetchUserDesigns,
  updateDesignProjectId,
  removeDesignFromProject,
} from "./backend/ProjectDetails";
import { AddDesign, AddProject } from "../DesignSpace/svg/AddImage";
import { HorizontalIcon, TiledIcon, VerticalIcon } from "./svg/ExportIcon";
import { Typography } from "@mui/material";
import { ListIcon } from "./svg/ExportIcon";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import LoadingPage from "../../components/LoadingPage";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import {
  formatDate,
  formatDateLong,
  getUsername,
  handleDeleteDesign,
} from "../Homepage/backend/HomepageActions";
import HomepageTable from "../Homepage/HomepageTable";
import ImportDesignModal, {
  DesignInfoBox,
  DesignInfoTooltip,
} from "../../components/ImportDesignModal";
import deepEqual from "deep-equal";
import { gradientButtonStyles, outlinedButtonStyles } from "../DesignSpace/PromptBar";
import { set } from "lodash";
import { circleButtonStyles } from "../Homepage/Homepage";
import {
  dialogActionsStyles,
  dialogContentStyles,
  dialogStyles,
  dialogTitleStyles,
} from "../../components/RenameModal";

function Project() {
  const { projectId } = useParams();
  const {
    user,
    users,
    designs,
    userDesigns,
    userProjects,
    projects,
    isDarkMode,
    userDoc,
    userDesignVersions,
  } = useSharedProps();
  const location = useLocation();
  const navigate = useNavigate();
  const [changeMode, setChangeMode] = useState(location?.state?.changeMode || "");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [optionsState, setOptionsState] = useState({
    showOptions: false,
    selectedId: null,
  });

  const [project, setProject] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [origFilteredDesigns, setOrigFilteredDesigns] = useState([]);
  const [filteredDesigns, setFilteredDesigns] = useState([]);
  const [filteredDesignsForTable, setFilteredDesignsForTable] = useState([]);
  const [displayedDesigns, setDisplayedDesigns] = useState([]);

  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [sortBy, setSortBy] = useState("none");
  const [order, setOrder] = useState("none");

  const [isDesignButtonDisabled, setIsDesignButtonDisabled] = useState(false);
  const [isRemoveDesignBtnDisabled, setIsRemoveDesignBtnDisabled] = useState(false);
  const [numToShowMoreDesign, setNumToShowMoreDesign] = useState(0);
  const [thresholdDesign, setThresholdDesign] = useState(6);

  const [isVertical, setIsVertical] = useState(false);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingDesigns, setLoadingDesigns] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const [openConfirmRemove, setOpenConfirmRemove] = useState(false);
  const [designIdToRemove, setDesignIdToRemove] = useState(null);
  const [designToRemove, setDesignToRemove] = useState(null);

  const userDesignsWithoutProject = userDesigns.filter((design) => !design.projectId);

  // Get project
  useEffect(() => {
    if (projectId && userProjects.length > 0) {
      const fetchedProject =
        userProjects.find((d) => d.id === projectId) || projects.find((d) => d.id === projectId);

      if (!fetchedProject) {
        console.error("Project not found.");
        setLoadingProject(false);
      } else if (Object.keys(project).length === 0 || !deepEqual(project, fetchedProject)) {
        setProject(fetchedProject);
        console.log("current project:", fetchedProject);
      }
    }
  }, [projectId, projects, userProjects]);

  // loading state
  useEffect(() => {
    if (project && userDesigns) {
      setLoadingProject(false);
    }
  }, [project, userDesigns]);

  // Load design data
  useEffect(() => {
    const loadData = async () => {
      if (project?.designs?.length > 0 && userDesigns?.length > 0) {
        try {
          setLoadingDesigns(true);

          // Get all designs that belong to this project
          const projectDesigns = project.designs
            .map(
              (designId) =>
                userDesigns.find((design) => design.id === designId) ||
                designs.find((design) => design.id === designId)
            )
            .filter((design) => design); // Filter out any undefined values

          if (projectDesigns.length > 0) {
            // Sort designs by latest modified
            const designsByLatest = [...projectDesigns].sort(
              (a, b) => b.modifiedAt?.toMillis() - a.modifiedAt?.toMillis()
            );

            setFilteredDesigns(designsByLatest);
            console.log("Loaded project designs:", designsByLatest);

            // Process table data
            const tableData = await Promise.all(
              designsByLatest.map(async (design) => ({
                ...design,
                ownerId: design.owner,
                owner: users?.find((user) => user?.id === design?.owner)?.username || "",
                formattedCreatedAt: formatDate(design?.createdAt),
                createdAtTimestamp: design.createdAt?.toMillis(),
                formattedModifiedAt: formatDate(design?.modifiedAt),
                modifiedAtTimestamp: design.modifiedAt?.toMillis(),
              }))
            );
            setFilteredDesignsForTable(tableData);
          } else {
            setFilteredDesigns([]);
            setFilteredDesignsForTable([]);
          }
        } catch (error) {
          console.error("Error loading design data:", error);
          showToast("error", "Failed to load designs for this project");
        } finally {
          setLoadingDesigns(false);
        }
      } else {
        setFilteredDesigns([]);
        setFilteredDesignsForTable([]);
        setLoadingDesigns(false);
      }
    };

    loadData();
  }, [project, designs, userDesigns, users]);

  // Sorting and filtering
  const handleOwnerChange = (owner) => {
    setSelectedOwner(owner);
    applyFilters(searchQuery, owner, dateRange);
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    applyFilters(searchQuery, selectedOwner, range);
  };

  // Add handler for search input
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const applyFilters = useCallback(
    (searchQuery, owner, dateRange, sortBy, order) => {
      if (!filteredDesigns) return;
      let filtered = [...filteredDesigns];
      // Apply search filter
      if (searchQuery.trim()) {
        filtered = filtered.filter((design) =>
          design.designName.toLowerCase().includes(searchQuery.trim().toLowerCase())
        );
      }
      // Apply owner filter
      if (owner) {
        filtered = filtered.filter((design) => design.owner === owner);
      }
      // Apply date range filter
      if (dateRange.start && dateRange.end) {
        filtered = filtered.filter(
          (design) =>
            design.modifiedAt?.toMillis() >= new Date(dateRange.start).getTime() &&
            design.modifiedAt?.toMillis() <= new Date(dateRange.end).getTime()
        );
      }
      // Apply sorting
      if (sortBy && sortBy !== "none" && order && order !== "none") {
        filtered.sort((a, b) => {
          let comparison = 0;
          switch (sortBy) {
            case "name":
              comparison = a.designName.localeCompare(b.designName);
              break;
            case "owner":
              comparison = (
                users.find((user) => user.id === a.owner)?.username || ""
              ).localeCompare(users.find((user) => user.id === b.owner)?.username || "");
              break;
            case "created":
              comparison = (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
              break;
            case "modified":
              comparison = (a.modifiedAt?.toMillis() || 0) - (b.modifiedAt?.toMillis() || 0);
              break;
            default:
              comparison = 0;
          }
          return order === "ascending" ? comparison : -comparison;
        });
      } else {
        // Default sort by latest modified
        filtered.sort((a, b) => (b.modifiedAt?.toMillis() || 0) - (a.modifiedAt?.toMillis() || 0));
      }

      setDisplayedDesigns(filtered);
      console.log("Applied filters:", {
        searchQuery,
        owner,
        dateRange,
        sortBy,
        order,
        filteredCount: filtered.length,
      });
    },
    [filteredDesigns, users]
  );

  useEffect(() => {
    applyFilters(searchQuery, selectedOwner, dateRange, sortBy, order);
  }, [searchQuery, selectedOwner, dateRange, sortBy, order, applyFilters]);

  useEffect(() => {
    setLoadingDesigns(true);
    if (filteredDesigns.length > 0) {
      // Set number of pages
      const itemsPerPage = 18;
      const totalPages = Math.ceil(filteredDesigns.length / itemsPerPage);
      setTotalPages(totalPages);

      // Set contents of the page
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedDesigns = filteredDesigns.slice(startIndex, endIndex);

      // Update displayed designs
      setDisplayedDesigns(paginatedDesigns);

      console.log("Project Design - page", page);
      console.log("Project Design - filteredDesigns", filteredDesigns);
      console.log("Project Design - displayedDesigns", paginatedDesigns);
    } else {
      setTotalPages(0);
      setDisplayedDesigns([]);
    }
    setLoadingDesigns(false);
  }, [filteredDesigns, page]);

  useEffect(() => {
    console.log("Project Design - Project designs:", project?.designs);
    console.log("Project Design - Available userDesigns:", userDesigns);
    console.log("Project Design - Available designs:", designs);
  }, [project, userDesigns, designs]);

  useEffect(() => {
    console.log("Project Design - filteredDesigns", filteredDesigns);
    console.log("Project Design - displayedDesigns", displayedDesigns);
    console.log("Project Design - page", page);
  }, [displayedDesigns, filteredDesigns, page]);

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

  const handleVerticalClick = () => {
    setIsVertical(true);
  };
  const handleHorizontalClick = () => {
    setIsVertical(false);
  };
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalContent(null);
  };

  const handleCreateDesign = async () => {
    setIsDesignButtonDisabled(true);
    try {
      const result = await handleCreateDesignBackend(
        projectId,
        project?.projectName || "Untitled Project",
        user,
        userDoc
      );
      console.log("result", result);
      if (!result.success) {
        showToast("error", "Failed to create design for this project.");
        return;
      }
      showToast("success", "Design created successfully");
    } catch (error) {
      console.error("Error creating design for this project:", error);
      showToast("error", "Failed to create design for this project.");
    } finally {
      setIsDesignButtonDisabled(false);
      setMenuOpen(false);
    }
  };

  const openConfirmRemoveModal = (designId) => {
    console.log("Opening confirm remove modal for design:", designId);
    const designToRemove = filteredDesigns.find((design) => design.id === designId);
    if (designToRemove) {
      setDesignToRemove(designToRemove);
      setDesignIdToRemove(designId);
      setOpenConfirmRemove(true);
    } else {
      console.error("Design not found:", designId);
      showToast("error", "Design not found");
    }
  };

  const handleRemoveDesign = async (e, designId) => {
    e.stopPropagation();
    if (!designId) return;
    setIsRemoveDesignBtnDisabled(true);
    try {
      const result = await removeDesignFromProject(projectId, designId, user, userDoc);
      if (!result) {
        showToast("error", "Failed to remove design from project");
        return;
      }
      showToast("success", "Design removed from project");
    } catch (error) {
      console.error("Error removing design from project:", error);
      showToast("error", "Failed to remove design from project");
    } finally {
      setOpenConfirmRemove(false);
      setDesignIdToRemove(null);
      setDesignToRemove(null);
      setIsRemoveDesignBtnDisabled(false);
    }
  };

  const handleCloseConfirmRemoveModal = (e) => {
    if (e) e.stopPropagation();
    setOpenConfirmRemove(false);
    setDesignIdToRemove(null);
    setDesignToRemove(null);
  };

  if (loadingProject || !project) {
    return <LoadingPage message="Loading project details." />;
  }

  if (!project.designs) {
    return <LoadingPage message="Loading project details." />;
  }

  if (loadingDesigns) {
    return <LoadingPage message="Loading project designs." />;
  }

  const openImportModal = () => {
    setImportModalOpen(true);
  };

  return (
    <ProjectSpace
      project={project}
      projectId={projectId}
      inDesign={true}
      inPlanMap={false}
      inTimeline={false}
      inBudget={false}
      changeMode={changeMode}
      setChangeMode={setChangeMode}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}
        <Paper
          component="form"
          sx={{
            display: "flex",
            alignItems: "center",
            margin: "20px",
            backgroundColor: "var(--bgMain)",
            border: "2px solid var(--borderInput)",
            borderRadius: "30px",
            width: "calc(100% - 49px)",
            padding: 0,
            "&:focus-within": {
              borderColor: "var(--borderInputBrighter)",
            },
          }}
        >
          <IconButton
            type="button"
            sx={{ p: "10px", color: "var(--color-white)" }}
            aria-label="search"
          >
            <SearchIcon sx={{ color: "var(--color-white)" }} />
          </IconButton>
          <InputBase
            sx={{ ml: 1, flex: 1, color: "var(--color-white)" }}
            placeholder="Search designs on this project"
            inputProps={{ "aria-label": "search designs" }}
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </Paper>
        {!isVertical && (
          <div className="dropdown-container">
            <Dropdowns
              owners={owners}
              onOwnerChange={handleOwnerChange}
              onDateRangeChange={handleDateRangeChange}
              sortBy={sortBy}
              order={order}
              onSortByChange={setSortBy}
              onOrderChange={setOrder}
              isDesign={true}
            />
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "row",
          }}
        >
          <main
            className="content"
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexDirection: "row",
              overflow: "hidden",
            }}
          ></main>
        </div>
      </div>
      <section
        style={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "90%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <div style={{ width: "98%" }}>
            <div style={{ display: "flex" }}>
              <h2>{`${searchQuery ? "Searched " : ""}Designs`}</h2>
              <div className="button-container" style={{ display: "flex", marginLeft: "auto" }}>
                <IconButton
                  style={{ marginRight: "10px" }}
                  onClick={handleHorizontalClick}
                  sx={{
                    ...iconButtonStyles,
                    padding: "10px",
                    marginRight: "10px",
                    borderRadius: "8px",
                    backgroundColor: !isVertical ? "var(--nav-card-modal)" : "transparent",
                    height: "37px",
                    width: "37px",
                  }}
                >
                  <TiledIcon />
                </IconButton>
                <IconButton
                  sx={{
                    ...iconButtonStyles,
                    padding: "10px",
                    marginRight: "10px",
                    borderRadius: "8px",
                    backgroundColor: isVertical ? "var(--nav-card-modal)" : "transparent",
                    height: "37px",
                    width: "37px",
                  }}
                  onClick={handleVerticalClick}
                >
                  <ListIcon />
                </IconButton>
              </div>
            </div>
          </div>

          <div style={{ width: "100%" }}>
            {!loadingDesigns && !loadingProject && project ? (
              displayedDesigns.length > 0 ? (
                <div
                  className={`${isVertical ? "vertical" : ""}`}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  {isVertical ? (
                    <div style={{ width: "100%" }}>
                      <HomepageTable
                        isDesign={true}
                        data={filteredDesignsForTable}
                        isHomepage={false}
                        page={page}
                        optionsState={optionsState}
                        setOptionsState={setOptionsState}
                        isProjectSpace={true}
                        openConfirmRemove={openConfirmRemoveModal}
                      />
                    </div>
                  ) : (
                    <div className="layout">
                      {displayedDesigns.map((design) => (
                        <div key={design.id} className="layoutBox">
                          <DesignIcon
                            id={design.id}
                            name={design.designName}
                            designId={design.id}
                            design={design}
                            onDelete={() => handleDeleteDesign(user, design.id, navigate)}
                            onOpen={() =>
                              navigate(`/design/${design.id}`, {
                                state: { designId: design.id },
                              })
                            }
                            owner={design.owner}
                            createdAt={formatDateLong(design.createdAt)}
                            modifiedAt={formatDateLong(design.modifiedAt)}
                            optionsState={optionsState}
                            setOptionsState={setOptionsState}
                            isProjectSpace={true}
                            openConfirmRemove={openConfirmRemoveModal}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-content">
                  <img
                    src={`/img/design-placeholder${!isDarkMode ? "-dark" : ""}.png`}
                    alt="No designs yet"
                  />
                  <p>No designs in this project yet. Start adding.</p>
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
        <div className="pagination-controls" style={{ marginBottom: "183px" }}>
          {/* Previous Page Button */}
          <IconButton onClick={handlePreviousPage} disabled={page === 1} sx={iconButtonStyles}>
            <ArrowBackIosRounded
              sx={{ color: page === 1 ? "var(--inputBg)" : "var(--color-white)" }}
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
          </div>

          {/* Next Page Button */}
          <IconButton onClick={handleNextPage} disabled={page === totalPages} sx={iconButtonStyles}>
            <ArrowForwardIosRounded
              sx={{ color: page === totalPages ? "var(--inputBg)" : "var(--color-white)" }}
            />
          </IconButton>
        </div>
      )}

      <ImportDesignModal
        open={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          setMenuOpen(false);
        }}
        project={project}
      />

      {/* Action Buttons */}
      <div className="circle-button-container">
        {menuOpen && (
          <div className="small-buttons">
            <div
              className="small-button-container"
              onClick={openImportModal}
              style={{
                opacity: isDesignButtonDisabled ? "0.5" : "1",
                cursor: isDesignButtonDisabled ? "default" : "pointer",
              }}
            >
              <span className="small-button-text">Import a Design</span>
              <div className="small-circle-button">
                <AddDesign />
              </div>
            </div>
            <div className="small-button-container">
              <span className="small-button-text">Create a Design</span>
              <Box
                onClick={() => !isDesignButtonDisabled && handleCreateDesign()}
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
                <AddProject />
              </Box>
            </div>
          </div>
        )}
        <div className={`circle-button ${menuOpen ? "rotate" : ""} add`} onClick={toggleMenu}>
          {menuOpen ? <AddIcon /> : <AddIcon />}
        </div>
      </div>

      {modalOpen && <Modal onClose={closeModal} />}
      <ConfirmRemoveDesign
        openConfirmRemove={openConfirmRemove}
        onClose={handleCloseConfirmRemoveModal}
        design={designToRemove}
        designIdToRemove={designIdToRemove}
        handleRemove={handleRemoveDesign}
        userDesigns={userDesigns}
        userDesignVersions={userDesignVersions}
        users={users}
        isRemoveDesignBtnDisabled={isRemoveDesignBtnDisabled}
      />
    </ProjectSpace>
  );
}

export default Project;

const ConfirmRemoveDesign = ({
  openConfirmRemove,
  onClose,
  design,
  designIdToRemove,
  handleRemove,
  userDesigns,
  userDesignVersions,
  users,
  isRemoveDesignBtnDisabled,
}) => {
  if (!design) return null;

  return (
    <Dialog
      open={openConfirmRemove}
      onClose={onClose}
      sx={{
        ...dialogStyles,
        zIndex: "13002",
      }}
    >
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
          Confirm design removal
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            ...iconButtonStyles,
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={dialogContentStyles}>
        <Typography variant="body1" sx={{ textAlign: "center", maxWidth: "500px" }}>
          {`Are you sure you want to remove this design from the project ?`}
        </Typography>
        <DesignInfoBox
          design={design}
          userDesigns={userDesigns}
          userDesignVersions={userDesignVersions}
          users={users}
          className="confirm-remove-design-box"
        />
      </DialogContent>
      <DialogActions sx={dialogActionsStyles}>
        {/* Yes Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={(e) => handleRemove(e, designIdToRemove)}
          sx={{
            ...gradientButtonStyles,
            opacity: isRemoveDesignBtnDisabled ? "0.5" : "1",
            cursor: isRemoveDesignBtnDisabled ? "default" : "pointer",
            "&:hover": {
              backgroundImage: !isRemoveDesignBtnDisabled && "var(--gradientButtonHover)",
            },
          }}
          disabled={isRemoveDesignBtnDisabled}
        >
          Yes
        </Button>

        {/* No Button */}
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
