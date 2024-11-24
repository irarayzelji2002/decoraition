import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSharedProps } from "../../contexts/SharedPropsContext.js";
import SearchAppBar from "./SearchAppBar.jsx";
import "../../css/homepage.css";
import "../../css/seeAll.css";
import Loading from "../../components/Loading.jsx";
import Dropdowns from "../../components/Dropdowns.jsx";
import DesignIcon from "../../components/DesignIcon.jsx";
import HomepageTable from "./HomepageTable.jsx";
import ImageIcon from "@mui/icons-material/Image";
import { AddIcon } from "../../components/svg/DefaultMenuIcons.jsx";
import {
  ArrowForwardIosRounded as ArrowForwardIosRoundedIcon,
  ArrowBackIosRounded as ArrowBackIosRoundedIcon,
} from "@mui/icons-material";
import {
  handleDeleteDesign,
  handleViewChange,
  formatDate,
  formatDateLong,
  getUsername,
  handleCreateDesign,
} from "./backend/HomepageActions";
import { TiledIcon, ListIcon } from "../ProjectSpace/svg/ExportIcon.jsx";
import { Box, Button, IconButton } from "@mui/material";
import { iconButtonStyles } from "./DrawerComponent.jsx";
import { gradientButtonStyles } from "../DesignSpace/PromptBar.jsx";
import { AddDesign } from "../DesignSpace/svg/AddImage.jsx";
import { circleButtonStyles } from "./Homepage.jsx";

export default function SeeAllDesigns() {
  const navigate = useNavigate();
  const { user, users, userDoc, designs, userDesigns, isDarkMode } = useSharedProps();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDesigns, setFilteredDesigns] = useState([]);
  const [displayedDesigns, setDisplayedDesigns] = useState([]);
  const [filteredDesignsForTable, setFilteredDesignsForTable] = useState([]);

  const [view, setView] = useState(userDoc.layoutSettings.designsListDesigns ?? 0); //0 for tiled view, 1 for list view
  const [loadingDesigns, setLoadingDesigns] = useState(true);
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
  const [isDesignButtonDisabled, setIsDesignButtonDisabled] = useState(false);

  const loadDesignDataForView = async () => {
    if (userDesigns.length > 0) {
      try {
        setLoadingDesigns(true);

        // Sort designs by latest modified date
        const designsByLatest = [...userDesigns].sort(
          (a, b) => b.modifiedAt?.toMillis() - a.modifiedAt?.toMillis()
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
            formattedCreatedAt: formatDate(design?.createdAt),
            createdAtTimestamp: design.createdAt?.toMillis(),
            formattedModifiedAt: formatDate(design?.modifiedAt),
            modifiedAtTimestamp: design.modifiedAt?.toMillis(),
          }))
        );

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

  useEffect(() => {
    const loadData = async () => {
      await loadDesignDataForView();
    };
    loadData();
  }, [userDesigns]);

  const handleOwnerChange = (owner) => {
    setSelectedOwner(owner);
    applyFilters(searchQuery, owner, dateRange);
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    applyFilters(searchQuery, selectedOwner, range);
  };

  const applyFilters = (searchQuery, owner, dateRange) => {
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
    const loadData = async () => {
      await loadDesignDataForView();
    };
    loadData();
  }, [designs, userDesigns, searchQuery, selectedOwner, dateRange]);

  useEffect(() => {
    applyFilters(searchQuery, selectedOwner, dateRange);
  }, [designs, userDesigns, searchQuery, selectedOwner, dateRange, sortBy, order]);

  useEffect(() => {
    setView(userDoc.layoutSettings.designsListDesigns ?? 0);
  }, [userDoc]);

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

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleCreateDesignWithLoading = async () => {
    setIsDesignButtonDisabled(true);
    await handleCreateDesign(user, userDoc.id, navigate);
    setIsDesignButtonDisabled(false);
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
              isDesign={true}
            />
          )}
        </div>
        {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}

        <section className="recent-section">
          <div className="recent-designs">
            <div className="separator see-all">
              <h2>{`${searchQuery ? "Searched " : ""}Designs`}</h2>
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
              </div>
            </div>

            <div style={{ width: "100%" }}>
              {!loadingDesigns ? (
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
                  ) : (
                    <div style={{ width: "100%" }}>
                      <HomepageTable
                        isDesign={true}
                        data={filteredDesignsForTable}
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
              <ArrowBackIosRoundedIcon
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
            <div className="small-button-container" onClick={handleCreateDesignWithLoading}>
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
            <div
              className="small-button-container"
              // onClick={() =>
              //   projectId
              //     ? navigate(`/addItem/${designId}/${projectId}/project`)
              //     : navigate(`/addItem/${designId}`)
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
