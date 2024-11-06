import React, { useState, useEffect, useRef } from "react";
import { Tabs, Tab, Select, MenuItem, IconButton, Box, Button } from "@mui/material";
import {
  ArrowForwardIosRounded as ArrowForwardIosRoundedIcon,
  ArrowBackIosRounded as ArrowBackIosRoundedIcon,
  KeyboardArrowDownRounded as KeyboardArrowDownRoundedIcon,
} from "@mui/icons-material";
import CommentContainer from "./CommentContainer";
import { toggleComments } from "./backend/DesignActions";

function CommentTabs({
  activeTab,
  handleTabChange,
  status,
  handleStatusChange,
  handleCloseComments,
  workingAreaRef,
  numImageFrames,
  showComments,
  setShowComments,
}) {
  const [commentForTab, setCommentForTab] = useState(true); // true for All Comments, false for For You
  const [commentTypeTab, setCommentTypeTab] = useState(true); // true for Open, false for Resolved
  const [isAddCommentOpen, setIsAddCommentOpen] = useState(false);

  const handleCommentForTabChange = () => {
    setCommentForTab(!commentForTab);
  };

  const handleCommentTypeTabChange = () => {
    setCommentTypeTab(!commentTypeTab);
  };

  const [width, setWidth] = useState(500);
  const [applyMinHeight, setApplyMinHeight] = useState(true);
  const resizeFactor = 3;
  const commentSectionRef = useRef(null);
  const resizeHandleRef = useRef(null);
  const commentSectionIconButtonRef = useRef(null);

  useEffect(() => {
    const promptBar = commentSectionRef.current;
    const resizeHandle = resizeHandleRef.current;
    if (!promptBar || !resizeHandle) return;

    promptBar.style.width = `${width}px`;

    const handleMouseDown = (e) => {
      e.preventDefault();
      if (window.innerWidth <= 600) {
        promptBar.style.width = "auto";
        return;
      }

      const initialX = e.clientX;
      const handleMouseMove = (e) => {
        const deltaX = initialX - e.clientX;
        const newWidth = width + resizeFactor * deltaX;
        if (newWidth > 0) {
          setWidth(newWidth);
        }
      };

      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    };

    resizeHandleRef.current.addEventListener("mousedown", handleMouseDown);

    const handleResize = () => {
      if (window.innerWidth <= 600) {
        promptBar.style.width = "auto";
      } else {
        promptBar.style.width = `${width}px`;
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (resizeHandle.current) {
        resizeHandleRef.current.removeEventListener("mousedown", handleMouseDown);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [width]);

  useEffect(() => {
    const promptBar = commentSectionRef.current;
    if (!promptBar) return;

    if (window.innerWidth <= 600) {
      promptBar.style.width = "auto";
    } else {
      promptBar.style.width = `${width}px`;
    }
  }, [showComments]);

  // Check height on component mount and on numImageFrames change
  useEffect(() => {
    const checkWorkingAreaHeight = () => {
      if (workingAreaRef.current) {
        const workingAreaHeight = workingAreaRef.current.offsetHeight;
        if (workingAreaHeight + 154 > window.innerHeight) {
          setApplyMinHeight(false);
        } else {
          setApplyMinHeight(true);
        }
      }
    };

    checkWorkingAreaHeight();
  }, [numImageFrames]);

  return (
    <div className="comment-section" ref={commentSectionRef}>
      <div className={window.innerWidth > 600 ? "resizeHandle left" : ""} ref={resizeHandleRef}>
        <div className={window.innerWidth > 600 ? "resizeHandleChildDiv" : ""}>
          <div className={window.innerWidth > 600 ? "sliderIndicator" : ""}></div>
        </div>
      </div>
      <IconButton
        sx={{
          color: "var(--color-white)",
          position: "absolute",
          borderRadius: "50%",
          right: "8px",
          top: "8px",
          marginTop: "9px",
          marginRight: "20px",
          zIndex: "1200",
          "&:hover": {
            backgroundColor: "rgba(60, 59, 66, 0.3)",
          },
        }}
        onClick={() => toggleComments(setShowComments)}
        className="commentSectionIconButtonInside"
      >
        <ArrowBackIosRoundedIcon
          sx={{
            color: "var(--color-white) !important",
            transform: !showComments ? "rotate(270deg)" : "rotate(90deg)",
          }}
        />
      </IconButton>
      <Box
        sx={{ minHeight: applyMinHeight ? "calc(100% - 90px)" : "686px" }}
        className="transitionMinHeight"
      >
        <div className="comment-tabs-header">
          {/* <IconButton onClick={handleCloseComments} className="close-icon-button">
          <CloseIcon sx={{ color: "var(--color-white)" }} />
        </IconButton> */}

          {/* Comment Tabs */}
          <div className="commentTabsContainer">
            <div className="pairTabs">
              <Tabs
                value={commentForTab ? 0 : 1}
                onChange={handleCommentForTabChange}
                sx={{
                  "& .MuiTabs-flexContainer": {
                    gap: 0,
                  },
                }}
                TabIndicatorProps={{ style: { display: "none" } }} // Hide default indicator
              >
                <Tab label="All Comments" sx={getPillTabStyle(commentForTab, 0)} />
                <Tab label="For You" sx={getPillTabStyle(commentForTab, 1)} />
              </Tabs>
            </div>
            <div className="pairTabs">
              <Tabs
                value={commentTypeTab ? 0 : 1}
                onChange={handleCommentTypeTabChange}
                sx={{
                  "& .MuiTabs-flexContainer": {
                    gap: 0,
                  },
                }}
                TabIndicatorProps={{ style: { display: "none" } }} // Hide default indicator
              >
                <Tab label="Open" sx={getPillTabStyle(commentTypeTab, 0)} />
                <Tab label="Resolved" sx={getPillTabStyle(commentTypeTab, 1)} />
              </Tabs>
            </div>
          </div>
        </div>

        {/* Comments container */}
        <CommentContainer />
      </Box>

      {/* Add a comment button */}
      <Box sx={{ margin: "0px 20px 0px 20px" }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => setIsAddCommentOpen(true)}
          sx={{
            color: "white",
            mt: 3,
            mb: 2,
            backgroundImage: "var(--gradientButton)",
            borderRadius: "20px",
            textTransform: "none",
            fontWeight: "bold",
            "&:hover": {
              backgroundImage: "var(--gradientButtonHover)",
            },
          }}
        >
          Add a comment
        </Button>
      </Box>
    </div>
  );
}

export default CommentTabs;

const getPillTabStyle = (selectedTab, index) => {
  const isSelected = (selectedTab && index === 0) || (!selectedTab && index === 1);
  return {
    px: "5px", // Padding for the pill shape
    paddingLeft: index === 0 ? "10px" : "5px",
    paddingRight: index === 0 ? "5px" : "10px",
    py: 0,
    textTransform: "none",
    borderRadius: index === 0 ? "20px 0 0 20px" : "0 20px 20px 0", // Left or Right rounded
    fontWeight: "bold",
    transition: "background-color 0.3s, color 0.3s",
    backgroundColor: isSelected ? "var(--brightFont)" : "transparent",
    color: isSelected ? "var(--color-white)" : "var(--color-white)", // Set selected color here
    border: isSelected ? "none" : "1.5px solid var(--brightFont)",
    "&:hover": {
      backgroundColor: isSelected ? "var(--brightFont)" : "rgba(0,0,0,0.05)",
    },
    "&.Mui-selected": {
      color: isSelected ? "var(--color-white)" : "var(--color-white)",
    },
    minHeight: "40px",
    width: "110px", // Ensures tabs are the same size
    marginBottom: "10px",
  };
};
