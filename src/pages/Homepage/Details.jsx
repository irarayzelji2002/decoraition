import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import deepEqual from "deep-equal";
import TopBar from "../../components/TopBar";
import "../../css/details.css";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { getUsername, getUsernames, formatDateDetail } from "./backend/HomepageActions";
import { capitalizeFieldName, showToast } from "../../functions/utils";
import Button from "@mui/material/Button";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import LoadingPage from "../../components/LoadingPage";
import ManageAcessModal from "../../components/ManageAccessModal";
import { getDesignImage, getProjectImage } from "../DesignSpace/backend/DesignActions";
import { isCollaboratorProject } from "../ProjectSpace/Project";
import { isDate } from "lodash";
import { isCollaboratorDesign } from "../DesignSpace/Design";

const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        text: {
          color: "var(--color-white)",
          backgroundColor: "var(--bgcolor)",
          textTransform: "none",
          width: "100%",
          fontFamily: '"Inter", sans-serif !important',
          fontSize: "1rem",
          fontWeight: 400,
          borderTop: "1px solid var(--table-stroke)",
          position: "absolute",
          bottom: "0",
          // borderBottom: "1px solid var(--table-stroke)",
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
  const navigate = useNavigate();

  const { id, type } = useParams();
  const {
    user,
    users,
    userDoc,
    designs,
    userDesigns,
    projects,
    userProjects,
    designVersions,
    userDesignVersions,
  } = useSharedProps();
  const [loading, setLoading] = useState(true);
  const [isViewCollabModalOpen, setIsViewCollabModalOpen] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [design, setDesign] = useState({});
  const [designId, setDesignId] = useState("");
  const [project, setProject] = useState({});
  const [projectId, setProjectId] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [managers, setManagers] = useState("");
  const [createdAtDisplay, setCreatedAtDisplay] = useState("");
  const [modifiedAtDisplay, setModifiedAtDisplay] = useState("");

  useEffect(() => {
    if (type === "design" && id && userDesigns.length > 0) {
      const designId = id;
      setDesignId(designId);
      setLoading(true);
      const fetchedDesign =
        userDesigns.find((design) => design.id === designId) ||
        designs.find((design) => design.id === designId);

      if (!fetchedDesign) {
        console.error("Design not found.");
      } else {
        // Check if user has access
        const hasAccess = isCollaboratorDesign(fetchedDesign, userDoc?.id);
        if (!hasAccess) {
          console.error("No access to design.");
          setLoading(false);
          showToast("error", "You don't have access to this design");
          navigate("/");
          return;
        }

        setDesign(fetchedDesign);
        setOwnerName(
          users.find((user) => user.id === fetchedDesign.owner || user.id === fetchedDesign.ownerId)
            ?.username
        );
        console.log("fetchedDesign", fetchedDesign);
        setCreatedAtDisplay(formatDateDetail(fetchedDesign.createdAt));
        setModifiedAtDisplay(formatDateDetail(fetchedDesign.modifiedAt));
      }
      setLoading(false);
    } else if (type === "project" && id && (userProjects.length > 0 || projects.length > 0)) {
      const projectId = id;
      setProjectId(projectId);
      setLoading(true);
      const fetchedProject =
        userProjects.find((project) => project.id === projectId) ||
        projects.find((project) => project.id === projectId);

      if (!fetchedProject) {
        console.error("Project not found.");
      } else {
        // Check if user has access
        const hasAccess = isCollaboratorProject(fetchedProject, userDoc?.id);
        if (!hasAccess) {
          console.error("No access to project.");
          setLoading(false);
          showToast("error", "You don't have access to this project");
          navigate("/");
          return;
        }

        setProject(fetchedProject);
        const projectManagers = (fetchedProject?.managers || []).map(
          (id) => users?.find((user) => user?.id === id)?.username || ""
        );
        setManagers(projectManagers);
        console.log("fetchedProject", fetchedProject);
        setCreatedAtDisplay(formatDateDetail(fetchedProject.createdAt));
        setModifiedAtDisplay(formatDateDetail(fetchedProject.modifiedAt));
      }
      setLoading(false);
    } else {
      console.log("Type:", type);
      console.log("ID:", id);
    }
  }, [designs, projects, userDesigns, userProjects, isCollaborator]);

  // Initialize access rights
  useEffect(() => {
    if (type === "design") {
      if (!project?.projectSettings || !userDoc?.id) return;
      // Check if user has any access
      const hasAccess = isCollaboratorProject(project, userDoc.id);
      if (!hasAccess) {
        showToast("error", "You don't have access to this project");
        navigate("/");
        return;
      }
      // If they have access, proceed with setting roles
      setIsCollaborator(isCollaboratorProject(project, userDoc.id));
    } else {
      if (!design?.designSettings || !userDoc?.id) return;
      // Check if user has any access
      const hasAccess = isCollaboratorDesign(project, userDoc.id);
      if (!hasAccess) {
        showToast("error", "You don't have access to this design");
        navigate("/");
        return;
      }
      // If they have access, proceed with setting roles
      setIsCollaborator(isCollaboratorDesign(project, userDoc.id));
    }
  }, [project, design, userDoc]);

  const handleOpenViewCollabModal = () => {
    setIsViewCollabModalOpen(true);
  };

  const handleCloseViewCollabModal = () => {
    setIsViewCollabModalOpen(false);
  };

  if (loading) {
    return <LoadingPage message={`Fetching ${type} details.`} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <div style={{ overflowX: "hidden" }}>
        <TopBar state="Details" navigateTo={navigateTo} navigateFrom={navigateFrom} />
        <div style={{ paddingTop: "74px" }}>
          <div className="details-container">
            <div className="content">
              {type === "design" && id && design.designName ? (
                <>
                  <div className="room-image-div">
                    <img
                      className="room-image"
                      src={
                        getDesignImage(
                          designId,
                          designs,
                          userDesigns,
                          designVersions,
                          userDesignVersions,
                          0
                        ) || "/img/transparent-image.png"
                      }
                      alt=""
                    />
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
                    <img
                      className="room-image"
                      src={
                        getProjectImage(
                          projectId,
                          userProjects,
                          projects,
                          designs,
                          userDesigns,
                          designVersions,
                          userDesignVersions,
                          0
                        ) || "/img/transparent-image.png"
                      }
                      alt=""
                    />
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
                      {managers?.slice(0, 3).join(", ")}
                      {managers?.length > 3 ? ", and more" : ""}
                    </p>
                  </div>
                </>
              ) : (
                <div>{capitalizeFieldName(type)} details not found</div>
              )}
            </div>
          </div>
          {type === "design" && id && design.designName ? (
            <Button variant="text" onClick={handleOpenViewCollabModal}>
              <div className="content">
                <div style={{ width: "100%", maxWidth: "768px", margin: "0 auto" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    Who has access{" "}
                    <KeyboardArrowRightRoundedIcon
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
            <Button variant="text" onClick={handleOpenViewCollabModal}>
              <div className="content">
                <div style={{ width: "100%", maxWidth: "768px", margin: "0 auto" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    Who has access{" "}
                    <KeyboardArrowRightRoundedIcon
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
        </div>
      </div>
      <ManageAcessModal
        isOpen={isViewCollabModalOpen}
        onClose={handleCloseViewCollabModal}
        handleAccessChange={() => {}}
        isDesign={type === "design" ? true : false}
        object={type === "design" ? design : project}
        isViewCollab={true}
      />
    </ThemeProvider>
  );
}

export default Details;
