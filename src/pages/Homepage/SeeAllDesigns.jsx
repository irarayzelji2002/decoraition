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
  handleDeleteDesign,
  handleViewChange,
  formatDate,
  formatDateLong,
  getUsername,
} from "./backend/HomepageActions";

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

  useEffect(() => {
    const loadData = async () => {
      await loadDesignDataForView();
    };
    loadData();
  }, [designs, userDesigns, searchQuery]);

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
      <div className="bg">
        <div className="dropdown-container">
          <Dropdowns />
        </div>
        {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}

        <section className="recent-section">
          <div className="recent-designs">
            <div className="separator">
              <div className="title">Designs</div>
              <div style={{ marginLeft: "auto", display: "inline-flex" }}>
                {filteredDesigns.length > 0 && (
                  <div>
                    <button
                      onClick={() =>
                        handleViewChange(
                          user,
                          userDoc.id,
                          userDoc.layoutSettings,
                          "designsListDesigns",
                          setView
                        )
                      }
                    >
                      {view === 0 ? "Tiled View" : "List View"}
                    </button>
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
                        <div key={design.id} style={{ width: "100%" }}>
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
