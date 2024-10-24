import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import deepEqual from "deep-equal";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { showToast } from "../../functions/utils";

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase"; // Assuming you have firebase setup
import DesignHead from "../../components/DesignHead";
import { getAuth } from "firebase/auth";
import PromptBar from "./PromptBar";
import BottomBar from "./BottomBar";
import Loading from "../../components/Loading";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { ToastContainer, toast } from "react-toastify";
import Version from "./Version";
import "../../css/design.css";
import TwoFrames from "./svg/TwoFrames";
import FourFrames from "./svg/FourFrames";
import CommentContainer from "./CommentContainer";
import { onSnapshot } from "firebase/firestore";
import { Tabs, Tab } from "@mui/material";
import { toggleComments, togglePromptBar, handleSidebarEffect } from "./backend/DesignActions"; // Import the functions from the backend file

function Design() {
  const { user, userDoc, designs, userDesigns } = useSharedProps();
  const { designId, projectId } = useParams(); // Get designId from the URL
  const [design, setDesign] = useState();

  // const [designData, setDesignData] = useState(null);
  const [newName, setNewName] = useState("");
  const [showComments, setShowComments] = useState(false);

  const [showPromptBar, setShowPromptBar] = useState(true);
  const [numImageFrames, setNumImageFrames] = useState(2);
  const [isEditingName, setIsEditingName] = useState(false);
  // const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState("Open");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state for sidebar
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchedDesign = userDesigns.find((design) => design.id === designId);
    setDesign(fetchedDesign);

    if (!fetchedDesign) {
      return <div>Design not found. Please reload or navigate to this design again.</div>;
    }
  }, []);

  useEffect(() => {
    const fetchedDesign = userDesigns.find((design) => design.id === designId);

    if (!fetchedDesign) {
      return <div>Design not found</div>;
    } else if (!deepEqual(design, fetchedDesign)) {
      setDesign(fetchedDesign);
    }
  }, [designs, userDesigns]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
  };

  useEffect(() => {
    const handleError = (event) => {
      if (event.message === "ResizeObserver loop completed with undelivered notifications.") {
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  useEffect(() => {
    const cleanup = handleSidebarEffect(isSidebarOpen);
    return cleanup;
  }, [isSidebarOpen]);

  const handleNameChange = async (designId, newName) => {
    try {
      const repsonse = await axios.put(
        `/api/design/${designId}/update-name`,
        { name: newName },
        {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        }
      );
      if (repsonse === 200) {
        setIsEditingName(false);
        showToast("success", "Design name updated successfully");
      }
    } catch (error) {
      console.error("Error updating design name:", error);
      showToast("error", "Failed to update design name");
    }
  };

  return (
    <div className="whole">
      <DesignHead
        design={design}
        newName={newName}
        setNewName={setNewName}
        isEditingName={isEditingName}
        toggleComments={() => toggleComments(setShowComments)}
        handleNameChange={() => handleNameChange(designId, newName)}
        setIsEditingName={setIsEditingName}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <>
        <div className="create-design">
          <div className="workspace">
            {showPromptBar && <PromptBar />}
            <div className="fixed-arrow-button" onClick={() => togglePromptBar(setShowPromptBar)}>
              {/* <div className="arrow-button">
                {showPromptBar ? (
                  <ArrowBackIosIcon sx={{ color: "var(--color-white) " }} />
                ) : (
                  <ArrowForwardIosIcon sx={{ color: "var(--color-white)" }} />
                )}
              </div> */}
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
              <div className={numImageFrames === 4 ? "image-grid-design" : "image-drop"}>
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
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  TabIndicatorProps={{
                    style: {
                      backgroundImage: "var(--gradientFont)", // Customize the indicator color
                    },
                  }}
                >
                  <Tab
                    sx={{
                      fontWeight: "bold",
                      textTransform: "none",
                      color: activeTab === 0 ? "var(--brightFont)" : "var(--color-white)",

                      "&.Mui-selected": {
                        color: "transparent", // Hide the actual text color
                        backgroundImage: "var(--gradientFont)", // Apply background image
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        fontWeight: "bold", // Optional: make text bold to stand out
                      },
                    }}
                    label="All Comments"
                  />
                  <Tab
                    sx={{
                      fontWeight: "bold",
                      textTransform: "none",
                      color: activeTab === 1 ? "var(--brightFont)" : "var(--color-white)",
                      "&:focus": {
                        outline: "none",
                        backgroundColor: "transparent",
                      },
                      "&:active": {
                        outline: "none",
                        backgroundColor: "transparent",
                      },

                      "&.Mui-selected": {
                        color: "transparent", // Hide the actual text color
                        backgroundImage: "var(--gradientFont)", // Apply background image
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        fontWeight: "bold",
                      },
                    }}
                    label="For You"
                  />
                </Tabs>

                <Select
                  value={status}
                  onChange={handleStatusChange}
                  displayEmpty
                  sx={{
                    marginTop: 2,
                    marginBottom: 2,
                    color: "var(--color-grey)",
                    borderRadius: 2,
                    border: "1px solid var(--color-grey)",
                    width: "150px",
                    height: "30px",
                  }}
                >
                  <MenuItem value="Open">Open</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                </Select>

                {activeTab === 0 && (
                  <>
                    <CommentContainer />
                    <button className="add-comment-button">Add a comment</button>
                  </>
                )}
                {activeTab === 1 && (
                  <>
                    <CommentContainer />
                    <button className="add-comment-button">Add a comment</button>
                  </>
                )}
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
