import React, { useState, useEffect } from "react";
import { HelpOutline as HelpOutlineIcon } from "@mui/icons-material";

const HelpTooltip = ({ message }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClickOutside = (event) => {
    if (!event.target.closest(".helpTooltip")) {
      setShowTooltip(false);
    }
  };

  useEffect(() => {
    if (showTooltip) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTooltip]);

  return (
    <div
      className="helpTooltip"
      style={{ display: "inline-block", position: "relative" }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => !showTooltip && setShowTooltip(false)}
    >
      <HelpOutlineIcon
        onClick={() => setShowTooltip(!showTooltip)}
        sx={{ marginLeft: "8px", cursor: "pointer", color: "var(--color-white)" }}
      />
      {showTooltip && (
        <div
          style={{
            position: "absolute",
            backgroundColor: "var(--nav-card-modal)",
            color: "var(--color-white)",
            width: "200px",
            padding: "10px",
            borderRadius: "5px",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            marginTop: "5px",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default HelpTooltip;
