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
import { AddPin, AdjustPin, ChangeOrder, ChangePlan } from "../DesignSpace/svg/AddImage";
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

function PlanMap() {
  const { projectId } = useParams();
  const { userDoc, isDarkMode, projects, userProjects } = useSharedProps();
  const navigate = useNavigate();
  const location = useLocation();
  const navigateFrom = location.pathname;
  const [changeMode, setChangeMode] = useState(location?.state?.changeMode || "");
  const [project, setProject] = useState({});
  const [pins, setPins] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [styleRefModalOpen, setStyleRefModalOpen] = useState(false);
  const [styleRefPreview, setStyleRefPreview] = useState(null);
  const [initStyleRef, setInitStyleRef] = useState(null);
  const styleRefFileInputRef = useRef(null);
  const [planImage, setPlanImage] = useState("../../img/floorplan.png");
  const [initPlanImage, setInitPlanImage] = useState(null);
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
    if (projectId && userProjects.length > 0) {
      const fetchedProject =
        userProjects.find((d) => d.id === projectId) || projects.find((d) => d.id === projectId);

      if (!fetchedProject) {
        console.error("Project not found.");
      } else if (Object.keys(project).length === 0 || !deepEqual(project, fetchedProject)) {
        setProject(fetchedProject);
        console.log("current project:", fetchedProject);
      }
    }
    setLoadingProject(false);
  }, [projectId, projects, userProjects]);

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
    if (!changeMode) {
      if (isManager) setChangeMode("Managing");
      else if (isManagerContentManager) setChangeMode("Managing Content");
      else if (isManagerContentManagerContributor) setChangeMode("Contributing");
      else if (isCollaborator) setChangeMode("Viewing");
    }
    console.log(
      `commentCont - isManager: ${isManager}, isManagerContentManager: ${isManagerContentManager}, isManagerContentManagerContributor: ${isManagerContentManagerContributor}, isCollaborator: ${isCollaborator}`
    );
  }, [
    isManager,
    isManagerContentManager,
    isManagerContentManagerContributor,
    isCollaborator,
    changeMode,
  ]);

  useEffect(() => {
    if (user) {
      fetchPlanImage(projectId, setPlanImage);
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchPins(projectId, setPins);
        fetchPlanImage(projectId, setPlanImage).finally(() => setLoadingImage(false));
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

  const handleStyleRefModalOpen = () => {
    setStyleRefModalOpen(true);
  };

  const handleStyleRefModalClose = () => {
    setStyleRefModalOpen(false);
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

  const handleDrop = (e, setInitStyleRef, setStyleRefPreview) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setInitStyleRef(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setStyleRefPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const deletePin = async (pinId) => {
    try {
      await deleteProjectPin(projectId, pinId);
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

  const onFileUpload = (event, setInitStyleRef, setStyleRefPreview) => {
    const file = event.target.files[0];
    if (file) {
      setInitStyleRef(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setStyleRefPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStyleRefContinue = () => {
    // Handle the continue action
  };

  const handlePlanImageContinue = () => {
    if (initPlanImage) {
      handlePlanImageUpload(initPlanImage, projectId, setPlanImage);
      setInitPlanImage(null);
    }
    setStyleRefModalOpen(false);
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
        <div className="sectionBudget" style={{ background: "none", maxWidth: "100%" }}>
          <div className="budgetSpaceImg" style={{ background: "none", height: "100%" }}>
            {planImage ? (
              <ImageFrame
                src={planImage}
                alt="design preview"
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
          <div className="budgetSpaceImg">
            {pins.length > 0 ? (
              pins
                .sort((a, b) => a.order - b.order) // Sort pins by design.order
                .map((design) => {
                  return (
                    <>
                      <MapPin
                        title={design.designName}
                        pinColor={design.color}
                        pinNo={design.order}
                        pinId={design.id}
                        designId={design.designId}
                        deletePin={() => deletePin(design.id)} // Pass design.id to deletePin
                        editPin={() => navigateToEditPin(design.id)} // Pass design.id to editPin
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
                <p>No designs yet. Start creating.</p>
              </div>
            )}
            <div className="bottom-filler" />
          </div>
        </div>

        {/* Floating Action Button */}
        <div className="circle-button-container">
          {menuOpen && (
            <div className="small-buttons" style={{ cursor: "pointer" }}>
              <div className="small-button-container" onClick={handleStyleRefModalOpen}>
                <span className="small-button-text">Change plan</span>
                <div className="small-circle-button">
                  <ChangePlan />
                </div>
              </div>
              <div
                className="small-button-container"
                onClick={planImage ? navigateToPinLayout : null}
              >
                <span className="small-button-text">Change pins order</span>
                <div className="small-circle-button">
                  <ChangeOrder />
                </div>
              </div>
              <div
                className="small-button-container"
                onClick={planImage ? navigateToAdjustPin : null}
              >
                <span className="small-button-text">Adjust Pins</span>
                <div className="small-circle-button">
                  <AdjustPin />
                </div>
              </div>
              <div className="small-button-container" onClick={planImage ? navigateToAddPin : null}>
                <span className="small-button-text">Add a Pin</span>
                <div className="small-circle-button">
                  <AddPin />
                </div>
              </div>
            </div>
          )}
          <div className={`circle-button ${menuOpen ? "rotate" : ""} add`} onClick={toggleMenu}>
            {menuOpen ? <AddIcon /> : <AddIcon />}
          </div>
        </div>
      </ProjectSpace>

      {/* Change Plan Modal */}
      <Dialog open={styleRefModalOpen} onClose={handleStyleRefModalClose} sx={dialogStyles}>
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
            Add a venue or floor plan
          </TypographyMUI>
          <IconButtonMUI
            onClick={handleStyleRefModalClose}
            sx={{
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
              handleDrop(e, setInitPlanImage, setStyleRefPreview);
            }}
          >
            {styleRefPreview ? (
              <img
                src={styleRefPreview}
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
                  <div className="image-placeholder">Upload a map layout</div>
                </div>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/png, image/jpeg, image/gif, image/webp"
            ref={planImageFileInputRef}
            style={{ display: "none" }}
            onChange={(event) => onFileUpload(event, setInitPlanImage, setStyleRefPreview)}
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
              className="confirm-button"
            >
              {!initPlanImage ? "Add Plan" : "Continue"}
            </ButtonMUI>
            {initPlanImage && (
              <ButtonMUI
                variant="contained"
                fullWidth
                onClick={() => handleUploadClick(planImageFileInputRef)}
                className="confirm-button"
              >
                Reupload Image
              </ButtonMUI>
            )}
            <ButtonMUI
              variant="contained"
              fullWidth
              onClick={handleStyleRefModalClose}
              className="cancel-button"
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
