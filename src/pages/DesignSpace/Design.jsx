import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase"; // Assuming you have firebase setup
import DesignHead from "../../components/DesignHead";
import { getAuth } from "firebase/auth";
import PromptBar from "./PromptBar";
import BottomBar from "./BottomBar";
import Loading from "../../components/Loading";
import { ToastContainer, toast } from "react-toastify";
import Version from "./Version";
import "../../css/design.css";
import { FaCheckCircle, FaEllipsisV, FaAt } from "react-icons/fa"; // Icons used: Check, Dots, At symbol
import TwoFrames from "./svg/TwoFrames";
import FourFrames from "./svg/FourFrames";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { onSnapshot } from "firebase/firestore";
import {
  handleCommentTabClick,
  handleStatusTabClick,
  handleContainerClick,
  handleNameChange,
  toggleComments,
  togglePromptBar,
  handleSidebarEffect,
} from "./backend/DesignActions"; // Import the functions from the backend file

function Design({ ...sharedProps }) {
  const { designId, projectId } = useParams(); // Get designId from the URL
  const [designData, setDesignData] = useState(null);
  const [newName, setNewName] = useState("");
  const [showComments, setShowComments] = useState(false);

  const [showPromptBar, setShowPromptBar] = useState(true);
  const [numImageFrames, setNumImageFrames] = useState(2);
  const [isEditingName, setIsEditingName] = useState(false);
  const [userId, setUserId] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state for sidebar
  const [activeCommentTab, setActiveCommentTab] = useState("left"); // For "All Comments / For You"
  const [activeStatusTab, setActiveStatusTab] = useState("left"); // For "Open / Resolved"
  const [clicked, setClicked] = useState(false); // Handle click state

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);

        const isProjectPath = window.location.pathname.includes("/project");

        let designRef;
        if (isProjectPath) {
          // Use a different reference when "/project" is in the URL
          designRef = doc(db, "users", user.uid, "projects", projectId, "designs", designId);
        } else {
          // Use the original design reference
          designRef = doc(db, "designs", designId);
        }

        const fetchDesignDetails = async () => {
          try {
            const designSnapshot = await getDoc(designRef);
            if (designSnapshot.exists()) {
              const design = designSnapshot.data();
              setDesignData(design);
              setNewName(design.name);
            } else {
              console.error("Design not found");
            }
            await updateDoc(designRef, {
              lastAccessed: new Date(),
            });
          } catch (error) {
            console.error("Error fetching design details:", error);
          }
        };

        fetchDesignDetails();

        const unsubscribeSnapshot = onSnapshot(designRef, (doc) => {
          if (doc.exists()) {
            const design = doc.data();
            setDesignData(design);
            setNewName(design.name);
          } else {
            console.error("Design not found");
          }
        });

        return () => unsubscribeSnapshot();
      } else {
        console.error("User is not authenticated");
      }
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [designId]);

  useEffect(() => {
    const cleanup = handleSidebarEffect(isSidebarOpen);
    return cleanup;
  }, [isSidebarOpen]);

  if (!designData) {
    return (
      <>
        <Loading />
      </>
    );
  }

  return (
    <div className="whole">
      <ToastContainer progressStyle={{ backgroundColor: "var(--brightFont)" }} />
      <DesignHead
        designData={designData}
        newName={newName}
        setNewName={setNewName}
        isEditingName={isEditingName}
        toggleComments={() => toggleComments(setShowComments)}
        handleNameChange={() =>
          handleNameChange(newName, userId, projectId, designId, setIsEditingName)
        }
        setIsEditingName={setIsEditingName}
      />

      <>
        <div className="create-design">
          <div className="workspace">
            {showPromptBar && <PromptBar />}
            <div className="fixed-arrow-button" onClick={() => togglePromptBar(setShowPromptBar)}>
              <div className="arrow-button">
                {showPromptBar ? (
                  <ArrowBackIosIcon sx={{ color: "var(--color-white) " }} />
                ) : (
                  <ArrowForwardIosIcon sx={{ color: "var(--color-white)" }} />
                )}
              </div>
            </div>

            <div className="working-area">
              <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
                <button onClick={() => setIsSidebarOpen(false)} className="close-sidebar">
                  Close
                </button>
                <div className="sidebar-content">
                  <Version />
                </div>
              </div>

              {isSidebarOpen && (
                <div className="overlay" onClick={() => setIsSidebarOpen(false)}></div>
              )}

              <div className="frame-buttons">
                <button onClick={() => setNumImageFrames(2)}>
                  <TwoFrames />
                </button>
                <button onClick={() => setNumImageFrames(4)}>
                  <FourFrames />
                </button>
              </div>
              <div className={numImageFrames === 4 ? "image-grid" : "image-drop"}>
                {Array.from({ length: numImageFrames }).map((_, index) => (
                  <div className="image-frame" key={index}>
                    <img
                      src="../../img/Room1.png"
                      alt={`design preview ${index + 1}`}
                      className="image-preview"
                    />
                  </div>
                ))}
              </div>
            </div>
            {showComments && (
              <div className="comment-section">
                <div className="split-button">
                  <button
                    onClick={() => handleCommentTabClick("left", setActiveCommentTab)}
                    className={`button-side ${activeCommentTab === "left" ? "active" : ""}`}
                  >
                    All Comments
                  </button>
                  <button
                    onClick={() => handleCommentTabClick("right", setActiveCommentTab)}
                    className={`button-side ${activeCommentTab === "right" ? "active" : ""}`}
                  >
                    For You
                  </button>
                </div>

                <div className="split-button">
                  <button
                    onClick={() => handleStatusTabClick("left", setActiveStatusTab)}
                    className={`button-side ${activeStatusTab === "left" ? "active" : ""}`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleStatusTabClick("right", setActiveStatusTab)}
                    className={`button-side ${activeStatusTab === "right" ? "active" : ""}`}
                  >
                    Resolved
                  </button>
                </div>
                <div
                  className={`comment-container ${clicked ? "clicked" : ""}`}
                  onClick={() => handleContainerClick(setClicked)}
                >
                  <div className="profile-section">
                    <div className="profile-info">
                      <div className="profile-pic"></div>
                      <div className="user-details">
                        <span className="username">Juan Dela Cruz</span>
                        <span className="date">June 17, 2024</span>
                      </div>
                    </div>
                    <div className="profile-status">
                      <FaCheckCircle className="check-mark" />
                      <FaEllipsisV className="options-dots" />
                    </div>
                  </div>
                  <div className="comment-text">Lorem ipsum dolor sit amet...</div>

                  {clicked && (
                    <div className="reply-input">
                      <FaAt className="at-symbol" />
                      <input type="text" placeholder="Add a Reply" />
                    </div>
                  )}
                </div>
                <button className="add-comment-button">Add a comment</button>
              </div>
            )}
          </div>
        </div>
      </>

      <BottomBar design={true} designId={designId} projectId={projectId} />
    </div>
  );
}

export default Design;
