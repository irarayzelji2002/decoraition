import React, { useState, useRef, useEffect } from "react";
import "../css/homepage.css";
import HomepageOptions from "../pages/Homepage/HomepageOptions";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useSharedProps } from "../contexts/SharedPropsContext";
import TrashOptions from "../pages/Trash/TrashOptions";

function ProjectOptionsHome({
  id,
  name,
  onOpen = () => {},
  managers = "",
  createdAt = "",
  modifiedAt = "",
  deletedAt = "",
  optionsState = {},
  project = {},
  setOptionsState = () => {},
  isTrash = false,
}) {
  const {
    designs,
    userDesigns,
    designVersions,
    userDesignVersions,
    deletedDesigns,
    userDeletedDesigns,
    userProjects,
    projects,
    userDeletedProjects,
    deletedProjects,
  } = useSharedProps();
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
    console.log(project.id);
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

  const getProjectImage = (projectId) => {
    // Get the project
    const fetchedProject =
      userProjects.find((project) => project.id === projectId) ||
      projects.find((project) => project.id === projectId);
    if (!fetchedProject || fetchedProject.designs.length === 0) {
      return "";
    }

    // Get all designs for this project
    const projectDesigns = designs.filter((design) => fetchedProject.designs.includes(design.id));

    // Sort designs by modifiedAt timestamp (most recent first)
    const sortedDesigns = projectDesigns.sort(
      (a, b) => (b.modifiedAt?.toMillis() || 0) - (a.modifiedAt?.toMillis() || 0)
    );

    // Get the latest designId (the first one after sorting)
    const latestDesignId = sortedDesigns[0]?.id;

    // Return the design image by calling getDesignImage
    return getDesignImage(latestDesignId);
  };

  const getTrashDesignImage = (designId) => {
    if (!designId) {
      console.log("No design ID provided");
      return "";
    }

    // Get the design
    const fetchedDeletedDesign =
      userDeletedDesigns.find((design) => design.id === designId) ||
      deletedDesigns.find((design) => design.id === designId) ||
      userDesigns.find((design) => design.id === designId) ||
      designs.find((design) => design.id === designId);
    if (
      !fetchedDeletedDesign ||
      !fetchedDeletedDesign.history ||
      fetchedDeletedDesign.history.length === 0
    ) {
      return "";
    }

    // Get the latest designVersionId
    const latestDesignVersionId =
      fetchedDeletedDesign.history[fetchedDeletedDesign.history.length - 1];
    if (!latestDesignVersionId) {
      return "";
    }
    const fetchedLatestDesignVersion = designVersions.find(
      (designVer) => designVer.id === latestDesignVersionId
    );
    if (!fetchedLatestDesignVersion?.images?.length) {
      return "";
    }

    // Return the first image's link from the fetched design version
    return fetchedLatestDesignVersion.images[0].link || "";
  };

  const getTrashProjectImage = (projectId) => {
    // Get the project
    const fetchedDeletedProject =
      userDeletedProjects.find((project) => project.id === projectId) ||
      deletedProjects.find((project) => project.id === projectId);
    if (!fetchedDeletedProject || fetchedDeletedProject.designs.length === 0) {
      return "";
    }

    // Get all designs for this project from both designs and deletedDesigns arrays
    const projectDesigns = [...designs, ...deletedDesigns].filter((design) =>
      fetchedDeletedProject.designs.includes(design.id)
    );

    // Sort designs by modifiedAt timestamp (most recent first)
    const sortedDesigns = projectDesigns.sort(
      (a, b) => (b.modifiedAt?.toMillis() || 0) - (a.modifiedAt?.toMillis() || 0)
    );

    // Get the latest designId (the first one after sorting)
    const latestDesignId = sortedDesigns[0]?.id;

    // Return the design image by calling getDesignImage
    return getTrashDesignImage(latestDesignId);
  };

  return (
    <div className="iconFrame">
      {!isTrash ? (
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
      ) : (
        <TrashOptions
          isDesign={false}
          id={id}
          object={project}
          isTable={false}
          optionsState={optionsState}
          setOptionsState={setOptionsState}
          clickedId={clickedId}
          setClickedId={setClickedId}
          toggleOptions={toggleOptions}
        />
      )}
      {/* Project image */}
      <div
        className="homepage-thumbnail"
        style={{ cursor: !isTrash ? "pointer" : "default" }}
        onClick={onOpen}
      >
        <img
          src={!isTrash ? getProjectImage(project.id) : getTrashProjectImage(project.id)}
          className="pic"
          alt=""
          style={{
            objectFit: "cover",
            objectPosition: "center",
            cursor: !isTrash ? "pointer" : "default",
          }}
        />
      </div>

      {/* Project title */}
      <div style={{ textAlign: "start", padding: "0px 3px", width: "100%" }}>
        <h3
          className="titleDesign"
          style={{ cursor: !isTrash ? "pointer" : "default" }}
          onClick={onOpen}
        >
          {name}
        </h3>
        <span className="dateModified">
          {!isTrash ? `Modified ${modifiedAt}` : `Deleted ${deletedAt}`}
        </span>
      </div>
    </div>
  );
}

export default ProjectOptionsHome;
