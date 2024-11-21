// CircleButtonContainer.js
import React, { useState } from "react";
import { AddIcon } from "./svg/DefaultMenuIcons";
import FolderIcon from "@mui/icons-material/Folder";
import ImageIcon from "@mui/icons-material/Image";
import "../css/homepage.css"; // Ensure this path is correct

const CircleButtonContainer = ({ onCreateProject, onCreateDesign }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="circle-button-container">
      {menuOpen && (
        <div className="small-buttons">
          <div className="small-button-container">
            <span className="small-button-text">Create a Project</span>
            <div className="small-circle-button" onClick={onCreateProject}>
              <FolderIcon className="icon" />
            </div>
          </div>
          <div className="small-button-container">
            <span className="small-button-text">Create a Design</span>
            <div className="small-circle-button" onClick={onCreateDesign}>
              <ImageIcon className="icon" />
            </div>
          </div>
        </div>
      )}
      <div className={`circle-button ${menuOpen ? "rotate" : ""}`} onClick={toggleMenu}>
        {menuOpen ? <AddIcon /> : <AddIcon />}
      </div>
    </div>
  );
};

export default CircleButtonContainer;
