import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import deepEqual from "deep-equal";
import Draggable from "react-draggable";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { showToast } from "../../functions/utils";
import SelectMaskCanvas from "./SelectMaskCanvas";
import {
  IconButton,
  Typography,
  Box,
  Stack,
  Tooltip,
  ClickAwayListener,
  tooltipClasses,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CircularProgress, { circularProgressClasses } from "@mui/material/CircularProgress";
import LinearProgress, { linearProgressClasses } from "@mui/material/LinearProgress";
import PropTypes from "prop-types";
import {
  ArrowForwardIosRounded as ArrowForwardIosRoundedIcon,
  ArrowBackIosRounded as ArrowBackIosRoundedIcon,
  KeyboardArrowDownRounded as KeyboardArrowDownRoundedIcon,
} from "@mui/icons-material";
import DesignSpace from "./DesignSpace";
import PromptBar from "./PromptBar";
import Loading from "../../components/Loading";
import CommentTabs from "./CommentTabs";
import "../../css/design.css";
import TwoFrames from "./svg/TwoFrames";
import FourFrames from "./svg/FourFrames";
import { toggleComments, togglePromptBar } from "./backend/DesignActions";
import { UnviewInfoIcon, ViewInfoIcon } from "../../components/svg/SharedIcons";
import { EditIcon } from "../../components/svg/DefaultMenuIcons";
import EditDescModal from "./EditDescModal";
import { handleEditDescription } from "./backend/DesignActions";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { SelectedComment, UnselectedComment } from "./svg/AddColor";
import LoadingPage from "../../components/LoadingPage";
import { formatDateDetailComma } from "../Homepage/backend/HomepageActions";

function Design() {
  const {
    user,
    users,
    userDoc,
    designs,
    userDesigns,
    designVersions,
    userDesignVersions,
    comments,
  } = useSharedProps();
  const { designId } = useParams(); // Get designId from the URL
  const { isDarkMode } = useSharedProps();
  const navigate = useNavigate();
  const location = useLocation();
  const [changeMode, setChangeMode] = useState(location?.state?.changeMode || "");

  const [design, setDesign] = useState({});

  const [isOwner, setIsOwner] = useState(false);
  const [isOwnerEditor, setIsOwnerEditor] = useState(false);
  const [isOwnerEditorCommenter, setIsOwnerEditorCommenter] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);

  const [designVersion, setDesignVersion] = useState({});
  const [designVersionImages, setDesignVersionImages] = useState([]);
  const [isNextGeneration, setIsNextGeneration] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
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
  const [isMobileLayout, setIsMobileLayout] = useState(window.innerWidth <= 768);
  const [openDescTooltip, setOpenDescTooltip] = useState(false);
  const [tooltipClickLocked, setTooltipClickLocked] = useState(false);
  const workingAreaRef = useRef(null);
  const imagesWorkSpaceChildRef = useRef(null);

  const promptBarRef = useRef(null);

  // For selecting mask and generation
  const [maskPrompt, setMaskPrompt] = useState("");
  const [samMaskMask, setSamMaskMask] = useState(null); // for canvas
  const [samMaskImage, setSamMaskImage] = useState(null); // for generating
  const [combinedMask, setCombinedMask] = useState(null);
  const [maskErrors, setMaskErrors] = useState({});
  const [samDrawing, setSamDrawing] = useState(null);
  const [pickedColorSam, setPickedColorSam] = useState("var(--samMask)");
  const [opacitySam, setOpacitySam] = useState(0.5);
  const [handleClearAllCanvas, setHandleClearAllCanvas] = useState(() => {});
  const [previewMask, setPreviewMask] = useState(null);
  const [base64ImageAdd, setBase64ImageAdd] = useState(null);
  const [base64ImageRemove, setBase64ImageRemove] = useState(null);
  const [selectedSamMask, setSelectedSamMask] = useState(null);
  const [refineMaskOption, setRefineMaskOption] = useState(true); // true for Add first then remove, false for Remove first then add
  const [showPreview, setShowPreview] = useState(true);
  const [canvasMode, setCanvasMode] = useState(true); // true for Add to Mask, false for Remove form Mask
  const [samMasks, setSamMasks] = useState([]);
  const [isPreviewingMask, setIsPreviewingMask] = useState(false); // for loading
  const [validateApplyMask, setValidateApplyMask] = useState(null);

  // Comment
  // userDesignComments & userComments for the designs's latest design version
  const [designComments, setDesignComments] = useState([]);
  const [commentTypeTab, setCommentTypeTab] = useState(true); // true for Open, false for Resolved
  const [isPinpointing, setIsPinpointing] = useState(false);
  const [pinpointLocation, setPinpointLocation] = useState(null); // {x, y}
  const [pinpointSelectedImage, setPinpointSelectedImage] = useState(null);
  // for selected in image pinpoint
  const [activeComment, setActiveComment] = useState("");
  const imageContainerRefs = useRef({});
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);

  // Generation
  const [statusMessage, setStatusMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImagesPreview, setGeneratedImagesPreview] = useState([]);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [generationErrors, setGenerationErrors] = useState({});

  // Initialize access rights
  useEffect(() => {
    if (!design?.designSettings || !userDoc?.id) return;
    // Check if user has any access
    const hasAccess = isCollaboratorDesign(design, userDoc.id);
    if (!hasAccess) {
      showToast("error", "You don't have access to this design");
      navigate("/");
      return;
    }
    // If they have access, proceed with setting roles
    setIsOwner(isOwnerDesign(design, userDoc.id));
    setIsOwnerEditor(isOwnerEditorDesign(design, userDoc.id));
    setIsOwnerEditorCommenter(isOwnerEditorCommenterDesign(design, userDoc.id));
    setIsCollaborator(isCollaboratorDesign(design, userDoc.id));
  }, [design, userDoc]);

  useEffect(() => {
    if (isOwner || isOwnerEditor) {
      setShowPromptBar(true);
      setShowComments(false); // initially hide comments
    } else if (isOwnerEditorCommenter || isCollaborator) {
      setShowPromptBar(false);
      setShowComments(true); // initially show comments
    }
    if (!changeMode) {
      if (isOwner) setChangeMode("Editing");
      else if (isOwnerEditor) setChangeMode("Editing");
      else if (isOwnerEditorCommenter) setChangeMode("Commenting");
      else if (isCollaborator) setChangeMode("Viewing");
    }
    console.log(
      `commentCont - isOwner: ${isOwner}, isOwnerEditor: ${isOwnerEditor}, isOwnerEditorCommenter: ${isOwnerEditorCommenter}, isCollaborator: ${isCollaborator}`
    );
  }, [isOwner, isOwnerEditor, isOwnerEditorCommenter, isCollaborator, changeMode]);

  useEffect(() => {
    console.log(`commentCont - changeMode: ${changeMode}`);
    if (changeMode === "Editing") {
      setShowPromptBar(true);
      setShowComments(false); // initially hide comments
    } else if (changeMode === "Commenting" || changeMode === "Viewing") {
      setShowPromptBar(false);
      setShowComments(true); // initially show comments
    }
  }, [changeMode]);

  const handleEdit = async (imageId, description) => {
    console.log("got imageId", imageId);
    console.log("got description", description);
    const designVersionImages = designVersion?.images;
    const image = designVersionImages.find((image) => image?.imageId === imageId);
    if (image?.description === description.trim()) {
      return { success: false, message: "Description is the same as the current description" };
    }
    try {
      const result = await handleEditDescription(
        designId,
        designVersion.id,
        imageId,
        description,
        user,
        userDoc
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
      setIsMobileLayout(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (designId && userDesigns.length > 0) {
      const fetchedDesign =
        userDesigns.find((d) => d.id === designId) || designs.find((d) => d.id === designId);

      if (!fetchedDesign) {
        console.error("Design not found.");
      } else if (Object.keys(design).length === 0 || !deepEqual(design, fetchedDesign)) {
        setDesign(fetchedDesign);
        console.log("current design:", fetchedDesign);
      }
    }
    // setLoading(false);
  }, [designId, design, userDesigns]);

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
      const fetchedLatestDesignVersion =
        designVersions.find((v) => v.id === latestDesignVersionId) ||
        userDesignVersions.find((v) => v.id === latestDesignVersionId);

      if (!fetchedLatestDesignVersion) {
        console.error("Latest design version not found.");
      } else if (
        Object.keys(designVersion).length === 0 ||
        !deepEqual(designVersion, fetchedLatestDesignVersion)
      ) {
        setDesignVersion(fetchedLatestDesignVersion);
        setDesignVersionImages(fetchedLatestDesignVersion.images || []);
        setIsNextGeneration(true);
        console.log("fetchedLatestDesignVersion", fetchedLatestDesignVersion);
      }
    } else {
      setDesignVersion({});
      setDesignVersionImages([]);
      setIsNextGeneration(false);
    }
    setLoading(false);
  }, [design, designVersions, userDesignVersions]);

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

  const adjustImageFrames = useCallback(() => {
    console.log("inside adjusting image frames");

    const imageGrid = containerRef.current;
    const imageFrames = containerRef.current?.querySelectorAll(".image-frame");

    if (!imageGrid || !imageFrames || imageFrames.length === 0) {
      console.log("No image frames found, returning early");
      return;
    }
    console.log("adjusting image frames");

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

    setImageWidth(imageFrames?.[0].clientWidth);
    setImageHeight(imageFrames?.[0].clientHeight);
  }, [
    showPromptBar,
    showComments,
    numImageFrames,
    controlWidthComments,
    controlWidthPromptBar,
    isSelectingMask,
  ]);

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
  }, [
    showPromptBar,
    showComments,
    numImageFrames,
    controlWidthComments,
    controlWidthPromptBar,
    isSelectingMask,
  ]);

  useEffect(() => {
    if (designVersionImages.length > 0) {
      adjustImageFrames();
    }
  }, [designVersionImages]);

  // Reset selected image to null if click happened on the working-area div itself
  const handleWorkingAreaClick = (e) => {
    if (
      e.target === workingAreaRef.current ||
      e.target === imagesWorkSpaceChildRef.current ||
      e.target === containerRef.current
    ) {
      if (showComments && isPinpointing) setPinpointSelectedImage(null);
      setSelectedImage(null);
    }
  };

  useEffect(() => {
    if (isPinpointing) {
      const cursor = document.createElement("div");
      cursor.className = "custom-cursor";
      cursor.innerHTML = `<svg
          width="21"
          height="21"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 19C11.78 19 13.5201 18.4722 15.0001 17.4832C16.4802 16.4943 17.6337 15.0887 18.3149 13.4442C18.9961 11.7996 19.1743 9.99002 18.8271 8.24419C18.4798 6.49836 17.6226 4.89472 16.364 3.63604C15.1053 2.37737 13.5016 1.5202 11.7558 1.17294C10.01 0.82567 8.20038 1.0039 6.55585 1.68509C4.91131 2.36628 3.50571 3.51983 2.51677 4.99987C1.52784 6.47991 1 8.21997 1 10C1 11.488 1.36 12.89 2 14.127L1 19L5.873 18C7.109 18.639 8.513 19 10 19Z"
            stroke="url(#paint0_linear_398_2887)"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            opacity="0.16"
            d="M10 18C11.78 18 13.5201 17.4722 15.0001 16.4832C16.4802 15.4943 17.6337 14.0887 18.3149 12.4442C18.9961 10.7996 19.1743 8.99002 18.8271 7.24419C18.4798 5.49836 17.6226 3.89472 16.364 2.63604C15.1053 1.37737 13.5016 0.520203 11.7558 0.172937C10.01 -0.17433 8.20038 0.00389951 6.55585 0.685088C4.91131 1.36628 3.50571 2.51983 2.51677 3.99987C1.52784 5.47991 1 7.21997 1 9C1 10.488 1.36 11.89 2 13.127L1 18L5.873 17C7.109 17.639 8.513 18 10 18Z"
            fill="url(#paint1_linear_398_2887)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_398_2887"
              x1="10"
              y1="1"
              x2="10"
              y2="19"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="#F68244" />
              <stop offset="0.5" stop-color="#EF4F56" />
              <stop offset="1" stop-color="#EC2073" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_398_2887"
              x1="10"
              y1="0"
              x2="10"
              y2="18"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="#F68244" />
              <stop offset="0.5" stop-color="#EF4F56" />
              <stop offset="1" stop-color="#EC2073" />
            </linearGradient>
          </defs>
        </svg>`;
      document.body.appendChild(cursor);
      cursor.style.display = "none";
      const imageFrames = document.querySelectorAll(".image-frame-cont");
      const draggablePins = document.querySelectorAll(".comment-pin.draggable");
      const updateCursor = (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      };

      const handleMouseEnter = () => {
        cursor.style.display = "block";
      };

      const handleMouseLeave = () => {
        cursor.style.display = "none";
      };

      const handlePinMouseEnter = () => {
        cursor.style.display = "none";
      };

      // Add listeners to each image frame
      imageFrames.forEach((frame) => {
        frame.addEventListener("mousemove", updateCursor);
        frame.addEventListener("mouseenter", handleMouseEnter);
        frame.addEventListener("mouseleave", handleMouseLeave);
        frame.style.cursor = "none";
      });

      // Add listeners to draggable pins
      draggablePins.forEach((pin) => {
        pin.addEventListener("mouseenter", handlePinMouseEnter);
        pin.addEventListener("mouseleave", handleMouseEnter);
      });

      return () => {
        imageFrames.forEach((frame) => {
          frame.removeEventListener("mousemove", updateCursor);
          frame.removeEventListener("mouseenter", handleMouseEnter);
          frame.removeEventListener("mouseleave", handleMouseLeave);
          frame.style.cursor = "auto";
        });
        draggablePins.forEach((pin) => {
          pin.removeEventListener("mouseenter", handlePinMouseEnter);
          pin.removeEventListener("mouseleave", handleMouseEnter);
        });
        document.body.removeChild(cursor);
      };
    }
  }, [isPinpointing]);

  useEffect(() => {
    console.log("pinpoint values", {
      imageWidth,
      imageHeight,
      isPinpointing,
      pinpointLocation,
      pinpointSelectedImage,
      selectedImage,
    });
  }, [isPinpointing, pinpointLocation, pinpointSelectedImage, selectedImage]);

  if (loading) {
    return <LoadingPage message="Please wait, we're loading your design." />;
  }

  if (!design) {
    return (
      <LoadingPage message="Design not found. Please reload or navigate to this design again." />
    );
  }

  return (
    <div className="whole" id="designWhole">
      <DesignSpace
        design={design}
        isDesign={true}
        designId={designId}
        setShowComments={setShowComments}
        isSelectingMask={isSelectingMask}
        changeMode={changeMode}
        setChangeMode={setChangeMode}
      >
        <div className="create-design">
          <div className="workspace">
            <div className={isMobileLayout ? "hiddenHeaders open" : ""}>
              {showPromptBar && isOwnerEditor && changeMode === "Editing" && (
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
                    showComments={showComments}
                    setShowComments={setShowComments}
                    width={controlWidthPromptBar}
                    setWidth={setControlWidthPromptBar}
                    commentsWidth={controlWidthComments}
                    setCommentsWidth={setControlWidthComments}
                    prevWidth={widthPromptBar}
                    setPrevWidth={setWidthPromptBar}
                    prevHeight={heightPromptBar}
                    setPrevHeight={setHeightPromptBar}
                    selectedImage={selectedImage}
                    setSelectedImage={setSelectedImage}
                    isNextGeneration={isNextGeneration}
                    isSelectingMask={isSelectingMask}
                    setIsSelectingMask={setIsSelectingMask}
                    setStatusMessage={setStatusMessage}
                    setProgress={setProgress}
                    setEta={setEta}
                    setIsGenerating={setIsGenerating}
                    generatedImagesPreview={generatedImagesPreview}
                    setGeneratedImagesPreview={setGeneratedImagesPreview}
                    generatedImages={generatedImages}
                    setGeneratedImages={setGeneratedImages}
                    samMaskMask={samMaskMask}
                    maskPrompt={maskPrompt}
                    setMaskPrompt={setMaskPrompt}
                    combinedMask={combinedMask}
                    setMaskErrors={setMaskErrors}
                    samDrawing={samDrawing}
                    setSamMaskMask={setSamMaskMask}
                    pickedColorSam={pickedColorSam}
                    opacitySam={opacitySam}
                    setSamMaskImage={setSamMaskImage}
                    setCombinedMask={setCombinedMask}
                    handleClearAllCanvas={handleClearAllCanvas}
                    setPreviewMask={setPreviewMask}
                    samMaskImage={samMaskImage}
                    base64ImageAdd={base64ImageAdd}
                    base64ImageRemove={base64ImageRemove}
                    selectedSamMask={selectedSamMask}
                    setSelectedSamMask={setSelectedSamMask}
                    refineMaskOption={refineMaskOption}
                    showPreview={showPreview}
                    setShowPreview={setShowPreview}
                    promptBarRef={promptBarRef}
                    generationErrors={generationErrors}
                    setGenerationErrors={setGenerationErrors}
                    designId={designId}
                    setRefineMaskOption={setRefineMaskOption}
                    setCanvasMode={setCanvasMode}
                    setSamMasks={setSamMasks}
                    setBase64ImageAdd={setBase64ImageAdd}
                    setBase64ImageRemove={setBase64ImageRemove}
                    setIsPreviewingMask={setIsPreviewingMask}
                    design={design}
                    designVersion={designVersion}
                    samMasks={samMasks}
                    validateApplyMask={validateApplyMask}
                    isGenerating={isGenerating}
                  />
                </div>
              )}

              {/* Location if < 768px */}
              {isMobileLayout && showComments && (
                <div
                  style={{
                    paddingBottom:
                      isMobileLayout && !showPromptBar && isOwnerEditor && changeMode === "Editing"
                        ? "61px"
                        : "0px",
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
                    promptBarWidth={controlWidthPromptBar}
                    setPromptBarWidth={setControlWidthPromptBar}
                    prevWidth={widthComments}
                    setPrevWidth={setWidthComments}
                    prevHeight={heightComments}
                    setPrevHeight={setHeightComments}
                    design={design}
                    designVersion={designVersion}
                    designVersionImages={designVersionImages}
                    activeComment={activeComment}
                    setActiveComment={setActiveComment}
                    showPromptBar={showPromptBar}
                    isPinpointing={isPinpointing}
                    setIsPinpointing={setIsPinpointing}
                    pinpointLocation={pinpointLocation}
                    setPinpointLocation={setPinpointLocation}
                    pinpointSelectedImage={pinpointSelectedImage}
                    setPinpointSelectedImage={setPinpointSelectedImage}
                    designComments={designComments}
                    setDesignComments={setDesignComments}
                    selectedImage={selectedImage}
                    commentTypeTab={commentTypeTab}
                    setCommentTypeTab={setCommentTypeTab}
                    setSelectedImage={setSelectedImage}
                    isOwnerEditorCommenter={isOwnerEditorCommenter}
                    isCollaborator={isCollaborator}
                    changeMode={changeMode}
                  />
                </div>
              )}
            </div>

            <div className="hiddenHeaders">
              {!showPromptBar && isOwnerEditor && changeMode === "Editing" && (
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
                  style={{ cursor: design?.designSettings ? "pointer" : "auto" }}
                  onClick={() => design?.designSettings && toggleComments(setShowComments)}
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
                      opacity: design?.designSettings ? 1 : 0.5,
                      "&:hover": {
                        backgroundColor: design?.designSettings
                          ? "var(--iconButtonHover)"
                          : "transparent",
                      },
                      "& .MuiTouchRipple-root span": {
                        backgroundColor: "var(--iconButtonActive)",
                      },
                    }}
                    disabled={!design?.designSettings}
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
              {isOwnerEditor && changeMode === "Editing" && (
                <IconButton
                  sx={{
                    color: "var(--color-white)",
                    position: "absolute",
                    borderRadius: "50%",
                    left: "8px",
                    top: "8px",
                    marginTop: "10px",
                    zIndex: "49",
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
              )}
              <Box
                sx={{
                  position: "absolute",
                  borderRadius: "50%",
                  right: "8px",
                  top: "8px",
                  marginTop: "10px",
                  zIndex: "49",
                  marginRight: !showComments ? "5px" : "0px",
                }}
              >
                <Box sx={{ display: "flex" }}>
                  {(designVersion?.description || designVersion?.createdAt) && !isSelectingMask && (
                    <ClickAwayListener onClickAway={() => setOpenDescTooltip(false)}>
                      <CustomTooltip
                        title={
                          <DescriptionTooltip
                            description={designVersion.description}
                            createdAt={designVersion.createdAt}
                          />
                        }
                        placement="bottom"
                        PopperProps={{
                          modifiers: [
                            {
                              name: "preventOverflow",
                              options: {
                                boundary: window,
                                altAxis: true,
                                padding: 8,
                              },
                            },
                            {
                              name: "flip",
                              options: {
                                fallbackPlacements: ["bottom", "left"],
                              },
                            },
                          ],
                        }}
                        onClose={() => setOpenDescTooltip(false)}
                        open={openDescTooltip}
                        disableFocusListener
                        disableHoverListener
                        disableTouchListener
                        arrow
                      >
                        <IconButton
                          sx={{
                            ...iconButtonStyles,
                            height: "40px",
                            width: "40px",
                            opacity: design?.designSettings ? 1 : 0.5,
                            "&:hover": {
                              backgroundColor: design?.designSettings
                                ? "var(--iconButtonHover)"
                                : "transparent",
                            },
                            "& .MuiTouchRipple-root span": {
                              backgroundColor: "var(--iconButtonActive)",
                            },
                          }}
                          onClick={() => {
                            if (tooltipClickLocked) {
                              // If tooltip is locked (was clicked before), clicking again will close it
                              setOpenDescTooltip(false);
                              setTooltipClickLocked(false);
                            } else {
                              // If tooltip is not locked, clicking will lock it open
                              setOpenDescTooltip(true);
                              setTooltipClickLocked(true);
                            }
                          }}
                          onMouseEnter={() => {
                            if (!tooltipClickLocked) setOpenDescTooltip(true);
                          }}
                          onMouseLeave={() => {
                            if (!tooltipClickLocked) setOpenDescTooltip(false);
                          }}
                        >
                          <ViewInfoIcon />
                        </IconButton>
                      </CustomTooltip>
                    </ClickAwayListener>
                  )}
                  {!isSelectingMask && (
                    <IconButton
                      sx={{
                        ...iconButtonStyles,

                        height: "40px",
                        width: "40px",
                        opacity: design?.designSettings ? 1 : 0.5,
                        "&:hover": {
                          backgroundColor: design?.designSettings
                            ? "var(--iconButtonHover)"
                            : "transparent",
                        },
                        "& .MuiTouchRipple-root span": {
                          backgroundColor: "var(--iconButtonActive)",
                        },
                      }}
                      disabled={!design?.designSettings}
                      onClick={() => design?.designSettings && toggleComments(setShowComments)}
                      className="commentSectionIconButton"
                    >
                      <ArrowBackIosRoundedIcon
                        sx={{
                          color: "var(--color-white) !important",
                          transform: showComments ? "rotate(180deg)" : "",
                        }}
                      />
                    </IconButton>
                  )}
                </Box>
              </Box>
              {isSelectingMask ? (
                <SelectMaskCanvas
                  selectedImage={selectedImage}
                  showPromptBar={showPromptBar}
                  setShowPromptBar={setShowPromptBar}
                  controlWidthPromptBar={controlWidthPromptBar}
                  setControlWidthPromptBar={setControlWidthPromptBar}
                  maskPrompt={maskPrompt}
                  setMaskPrompt={setMaskPrompt}
                  samMaskMask={samMaskMask}
                  setSamMaskMask={setSamMaskMask}
                  combinedMask={combinedMask}
                  setCombinedMask={setCombinedMask}
                  errors={maskErrors}
                  setErrors={setMaskErrors}
                  samDrawing={samDrawing}
                  setSamDrawing={setSamDrawing}
                  pickedColorSam={pickedColorSam}
                  setPickedColorSam={setPickedColorSam}
                  opacitySam={opacitySam}
                  setOpacitySam={setOpacitySam}
                  samMaskImage={samMaskImage}
                  setSamMaskImage={setSamMaskImage}
                  handleClearAllCanvas={handleClearAllCanvas}
                  setHandleClearAllCanvas={setHandleClearAllCanvas}
                  previewMask={previewMask}
                  setPreviewMask={setPreviewMask}
                  base64ImageAdd={base64ImageAdd}
                  setBase64ImageAdd={setBase64ImageAdd}
                  base64ImageRemove={base64ImageRemove}
                  setBase64ImageRemove={setBase64ImageRemove}
                  selectedSamMask={selectedSamMask}
                  setSelectedSamMask={setSelectedSamMask}
                  refineMaskOption={refineMaskOption}
                  setRefineMaskOption={setRefineMaskOption}
                  showPreview={showPreview}
                  setShowPreview={setShowPreview}
                  promptBarRef={promptBarRef}
                  generationErrors={generationErrors}
                  canvasMode={canvasMode}
                  setCanvasMode={setCanvasMode}
                  samMasks={samMasks}
                  setSamMasks={setSamMasks}
                  design={design}
                  designVersion={designVersion}
                  designVersionImages={designVersionImages}
                  isPreviewingMask={isPreviewingMask}
                  setIsPreviewingMask={setIsPreviewingMask}
                  validateApplyMask={validateApplyMask}
                  setValidateApplyMask={setValidateApplyMask}
                  isSelectingMask={isSelectingMask}
                />
              ) : (isGenerating && generatedImagesPreview.length > 0) ||
                designVersionImages.length > 0 ? (
                <>
                  <div className="frame-buttons">
                    <button
                      onClick={() => setNumImageFrames(2)}
                      className={numImageFrames === 2 ? "active" : ""}
                    >
                      <TwoFrames />
                    </button>
                    <button
                      onClick={() => setNumImageFrames(4)}
                      className={numImageFrames === 4 ? "active" : ""}
                    >
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
                        {(isGenerating && generatedImagesPreview
                          ? generatedImagesPreview
                          : designVersionImages
                        ).map((image, index) => (
                          <div
                            key={image.imageId}
                            className="image-frame-cont"
                            style={{
                              background:
                                showComments && isPinpointing
                                  ? pinpointSelectedImage &&
                                    pinpointSelectedImage.imageId === image.imageId
                                    ? "var(--gradientButton)"
                                    : "transparent"
                                  : selectedImage && selectedImage.imageId === image.imageId
                                  ? "var(--gradientButton)"
                                  : "transparent",
                            }}
                            onClick={(e) => {
                              console.log(showComments && isPinpointing);
                              if (showComments && isPinpointing) {
                                console.log("clicked pinpoint");
                                const rect = e.currentTarget.getBoundingClientRect();
                                const cursorHeight = 21;
                                const offset = 2;
                                // Calculate percentages
                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                const y =
                                  ((e.clientY - rect.top - (cursorHeight + offset)) / rect.height) *
                                  100;
                                setPinpointLocation({ x, y });
                                // setIsPinpointing(false);
                                setSelectedImage(image);
                                setPinpointSelectedImage(image);
                              } else {
                                setSelectedImage(image);
                              }
                            }}
                          >
                            <div
                              className="image-frame"
                              style={{
                                cursor: isPinpointing ? "none" : !isGenerating ? "pointer" : "auto",
                                position: "relative",
                              }}
                            >
                              {!isGenerating &&
                                !showComments &&
                                (infoVisible ? (
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
                                    {isOwnerEditor && changeMode === "Editing" && (
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
                                          console.log("editdesc - Image object:", image); // Add this
                                          console.log("editdesc - Image ID:", image.imageId); // Add this
                                          setImageDescToEdit(image.imageId);
                                          setIsEditDescModalOpen(true);
                                        }}
                                      >
                                        <EditIcon />
                                      </IconButton>
                                    )}
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
                                ))}
                              <img
                                src={(() => {
                                  const source =
                                    isGenerating && generatedImagesPreview ? image.src : image.link;
                                  return source && source !== ""
                                    ? source
                                    : "/img/transparent-image.png";
                                })()}
                                alt=""
                                className="image-preview"
                              />
                              {/* Show comment pins */}
                              {showComments &&
                                !isPinpointing &&
                                designComments
                                  .filter(
                                    (comment) => comment.designVersionImageId === image.imageId
                                  )
                                  .map(
                                    (comment) =>
                                      comment.designVersionImageId === image.imageId &&
                                      comment.status === !commentTypeTab &&
                                      comment.location && (
                                        <div
                                          key={comment.id}
                                          className="comment-pin"
                                          style={{
                                            position: "absolute",
                                            left: `${comment.location.x}%`,
                                            top: `${comment.location.y}%`,
                                            transform: "translate(0%, -10%)",
                                            cursor: "pointer",
                                            zIndex: 10,
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveComment(comment.id);
                                          }}
                                        >
                                          {activeComment === comment.id ? (
                                            <SelectedComment />
                                          ) : (
                                            <UnselectedComment />
                                          )}
                                        </div>
                                      )
                                  )}

                              {/* Show current pinpoint when adding comment */}
                              {showComments &&
                                isPinpointing &&
                                pinpointSelectedImage?.imageId === image.imageId &&
                                pinpointLocation && (
                                  <Draggable
                                    bounds="parent"
                                    position={{
                                      x: (pinpointLocation.x * imageWidth) / 100,
                                      y: (pinpointLocation.y * imageHeight) / 100,
                                    }}
                                    onDrag={(e, data) => {
                                      setPinpointLocation({
                                        x: (data.x * 100) / imageWidth,
                                        y: (data.y * 100) / imageHeight,
                                      });
                                    }}
                                  >
                                    <div className="comment-pin draggable">
                                      <SelectedComment />
                                    </div>
                                  </Draggable>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="noDesignVersionsCont">
                  <img
                    src={`/img/design-placeholder${!isDarkMode ? "-dark" : ""}.png`}
                    style={{ width: "100px" }}
                    alt=""
                  />
                  <p className="grey-text">No images generated yet.</p>
                  <p className="grey-text">Start generating.</p>
                </div>
              )}
              {isGenerating && (
                <GeneratingOverlay
                  statusMessage={statusMessage}
                  progress={progress}
                  eta={eta}
                  transparent={true}
                />
              )}
            </div>
            {/* Default location on desktop screen */}
            {!isMobileLayout && showComments && (
              <div>
                <div style={{ height: "100%" }}>
                  <CommentTabs
                    workingAreaRef={workingAreaRef}
                    numImageFrames={numImageFrames}
                    showComments={showComments}
                    setShowComments={setShowComments}
                    width={controlWidthComments}
                    setWidth={setControlWidthComments}
                    promptBarWidth={controlWidthPromptBar}
                    setPromptBarWidth={setControlWidthPromptBar}
                    prevWidth={widthComments}
                    setPrevWidth={setWidthComments}
                    design={design}
                    designVersion={designVersion}
                    designVersionImages={designVersionImages}
                    activeComment={activeComment}
                    setActiveComment={setActiveComment}
                    showPromptBar={showPromptBar}
                    isPinpointing={isPinpointing}
                    setIsPinpointing={setIsPinpointing}
                    pinpointLocation={pinpointLocation}
                    setPinpointLocation={setPinpointLocation}
                    pinpointSelectedImage={pinpointSelectedImage}
                    setPinpointSelectedImage={setPinpointSelectedImage}
                    designComments={designComments}
                    setDesignComments={setDesignComments}
                    selectedImage={selectedImage}
                    commentTypeTab={commentTypeTab}
                    setCommentTypeTab={setCommentTypeTab}
                    setSelectedImage={setSelectedImage}
                    isOwnerEditorCommenter={isOwnerEditorCommenter}
                    isCollaborator={isCollaborator}
                    changeMode={changeMode}
                  />
                </div>
              </div>
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

export const GeneratingOverlay = ({ statusMessage, progress, eta, transparent = false }) => {
  const { isDarkMode } = useSharedProps();
  return (
    <div
      className="generatingOverlayBox"
      style={{ backgroundColor: transparent ? "rgba(0, 0, 0, 0)" : "rgba(0, 0, 0, 0.4)" }}
    >
      <div className="generatingOverlayContent">
        <div className="gradientCircleDiv">
          <GradientCircularProgress statusMessage={statusMessage} value={progress} />
        </div>
        <div className="generatingOverlayTextCont">
          {statusMessage && (
            <Box
              variant="body1"
              sx={{
                color: "white",
                fontFamily: '"Inter", sans-serif',
                fontSize: "1.1rem",
                // background: "var(--gradientFont)",
                // WebkitBackgroundClip: "text",
                // WebkitTextFillColor: "transparent",
                fontWeight: "800",
                textShadow: "0px 2px 11px rgba(0,0,0,0.5)",
              }}
            >
              <BouncyText text={`${statusMessage}...`} />
            </Box>
          )}
          {statusMessage && statusMessage.startsWith("Generating image") && (
            <Typography
              variant="body1"
              sx={{
                color: isDarkMode ? "var(--greyText)" : "var(color-white)",
                fontFamily: '"Inter", sans-serif',
                fontSize: "0.875rem",
                fontWeight: "400",
                textShadow: isDarkMode
                  ? "0px 2px 11px rgba(0,0,0,0.5)"
                  : "0px 2px 11px rgba(255,255,255,0.5)",
              }}
            >
              {`${progress}%, ${eta}`}
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
};

const BouncyText = ({ text }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "-webkit-linear-gradient(-90deg, #faa652 0%, #f36b24 50%, #ea1179 100%);",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      {text.split("").map((char, index) => (
        <p
          key={index}
          variant="body1"
          style={{
            color: "inherit",
            fontFamily: '"Inter", sans-serif',
            fontSize: "1.1rem",
            fontWeight: "800",
            display: "inline-block",
            willChange: "transform",
            background: "inherit",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: `bounce 1.5s ease-in-out ${index * 0.1}s infinite`,
          }}
          className="bouncyText"
        >
          {char === " " ? "\u00A0" : char} {/* Non-breaking space for spaces */}
        </p>
      ))}
      <style>
        {`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {transform: translateY(0);} 
            40% {transform: translateY(-4px);} 
            60% {transform: translateY(-1px);} 
          }
        `}
      </style>
    </Box>
  );
};

export const GradientCircularProgress = ({ statusMessage, value }) => {
  return (
    <React.Fragment>
      <svg width={0} height={0}>
        <defs>
          <linearGradient id="gradientFont" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#ea1179", stopOpacity: 1 }} />
            <stop offset="40%" style={{ stopColor: "#f36b24", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#faa652", stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>
      {statusMessage && statusMessage.startsWith("Generating image") ? (
        <CircularProgressWithBackground value={value} />
      ) : (
        <CircularProgress
          variant="indeterminate"
          thickness={6}
          size={45}
          sx={{
            "& .MuiCircularProgress-circle": {
              stroke: "url(#gradientFont)",
              strokeLinecap: "round",
            },
          }}
        />
      )}
    </React.Fragment>
  );
};

const CircularProgressWithBackground = ({ value }) => {
  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background Circle */}
      <Box sx={{ position: "absolute" }}>
        <CircularProgress
          variant="determinate"
          thickness={6}
          size={45}
          sx={{
            "& .MuiCircularProgress-circle": {
              stroke: "var(--slider)",
              strokeLinecap: "round",
            },
          }}
          value={100}
        />
      </Box>
      {/* Progress Circle */}
      <Box sx={{ position: "absolute" }}>
        {/* Circular Progress */}
        <CircularProgress
          variant="determinate"
          thickness={6}
          size={45}
          sx={{
            "& .MuiCircularProgress-circle": {
              stroke: "url(#gradientFont)",
              strokeLinecap: "round",
            },
          }}
          value={value}
        />
      </Box>
    </Box>
  );
};

function CircularProgressWithLabel(props) {
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress
        variant="determinate"
        thickness={6}
        size={45}
        sx={{
          color: "var(--slider)",
          "& .MuiCircularProgress-circle": {
            stroke: "url(#gradientFont)",
            strokeLinecap: "round",
          },
        }}
        {...props}
      />
      {/* <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="caption" component="div" color="var(--color-white)">
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box> */}
    </Box>
  );
}

CircularProgressWithLabel.propTypes = {
  /**
   * The value of the progress indicator for the determinate variant.
   * Value between 0 and 100.
   * @default 0
   */
  value: PropTypes.number.isRequired,
};

// <CircularProgressWithLabel value={progress} /> 0-100

export const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: "var(--slider)",
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    background: "var(--gradientButton)",
  },
}));

export const CustomTooltip = styled(
  React.forwardRef(({ className, ...props }, ref) => (
    <Tooltip
      {...props}
      ref={ref}
      classes={{ popper: className }}
      slotProps={{
        popper: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [-8, -6],
              },
            },
          ],
        },
      }}
    />
  ))
)(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: "transparent",
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "var(--iconBg)",
    color: "var(--color-white)",
    maxWidth: "320px",
    width: "100%",
    borderRadius: "10px",
    boxShadow: "-4px 4px 10px rgba(0, 0, 0, 0.2)",
    border: "1px solid var(--table-stroke)",
    padding: "0",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    transform: "translateX(-20px) !important",
  },
}));

export const DescriptionTooltip = ({ description = "", createdAt = "" }) => {
  const displayDate = formatDateDetailComma(createdAt);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: "5px",
        textAlign: "justify",
        padding: "5px 10px",
        minWidth: "calc(320px - 40px)",
      }}
    >
      <Box>
        {description && (
          <Typography
            sx={{
              color: "var(--color-white)",
              fontSize: "0.875rem",
              fontWeight: "500",
              wordBreak: "break-word",
            }}
          >
            {description}
          </Typography>
        )}
        {createdAt && (
          <Typography sx={{ color: "var(--greyText)", fontSize: "0.7rem", textAlign: "center" }}>
            {`Version created ${displayDate?.includes(",") ? "at " : ""}${displayDate}`}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

//0 for viewer, 1 for editor, 2 for commenter, 3 for owner
// Check if user is owner (manage)
export const isOwnerDesign = (design, userId) => {
  const isOwner = design.owner === userId;
  return isOwner;
};

// Check if user is owner or editor in design (editing)
export const isOwnerEditorDesign = (design, userId) => {
  if (design.designSettings.generalAccessSetting === 0) {
    // Restricted Access
    const isOwner = design.owner === userId;
    const isEditor = design.editors?.includes(userId);
    return isOwner || isEditor;
  } else {
    // Anyone with the link
    if (design.designSettings.generalAccessRole === 1) return true;
    const isOwner = design.owner === userId;
    const isEditor = design.editors?.includes(userId);
    return isOwner || isEditor;
  }
};

// Check if user is owner, editor, commenter (commenting)
export const isOwnerEditorCommenterDesign = (design, userId) => {
  if (design.designSettings.generalAccessSetting === 0) {
    // Restricted Access
    const isOwner = design.owner === userId;
    const isEditor = design.editors?.includes(userId);
    const isCommenter = design.commenters?.includes(userId);
    return isOwner || isEditor || isCommenter;
  } else {
    // Anyone with the link
    if (
      design.designSettings.generalAccessRole === 2 ||
      design.designSettings.generalAccessRole === 1
    )
      return true;
    const isOwner = design.owner === userId;
    const isEditor = design.editors?.includes(userId);
    const isCommenter = design.commenters?.includes(userId);
    return isOwner || isEditor || isCommenter;
  }
};

// Check if user is owner, editor, commenter, viewer (viewing)
export const isCollaboratorDesign = (design, userId) => {
  if (design.designSettings.generalAccessSetting === 0) {
    // Restricted Access
    const isOwner = design.owner === userId;
    const isEditor = design.editors?.includes(userId);
    const isCommenter = design.commenters?.includes(userId);
    const isViewer = design.viewers?.includes(userId);
    return isOwner || isEditor || isCommenter || isViewer;
  } else {
    // Anyone with the link
    if (
      design.designSettings.generalAccessRole === 0 ||
      design.designSettings.generalAccessRole === 1 ||
      design.designSettings.generalAccessRole === 2
    )
      return true;
    const isOwner = design.owner === userId;
    const isEditor = design.editors?.includes(userId);
    const isCommenter = design.commenters?.includes(userId);
    const isViewer = design.viewers?.includes(userId);
    return isOwner || isEditor || isCommenter || isViewer;
  }
};

<BorderLinearProgress variant="determinate" value={50} />;

// const dummyDesignVersionImages = [
//   {
//     id: "image123",
//     link: "../../img/Room1.png",
//     description: "Living room view 1",
//     comments: ["comment1"],
//   },
//   {
//     id: "image456",
//     link: "../../img/Room1.png",
//     description: "Living room view 2",
//     comments: ["comment2"],
//   },
//   {
//     id: "image789",
//     link: "../../img/Room1.png",
//     description: "Living room view 3",
//     comments: ["comment3", "comment4"],
//   },
//   {
//     id: "image101112",
//     link: "../../img/Room1.png",
//     description: "Living room view 4",
//     comments: "",
//   },
// ];

// const dummyDesignVersion = {
//   id: "designVersion1",
//   description: "Living room design concept",
//   images: dummyDesignVersionImages,
//   createdAt: new Date("2024-10-01T09:00:00Z"),
//   copiedDesigns: [],
//   isRestored: false,
//   isRestoredFrom: null,
// };

const dummyDesignVersionImages = [];
const dummyDesignVersion = {};
