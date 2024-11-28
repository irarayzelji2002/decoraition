import React, { useState, useRef, useEffect } from "react";
import "../css/homepage.css";
import HomepageOptions from "../pages/Homepage/HomepageOptions";
import { useSharedProps } from "../contexts/SharedPropsContext";
import { IconButton } from "@mui/material";
import { CloseRounded as CloseRoundedIcon } from "@mui/icons-material";
import { iconButtonStyles } from "../pages/Homepage/DrawerComponent";

function DesignIcon({
  id,
  name,
  onOpen,
  projectType = false,
  modifiedAt = "",
  optionsState = {},
  design = {},
  setOptionsState = () => {},
  isProjectSpace = false,
  openConfirmRemove = () => {},
  isManagerContentManager = false,
}) {
  const { designs, userDesigns, designVersions, userDesignVersions, projects, userProjects } =
    useSharedProps();
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

  const getDesignImage = (designId) => {
    if (!designId) {
      console.log("No design ID provided");
      return "";
    }

    // Get the design
    const fetchedDesign =
      userDesigns.find((design) => design.id === designId) ||
      designs.find((design) => design.id === designId);
    if (!fetchedDesign || !fetchedDesign.history || fetchedDesign.history.length === 0) {
      return "";
    }

    // Get the latest designVersionId
    const latestDesignVersionId = fetchedDesign.history[fetchedDesign.history.length - 1];
    if (!latestDesignVersionId) {
      return "";
    }
    const fetchedLatestDesignVersion =
      userDesignVersions.find((designVer) => designVer.id === latestDesignVersionId) ||
      designVersions.find((designVer) => designVer.id === latestDesignVersionId);
    if (!fetchedLatestDesignVersion?.images?.length) {
      return "";
    }

    // Return the first image's link from the fetched design version
    return fetchedLatestDesignVersion.images[0].link || "";
  };

  return (
    <div className={projectType ? "iconFrameAlt" : "iconFrame"}>
      <HomepageOptions
        isDesign={true}
        id={id}
        onOpen={onOpen}
        optionsState={optionsState}
        setOptionsState={setOptionsState}
        clickedId={clickedId}
        setClickedId={setClickedId}
        toggleOptions={toggleOptions}
        object={design}
      />
      {isProjectSpace && isManagerContentManager && (
        <div
          className="options"
          style={{ right: "54px", width: "35px", height: "35px" }}
          data-options
        >
          <div className="selectOption" style={{ position: "absolute" }}>
            <IconButton
              sx={{
                ...iconButtonStyles,
                color: "var(--color-white)",
                padding: "5.5px",
                "&:hover": {
                  backgroundColor: "var(--nav-card-modal) !important",
                },
                "& .MuiTouchRipple-root span": {
                  backgroundColor: "var(--nav-card-modal) !important",
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                openConfirmRemove(id);
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </div>
        </div>
      )}
      {/* Design image */}
      <div className="homepage-thumbnail" onClick={onOpen}>
        <img
          src={getDesignImage(design.id)}
          className="pic"
          alt=""
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

export default DesignIcon;
