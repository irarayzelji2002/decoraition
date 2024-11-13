import React, { useState, useRef, useEffect } from "react";
import "../css/homepage.css";
import HomepageOptions from "../pages/Homepage/HomepageOptions";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";

function ProjectOptionsHome({
  id,
  name,
  onOpen,
  managers = "",
  createdAt = "",
  modifiedAt = "",
  optionsState = {},
  project = {},
  setOptionsState = () => {},
}) {
  const [clickedId, setClickedId] = useState("");

  const toggleOptions = (id) => {
    setOptionsState((prev) => {
      if (prev.selectedId === id) {
        // If the same ID is clicked, close the options menu
        return { showOptions: false, selectedId: null };
      } else {
        // Open options for the new ID
        return { showOptions: true, selectedId: id };
      }
    });
  };

  useEffect(() => {
    toggleOptions(clickedId);
  }, [clickedId]);

  return (
    <div className="iconFrame">
      <HomepageOptions
        isDesign={false}
        id={id}
        onOpen={onOpen}
        optionsState={optionsState}
        setOptionsState={setOptionsState}
        clickedId={clickedId}
        setClickedId={setClickedId}
        toggleOptions={toggleOptions}
        object={project}
      />
      {/* Design image */}
      <div className="homepage-thumbnail" onClick={onOpen}>
        <img
          src={"/img/Room1.png"}
          className="pic"
          alt="Design"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      </div>

      {/* Design title */}
      <div style={{ textAlign: "start", padding: "0px 3px", width: "100%" }}>
        <h3 className="titleDesign" onClick={onOpen}>
          {name}
        </h3>
        <span className="dateModified">{`Modified ${modifiedAt}`}</span>
      </div>
    </div>
  );
}

export default ProjectOptionsHome;
