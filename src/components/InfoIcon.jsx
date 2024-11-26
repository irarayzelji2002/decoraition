import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Button from "@mui/material/Button";
import "../css/infoIcon.css";

const InfoIcon = ({ infoText }) => {
  const [infoOpen, setInfoOpen] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  const toggleInfo = () => {
    if (infoOpen) {
      setFadeOut(true);
      setTimeout(() => {
        setInfoOpen(false);
        setFadeOut(false);
      }, 500);
    } else {
      setInfoOpen(true);
      setFadeIn(true);
      setTimeout(() => {
        setFadeIn(false);
        setFadeOut(true);
        setTimeout(() => {
          setInfoOpen(false);
          setFadeOut(false);
        }, 500);
      }, 6000);
    }
  };

  return (
    <div className="info-icon-container">
      <IconButton onClick={toggleInfo} className="info-icon" sx={{ marginLeft: "10px" }}>
        <HelpOutlineIcon sx={{ color: "var(--color-grey)" }} />
      </IconButton>
      {infoOpen && (
        <div className={`info-window ${fadeIn ? "fade-in" : ""} ${fadeOut ? "fade-out" : ""}`}>
          <p>{infoText}</p>
          <button className="cancel-button" onClick={toggleInfo}>
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default InfoIcon;
