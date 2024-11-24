import React, { useState, useEffect } from "react";
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
import ImportDesignModal from "../../components/ImportDesignModal"; // Add this import
import deepEqual from "deep-equal";
import { gradientButtonStyles } from "../DesignSpace/PromptBar";
import { set } from "lodash";

function Project() {
  const { projectId } = useParams();
  const { user, users, designs, userDesigns, userProjects, projects, isDarkMode, userDoc } =
    useSharedProps();
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
  const [filteredDesigns, setFilteredDesigns] = useState([]);
  const [filteredDesignsForTable, setFilteredDesignsForTable] = useState([]);
  const [displayedDesigns, setDisplayedDesigns] = useState([]);

  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [sortBy, setSortBy] = useState("none");
  const [order, setOrder] = useState("none");

  const [isDesignButtonDisabled, setIsDesignButtonDisabled] = useState(false);
  const [numToShowMoreDesign, setNumToShowMoreDesign] = useState(0);
  const [thresholdDesign, setThresholdDesign] = useState(6);

  const [isVertical, setIsVertical] = useState(false);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingDesigns, setLoadingDesigns] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedDesignId, setSelectedDesignId] = useState("");
  const userDesignsWithoutProject = userDesigns.filter((design) => !design.projectId);

  // Get project
  useEffect(() => {
    if (projectId && userProjects.length > 0) {
      const fetchedProject =
        userProjects.find((d) => d.id === projectId) || projects.find((d) => d.id === projectId);

      if (!fetchedProject) {
        console.error("Project not found.");
      } else if (Object.keys(project).length === 0 || !deepEqual(project, fetchedProject)) {
        setProject(fetchedProject);
        console.log("current project:", fetchedProject);
      }
    }
    setLoadingProject(false);
  }, [projectId, projects, userProjects]);

  useEffect(() => {
    const loadData = async () => {
      await loadDesignDataForView();
    };
    loadData();
  }, [project, designs, userDesigns]);

  // Get project designs
  const loadDesignDataForView = async () => {
    if (userDesigns?.length > 0) {
      try {
        setLoadingDesigns(true);

        const designsByLatest = [...userDesigns].sort(
          (a, b) => b.modifiedAt?.toMillis() - a.modifiedAt?.toMillis()
        );

        const filteredDesigns = project.designs?.map((designId) =>
          designsByLatest.find((design) => design.id === designId)
        );
        setFilteredDesigns(filteredDesigns);
        console.log("filteredDesigns", filteredDesigns);
        setLoadingDesigns(false);

        console.log("filteredDesigns", filteredDesigns);

        // Process table data
        const tableData = await Promise.all(
          filteredDesigns.map(async (design) => ({
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

  // Sorting and filtering
  const handleOwnerChange = (owner) => {
    setSelectedOwner(owner);
    applyFilters(searchQuery, owner, dateRange);
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    applyFilters(searchQuery, selectedOwner, range);
  };

  const applyFilters = (searchQuery, owner, dateRange, sortBy, order) => {
    let filteredDesigns = userDesigns.filter((design) => {
      const matchesSearchQuery = design.designName
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());
      const matchesOwner = owner ? design.owner === owner : true;
      const matchesDateRange =
        dateRange.start && dateRange.end
          ? design.modifiedAt.toMillis() >= new Date(dateRange.start).getTime() &&
            design.modifiedAt.toMillis() <= new Date(dateRange.end).getTime()
          : true;
      return matchesSearchQuery && matchesOwner && matchesDateRange;
    });

    // sorting logic for tiled view
    filteredDesigns.sort((a, b) => b.modifiedAt.toMillis() - a.modifiedAt.toMillis());

    if (sortBy && sortBy !== "none" && order && order !== "none") {
      filteredDesigns = filteredDesigns.sort((a, b) => {
        let comparison = 0;
        if (sortBy === "name") {
          comparison = a.designName.localeCompare(b.designName);
        } else if (sortBy === "owner") {
          comparison = users
            .find((user) => user.id === a.owner)
            ?.username.localeCompare(users.find((user) => user.id === b.owner)?.username);
        } else if (sortBy === "created") {
          comparison = a.createdAt.toMillis() - b.createdAt.toMillis();
        } else if (sortBy === "modified") {
          comparison = a.modifiedAt.toMillis() - b.modifiedAt.toMillis();
        }
        return order === "ascending" ? comparison : -comparison;
      });
    }

    setFilteredDesigns(filteredDesigns);
    setPage(1); // Reset to the first page after filtering
  };

  useEffect(() => {
    applyFilters(searchQuery, selectedOwner, dateRange, sortBy, order);
  }, [designs, userDesigns, searchQuery, selectedOwner, dateRange, sortBy, order]);

  useEffect(() => {
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
  }, [filteredDesigns, page]);

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
    }
  };

  if (loadingProject || !project) {
    return <LoadingPage message="Fetching designs for this project." />;
  }

  const handleCreateDesign = async () => {
    setIsDesignButtonDisabled(true);
    await handleCreateDesignWithLoading(projectId, setDesigns);
    setIsDesignButtonDisabled(false);
  };

  const handleImportDesign = () => {
    setImportModalOpen(true);
  };

  const handleConfirmImport = async () => {
    if (selectedDesignId) {
      await updateDesignProjectId(selectedDesignId, projectId);
      setImportModalOpen(false);
      setSelectedDesignId("");
      const updatedDesigns = userDesigns.filter((design) => design.projectId === projectId);
      setDesigns(updatedDesigns);
    }
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
            p: "2px 4px",
            display: "flex",
            alignItems: "center",
            width: "90%",
            marginTop: "40px",
            backgroundColor: "var(--bgMain)",
            border: "2px solid var(--borderInput)",
            borderRadius: "20px",
            "&:focus-within": {
              borderColor: "var(--brightFont)",
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
            inputProps={{ "aria-label": "search google maps" }}
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
          paddingBottom: "20%",
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
          <div style={{ width: "90%" }}>
            <div style={{ display: "flex" }}>
              <span
                className="SubtitlePrice"
                style={{
                  backgroundColor: "transparent",
                }}
              >
                <h2>{`${searchQuery ? "Searched " : ""}Designs`}</h2>
              </span>
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
                  }}
                  onClick={handleVerticalClick}
                >
                  <ListIcon />
                </IconButton>
              </div>
            </div>
          </div>

          <div style={{ width: "100%" }}>
            {!loadingDesigns && !loadingProject ? (
              displayedDesigns.length > 0 ? (
                <div
                  className={`layout ${isVertical ? "vertical" : ""}`}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                  }}
                >
                  {isVertical ? (
                    <div style={{ width: "100%" }}>
                      <HomepageTable
                        isDesign={true}
                        data={filteredDesigns}
                        isHomepage={false}
                        numToShowMore={numToShowMoreDesign}
                        optionsState={optionsState}
                        setOptionsState={setOptionsState}
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
                  <p>No designs yet. Start creating.</p>
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
        onClose={() => setImportModalOpen(false)}
        userDesignsWithoutProject={userDesignsWithoutProject}
        selectedDesignId={selectedDesignId}
        setSelectedDesignId={setSelectedDesignId}
        handleConfirmImport={handleConfirmImport}
      />

      {/* Action Buttons */}
      <div className="circle-button-container">
        {menuOpen && (
          <div className="small-buttons">
            <div
              className="small-button-container"
              onClick={handleImportDesign}
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
            <div
              className="small-button-container"
              onClick={() => !isDesignButtonDisabled && handleCreateDesign()}
              style={{
                opacity: isDesignButtonDisabled ? "0.5" : "1",
                cursor: isDesignButtonDisabled ? "default" : "pointer",
              }}
            >
              <span className="small-button-text">Create a Design</span>
              <div className="small-circle-button">
                <AddProject />
              </div>
            </div>
          </div>
        )}
        <div className={`circle-button ${menuOpen ? "rotate" : ""} add`} onClick={toggleMenu}>
          {menuOpen ? <AddIcon /> : <AddIcon />}
        </div>
      </div>

      {modalOpen && <Modal onClose={closeModal} />}
    </ProjectSpace>
  );
}

export default Project;
