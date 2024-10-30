import React from "react";
import "../css/generateimg.css";

function GenerateImgLoadingPage({ position }) {
  return (
    <div className="loading-container">
      <div className="loading-background">
        <h1 className="loading-title">Hang in there!</h1>
        <p className="loading-subtitle">We’ll be with you shortly...</p>
        <p className="loading-status">
          You’re currently number <span className="position">{position}</span>
          {"1 "}
          in line.
        </p>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: "60%" }}>
            60%
          </div>
        </div>
      </div>
    </div>
  );
}

export default GenerateImgLoadingPage;
