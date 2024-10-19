import React, { useState, useEffect } from "react";
import SearchAppBar from "../Homepage/SearchAppBar.jsx";
import { onAuthStateChanged } from "firebase/auth";
import "../../css/seeAll.css";
import { auth, db } from "../../firebase.js";
import Dropdowns from "../../components/Dropdowns.jsx";
import { useNavigate } from "react-router-dom";
import DesignIcon from "../../components/DesignIcon.jsx";
import "../../css/homepage.css";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  limit,
  startAfter,
} from "firebase/firestore";
import FolderIcon from "@mui/icons-material/Folder";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";

export default function SeeAllProjects({ designId, projectId }) {
  const [user, setUser] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [username, setUsername] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastVisible, setLastVisible] = useState(null);
  const [page, setPage] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);
  const [totalPages, setTotalPages] = useState(5);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchDesigns(user.uid, 1);
      } else {
        setUser(null);
        setDesigns([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  const toggleModal = () => {
    // Your modal toggle logic here
  };

  const fetchDesigns = (userId, page) => {
    const designsRef = collection(db, "projects");
    let q = query(designsRef, where("createdBy", "==", userId), limit(10)); // Fetch 10 designs per page

    if (page > 1 && lastVisible) {
      q = query(
        designsRef,
        where("createdAt", ">", new Date(0)),
        startAfter(lastVisible),
        limit(10)
      );
    }

    const unsubscribeDesigns = onSnapshot(q, (querySnapshot) => {
      const designList = [];
      querySnapshot.forEach((doc) => {
        designList.push({ id: doc.id, ...doc.data() });
      });
      setDesigns(designList);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setIsLastPage(querySnapshot.size < 10); // If fewer than 10 results, it's the last page
    });

    return () => unsubscribeDesigns();
  };

  const handleDeleteDesign = async (designId) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const designRef = doc(
          db,
          "users",
          currentUser.uid,
          "projects",
          designId
        );
        await deleteDoc(designRef);
        fetchDesigns(currentUser.uid, page);
      }
    } catch (error) {
      console.error("Error deleting design: ", error);
    }
  };

  const handlePageClick = (pageNumber) => {
    setPage(pageNumber);
    fetchDesigns(user.uid, pageNumber);
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      handlePageClick(page - 1);
    }
  };

  const handleNextPage = () => {
    if (!isLastPage) {
      handlePageClick(page + 1);
    }
  };

  const filteredDesigns = designs.filter((design) =>
    design.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <SearchAppBar
        onSearchChange={(value) => setSearchQuery(value)}
        user={user}
        username={username}
      />
      <div className="bg">
        <div className="dropdown-container">
          <Dropdowns />
        </div>
        {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}
        <div className="title">Projects</div>
        <section className="recent-section">
          <div className="recent-designs">
            <div className="layout">
              {filteredDesigns.length > 0 ? (
                filteredDesigns.map((design) => (
                  <DesignIcon
                    key={design.id}
                    name={design.name}
                    designId={design.id}
                    onDelete={handleDeleteDesign}
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

        {/* Pagination Section */}
        <div className="pagination-controls">
          {/* Previous Page Button */}
          <button
            onClick={handlePreviousPage}
            className="pagination-arrow"
            disabled={page === 1}
          >
            &lt;
          </button>

          {/* Map over an array to create pagination buttons */}
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              className={`pagination-button ${
                page === index + 1 ? "active" : ""
              }`}
              onClick={() => handlePageClick(index + 1)}
            >
              {index + 1}
            </button>
          ))}

          {/* Next Page Button */}
          <button
            onClick={handleNextPage}
            className="pagination-arrow"
            disabled={isLastPage}
          >
            &gt;
          </button>
        </div>
      </div>

      <div className="circle-button-container">
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
              //     ? navigate(`/addItem/${designId}/${projectId}/project`)
              //     : navigate(`/addItem/${designId}`)
              // }
            ></div>
          </div>
        )}
        <div
          className={`circle-button ${menuOpen ? "rotate" : ""}`}
          onClick={toggleMenu}
        >
          {menuOpen ? <CloseIcon /> : <AddIcon />}
        </div>
      </div>
    </>
  );
}
