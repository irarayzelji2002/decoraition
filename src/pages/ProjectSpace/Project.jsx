import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { onSnapshot, doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Paper, IconButton, InputBase } from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import { auth, db } from "../../firebase";
import ProjectHead from "./ProjectHead";
import Modal from "../../components/Modal";
import BottomBarDesign from "./BottomBarProject";
import Loading from "../../components/Loading";
import DesignIcon from "../../components/DesignIcon";
import Dropdowns from "../../components/Dropdowns";
import "../../css/seeAll.css";
import "../../css/project.css";
import { fetchDesigns, handleCreateDesign, handleDeleteDesign } from "./backend/ProjectDetails";
import { Button } from "@mui/material";
import { AddDesign, AddProject } from "../DesignSpace/svg/AddImage";
import { HorizontalIcon, VerticalIcon } from "./svg/ExportIcon";
import DesignSvg from "../Homepage/svg/DesignSvg";

function Project() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const { projectId } = useParams();
  const [newName, setNewName] = useState("");
  const [userId, setUserId] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (user) {
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchDesigns(currentUser.uid, projectId, setDesigns);
      } else {
        setUser(null);
        setDesigns([]);
      }
    });

    return () => unsubscribeAuth();
  }, [user]);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);

        const fetchProjectDetails = async () => {
          try {
            const projectRef = doc(db, "projects", projectId);
            const projectSnapshot = await getDoc(projectRef);
            if (projectSnapshot.exists()) {
              const project = projectSnapshot.data();
              setProjectData(project);
              setNewName(project.name);

              // Listen for real-time updates to the project document
              const unsubscribeProject = onSnapshot(projectRef, (doc) => {
                if (doc.exists()) {
                  const updatedProject = doc.data();
                  setProjectData(updatedProject);
                  setNewName(updatedProject.name);
                }
              });

              // Cleanup listener on component unmount
              return () => unsubscribeProject();
            } else {
              console.error("Project not found");
            }
          } catch (error) {
            console.error("Error fetching project details:", error);
          }
        };

        fetchProjectDetails();
      } else {
        console.error("User is not authenticated");
      }
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [projectId]);

  const closeModal = () => {
    setModalOpen(false);
    setModalContent(null);
  };

  if (!projectData) {
    return (
      <>
        <Loading />
      </>
    );
  }
  return (
    <>
      <ProjectHead />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}
        <Paper
          component="form"
          sx={{
            p: "2px 4px",
            display: "flex",
            alignItems: "center",
            width: "90%",
            marginTop: "40px",
            backgroundColor: "var(--bgMain)",
            border: "2px solid var(--borderInput)",
            borderRadius: "20px",
            "&:focus-within": {
              borderColor: "var(--brightFont)",
            },
          }}
        >
          <IconButton
            type="button"
            sx={{ p: "10px", color: "var(--color-white)" }}
            aria-label="search"
          >
            <SearchIcon sx={{ color: "var(--color-white)" }} />
          </IconButton>
          <InputBase
            sx={{ ml: 1, flex: 1, color: "var(--color-white)" }}
            placeholder="Search designs on this project"
            inputProps={{ "aria-label": "search google maps" }}
          />
        </Paper>
        <Dropdowns />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "row",
          }}
        >
          <main
            className="content"
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexDirection: "row",
              overflow: "hidden",
            }}
          ></main>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          width: "auto",

          padding: "20px",
        }}
      >
        <span className="SubtitleBudget" style={{ marginLeft: "20px", fontSize: "30px" }}>
          Project Name
          <br />
          <span
            className="SubtitlePrice"
            style={{
              backgroundColor: "transparent",
            }}
          >
            Designs
          </span>
        </span>

        <div className="button-container" style={{ display: "flex", marginLeft: "auto" }}>
          <Button style={{ marginRight: "10px" }}>
            <HorizontalIcon />
          </Button>
          <Button>
            <VerticalIcon />
          </Button>
        </div>
      </div>
      <div style={{ paddingBottom: "20%" }}>
        <div className="layout">
          {designs.length > 0 &&
            designs.slice(0, 6).map((design) => (
              <DesignIcon
                key={design.id}
                name={design.name}
                designId={design.id}
                onDelete={() => handleDeleteDesign(projectId, design.id)}
                onOpen={() =>
                  navigate(`/design/${design.id}`, {
                    state: { designId: design.id },
                  })
                }
              />
            ))}
        </div>
        {designs.length === 0 && (
          <div className="no-content">
            <img src="/img/design-placeholder.png" alt="No designs yet" />
            <p>No designs yet. Start creating.</p>
          </div>
        )}
      </div>

      <div className="circle-button-container">
        {menuOpen && (
          <div className="small-buttons">
            <div className="small-button-container" onClick={() => handleCreateDesign(projectId)}>
              <span className="small-button-text">Import a Design</span>
              <div className="small-circle-button">
                <AddDesign />
              </div>
            </div>
            <div className="small-button-container" onClick={() => handleCreateDesign(projectId)}>
              <span className="small-button-text">Create a Design</span>
              <div className="small-circle-button">
                <AddProject />
              </div>
            </div>
          </div>
        )}
        <div className={`circle-button ${menuOpen ? "rotate" : ""}`} onClick={toggleMenu}>
          {menuOpen ? <CloseIcon /> : <AddIcon />}
        </div>
      </div>

      {modalOpen && <Modal onClose={closeModal} />}

      <BottomBarDesign Design={true} projId={projectId} />
    </>
  );
}

export default Project;
