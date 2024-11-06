import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import deepEqual from "deep-equal";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { showToast } from "../../functions/utils";
import { Box, IconButton, Typography } from "@mui/material";
import {
  ArrowForwardIosRounded as ArrowForwardIosRoundedIcon,
  ArrowBackIosRounded as ArrowBackIosRoundedIcon,
  KeyboardArrowDownRounded as KeyboardArrowDownRoundedIcon,
} from "@mui/icons-material";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase"; // Assuming you have firebase setup
import DesignSpace from "./DesignSpace";
import DesignHead from "../../components/DesignHead";
import { getAuth } from "firebase/auth";
import PromptBar from "./PromptBar";
import BottomBar from "./BottomBar";
import Loading from "../../components/Loading";
import CommentTabs from "./CommentTabs";
import { ToastContainer, toast } from "react-toastify";
import Version from "./Version";
import "../../css/design.css";
import TwoFrames from "./svg/TwoFrames";
import FourFrames from "./svg/FourFrames";
import CommentContainer from "./CommentContainer";
import { onSnapshot } from "firebase/firestore";
import { Tabs, Tab } from "@mui/material";
import {
  toggleComments,
  togglePromptBar,
  handleSidebarEffect,
  handleNameChange,
} from "./backend/DesignActions"; // Import the functions from the backend file

function Design() {
  const { user, userDoc, designs, userDesigns } = useSharedProps();
  const { designId } = useParams(); // Get designId from the URL
  const [design, setDesign] = useState({});

  // const [designData, setDesignData] = useState(null);
  const [showComments, setShowComments] = useState(false);

  const [showPromptBar, setShowPromptBar] = useState(true);
  const [numImageFrames, setNumImageFrames] = useState(2);
  // const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState("Open");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state for sidebar
  const [activeTab, setActiveTab] = useState(0);

  const [loading, setLoading] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(window.innerWidth <= 600);
  const workingAreaRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileLayout(window.innerWidth <= 600);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (designId && userDesigns.length > 0) {
      const fetchedDesign = userDesigns.find((d) => d.id === designId);

      if (!fetchedDesign) {
        console.error("Design not found.");
      } else if (Object.keys(design).length === 0 || !deepEqual(design, fetchedDesign)) {
        setDesign(fetchedDesign);
      }
    }
    setLoading(false);
  }, [designId, userDesigns]);

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

  const handleNotifClick = () => {
    setIsNotifOpen(true);
  };

  const handleNotifClose = () => {
    setIsNotifOpen(false);
  };

  if (loading) {
    return <Loading />;
  }

  if (!design) {
    return <div>Design not found. Please reload or navigate to this design again.</div>;
  }

  return (
    <div className="whole">
      <DesignSpace
        design={design}
        isDesign={true}
        designId={designId}
        setShowComments={setShowComments}
      >
        <div className="create-design">
          <div className="workspace">
            {showPromptBar ? (
              <PromptBar
                workingAreaRef={workingAreaRef}
                numImageFrames={numImageFrames}
                showPromptBar={showPromptBar}
                setShowPromptBar={setShowPromptBar}
              />
            ) : (
              <div style={{ position: "relative" }}>
                <div className="promptBarHiddenHeader">
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: "500",
                      fontSize: "1.1rem",
                      fontFamily: '"Inter", sans-serif !important',
                    }}
                  >
                    Prompt Bar
                  </Typography>
                  <IconButton
                    sx={{
                      color: "var(--color-white)",
                      borderRadius: "50%",
                      zIndex: "49",
                      "&:hover": {
                        backgroundColor: "rgba(60, 59, 66, 0.3)",
                      },
                    }}
                    onClick={() => togglePromptBar(setShowPromptBar)}
                  >
                    <ArrowBackIosRoundedIcon
                      sx={{
                        color: "var(--color-white) !important",
                        transform: "rotate(270deg)",
                      }}
                    />
                  </IconButton>
                </div>
                <div
                  style={{
                    height: "80px",
                    backgroundColor: "var(--nav-card-modal)",
                    position: "absolute",
                    width: "100%",
                  }}
                ></div>
              </div>
            )}

            {/* <div
              className="fixed-arrow-button"
              onClick={() => togglePromptBar(setShowPromptBar)}
            ></div> */}
            {/* Location if < 600px */}
            {isMobileLayout && showComments ? (
              <CommentTabs
                activeTab={activeTab}
                handleTabChange={handleTabChange}
                status={status}
                handleStatusChange={handleStatusChange}
                handleCloseComments={() => toggleComments(setShowComments)}
                workingAreaRef={workingAreaRef}
                numImageFrames={numImageFrames}
                showComments={showComments}
                setShowComments={setShowComments}
              />
            ) : (
              isMobileLayout &&
              !showComments && (
                <div className="commentSectionHiddenHeader">
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: "500",
                      fontSize: "1.1rem",
                      fontFamily: '"Inter", sans-serif !important',
                    }}
                  >
                    Comments
                  </Typography>
                  <IconButton
                    sx={{
                      color: "var(--color-white)",
                      borderRadius: "50%",
                      zIndex: "49",
                      "&:hover": {
                        backgroundColor: "rgba(60, 59, 66, 0.3)",
                      },
                    }}
                    onClick={() => toggleComments(setShowComments)}
                  >
                    <ArrowBackIosRoundedIcon
                      sx={{
                        color: "var(--color-white) !important",
                        transform: "rotate(270deg)",
                      }}
                    />
                  </IconButton>
                </div>
              )
            )}
            <Version isDrawerOpen={isNotifOpen} onClose={handleNotifClose} />
            <div className="working-area" ref={workingAreaRef}>
              {/* Hide/Show PromptBar and CommentTabs IconButtons */}
              <IconButton
                sx={{
                  color: "var(--color-white)",
                  position: "absolute",
                  borderRadius: "50%",
                  left: "8px",
                  top: "8px",
                  marginTop: "10px",
                  zIndex: "50",
                  "&:hover": {
                    backgroundColor: "rgba(60, 59, 66, 0.3)",
                  },
                }}
                onClick={() => togglePromptBar(setShowPromptBar)}
                className="promptBarIconButton"
              >
                <ArrowBackIosRoundedIcon
                  sx={{
                    color: "var(--color-white) !important",
                    transform: !showPromptBar ? "rotate(180deg)" : "",
                  }}
                />
              </IconButton>
              <IconButton
                sx={{
                  color: "var(--color-white)",
                  position: "absolute",
                  borderRadius: "50%",
                  right: "8px",
                  top: "8px",
                  marginRight: !showComments ? "5px" : "0px",
                  marginTop: "10px",
                  zIndex: "50",
                  "&:hover": {
                    backgroundColor: "rgba(60, 59, 66, 0.3)",
                  },
                }}
                onClick={() => toggleComments(setShowComments)}
                className="commentSectionIconButton"
              >
                <ArrowBackIosRoundedIcon
                  sx={{
                    color: "var(--color-white) !important",
                    transform: showComments ? "rotate(180deg)" : "",
                  }}
                />
              </IconButton>

              <div className="frame-buttons">
                <button onClick={() => setNumImageFrames(2)}>
                  <TwoFrames />
                </button>
                <button onClick={() => setNumImageFrames(4)}>
                  <FourFrames />
                </button>
              </div>
              <div className="imagesWorkSpace">
                <div className="imagesWorkSpaceChild">
                  <div className={`image-grid-design ${numImageFrames === 4 ? "fit-view" : ""}`}>
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
              </div>
            </div>
            {/* Default location on desktop screen */}
            {!isMobileLayout && showComments && (
              <CommentTabs
                activeTab={activeTab}
                handleTabChange={handleTabChange}
                status={status}
                handleStatusChange={handleStatusChange}
                handleCloseComments={() => toggleComments(setShowComments)}
                workingAreaRef={workingAreaRef}
                numImageFrames={numImageFrames}
                showComments={showComments}
                setShowComments={setShowComments}
              />
            )}
          </div>
        </div>
      </DesignSpace>
    </div>
  );
}

export default Design;
