import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import deepEqual from "deep-equal";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { showToast } from "../../functions/utils";
import SelectMaskCanvas from "./SelectMaskCanvas";
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
import { UnviewInfoIcon, ViewInfoIcon } from "../../components/svg/SharedIcons";
import { EditIcon } from "../../components/svg/DefaultMenuIcons";
import EditDescModal from "./EditDescModal";
import { handleEditDescription } from "./backend/DesignActions";
import { iconButtonStyles } from "../Homepage/DrawerComponent";

function Design() {
  const { user, userDoc, designs, userDesigns, userDesignVersions, comments } = useSharedProps();
  const { designId } = useParams(); // Get designId from the URL
  const [design, setDesign] = useState({});
  const [designVersion, setDesignVersion] = useState({});
  const [designVersionImages, setDesignVersionImages] = useState([]);
  const [isNextGeneration, setIsNextGeneration] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageData, setSelectedImageData] = useState(null);
  const [isSelectingMask, setIsSelectingMask] = useState(false);
  const [imageDescToEdit, setImageDescToEdit] = useState(null);
  const [infoVisible, setInfoVisible] = useState(false);
  const [isEditDescModalOpen, setIsEditDescModalOpen] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [widthComments, setWidthComments] = useState(500);
  const [controlWidthComments, setControlWidthComments] = useState(500);
  const [heightComments, setHeightComments] = useState("100%");

  const [showPromptBar, setShowPromptBar] = useState(true);
  const [numImageFrames, setNumImageFrames] = useState(2);
  const [widthPromptBar, setWidthPromptBar] = useState(500);
  const [controlWidthPromptBar, setControlWidthPromptBar] = useState(500);
  const [heightPromptBar, setHeightPromptBar] = useState("100%");

  const [loading, setLoading] = useState(true);
  const [isMobileLayout, setIsMobileLayout] = useState(window.innerWidth <= 600);
  const workingAreaRef = useRef(null);
  const imagesWorkSpaceChildRef = useRef(null);

  const handleEdit = async (imageId, description) => {
    console.log("got imageId", imageId);
    console.log("got description", description);
    const designVersionImages = designVersion?.images;
    const image = designVersionImages.find((image) => image.id === imageId);
    if (image.description === description.trim()) {
      return { success: false, message: "Description is the same as the current description" };
    }
    try {
      const result = await handleEditDescription(
        designId,
        designVersion.id,
        imageId,
        description,
        user
      );
      if (result.success) {
        setIsEditDescModalOpen(false);
        return { success: true, message: "Description updated successfully" };
      } else {
        return { success: false, message: "Failed to update description" };
      }
    } catch (error) {
      console.error("Error updating description:", error);
      return { success: false, message: "Failed to update description" };
    }
  };

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

  useEffect(() => {
    if (
      dummyDesignVersionImages &&
      dummyDesignVersionImages?.length > 0 &&
      dummyDesignVersion &&
      Object.keys(dummyDesignVersion)?.length !== 0
    ) {
      setDesignVersionImages(dummyDesignVersionImages);
      setDesignVersion(dummyDesignVersion);
      setIsNextGeneration(true);
      return;
    }

    if (design?.history && design.history.length > 0) {
      const latestDesignVersionId = design.history[design.history.length - 1];
      const fetchedLatestDesignVersion = userDesignVersions.find(
        (designVer) => designVer.id === latestDesignVersionId
      );

      if (!fetchedLatestDesignVersion) {
        console.error("Latest design version not found.");
      } else if (
        Object.keys(designVersion).length === 0 ||
        !deepEqual(designVersion, fetchedLatestDesignVersion)
      ) {
        setDesignVersion(fetchedLatestDesignVersion);
        setDesignVersionImages(fetchedLatestDesignVersion.images);
        setIsNextGeneration(true);
      }
    } else {
      setIsNextGeneration(false);
    }
    setLoading(false);
  }, [design, userDesignVersions]);

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

  const containerRef = useRef(null);

  const adjustImageFramesDefault = () => {
    const imageFrames = containerRef.current?.querySelectorAll(".image-frame");
    if (!imageFrames) return;

    // Set maxHeight based on the correct calculation
    const maxHeight = window.innerHeight - 255;
    const containerWidth = containerRef.current.offsetWidth;
    // console.log("containerWidth", containerWidth);

    // Check if each frame should use 56.25% or the calculated maxHeight
    imageFrames.forEach((frame) => {
      const calculatedHeight = frame.offsetWidth;
      // console.log("calculatedHeight >", calculatedHeight);
      // console.log("maxHeight", maxHeight);
      if (calculatedHeight > maxHeight && containerWidth >= maxHeight + 35) {
        frame.classList.add("max-height");
      } else {
        frame.classList.remove("max-height");
      }
    });
  };

  const adjustImageFrames = () => {
    const imageGrid = containerRef.current;
    const imageFrames = containerRef.current?.querySelectorAll(".image-frame");

    if (!imageGrid || !imageFrames) return;

    // Calculate thresholds based on viewport height
    const width62 = window.innerHeight * 0.62 - 142;
    const width55 = window.innerHeight * 0.55 - 142;
    const width50 = window.innerHeight * 0.5 - 142;
    const width44 = window.innerHeight * 0.44 - 142;
    const width37 = window.innerHeight * 0.37 - 142;
    const width32 = window.innerHeight * 0.32 - 142;

    const threshold62 = 4 * width62 + 35 + 40;
    const threshold55 = 4 * width55 + 35 + 40;
    const threshold50 = 2 * width50 + 35 + 10;
    const threshold44 = 2 * width44 + 35 + 10;
    const threshold37 = 2 * width37 + 35 + 10;

    // Get the width of the image-grid-design container
    const gridWidth = imageGrid.offsetWidth;

    // Remove all previous classes before reapplying the correct one
    imageFrames.forEach((frame) => {
      frame.classList.remove(
        "width-62",
        "width-55",
        "width-50",
        "width-44",
        "width-37",
        "width-32"
      );
    });

    // Apply the largest possible width class based on container width
    if (gridWidth >= threshold62) {
      imageFrames.forEach((frame) => frame.classList.add("width-62"));
    } else if (gridWidth >= threshold55) {
      imageFrames.forEach((frame) => frame.classList.add("width-55"));
    } else if (gridWidth >= threshold50) {
      imageFrames.forEach((frame) => frame.classList.add("width-50"));
    } else if (gridWidth >= threshold44) {
      imageFrames.forEach((frame) => frame.classList.add("width-44"));
    } else if (gridWidth >= threshold37) {
      imageFrames.forEach((frame) => frame.classList.add("width-37"));
    } else {
      imageFrames.forEach((frame) => frame.classList.add("width-32"));
    }

    adjustImageFramesDefault();
  };

  useEffect(() => {
    // Attach the resize event listener and call the function initially
    window.addEventListener("resize", adjustImageFrames);
    adjustImageFrames(); // Initial call on mount

    return () => {
      window.removeEventListener("resize", adjustImageFrames);
    };
  }, []);

  useEffect(() => {
    adjustImageFrames();
  }, [showPromptBar, showComments, numImageFrames, controlWidthComments, controlWidthPromptBar]);

  // Reset selected image to null if click happened on the working-area div itself
  const handleWorkingAreaClick = (e) => {
    if (
      e.target === workingAreaRef.current ||
      e.target === imagesWorkSpaceChildRef.current ||
      e.target === containerRef.current
    ) {
      setSelectedImage(null);
    }
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
            <div className={isMobileLayout ? "hiddenHeaders open" : ""}>
              {showPromptBar && (
                <div
                  style={{
                    paddingBottom: isMobileLayout && !showComments ? "61px" : "0px",
                    height: "100%",
                  }}
                >
                  <PromptBar
                    workingAreaRef={workingAreaRef}
                    numImageFrames={numImageFrames}
                    showPromptBar={showPromptBar}
                    setShowPromptBar={setShowPromptBar}
                    setShowComments={setShowComments}
                    width={controlWidthPromptBar}
                    setWidth={setControlWidthPromptBar}
                    prevWidth={widthPromptBar}
                    setPrevWidth={setWidthPromptBar}
                    prevHeight={heightPromptBar}
                    setPrevHeight={setHeightPromptBar}
                    selectedImage={selectedImage}
                    setSelectedImage={setSelectedImage}
                    isNextGeneration={isNextGeneration}
                    setIsNextGeneration={setIsNextGeneration}
                    isSelectingMask={isSelectingMask}
                    setIsSelectingMask={setIsSelectingMask}
                  />
                </div>
              )}

              {/* Location if < 600px */}
              {isMobileLayout && showComments && (
                <div
                  style={{
                    paddingBottom: isMobileLayout && !showPromptBar ? "61px" : "0px",
                    height: "100%",
                  }}
                >
                  <CommentTabs
                    workingAreaRef={workingAreaRef}
                    numImageFrames={numImageFrames}
                    showComments={showComments}
                    setShowComments={setShowComments}
                    width={controlWidthComments}
                    setWidth={setControlWidthComments}
                    prevWidth={widthComments}
                    setPrevWidth={setWidthComments}
                    prevHeight={heightComments}
                    setPrevHeight={setHeightComments}
                  />
                </div>
              )}
            </div>

            <div className="hiddenHeaders">
              {!showPromptBar && (
                <div
                  className="promptBarHiddenHeader"
                  style={{ cursor: "pointer" }}
                  onClick={() => togglePromptBar(setShowPromptBar)}
                >
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
                        backgroundColor: "var(--iconButtonHover)",
                      },
                      "& .MuiTouchRipple-root span": {
                        backgroundColor: "var(--iconButtonActive)",
                      },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePromptBar(setShowPromptBar);
                    }}
                  >
                    <ArrowBackIosRoundedIcon
                      sx={{
                        color: "var(--color-white) !important",
                        transform: "rotate(90deg)",
                      }}
                    />
                  </IconButton>
                </div>
              )}
              {isMobileLayout && !showComments && (
                <div
                  className="commentSectionHiddenHeader"
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleComments(setShowComments)}
                >
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
                      height: "45px",
                      zIndex: "49",
                      "&:hover": {
                        backgroundColor: "var(--iconButtonHover)",
                      },
                      "& .MuiTouchRipple-root span": {
                        backgroundColor: "var(--iconButtonActive)",
                      },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleComments(setShowComments);
                    }}
                  >
                    <ArrowBackIosRoundedIcon
                      sx={{
                        color: "var(--color-white) !important",
                        transform: "rotate(90deg)",
                      }}
                    />
                  </IconButton>
                </div>
              )}
            </div>
            {isMobileLayout && <div className="grey-cover-behind-bottom-bar"></div>}

            <div className="working-area" ref={workingAreaRef} onClick={handleWorkingAreaClick}>
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
                  height: "40px",
                  width: "40px",
                  "&:hover": {
                    backgroundColor: "var(--iconButtonHover)",
                  },
                  "& .MuiTouchRipple-root span": {
                    backgroundColor: "var(--iconButtonActive)",
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
                  height: "40px",
                  width: "40px",
                  "&:hover": {
                    backgroundColor: "var(--iconButtonHover)",
                  },
                  "& .MuiTouchRipple-root span": {
                    backgroundColor: "var(--iconButtonActive)",
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
              {isSelectingMask ? (
                <SelectMaskCanvas
                  selectedImage={selectedImageData}
                  showPromptBar={showPromptBar}
                  showComments={showPromptBar}
                  controlWidthComments={showPromptBar}
                  controlWidthPromptBar={showPromptBar}
                />
              ) : designVersionImages.length > 0 ? (
                <>
                  <div className="frame-buttons">
                    <button onClick={() => setNumImageFrames(2)}>
                      <TwoFrames />
                    </button>
                    <button onClick={() => setNumImageFrames(4)}>
                      <FourFrames />
                    </button>
                  </div>
                  <div className={`imagesWorkSpace`}>
                    <div
                      className="imagesWorkSpaceChild"
                      ref={imagesWorkSpaceChildRef}
                      onClick={handleWorkingAreaClick}
                    >
                      <div
                        className={`image-grid-design ${numImageFrames === 4 ? "fit-view" : ""}`}
                        ref={containerRef}
                      >
                        {designVersionImages.map((image, index) => (
                          <div
                            className="image-frame-cont"
                            style={{
                              background:
                                selectedImage === image.id
                                  ? "var(--gradientButton)"
                                  : "transparent",
                            }}
                            onClick={() => {
                              setSelectedImage(image.id);
                              setSelectedImageData(image);
                            }}
                          >
                            <div className="image-frame" key={image.id}>
                              {infoVisible ? (
                                <div className="image-info">
                                  <div className="image-actual-info">
                                    <Typography
                                      variant="body1"
                                      sx={{ fontWeight: "bold", fontSize: "1.1rem" }}
                                    >
                                      {`Image ${index + 1}`}
                                    </Typography>
                                    {image.description && (
                                      <Typography
                                        variant="caption"
                                        sx={{ color: "var(--color-grey2)" }}
                                      >
                                        {image.description}
                                      </Typography>
                                    )}
                                  </div>
                                  <IconButton
                                    sx={{
                                      ...iconButtonStyles,
                                      opacity: "0.3",
                                      width: "40px",
                                      height: "40px",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setImageDescToEdit(image.id);
                                      setIsEditDescModalOpen(true);
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    sx={{
                                      color: "var(--color-white)",
                                      borderRadius: "50%",
                                      opacity: "0.3",
                                      width: "40px",
                                      height: "40px",
                                      "&:hover": {
                                        backgroundColor: "var(--iconButtonHover2)",
                                      },
                                      "& .MuiTouchRipple-root span": {
                                        backgroundColor: "var(--iconButtonActive2)",
                                      },
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setInfoVisible(!infoVisible);
                                    }}
                                  >
                                    {infoVisible ? <UnviewInfoIcon /> : <ViewInfoIcon />}
                                  </IconButton>
                                </div>
                              ) : (
                                <IconButton
                                  sx={{
                                    color: "var(--color-white)",
                                    borderRadius: "50%",
                                    opacity: "0.3",
                                    width: "40px",
                                    height: "40px",
                                    position: "absolute",
                                    top: "8px",
                                    right: "8px",
                                    zIndex: "1",
                                    "&:hover": {
                                      backgroundColor: "var(--iconButtonHover2)",
                                    },
                                    "& .MuiTouchRipple-root span": {
                                      backgroundColor: "var(--iconButtonActive2)",
                                    },
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setInfoVisible(!infoVisible);
                                  }}
                                >
                                  {infoVisible ? <UnviewInfoIcon /> : <ViewInfoIcon />}
                                </IconButton>
                              )}
                              <img src={image.link} alt="" className="image-preview" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="noDesignVersionsCont">
                  <img src={"../../img/design-placeholder.png"} style={{ width: "100px" }} alt="" />
                  <p className="grey-text">No images generated yet.</p>
                  <p className="grey-text">Start generating.</p>
                </div>
              )}
            </div>
            {/* Default location on desktop screen */}
            {!isMobileLayout && showComments && (
              <CommentTabs
                workingAreaRef={workingAreaRef}
                numImageFrames={numImageFrames}
                showComments={showComments}
                setShowComments={setShowComments}
                width={controlWidthComments}
                setWidth={setControlWidthComments}
                prevWidth={widthComments}
                setPrevWidth={setWidthComments}
                prevHeight={heightComments}
                setPrevHeight={setHeightComments}
              />
            )}
          </div>
        </div>
      </DesignSpace>

      {isEditDescModalOpen && (
        <EditDescModal
          isOpen={isEditDescModalOpen}
          onClose={() => setIsEditDescModalOpen(false)}
          handleEdit={handleEdit}
          designVersion={designVersion}
          imageId={imageDescToEdit ?? ""}
        />
      )}
    </div>
  );
}

export default Design;

const dummyDesignVersionImages = [
  { id: 1, link: "../../img/Room1.png", description: "desc for 1", comments: "" },
  { id: 2, link: "../../img/Room1.png", description: "", comments: "" },
  { id: 3, link: "../../img/Room1.png", description: "", comments: "" },
  { id: 4, link: "../../img/Room1.png", description: "desc for 4", comments: "" },
];

const dummyDesignVersion = {
  id: "1",
  images: dummyDesignVersionImages,
  createdAt: new Date(),
  copiedDesigns: [],
  isRestored: false,
  isRestoredFrom: null,
};

// const dummyDesignVersionImages = [];
// const dummyDesignVersion = {};
