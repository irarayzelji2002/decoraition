import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { fetchPins, deleteProjectPin } from "./backend/ProjectDetails";
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

function PlanMap() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateFrom = location.pathname;
  const { projectId } = useParams();
  const [pins, setPins] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [styleRefModalOpen, setStyleRefModalOpen] = useState(false);
  const [styleRefPreview, setStyleRefPreview] = useState(null);
  const [initStyleRef, setInitStyleRef] = useState(null);
  const styleRefFileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchPins(projectId, setPins);
      } else {
        setUser(null);
        setPins([]);
      }
    });
    return () => unsubscribeAuth();
  });

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
      state: { navigateFrom: navigateFrom },
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
      console.log("Deleting pin lol", pinId);
      setPins((prevPins) => prevPins.filter((pin) => pin.id !== pinId));
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

  return (
    <>
      <ProjectHead />
      {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}
      <div className="sectionBudget" style={{ background: "none" }}>
        <div className="budgetSpaceImg" style={{ background: "none", height: "100%" }}>
          <ImageFrame
            src="../../img/floorplan.png"
            alt="design preview"
            pins={pins}
            projectId={projectId}
            setPins={setPins}
            draggable={false} // Ensure this line is present
          />
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
                      deletePin={() => deletePin(design.id)} // Pass design.id to deletePin
                    />
                  </>
                );
              })
          ) : (
            <div className="no-content" style={{ height: "80vh" }}>
              <img src="/img/design-placeholder.png" alt="No designs yet" />
              <p>No designs yet. Start creating.</p>
            </div>
          )}
          <div className="bottom-filler" />
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="circle-button-container">
        {menuOpen && (
          <div className="small-buttons">
            <div className="small-button-container" onClick={handleStyleRefModalOpen}>
              <span className="small-button-text">Change plan</span>
              <div className="small-circle-button">
                <ChangePlan />
              </div>
            </div>
            <div className="small-button-container" onClick={navigateToPinLayout}>
              <span className="small-button-text">Change pins order</span>
              <div className="small-circle-button">
                <ChangeOrder />
              </div>
            </div>
            <div className="small-button-container" onClick={navigateToAdjustPin}>
              <span className="small-button-text">Adjust Pins</span>
              <div className="small-circle-button">
                <AdjustPin />
              </div>
            </div>
            <div className="small-button-container" onClick={navigateToAddPin}>
              <span className="small-button-text">Add a Pin</span>
              <div className="small-circle-button">
                <AddPin />
              </div>
            </div>
          </div>
        )}
        <div className={`circle-button ${menuOpen ? "rotate" : ""}`} onClick={toggleMenu}>
          {menuOpen ? <AddIcon /> : <AddIcon />}
        </div>
      </div>
      <BottomBarDesign PlanMap={true} projId={projectId} />

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
              handleDrop(e, setInitStyleRef, setStyleRefPreview);
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
                onClick={() => handleUploadClick(styleRefFileInputRef)}
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
                  <div className="image-placeholder">Upload an style reference</div>
                </div>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/png, image/jpeg, image/gif, image/webp"
            ref={styleRefFileInputRef}
            style={{ display: "none" }}
            onChange={(event) => onFileUpload(event, setInitStyleRef, setStyleRefPreview)}
          />
          <div style={dialogActionsVertButtonsStyles}>
            <ButtonMUI
              variant="contained"
              fullWidth
              onClick={
                !initStyleRef
                  ? () => handleUploadClick(styleRefFileInputRef)
                  : handleStyleRefContinue
              }
              className="confirm-button"
            >
              {!initStyleRef ? "Add Plan" : "Continue"}
            </ButtonMUI>
            {initStyleRef && (
              <ButtonMUI
                variant="contained"
                fullWidth
                onClick={() => handleUploadClick(styleRefFileInputRef)}
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
