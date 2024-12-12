import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import {
  fetchPins,
  deleteProjectPin,
  savePinOrder,
  handlePlanImageUpload,
  fetchPlanImage,
} from "./backend/ProjectDetails";
import ProjectHead from "./ProjectHead";
import MapPin from "./MapPin";
import BottomBarDesign from "./BottomBarProject";
import { useParams } from "react-router-dom";
import { AddIcon } from "../../components/svg/DefaultMenuIcons";
import "../../css/project.css";
import "../../css/seeAll.css";
import "../../css/budget.css";
import { AddPin, AdjustPin, ChangeOrder, ChangePlan, AddPlan } from "../DesignSpace/svg/AddImage";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButtonMUI from "@mui/material/IconButton";
import ButtonMUI from "@mui/material/Button";
import TypographyMUI from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import NoImage from "../DesignSpace/svg/NoImage"; // Assuming this is the correct path
import {
  dialogStyles,
  dialogTitleStyles,
  dialogContentStyles,
  dialogActionsVertButtonsStyles,
} from "../../components/RenameModal";
import ImageFrame from "../../components/ImageFrame";
import LoadingPage from "../../components/LoadingPage";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import ProjectSpace from "./ProjectSpace";
import deepEqual from "deep-equal";
import { showToast } from "../../functions/utils";
import {
  isManagerProject,
  isManagerContentManagerProject,
  isManagerContentManagerContributorProject,
  isCollaboratorProject,
} from "./Project";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { gradientButtonStyles, outlinedButtonStyles } from "../DesignSpace/PromptBar";

function PlanMap() {
  const { projectId } = useParams();
  const { userDoc, isDarkMode, designs, projects, userProjects } = useSharedProps();
  const navigate = useNavigate();
  const location = useLocation();
  const navigateFrom = location.pathname;
  const [changeMode, setChangeMode] = useState(location?.state?.changeMode || "");
  const [project, setProject] = useState({});
  const [pins, setPins] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [planImageModalOpen, setPlanImageModalOpen] = useState(false);
  const [planImagePreview, setPlanImagePreview] = useState(null);
  const [planImage, setPlanImage] = useState(null);
  const [initPlanImage, setInitPlanImage] = useState(null);
  const [isContinueBtnDisabled, setIsContinueBtnDisabled] = useState(false);
  const planImageFileInputRef = useRef(null);
  const [loadingImage, setLoadingImage] = useState(true);
  const [loadingProject, setLoadingProject] = useState(true);

  const [isManager, setIsManager] = useState(false);
  const [isManagerContentManager, setIsManagerContentManager] = useState(false);
  const [isManagerContentManagerContributor, setIsManagerContentManagerContributor] =
    useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);

  // Get project
  useEffect(() => {
    if (projectId && (userProjects.length > 0 || projects.length > 0)) {
      const fetchedProject =
        userProjects.find((d) => d.id === projectId) || projects.find((d) => d.id === projectId);

      if (!fetchedProject) {
        console.error("Project not found.");
        setLoadingProject(false);
      } else {
        // Check if user has access
        const hasAccess = isCollaboratorProject(fetchedProject, userDoc?.id);
        if (!hasAccess) {
          console.error("No access to project.");
          setLoadingProject(false);
          showToast("error", "You don't have access to this project");
          navigate("/");
          return;
        }

        if (Object.keys(project).length === 0 || !deepEqual(project, fetchedProject)) {
          setProject(fetchedProject);
          console.log("current project:", fetchedProject);
        }
      }
    }
    setLoadingProject(false);
  }, [projectId, projects, userProjects, isCollaborator]);

  // Initialize access rights
  useEffect(() => {
    if (!project?.projectSettings || !userDoc?.id) return;
    // Check if user has any access
    const hasAccess = isCollaboratorProject(project, userDoc.id);
    if (!hasAccess) {
      showToast("error", "You don't have access to this project");
      navigate("/");
      return;
    }
    // If they have access, proceed with setting roles
    setIsManager(isManagerProject(project, userDoc.id));
    setIsManagerContentManager(isManagerContentManagerProject(project, userDoc.id));
    setIsManagerContentManagerContributor(
      isManagerContentManagerContributorProject(project, userDoc.id)
    );
    setIsCollaborator(isCollaboratorProject(project, userDoc.id));
  }, [project, userDoc]);

  useEffect(() => {
    if (user) {
      fetchPlanImage(projectId, setPlanImage, setPlanImagePreview);
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchPins(projectId, setPins);
        fetchPlanImage(projectId, setPlanImage, setPlanImagePreview).finally(() =>
          setLoadingImage(false)
        );
      } else {
        setUser(null);
        setPins([]);
        setLoadingImage(false);
      }
    });
    return () => unsubscribeAuth();
  }, [user, projectId]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const navigateToAddPin = () => {
    const totalPins = pins.length; // Assuming `pins` is an array containing the existing pins
    console.log("Total Pins:", totalPins);
    navigate("/addPin/", {
      state: { navigateFrom: navigateFrom, projectId: projectId, totalPins: totalPins },
    });
  };
  const navigateToPinLayout = () => {
    navigate(`/pinOrder/${projectId}`, {
      state: { navigateFrom: navigateFrom },
    });
  };
  const navigateToAdjustPin = () => {
    navigate(`/adjustPin/${projectId}`, {
      state: { navigateFrom: navigateFrom, projectId: projectId },
    });
  };

  const navigateToEditPin = (pinId) => {
    const pinToEdit = pins.find((pin) => pin.id === pinId);
    navigate("/addPin/", {
      state: { navigateFrom: navigateFrom, projectId: projectId, pinToEdit: pinToEdit },
    });
  };

  const handlePlanImageModalOpen = () => {
    setPlanImageModalOpen(true);
  };

  const handleStyleRefModalClose = () => {
    setInitPlanImage(null);
    setPlanImagePreview("");
    setPlanImageModalOpen(false);
  };

  const handleUploadClick = (ref) => {
    ref.current.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleFileChange = (file, setInitImage, setImagePreview) => {
    const message = handleImageValidation(file);
    if (message !== "") return;

    setInitImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log("FileReader result:", reader.result);
      setImagePreview(reader.result);
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };
    reader.readAsDataURL(file);
    console.log("File uploaded:", file);
  };

  // Image validation
  const handleImageValidation = (file) => {
    let message = "";
    const acceptedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
    if (!acceptedTypes?.includes(file.type)) {
      message = "Please upload an image file of png, jpg, or jpeg type";
      showToast("error", message);
    } else {
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        message = "Image size must be less than 2MB";
        showToast("error", message);
      }
    }
    return message;
  };

  const handleDrop = (e, setInitPlanImage, setPlanImagePreview) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const message = handleImageValidation(file);
      if (message !== "") return;
      handleFileChange(file, setInitPlanImage, setPlanImagePreview);
    }
  };

  const deletePin = async (pinId) => {
    try {
      await deleteProjectPin(projectId, pinId, user, userDoc);
      console.log("Deleting pin", pinId);
      const updatedPins = pins
        .filter((pin) => pin.id !== pinId)
        .map((pin, index) => ({
          ...pin,
          order: index + 1,
        }));
      setPins(updatedPins);
      await savePinOrder(projectId, updatedPins);
    } catch (error) {
      console.error("Error deleting pin:", error);
    }
  };

  const onFileUpload = (event, setInitPlanImage, setPlanImagePreview) => {
    const file = event.target.files[0];
    if (file) handleFileChange(file, setInitPlanImage, setPlanImagePreview);
  };

  const handlePlanImageContinue = async () => {
    setIsContinueBtnDisabled(true);
    try {
      if (initPlanImage) {
        const result = await handlePlanImageUpload(initPlanImage, projectId, setPlanImage);
        console.log("plan map upload result:", result);
        if (!result.success) {
          showToast("error", result.message || "Failed to upload plan image");
          return;
        }
        showToast("success", "Plan map uploaded successfully");
        setInitPlanImage(null);
        setPlanImagePreview(null);
        setPlanImageModalOpen(false);
        setMenuOpen(false);
      }
    } finally {
      setIsContinueBtnDisabled(false);
    }
  };

  const handleNoPlanImage = () => {
    showToast("error", "Please upload a plan map first");
  };

  if (loadingImage) {
    return <LoadingPage />;
  }

  return (
    <>
      <ProjectSpace
        project={project}
        projectId={projectId}
        inDesign={false}
        inPlanMap={true}
        inTimeline={false}
        inBudget={false}
        changeMode={changeMode}
        setChangeMode={setChangeMode}
      >
        {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}
        <div className="sectionPins" style={{ background: "none", maxWidth: "100%" }}>
          <div className="budgetSpaceImg" style={{ background: "none", height: "100%" }}>
            {planImage ? (
              <ImageFrame
                src={planImage}
                alt=""
                pins={pins}
                projectId={projectId}
                setPins={setPins}
                draggable={false} // Ensure this line is present
              />
            ) : (
              <div className="no-content" style={{ height: "80vh" }}>
                <p>Please upload an image to place your pins</p>
              </div>
            )}
          </div>
          <div className="budgetSpaceImg pinsCont">
            {pins.length > 0 ? (
              pins
                .sort((a, b) => a.order - b.order) // Sort pins by design.order
                .map((pin) => {
                  return (
                    <>
                      <MapPin
                        title={
                          designs.find((design) => design.id === pin.designId)?.designName ??
                          "Untitled Design"
                        }
                        pinColor={pin.color}
                        pinNo={pin.order}
                        pinId={pin.id}
                        designId={pin.designId}
                        deletePin={() => deletePin(pin.id)}
                        editPin={() => navigateToEditPin(pin.id)}
                        manager={
                          isManagerContentManager &&
                          (changeMode === "Managing Content" || changeMode === "Managing")
                        }
                        contributor={
                          (isManager ||
                            isManagerContentManager ||
                            isManagerContentManagerContributor) &&
                          (changeMode === "Managing Content" ||
                            changeMode === "Managing" ||
                            changeMode === "Contributing")
                        }
                      />
                    </>
                  );
                })
            ) : (
              <div className="no-content" style={{ height: "80vh" }}>
                <img
                  src={`/img/design-placeholder${!isDarkMode ? "-dark" : ""}.png`}
                  alt="No designs yet"
                />
                <p>No pins yet. Start adding.</p>
              </div>
            )}
            <div className="bottom-filler" />
          </div>
        </div>

        {/* Floating Action Button */}
        {(isManager || isManagerContentManager || isManagerContentManagerContributor) &&
          (changeMode === "Managing Content" ||
            changeMode === "Managing" ||
            changeMode === "Contributing") && (
            <div className="circle-button-container">
              {menuOpen && (
                <div className="small-buttons" style={{ cursor: "pointer" }}>
                  {isManagerContentManagerContributor &&
                    (changeMode === "Managing Content" ||
                      changeMode === "Managing" ||
                      changeMode === "Contributing") && (
                      <>
                        <div className="small-button-container" onClick={handlePlanImageModalOpen}>
                          <span className="small-button-text">
                            {!planImage ? "Add a plan" : "Change plan"}
                          </span>
                          <div className="small-circle-button">
                            {!planImage ? <AddPlan /> : <ChangePlan />}
                          </div>
                        </div>
                        {planImage && pins.length > 1 && (
                          <div
                            className="small-button-container"
                            onClick={planImage ? navigateToPinLayout : handleNoPlanImage}
                          >
                            <span className="small-button-text">Change pins' order</span>
                            <div className="small-circle-button">
                              <ChangeOrder />
                            </div>
                          </div>
                        )}

                        {planImage && pins.length > 0 && (
                          <div
                            className="small-button-container"
                            onClick={planImage ? navigateToAdjustPin : handleNoPlanImage}
                          >
                            <span className="small-button-text">Adjust pins</span>
                            <div className="small-circle-button">
                              <AdjustPin />
                            </div>
                          </div>
                        )}
                        {planImage && (
                          <div
                            className="small-button-container"
                            onClick={planImage ? navigateToAddPin : handleNoPlanImage}
                          >
                            <span className="small-button-text">Add a pin</span>
                            <div className="small-circle-button">
                              <AddPin />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                </div>
              )}
              <div className={`circle-button ${menuOpen ? "rotate" : ""} add`} onClick={toggleMenu}>
                {menuOpen ? <AddIcon /> : <AddIcon />}
              </div>
            </div>
          )}
      </ProjectSpace>

      {/* Change Plan Modal */}
      <Dialog open={planImageModalOpen} onClose={handleStyleRefModalClose} sx={dialogStyles}>
        <DialogTitle sx={dialogTitleStyles}>
          <TypographyMUI
            variant="body1"
            sx={{
              fontWeight: "bold",
              fontSize: "1.15rem",
              flexGrow: 1,
              maxWidth: "80%",
              whiteSpace: "normal",
            }}
          >
            {`${!planImage ? "Add a" : "Change the"} venue or floor plan`}
          </TypographyMUI>
          <IconButtonMUI
            onClick={handleStyleRefModalClose}
            sx={{
              ...iconButtonStyles,
              flexShrink: 0,
              marginLeft: "auto",
            }}
          >
            <CloseRoundedIcon />
          </IconButtonMUI>
        </DialogTitle>
        <DialogContent
          sx={{
            ...dialogContentStyles,
            alignItems: "center",
            padding: "20px",
            paddingBottom: 0,
            marginTop: 0,
            width: "auto",
          }}
        >
          <div
            style={{
              width: "min(50vw, 50vh)",
              height: "min(50vw, 50vh)",
              maxWidth: "500px",
              maxHeight: "500px",
              padding: "20px 0",
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              handleDrop(e, setInitPlanImage, setPlanImagePreview);
            }}
          >
            {planImagePreview ? (
              <img
                src={planImagePreview}
                alt="Selected"
                style={{
                  objectFit: "cover",
                  width: "100%",
                  height: "100%",
                  marginBottom: "40px",
                  borderRadius: "20px",
                }}
              />
            ) : (
              <div
                className="image-placeholder-container"
                onClick={() => handleUploadClick(planImageFileInputRef)}
                style={{ cursor: "pointer" }}
              >
                <div
                  style={{
                    padding: "10px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <NoImage />
                  <div className="image-placeholder">Upload a plan</div>
                </div>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/png, image/jpeg, image/gif, image/webp"
            ref={planImageFileInputRef}
            style={{ display: "none" }}
            onChange={(event) => onFileUpload(event, setInitPlanImage, setPlanImagePreview)}
          />
          <div style={dialogActionsVertButtonsStyles}>
            <ButtonMUI
              variant="contained"
              fullWidth
              onClick={
                !initPlanImage
                  ? () => handleUploadClick(planImageFileInputRef)
                  : handlePlanImageContinue
              }
              sx={{
                ...gradientButtonStyles,
                opacity: isContinueBtnDisabled ? "0.5" : "1",
                cursor: isContinueBtnDisabled ? "default" : "pointer",
                "&:hover": {
                  backgroundImage: !isContinueBtnDisabled && "var(--gradientButtonHover)",
                },
              }}
              // className="confirm-button"
              disabled={isContinueBtnDisabled}
            >
              {(() => {
                if (!initPlanImage) {
                  if (planImage) return "Change Plan";
                  else return "Add Plan";
                } else return "Continue";
              })()}
            </ButtonMUI>
            {initPlanImage && (
              <ButtonMUI
                variant="contained"
                fullWidth
                onClick={() => handleUploadClick(planImageFileInputRef)}
                sx={gradientButtonStyles}
                // className="confirm-button"
              >
                Reupload Image
              </ButtonMUI>
            )}
            <ButtonMUI
              variant="contained"
              fullWidth
              onClick={handleStyleRefModalClose}
              // className="cancel-button"
              sx={outlinedButtonStyles}
              onMouseOver={(e) =>
                (e.target.style.backgroundImage =
                  "var(--lightGradient), var(--gradientButtonHover)")
              }
              onMouseOut={(e) =>
                (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
              }
            >
              Cancel
            </ButtonMUI>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PlanMap;

export {
  isManagerProject,
  isManagerContentManagerProject,
  isManagerContentManagerContributorProject,
  isCollaboratorProject,
};
