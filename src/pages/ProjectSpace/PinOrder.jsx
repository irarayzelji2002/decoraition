import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import update from "immutability-helper";
import TopBar from "../../components/TopBar";
import MapPin from "./MapPin";
import { fetchPins, savePinOrder } from "./backend/ProjectDetails";
import { useParams } from "react-router-dom";
import deepEqual from "deep-equal";
import { showToast } from "../../functions/utils";
import {
  isManagerProject,
  isManagerContentManagerProject,
  isManagerContentManagerContributorProject,
  isCollaboratorProject,
} from "./Project";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { gradientButtonStyles } from "../DesignSpace/PromptBar";

const ItemType = {
  PIN: "pin",
};

function DraggablePin({ id, index, movePin, title, editMode, pinNo, color }) {
  const ref = useRef(null);
  const { projectId } = useParams();
  const { userDoc, projects, userProjects } = useSharedProps();
  const [loadingProject, setLoadingProject] = useState(true);
  const [project, setProject] = useState({});
  const [isManager, setIsManager] = useState(false);
  const [isManagerContentManager, setIsManagerContentManager] = useState(false);
  const [isManagerContentManagerContributor, setIsManagerContentManagerContributor] =
    useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const navigate = useNavigate();

  // Get project
  useEffect(() => {
    if (projectId && userProjects.length > 0) {
      const fetchedProject =
        userProjects.find((d) => d.id === projectId) || projects.find((d) => d.id === projectId);

      if (!fetchedProject) {
        console.error("Project not found.");
        setLoadingProject(false);
      } else if (Object.keys(project).length === 0 || !deepEqual(project, fetchedProject)) {
        setProject(fetchedProject);
        console.log("current project:", fetchedProject);
      }
    }
    setLoadingProject(false);
  }, [projectId, projects, userProjects]);

  // Initialize access rights
  useEffect(() => {
    if (!project?.projectSettings || !userDoc?.id) return;
    // Check if user has any access
    const hasAccess = isCollaboratorProject(project, userDoc.id);
    if (!hasAccess) {
      showToast("error", "You don't have access to this portion of the project.");
      navigate("/timeline/" + projectId);
      return;
    }
    // If they have access, proceed with setting roles
    setIsManager(isManagerProject(project, userDoc.id));
    setIsManagerContentManager(isManagerContentManagerProject(project, userDoc.id));
    setIsManagerContentManagerContributor(
      isManagerContentManagerContributorProject(project, userDoc.id)
    );
    setIsCollaborator(isCollaboratorProject(project, userDoc.id));

    // Check if none of the manager roles are true
    if (
      isManagerProject(project, userDoc.id) ||
      isManagerContentManagerProject(project, userDoc.id) ||
      isManagerContentManagerContributorProject(project, userDoc.id)
    ) {
    } else {
      showToast("error", "You don't have access to this portion of the project.");
      navigate("/planMap/" + projectId);
      return;
    }
  }, [project, userDoc, navigate, projectId]);
  const [, drop] = useDrop({
    accept: ItemType.PIN,
    hover(item) {
      if (item.index !== index) {
        movePin(item.index, index);
        item.index = index;
      }
    },
  });

  const [, drag] = useDrag({
    type: ItemType.PIN,
    item: { id, index },
  });

  drag(drop(ref));

  return (
    <div ref={ref} style={{ width: "100%", maxWidth: "600px" }}>
      <MapPin title={title} editMode={editMode} pinNo={pinNo} pinColor={color} />
    </div>
  );
}

function PinOrder() {
  const location = useLocation();
  const navigateTo = location.state?.navigateFrom || "/";
  const navigateFrom = location.pathname;
  const { projectId } = useParams();
  const [pins, setPins] = useState([]);
  const [isSaveBtnDisabled, setisSaveBtnDisabled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId) {
      fetchPins(projectId, (fetchedPins) => {
        const sortedPins = fetchedPins.sort((a, b) => a.order - b.order);
        setPins(sortedPins);
      });
    }
  }, [projectId]);

  const movePin = (fromIndex, toIndex) => {
    const movedPin = pins[fromIndex];
    const updatedPins = update(pins, {
      $splice: [
        [fromIndex, 1],
        [toIndex, 0, movedPin],
      ],
    }).map((pin, index) => ({
      ...pin,
      order: index + 1,
    }));
    setPins(updatedPins);
  };

  const handleSave = async () => {
    setisSaveBtnDisabled(true);
    try {
      await savePinOrder(projectId, pins);
      showToast("success", "Pins order saved successfully!");
      navigate(`/planMap/${projectId}`);
    } catch (error) {
      showToast("error", "Failed to save pins order.");
    } finally {
      setisSaveBtnDisabled(false);
    }
  };

  const isMobile = window.innerWidth <= 768;

  return (
    <DndProvider
      backend={isMobile ? TouchBackend : HTML5Backend}
      options={isMobile ? { enableMouseEvents: true } : undefined}
    >
      <TopBar state={"Change pins order"} navigateTo={navigateTo} navigateFrom={navigateFrom} />
      <div style={{ width: "95%", paddingTop: "74px" }}>
        <div className="pinSpace">
          {pins.map((pin, index) => (
            <DraggablePin
              key={pin.id}
              id={pin.id}
              index={index}
              movePin={movePin}
              title={pin.designName}
              editMode={true}
              pinNo={pin.order}
              color={pin.color}
            />
          ))}
          <Button
            // className="add-item-btn"
            variant="contained"
            onClick={handleSave}
            sx={{
              ...gradientButtonStyles,
              paddingLeft: "20px",
              paddingRight: "20px",
              maxWidth: "235px",
              opacity: isSaveBtnDisabled ? 0.5 : 1,
              cursor: isSaveBtnDisabled ? "default" : "pointer",
              "&:hover": {
                backgroundImage: !isSaveBtnDisabled && "var(--gradientButtonHover)",
              },
            }}
            disabled={isSaveBtnDisabled}
          >
            Save pins order and color
          </Button>
        </div>
      </div>
    </DndProvider>
  );
}

export default PinOrder;
