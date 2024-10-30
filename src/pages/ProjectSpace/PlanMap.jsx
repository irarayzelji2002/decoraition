import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { fetchDesigns } from "./backend/ProjectDetails";

import ProjectHead from "./ProjectHead";
import MapPin from "./MapPin";
import BottomBarDesign from "./BottomBarProject";
import { useParams } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import "../../css/project.css";
import "../../css/seeAll.css";
import "../../css/budget.css";
import { ToastContainer } from "react-toastify";
import { AddPin, AdjustPin, ChangeOrder, ChangePlan } from "../DesignSpace/svg/AddImage";

function PlanMap() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [designs, setDesigns] = useState([]);
  const [user, setUser] = useState(null);
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (user) {
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchDesigns(currentUser.uid, projectId, setDesigns);
      } else {
        setUser(null);
        setDesigns([]);
      }
    });
    return () => unsubscribeAuth();
  }, [user]);
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const fetchProjectDetails = async () => {
          try {
            const projectRef = doc(db, "projects", projectId);
            const projectSnapshot = await getDoc(projectRef);
            if (projectSnapshot.exists()) {
              // Listen for real-time updates to the project document
              const unsubscribeProject = onSnapshot(projectRef, (doc) => {
                if (doc.exists()) {
                  const updatedProject = doc.data();
                }
              });
              // Cleanup listener on component unmount
              return () => unsubscribeProject();
            } else {
              console.error("Project not found");
            }
          } catch (error) {
            console.error("Error fetching project details:", error);
          }
        };
        fetchProjectDetails();
      } else {
        console.error("User is not authenticated");
      }
    });
    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [projectId]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const navigateToAddPin = () => {
    navigate("/addPin" + projectId);
  };
  const navigateToPinLayout = () => {
    navigate("/pinOrder/" + projectId);
  };

  return (
    <>
      <ProjectHead />
      {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}
      <div className="sectionBudget" style={{ background: "none" }}>
        <div className="budgetSpaceImg">
          <div className="image-frame">
            <img
              src="../../img/logoWhitebg.png"
              alt={`design preview `}
              className="image-preview"
            />
          </div>
        </div>
        <div className="budgetSpaceImg">
          {designs.length > 0 ? (
            designs.map((design) => {
              return <MapPin title={design.name} />;
            })
          ) : (
            <div className="no-content" style={{ height: "80vh" }}>
              <img src="/img/design-placeholder.png" alt="No designs yet" />
              <p>No designs yet. Start creating.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="circle-button-container">
        {menuOpen && (
          <div className="small-buttons">
            <div className="small-button-container">
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
            <div className="small-button-container">
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
          {menuOpen ? <CloseIcon /> : <AddIcon />}
        </div>
      </div>
      <BottomBarDesign PlanMap={true} projId={projectId} />
    </>
  );
}

export default PlanMap;
