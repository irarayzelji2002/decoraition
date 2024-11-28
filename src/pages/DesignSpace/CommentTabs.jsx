import React, { useState, useEffect, useRef } from "react";
import { Tabs, Tab, Select, MenuItem, IconButton, Box, Button } from "@mui/material";
import {
  ArrowForwardIosRounded as ArrowForwardIosRoundedIcon,
  ArrowBackIosRounded as ArrowBackIosRoundedIcon,
  KeyboardArrowDownRounded as KeyboardArrowDownRoundedIcon,
} from "@mui/icons-material";
import CommentContainer from "./CommentContainer";
import { toggleComments } from "./backend/DesignActions";
import { set } from "lodash";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { formatDateDetail } from "../Homepage/backend/HomepageActions";
import AddCommentContainer from "./AddCommentContainer";

function CommentTabs({
  workingAreaRef,
  numImageFrames,
  showComments,
  setShowComments,
  width,
  setWidth,
  promptBarWidth,
  setPromptBarWidth,
  prevWidth,
  setPrevWidth,
  prevHeight,
  setPrevHeight,
  design,
  designVersion,
  designVersionImages,
  activeComment,
  setActiveComment,
  showPromptBar,
  isPinpointing,
  setIsPinpointing,
  pinpointLocation,
  setPinpointLocation,
  pinpointSelectedImage,
  setPinpointSelectedImage,
  designComments,
  setDesignComments,
  selectedImage,
  commentTypeTab,
  setCommentTypeTab,
  setSelectedImage,
  isOwnerEditorCommenter,
  changeMode,
}) {
  const {
    user,
    userDoc,
    userComments,
    userReplies,
    userDesignsComments,
    isDarkMode,
    notificationUpdate,
  } = useSharedProps();
  const [commentForTab, setCommentForTab] = useState(true); // true for All Comments, false for For You
  const [userOwnedComments, setUserOwnedComments] = useState([]);
  const [userOwnedReplies, setUserOwnedReplies] = useState([]);
  const [filteredAndSortedComments, setFilteredAndSortedComments] = useState([]);
  const [isAddingComment, setIsAddingComment] = useState(false);

  // For option select
  const [selectedId, setSelectedId] = useState("");
  const [optionsState, setOptionsState] = useState({
    showOptions: false,
    selectedId: null,
  });

  const [isLess768, setIsLess768] = useState(false);

  const handleCommentForTabChange = () => {
    setCommentForTab(!commentForTab);
  };

  const handleCommentTypeTabChange = () => {
    setCommentTypeTab(!commentTypeTab);
  };

  const [height, setHeight] = useState("100%");
  const [applyMinHeight, setApplyMinHeight] = useState(true);
  const resizeFactor = 2;
  const commentSectionRef = useRef(null);
  const resizeHandleRef = useRef(null);
  const resizeHandleHeightRef = useRef(null);

  const handleOpenCommentsWidth = () => {
    if (window.innerWidth > 768) {
      const promptBarTrueWidth = showPromptBar ? promptBarWidth + 80 : 0;
      const maxAvailableWidth = window.innerWidth - 320 - 40 - promptBarTrueWidth;
      if (width > maxAvailableWidth) {
        setWidth(maxAvailableWidth);
      }
    }
  };

  useEffect(() => {
    const initializeWidth = () => {
      if (window.innerWidth > 768) {
        const promptBarTrueWidth = showPromptBar ? promptBarWidth + 80 : 0;
        const maxAvailableWidth = window.innerWidth - 320 - 40 - promptBarTrueWidth;
        const initialWidth = Math.min(500, maxAvailableWidth); // Default to 500 or less if space is limited
        setWidth(initialWidth);
      }
    };

    initializeWidth();
  }, []); // Run once on mount

  useEffect(() => {
    if (showComments) {
      handleOpenCommentsWidth();
    }
  }, [showComments, showPromptBar, promptBarWidth]);

  // Effect for adjusting the commentSection width on drag
  useEffect(() => {
    const commentSection = commentSectionRef.current;
    const resizeHandle = resizeHandleRef.current;
    if (!commentSection || !resizeHandle) return;

    commentSection.style.width = `${width}px`;

    const handleMouseDown = (e) => {
      e.preventDefault();
      if (window.innerWidth <= 768) {
        commentSection.style.width = "auto";
        setIsLess768(true);
        return;
      } else setIsLess768(false);

      const initialX = e.clientX;
      const handleMouseMove = (e) => {
        const deltaX = initialX - e.clientX;
        const newWidth = width + resizeFactor * deltaX;
        if (newWidth > 0 && newWidth <= window.innerWidth * 0.75) {
          const promptBarTrueWidth = showPromptBar ? promptBarWidth + 80 : 0;
          const maxAvailableWidth = window.innerWidth - 320 - 40 - promptBarTrueWidth;
          if (newWidth <= maxAvailableWidth) {
            // 40 is width padding, 320 is working area (middle part)
            setWidth(newWidth);
          }
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
      if (window.innerWidth <= 768) {
        commentSection.style.width = "auto";
        setIsLess768(true);
      } else {
        handleOpenCommentsWidth();
        commentSection.style.width = `${width}px`;

        setIsLess768(false);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (resizeHandle.current) {
        resizeHandleRef.current.removeEventListener("mousedown", handleMouseDown);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [width, showPromptBar]);

  // Effect for adjusting the commentSection height on drag
  useEffect(() => {
    const commentSection = commentSectionRef.current;
    const resizeHandleHeight = resizeHandleHeightRef.current;
    if (!commentSection || !resizeHandleHeight) return;

    commentSection.style.height = `${height}px`;

    // Handle resizing on mousedown and drag
    const handleMouseDownHeight = (e) => {
      e.preventDefault();
      console.log("Mouse down detected on resize handle");
      const startY = e.clientY;
      const startHeight = commentSection.getBoundingClientRect().height;

      const handleMouseMoveHeight = (e) => {
        const deltaY = startY - e.clientY;
        let newHeight = startHeight + deltaY;
        console.log(
          `Mouse move detected. StartY: ${startY}, CurrentY: ${e.clientY}, deltaY: ${deltaY}, newHeight: ${newHeight}`
        );

        // Adjust height
        if (window.innerWidth <= 768) {
          const initHeight = window.innerHeight - 154;
          if (newHeight >= initHeight) {
            newHeight = initHeight;
            // console.log("Max height reached, setting height to 100%");
          } else if (newHeight < 0) {
            newHeight = 0;
            // console.log("Min height reached, setting height to 0");
          }
          setHeight(`${newHeight}px`);
          commentSection.style.height = `${newHeight}px`;
        } else {
          setHeight("auto");
          commentSection.style.height = "auto";
        }
      };

      const handleMouseUpHeight = () => {
        console.log("Mouse up detected, removing mousemove and mouseup listeners");
        window.removeEventListener("mousemove", handleMouseMoveHeight);
        window.removeEventListener("mouseup", handleMouseUpHeight);
      };

      window.addEventListener("mousemove", handleMouseMoveHeight);
      window.addEventListener("mouseup", handleMouseUpHeight);
    };

    resizeHandleHeight.addEventListener("mousedown", handleMouseDownHeight);

    // Handle screen resize adjustments
    const handleResizeHeight = () => {
      if (window.innerWidth <= 768) {
        commentSection.style.height = `${height}px`;
      } else {
        commentSection.style.height = "100%";
      }
    };
    window.addEventListener("resize", handleResizeHeight);

    return () => {
      resizeHandleHeight.removeEventListener("mousedown", handleMouseDownHeight);
      window.removeEventListener("resize", handleResizeHeight);
    };
  }, [height]);

  useEffect(() => {
    const commentSection = commentSectionRef.current;
    if (!commentSection) return;
    setWidth(prevWidth ?? width);
    setHeight(prevHeight ?? height);

    if (window.innerWidth <= 768) {
      commentSection.style.width = "auto";
      commentSection.style.height = `${prevHeight ?? height}`;
      setIsLess768(true);
    } else {
      commentSection.style.width = `${prevWidth ?? width}`;
      commentSection.style.height = "100%";
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

  const [isWrapped, setIsWrapped] = useState(false);
  const adjustPillStyle = () => {
    const commentTabsHeader = document.querySelector(".pairTabs");
    setIsWrapped(commentTabsHeader?.offsetWidth <= 219.99);
  };

  useEffect(() => {
    adjustPillStyle();
    window.addEventListener("resize", adjustPillStyle);
    return () => {
      window.removeEventListener("resize", adjustPillStyle);
    };
  }, [width]);

  useEffect(() => {
    adjustPillStyle();
  }, [showPromptBar]);

  useEffect(() => {
    if (
      dummyUserDesignComments &&
      dummyUserDesignComments?.length > 0 &&
      dummyUserComments &&
      dummyUserComments?.length > 0 &&
      dummyUserReplies &&
      dummyUserReplies?.length > 0
    ) {
      setDesignComments(dummyUserDesignComments);
      setUserOwnedComments(dummyUserComments);
      setUserOwnedReplies(dummyUserReplies);
      return;
    }

    console.log("fetch comments - design", design);
    console.log("fetch comments - designVersion", designVersion);
    console.log("fetch comments - userDesignComments", userDesignsComments);
    if (design && designVersion && userDesignsComments) {
      // Get all imageIds from the current designVersion
      const designVersionImageIds = designVersion?.images?.map((img) => img.imageId);
      console.log("fetch comments - designVersionImageIds", designVersionImageIds);

      // Filter comments that belong to the current designVersion's images
      const filteredDesignComments = userDesignsComments.filter((comment) =>
        designVersionImageIds?.includes(comment.designVersionImageId)
      );
      setDesignComments(filteredDesignComments);
      console.log("fetch comments - filteredDesignComments", filteredDesignComments);

      // Filter user's own comments from the filtered design comments
      const filteredUserComments = userComments.filter((comment) =>
        designVersionImageIds?.includes(comment.designVersionImageId)
      );
      setUserOwnedComments(filteredUserComments);
      console.log("fetch comments - filteredUserComments", filteredUserComments);

      // Filter user's replies that exist in any of the design comments
      const userRepliesInDesign = userReplies.filter((reply) => {
        return filteredDesignComments.some((comment) =>
          comment.replies?.some((r) => r.replyId === reply.id)
        );
      });
      setUserOwnedReplies(userRepliesInDesign);
      console.log("fetch comments - userRepliesInDesign", userRepliesInDesign);
    } else {
      setDesignComments([]);
      setUserOwnedComments([]);
      setUserOwnedReplies([]);
    }
  }, [design, designVersion, userComments, userReplies, userDesignsComments]);

  useEffect(() => {
    if (commentForTab) {
      // All Comments tab
      const filteredAndSortedComments = designComments
        .filter((comment) => (commentTypeTab ? !comment.status : comment.status))
        .sort((a, b) => {
          const aImageIndex = designVersion?.images?.findIndex(
            (img) => img.imageId === a.designVersionImageId
          );
          const bImageIndex = designVersion?.images?.findIndex(
            (img) => img.imageId === b.designVersionImageId
          );
          if (aImageIndex !== bImageIndex) return aImageIndex - bImageIndex;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

      // Set selectedId to first comment's id if available
      if (filteredAndSortedComments.length > 0) {
        setSelectedId(filteredAndSortedComments[0].id);
        setFilteredAndSortedComments(filteredAndSortedComments);
        console.log(
          `filteredAndSortedComments - all comments ${commentTypeTab ? "(open)" : "(resolved)"}`,
          filteredAndSortedComments
        );
      } else {
        setSelectedId("");
        setFilteredAndSortedComments([]);
      }
    } else {
      // For You tab (user's comments, replies, and mentions)
      // Create a Set to track unique comment IDs
      const uniqueCommentIds = new Set();
      const allUserRelatedComments = [];

      // Add user's own comments
      userOwnedComments.forEach((comment) => {
        if (!uniqueCommentIds.has(comment.id)) {
          uniqueCommentIds.add(comment.id);
          allUserRelatedComments.push(comment);
        }
      });

      // Add user's replies (as parent comments)
      userOwnedReplies.forEach((reply) => {
        const parentComment = designComments.find((c) => c.id === reply.commentId);
        if (parentComment && !uniqueCommentIds.has(parentComment.id)) {
          uniqueCommentIds.add(parentComment.id);
          allUserRelatedComments.push(parentComment);
        }
      });

      // Add comments where user is mentioned
      designComments.forEach((comment) => {
        const isUserMentioned =
          comment.mentions?.includes(user?.uid) ||
          comment.replies?.some((reply) => reply.mentions?.includes(user?.uid));
        if (isUserMentioned && !uniqueCommentIds.has(comment.id)) {
          uniqueCommentIds.add(comment.id);
          allUserRelatedComments.push(comment);
        }
      });

      const filteredAndSortedComments = allUserRelatedComments
        .filter((item) => (commentTypeTab ? !item.status : item.status))
        .sort((a, b) => {
          const aImageIndex = designVersion?.images?.findIndex(
            (img) => img.imageId === a.designVersionImageId
          );
          const bImageIndex = designVersion?.images?.findIndex(
            (img) => img.imageId === b.designVersionImageId
          );
          if (aImageIndex !== bImageIndex) return aImageIndex - bImageIndex;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

      // Set selectedId to first comment's id if available
      if (filteredAndSortedComments.length > 0) {
        setSelectedId(filteredAndSortedComments[0].id);
        setFilteredAndSortedComments(filteredAndSortedComments);
        console.log("filteredAndSortedComments - for you", filteredAndSortedComments);
      } else {
        setSelectedId("");
        setFilteredAndSortedComments([]);
      }
    }
  }, [
    commentForTab,
    commentTypeTab,
    designComments,
    designVersion,
    user,
    userOwnedComments,
    userOwnedReplies,
  ]);

  // Notification highlight
  useEffect(() => {
    const handleNotificationActions = async () => {
      console.log(
        "notif (comment tabs) - handleNotificationActions called - tabs loaded:",
        !!commentTypeTab
      );
      if (typeof commentTypeTab === "undefined") return;

      const pendingActions = localStorage.getItem("pendingNotificationActions");
      console.log("notif (comment tabs) - pendingActions from localStorage:", pendingActions);

      if (pendingActions) {
        try {
          const parsedActions = JSON.parse(pendingActions);
          console.log("notif (comment tabs) - parsed pendingActions:", parsedActions);

          const { actions, references, timestamp, completed, type, title } = parsedActions;

          const uniqueCompleted = completed.reduce((acc, current) => {
            const x = acc.find((item) => item.index === current.index);
            if (!x) return acc.concat([current]);
            return acc;
          }, []);

          for (const [index, action] of actions.entries()) {
            console.log("notif (comment tabs) - Processing action:", action, "at index:", index);

            const isAlreadyCompleted = uniqueCompleted.some((c) => c.index === index);
            if (isAlreadyCompleted) {
              console.log(`notif (comment tabs) - Action at index ${index} already completed`);
              continue;
            }

            const previousActionsCompleted =
              uniqueCompleted.filter((c) => c.index < index).length === index;
            console.log(
              "notif (comment tabs) - previousActionsCompleted:",
              previousActionsCompleted
            );

            if (action === "Set comment type and for" && previousActionsCompleted) {
              const commentForTab = type === "mention" ? false : true;
              const commentTypeTab = title?.toLowerCase()?.includes("resolved") ? false : true;
              setCommentForTab(commentForTab);
              setCommentTypeTab(commentTypeTab);
              uniqueCompleted.push({ action, index, timestamp });
              localStorage.setItem(
                "pendingNotificationActions",
                JSON.stringify({
                  actions,
                  references,
                  timestamp,
                  completed: uniqueCompleted,
                  type,
                  title,
                })
              );
            }

            if (index === actions.length - 1 && uniqueCompleted.length === actions.length) {
              console.log(
                "notif (comment tabs) - Removing pendingNotificationActions from localStorage"
              );
              localStorage.removeItem("pendingNotificationActions");
            }
          }
        } catch (error) {
          console.error("Error processing notification actions:", error);
        }
      }
    };

    handleNotificationActions();
  }, [commentTypeTab, setCommentForTab, setCommentTypeTab, notificationUpdate]);

  return (
    <div className="comment-section" ref={commentSectionRef}>
      <div className={window.innerWidth > 768 ? "resizeHandle left" : ""} ref={resizeHandleRef}>
        <div className={window.innerWidth > 768 ? "resizeHandleChildDiv" : ""}>
          <div className={window.innerWidth > 768 ? "sliderIndicator" : ""}></div>
        </div>
      </div>
      <div
        className={window.innerWidth <= 768 ? "resizeHandle height" : ""}
        ref={resizeHandleHeightRef}
      >
        <div className={window.innerWidth <= 768 ? "resizeHandleChildDiv" : ""}>
          <div className={window.innerWidth <= 768 ? "sliderIndicator" : ""}></div>
        </div>
      </div>
      {isLess768 && (
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
              backgroundColor: "var(--iconButtonHover)",
            },
            "& .MuiTouchRipple-root span": {
              backgroundColor: "var(--iconButtonActive)",
            },
          }}
          onClick={() => {
            setPrevWidth(width);
            setPrevHeight(height);
            toggleComments(setShowComments);
          }}
          className="commentSectionIconButtonInside"
        >
          <ArrowBackIosRoundedIcon
            sx={{
              color: "var(--color-white) !important",
              transform: showComments ? "rotate(270deg)" : "rotate(90deg)",
            }}
          />
        </IconButton>
      )}

      {isAddingComment ? (
        <AddCommentContainer
          design={design}
          isAddingComment={isAddingComment}
          setIsAddingComment={setIsAddingComment}
          isPinpointing={isPinpointing}
          setIsPinpointing={setIsPinpointing}
          pinpointLocation={pinpointLocation}
          setPinpointLocation={setPinpointLocation}
          pinpointSelectedImage={pinpointSelectedImage}
          setPinpointSelectedImage={setPinpointSelectedImage}
          applyMinHeight={applyMinHeight}
          setSelectedImage={setSelectedImage}
        />
      ) : (
        <Box
          sx={{ minHeight: applyMinHeight ? "calc(100vh - 259px)" : "688px" }}
          className="transitionMinHeight"
        >
          <div className="comment-tabs-header">
            {/* Comment Tabs */}
            <div className="commentTabsContainer">
              <div className="pairTabs">
                <Tabs
                  value={commentForTab ? 0 : 1}
                  onChange={handleCommentForTabChange}
                  sx={{
                    minHeight: "40px",
                    "& .MuiTabs-flexContainer": {
                      gap: 0,
                      flexWrap: "wrap",
                      justifyContent: "center",
                    },
                  }}
                  TabIndicatorProps={{ style: { display: "none" } }} // Hide default indicator
                >
                  <Tab label="All Comments" sx={getPillTabStyle(isWrapped, commentForTab, 0)} />
                  <Tab label="For You" sx={getPillTabStyle(isWrapped, commentForTab, 1)} />
                </Tabs>
              </div>
              <div className="pairTabs">
                <Tabs
                  value={commentTypeTab ? 0 : 1}
                  onChange={handleCommentTypeTabChange}
                  sx={{
                    minHeight: "40px",
                    "& .MuiTabs-flexContainer": {
                      gap: 0,
                      flexWrap: "wrap",
                      justifyContent: "center",
                    },
                  }}
                  TabIndicatorProps={{ style: { display: "none" } }} // Hide default indicator
                >
                  <Tab label="Open" sx={getPillTabStyle(isWrapped, commentTypeTab, 0)} />
                  <Tab label="Resolved" sx={getPillTabStyle(isWrapped, commentTypeTab, 1)} />
                </Tabs>
              </div>
            </div>
          </div>
          {/* Comments container */}
          {(!selectedImage
            ? filteredAndSortedComments
            : filteredAndSortedComments.filter(
                (comment) => comment.designVersionImageId === selectedImage.imageId
              )
          ).map((comment) => (
            <RootCommentContainer
              key={comment.id}
              commentId={comment.id}
              comment={comment}
              design={design}
              optionsState={optionsState}
              setOptionsState={setOptionsState}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              activeComment={activeComment}
              setActiveComment={setActiveComment}
              isOwnerEditorCommenter={isOwnerEditorCommenter}
              changeMode={changeMode}
            />
          ))}
          {filteredAndSortedComments.length === 0 && (
            <div className="placeholderDiv">
              <img
                src={`/img/design-placeholder${!isDarkMode ? "-dark" : ""}.png`}
                style={{ width: "100px" }}
                alt=""
              />
              {commentForTab && commentTypeTab && (
                <>
                  <p className="grey-text center">No opened comments yet.</p>
                  <p className="grey-text center">Start adding.</p>
                </>
              )}
              {commentForTab && !commentTypeTab && (
                <>
                  <p className="grey-text center">No resolved comments yet.</p>
                  <p className="grey-text center">Start resolving.</p>
                </>
              )}
              {!commentForTab && commentTypeTab && (
                <p className="grey-text center">
                  You don't have open comments yet or there are no open comments where you're
                  mentioned.
                </p>
              )}
              {!commentForTab && !commentTypeTab && (
                <p className="grey-text center">
                  You don't have resolved comments yet or there are no resolved comments where
                  you're mentioned.
                </p>
              )}
            </div>
          )}
        </Box>
      )}

      {/* Add a comment button */}
      {!isAddingComment && isOwnerEditorCommenter && (
        <Box sx={{ margin: "0px 20px 0px 20px" }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setIsAddingComment(true)}
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
      )}
    </div>
  );
}

export default CommentTabs;

const getPillTabStyle = (isWrapped, selectedTab, index) => {
  const isSelected = (selectedTab && index === 0) || (!selectedTab && index === 1);
  return {
    px: "5px", // Padding for the pill shape
    paddingLeft: index === 0 ? "10px" : "5px",
    paddingRight: index === 0 ? "5px" : "10px",
    py: 0,
    textTransform: "none",
    borderRadius: !isWrapped
      ? index === 0
        ? "20px 0px 0px 20px"
        : "0px 20px 20px 0px" // Left or Right rounded
      : index === 0
      ? "20px 20px 0 0"
      : "0 0 20px 20px", // Top or Bottom rounded
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
    width: "112px", // Ensures tabs are the same size
  };
};

const RootCommentContainer = ({ ...props }) => {
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    console.log("reply to:", replyTo);
  }, [replyTo]);

  return <CommentContainer {...props} replyTo={replyTo} setReplyTo={setReplyTo} />;
};

const dummyUser1 = { id: "ub9S8LqLBXRFKPJCUQL8xGgCMkH2", username: "irarayzelji" }; // current user
const dummyUser2 = { id: "qZjAWQkR1ShNfWhG6BQJkElEkQy1", username: "EmanuelRegister" };
const dummyUser3 = { id: "VJbdZCvYn4hxiEpiT2d6pIzQq2P2", username: "irarayzelji2" };

const dummyImageId1 = "GUP5ws7igBBA3MP3I4Wz";
const dummyImageId2 = "NvHHm4EhATzWXjRz6mdi";
const dummyImageId3 = "pKvVjtljK7jaQG5DQDpp";
const dummyImageId4 = "UedR33oDACgvMgJA8z2Y";

const createDummyDate = (stringDate) => {
  const date = new Date(stringDate); // ex: "2024-11-15T10:00:00Z"
  const seconds = Math.floor(date.getTime() / 1000);
  const nanoseconds = (date.getTime() % 1000) * 1e6;
  const mockTimestamp = { seconds, nanoseconds };
  // Outputs: { seconds: 1731649200, nanoseconds: 0 }
  return mockTimestamp;
};

// Comments for the design version
// const dummyUserDesignComments = [
//   {
//     id: "comment1",
//     designVersionImageId: dummyImageId1,
//     location: { x: 69.23076923076923, y: 5.279034690799397 },
//     userId: dummyUser1.id,
//     message: `This is the first comment. @${dummyUser2.username} This is the first comment.This is the first comment.This is the first comment.This is the first comment.This is the first comment.This is the first comment. @${dummyUser3.username} This is the first comment.This is the first comment.`,
//     mentions: [dummyUser2.id, dummyUser3.id],
//     status: false,
//     createdAt: createDummyDate("2024-10-01T10:00:00Z"),
//     modifiedAt: createDummyDate("2024-10-01T12:00:00Z"),
//     replies: [
//       {
//         replyId: "reply1_1",
//         userId: dummyUser2.id,
//         message: `@${dummyUser1.username} mention in fornt. This is a reply to the first comment.`,
//         mentions: [dummyUser1.id],
//         createdAt: createDummyDate("2024-10-01T11:00:00Z"),
//         modifiedAt: createDummyDate("2024-10-01T11:30:00Z"),
//         replies: ["reply1_1_1", "reply1_1_2"],
//       },
//       {
//         replyId: "reply1_1_1",
//         userId: dummyUser2.id,
//         message: `@${dummyUser1.username} mention in fornt. This is a 1st reply to the first reply.`,
//         mentions: [dummyUser1.id],
//         createdAt: createDummyDate("2024-10-02T11:00:00Z"),
//         modifiedAt: createDummyDate("2024-10-02T11:30:00Z"),
//         replies: ["reply1_1_1_1"],
//       },
//       {
//         replyId: "reply1_1_1_1",
//         userId: dummyUser1.id,
//         message: `This is a 1st replt to the 1st reply of the first reply. @${dummyUser3.username}`,
//         mentions: [dummyUser3.id],
//         createdAt: createDummyDate("2024-10-02T11:00:00Z"),
//         modifiedAt: createDummyDate("2024-10-02T11:30:00Z"),
//         replies: [],
//       },
//       {
//         replyId: "reply1_1_2",
//         userId: dummyUser1.id,
//         message: `@${dummyUser2.username} mention in fornt. This is a 2nd reply to the first reply.`,
//         mentions: [dummyUser2.id],
//         createdAt: createDummyDate("2024-10-02T11:50:00Z"),
//         modifiedAt: createDummyDate("2024-10-02T11:50:00Z"),
//         replies: [],
//       },
//       {
//         replyId: "reply1_2",
//         userId: dummyUser3.id,
//         message: "Another reply to the first comment.",
//         mentions: [],
//         createdAt: createDummyDate("2024-10-01T11:15:00Z"),
//         modifiedAt: createDummyDate("2024-10-01T11:45:00Z"),
//         replies: [],
//       },
//     ],
//   },
//   {
//     id: "comment2",
//     designVersionImageId: dummyImageId2,
//     location: { x: 20, y: 30 },
//     userId: dummyUser2.id,
//     message: "This is the second comment.",
//     mentions: [],
//     status: true,
//     createdAt: createDummyDate("2024-10-02T09:30:00Z"),
//     modifiedAt: createDummyDate("2024-10-02T10:30:00Z"),
//     replies: [
//       {
//         replyId: "reply2_1",
//         userId: dummyUser1.id,
//         message: `Replying to the second comment. @${dummyUser2.username} message after mention.`,
//         mentions: [dummyUser2.id],
//         createdAt: createDummyDate("2024-10-02T10:00:00Z"),
//         modifiedAt: createDummyDate("2024-10-02T10:20:00Z"),
//         replies: ["reply2_1_1"],
//       },
//       {
//         replyId: "reply2_1_1",
//         userId: dummyUser1.id,
//         message: `Replying to the second comment's reply. @${dummyUser1.username} message after mention.`,
//         mentions: [dummyUser1.id],
//         createdAt: createDummyDate("2024-10-03T10:00:00Z"),
//         modifiedAt: createDummyDate("2024-10-03T10:20:00Z"),
//         replies: [],
//       },
//     ],
//   },
//   {
//     id: "comment3",
//     designVersionImageId: dummyImageId3,
//     location: { x: 80, y: 40 },
//     userId: dummyUser3.id,
//     message: `This is the third comment.`,
//     mentions: [],
//     status: false,
//     createdAt: createDummyDate("2024-10-03T14:00:00Z"),
//     modifiedAt: createDummyDate("2024-10-03T14:30:00Z"),
//     replies: [],
//   },
//   {
//     id: "comment4",
//     designVersionImageId: dummyImageId4,
//     location: { x: 45, y: 20 },
//     userId: dummyUser1.id,
//     message: "This is the fourth comment.",
//     mentions: [],
//     status: false,
//     createdAt: createDummyDate("2024-10-03T14:00:00Z"),
//     modifiedAt: createDummyDate("2024-10-03T14:30:00Z"),
//     replies: [],
//   },
// ];

// // User's own comments (assuming current user is dummyUser1.id)
// const dummyUserComments = dummyUserDesignComments.filter(
//   (comment) => comment.userId === dummyUser1.id
// );

// // User's own replies (assuming current user is dummyUser1.id)
// const dummyUserReplies = dummyUserDesignComments.flatMap((comment) =>
//   comment.replies
//     .filter((reply) => reply.userId === dummyUser1.id)
//     .map((reply) => ({
//       id: reply.replyId,
//       commentId: comment.id,
//       ...reply,
//     }))
// );

const dummyUserDesignComments = [];
const dummyUserComments = [];
const dummyUserReplies = [];
