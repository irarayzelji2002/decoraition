import React, { useState } from "react";
import ProjectHead from "./ProjectHead";
import MapPin from "./MapPin";
import BottomBarDesign from "./BottomBarProject";
import { useParams } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import TuneIcon from "@mui/icons-material/Tune";
import PushPinIcon from "@mui/icons-material/PushPin";
import "../../css/project.css";
import "../../css/seeAll.css";
import "../../css/budget.css";
import { ToastContainer } from "react-toastify";

function PlanMap({ ...sharedProps }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { projectId } = useParams();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="app-container">
      <ToastContainer />
      <ProjectHead />
      {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div className="budgetSpace">
          <div className="image-frame">
            <img
              src="../../img/logoWhitebg.png"
              alt={`design preview `}
              className="image-preview"
            />
          </div>
        </div>
        <div className="budgetSpace">
          <MapPin />
          <MapPin />
        </div>
      </div>
      <BottomBarDesign PlanMap={true} projId={projectId} />

      {/* Floating Action Button */}
      <div className="circle-button-container">
        {menuOpen && (
          <div className="small-buttons">
            <div className="small-button-container">
              <span className="small-button-text">Change plan</span>
              <div className="small-circle-button">
                <AssignmentOutlinedIcon className="icon" />
              </div>
            </div>
            <div className="small-button-container">
              <span className="small-button-text">Change pins order</span>
              <div className="small-circle-button">
                <SwapHorizIcon className="icon" />
              </div>
            </div>
            <div className="small-button-container">
              <span className="small-button-text">Adjust Pins</span>
              <div className="small-circle-button">
                <TuneIcon className="icon" />
              </div>
            </div>
            <div className="small-button-container">
              <span className="small-button-text">Add a Pin</span>
              <div className="small-circle-button">
                <PushPinIcon className="icon" />
              </div>
            </div>
          </div>
        )}
        <div className={`circle-button ${menuOpen ? "rotate" : ""}`} onClick={toggleMenu}>
          {menuOpen ? <CloseIcon /> : <AddIcon />}
        </div>
      </div>
    </div>
  );
}

export default PlanMap;