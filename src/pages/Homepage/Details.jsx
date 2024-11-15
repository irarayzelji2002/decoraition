import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import deepEqual from "deep-equal";
import TopBar from "../../components/TopBar";
import "../../css/details.css";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { getUsername, getUsernames, formatDateDetail } from "./backend/HomepageActions";
import { capitalizeFieldName } from "../../functions/utils";
import Button from "@mui/material/Button";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        text: {
          color: "var(--color-white)",
          position: "relative",
          textTransform: "none",
          width: "100%",
          fontFamily: '"Inter", sans-serif !important',
          fontSize: "1rem",
          fontWeight: 400,
          borderTop: "1px solid var(--table-stroke)",
          borderBottom: "1px solid var(--table-stroke)",
          padding: "20px",
          borderRadius: 0,
          "&:hover": {
            color: "var(--color-white)",
            backgroundColor: "rgba(255, 255, 255, 0.1)", // lighter hover background
          },
          "&:focus-visible": {
            outline: "none",
            backgroundColor: "rgba(255, 255, 255, 0.1)", // same color for focus
          },
          "& .MuiTouchRipple-root": {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
    },
  },
});

function Details() {
  const location = useLocation();
  const navigateTo = location.state?.navigateFrom || "/";
  const navigateFrom = location.pathname;

  const { id, type } = useParams();
  const { user, userDoc, designs, userDesigns, projects, userProjects } = useSharedProps();
  const [loading, setLoading] = useState(true);
  const [design, setDesign] = useState({});
  const [designId, setDesignId] = useState("");
  const [project, setProject] = useState({});
  const [projectId, setProjectId] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [managerNames, setManagerNames] = useState("");
  const [createdAtDisplay, setCreatedAtDisplay] = useState("");
  const [modifiedAtDisplay, setModifiedAtDisplay] = useState("");

  useEffect(() => {
    if (type === "design" && id && userDesigns.length > 0) {
      const designId = id;
      setDesignId(designId);
      setLoading(true);
      const fetchedDesign = userDesigns.find((design) => design.id === designId);

      if (!fetchedDesign) {
        console.error("Design not found.");
      } else {
        setDesign(fetchedDesign);
        getUsername(fetchedDesign.owner).then((username) => setOwnerName(username));
        console.log("fetchedDesign", fetchedDesign);
        setCreatedAtDisplay(formatDateDetail(fetchedDesign.createdAt));
        setModifiedAtDisplay(formatDateDetail(fetchedDesign.modifiedAt));
      }
      setLoading(false);
    } else if (type === "project" && id && userProjects.length > 0) {
      const projectId = id;
      setProjectId(projectId);
      setLoading(true);
      const fetchedProject = userDesigns.find((project) => project.id === projectId);

      if (!fetchedProject) {
        console.error("Project not found.");
      } else {
        setProject(fetchedProject);
        getUsernames(fetchedProject.managers).then((usernames) => setManagerNames(usernames));
        console.log("fetchedProject", fetchedProject);
        setCreatedAtDisplay(formatDateDetail(fetchedProject.createdAt));
        setModifiedAtDisplay(formatDateDetail(fetchedProject.modifiedAt));
      }
      setLoading(false);
    } else {
      console.log("Type:", type);
      console.log("ID:", id);
    }
  }, []);

  useEffect(() => {
    if (type === "design" && designId && userDesigns.length > 0) {
      const fetchedDesign = userDesigns.find((design) => design.id === designId);

      if (!fetchedDesign) {
        console.error("Design not found.");
      } else if (!deepEqual(design, fetchedDesign)) {
        setDesign(fetchedDesign);
        getUsername(fetchedDesign.owner).then((username) => setOwnerName(username));
        console.log("fetchedDesign", fetchedDesign);
        setCreatedAtDisplay(formatDateDetail(fetchedDesign.createdAt));
        setModifiedAtDisplay(formatDateDetail(fetchedDesign.modifiedAt));
      }
    }
  }, [designId, userDesigns]);

  useEffect(() => {
    if (type === "project" && projectId && userProjects.length > 0) {
      const fetchedProject = userProjects.find((project) => project.id === projectId);

      if (!fetchedProject) {
        console.error("Project not found.");
      } else if (!deepEqual(project, fetchedProject)) {
        setProject(fetchedProject);
        getUsernames(fetchedProject.managers).then((usernames) => setManagerNames(usernames));
        console.log("fetchedProject", fetchedProject);
        setCreatedAtDisplay(formatDateDetail(fetchedProject.createdAt));
        setModifiedAtDisplay(formatDateDetail(fetchedProject.modifiedAt));
      }
    }
  }, [projectId, userProjects]);

  return (
    <ThemeProvider theme={theme}>
      <div style={{ overflowX: "hidden" }}>
        <TopBar state="Details" navigateTo={navigateTo} navigateFrom={navigateFrom} />
        <div className="details-container">
          <div className="content">
            {type === "design" && id && design.designName ? (
              <>
                <div className="room-image-div">
                  <img className="room-image" src="../../img/logoWhitebg.png" alt="Room 1803" />
                </div>
                <div className="room-info">
                  <h1>{design.designName}</h1>
                  <p className="category">Type</p>
                  <p>Design</p>
                  <p className="category">Created</p>
                  <p>{createdAtDisplay}</p>
                  <p className="category">Modified</p>
                  <p>{modifiedAtDisplay}</p>
                  <p className="category">Owner</p>
                  <p>{ownerName}</p>
                </div>
              </>
            ) : type === "project" && id && project.projectName ? (
              <>
                <div className="room-image-div">
                  <img className="room-image" src="../../img/logoWhitebg.png" alt="Room 1803" />
                </div>
                <div className="room-info">
                  <h1>{project.projectName}</h1>
                  <p className="category">Type</p>
                  <p>Project</p>
                  <p className="category">Created</p>
                  <p>{createdAtDisplay}</p>
                  <p className="category">Modified</p>
                  <p>{modifiedAtDisplay}</p>
                  <p className="category">Managers</p>
                  <p>
                    {managerNames.slice(0, 3).join(", ")}
                    {managerNames.length > 3 ? ", and more" : ""}
                  </p>
                </div>
              </>
            ) : (
              <div>{capitalizeFieldName(type)} details not found</div>
            )}
          </div>
        </div>
        {type === "design" && id && design.designName ? (
          <Button variant="text">
            <div className="content">
              <div style={{ width: "100%", maxWidth: "768px", margin: "0 auto" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  Who has access{" "}
                  <ChevronRightRoundedIcon
                    sx={{
                      color: "var(--color-white)",
                      fontSize: "2rem",
                    }}
                  />
                </div>
              </div>
            </div>
          </Button>
        ) : type === "project" && id && project.projectName ? (
          <Button variant="text">
            Who has access{" "}
            <div className="content">
              <div style={{ width: "100%", maxWidth: "768px", margin: "0 auto" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  Who has access{" "}
                  <ChevronRightRoundedIcon
                    sx={{
                      color: "var(--color-white)",
                      fontSize: "2rem",
                    }}
                  />
                </div>
              </div>
            </div>
          </Button>
        ) : (
          <></>
        )}
        <div></div>
      </div>
    </ThemeProvider>
  );
}

export default Details;
