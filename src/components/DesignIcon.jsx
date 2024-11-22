import React, { useState, useRef, useEffect } from "react";
import "../css/homepage.css";
import HomepageOptions from "../pages/Homepage/HomepageOptions";
import { useSharedProps } from "../contexts/SharedPropsContext";

function DesignIcon({
  id,
  name,
  onOpen,
  projectType = false,
  modifiedAt = "",
  optionsState = {},
  design = {},
  setOptionsState = () => {},
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
    // Get the design
    const fetchedDesign =
      userDesigns.find((design) => design.id === designId) ||
      designs.find((design) => design.id === designId);
    if (!fetchedDesign || !fetchedDesign.history || fetchedDesign.history.length === 0) {
      return "";
    }

    // Get the latest designVersionId
    const latestDesignVersionId = fetchedDesign.history[fetchedDesign.history.length - 1];
    const fetchedLatestDesignVersion =
      userDesignVersions.find((designVer) => designVer.id === latestDesignVersionId) ||
      designVersions.find((designVer) => designVer.id === latestDesignVersionId);
    if (
      !fetchedLatestDesignVersion ||
      !fetchedLatestDesignVersion.images ||
      fetchedLatestDesignVersion.images.length === 0
    ) {
      return "";
    }

    // Return the first image's link from the fetched design version
    return fetchedLatestDesignVersion.images[0].link;
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
