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
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
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
} from "./backend/HomepageActions";
import { TiledIcon, ListIcon } from "../ProjectSpace/svg/ExportIcon.jsx";
import { Button, IconButton } from "@mui/material";
import { iconButtonStyles } from "./DrawerComponent.jsx";
import { gradientButtonStyles } from "../DesignSpace/PromptBar.jsx";

export default function SeeAllDesigns() {
  const navigate = useNavigate();
  const { user, userDoc, designs, userDesigns } = useSharedProps();

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
  const [sortBy, setSortBy] = useState("");
  const [order, setOrder] = useState("");

  const loadDesignDataForView = async () => {
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

      const uniqueOwners = await Promise.all(
        [...new Set(userDesigns.map((design) => design.owner))].map(async (ownerId) => {
          const username = await getUsername(ownerId);
          return username;
        })
      );
      setOwners(uniqueOwners);
    } else {
      setFilteredDesigns([]);
      setFilteredDesignsForTable([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadDesignDataForView();
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

    if (sortBy) {
      filteredDesigns = filteredDesigns.sort((a, b) => {
        let comparison = 0;
        if (sortBy === "name") {
          comparison = a.designName.localeCompare(b.designName);
        } else if (sortBy === "owner") {
          comparison = a.owner.localeCompare(b.owner);
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
      const totalPages = Math.ceil(filteredDesigns.length / 25);
      setTotalPages(totalPages);

      // Set contents of the page
      const itemsPerPage = 25;
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

  const toggleModal = () => {
    // Your modal toggle logic here
  };

  return (
    <>
      <SearchAppBar onSearchChange={(value) => setSearchQuery(value)} searchQuery={searchQuery} />

      <div className="bg" style={{ background: "none" }}>
        <div className="dropdown-container">
          <Dropdowns
            owners={owners}
            onOwnerChange={handleOwnerChange}
            onDateRangeChange={handleDateRangeChange}
            sortBy={sortBy}
            order={order}
            onSortByChange={setSortBy}
            onOrderChange={setOrder}
          />
        </div>
        {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}

        <section className="recent-section">
          <div className="recent-designs">
            <div className="separator">
              <h2>Designs</h2>
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
                        <div
                          key={design.id}
                          style={{ width: "100%", display: "flex", justifyContent: "center" }}
                        >
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

        {/* Pagination Section */}
        {totalPages > 0 && (
          <div className="pagination-controls">
            {/* Previous Page Button */}
            <IconButton onClick={handlePreviousPage} disabled={page === 1} sx={iconButtonStyles}>
              <ArrowBackIosRoundedIcon
                sx={{ color: page === totalPages ? "var(--inputBg)" : "var(--color-white)" }}
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
            <div className="small-button-container" onClick={toggleModal}>
              <span className="small-button-text">Create a Design</span>
              <div className="small-circle-button">
                <ImageIcon className="icon" />
              </div>
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
        <div className={`circle-button ${menuOpen ? "rotate" : ""}`} onClick={toggleMenu}>
          {menuOpen ? <CloseIcon /> : <AddIcon />}
        </div>
      </div>
    </>
  );
}
