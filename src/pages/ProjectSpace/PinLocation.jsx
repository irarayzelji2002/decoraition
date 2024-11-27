import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../../css/addItem.css";
import "../../css/budget.css";
import { useNavigate } from "react-router-dom";
import TopBar from "../../components/TopBar";
import ImageFrame from "../../components/ImageFrame";
import { fetchPins, updatePinLocation } from "./backend/ProjectDetails"; // Assuming this is the correct path
import deepEqual from "deep-equal";
import { showToast } from "../../functions/utils";
import {
  isManagerProject,
  isManagerContentManagerProject,
  isManagerContentManagerContributorProject,
  isCollaboratorProject,
} from "./Project";
import { useSharedProps } from "../../contexts/SharedPropsContext";

function PinLocation({ EditMode }) {
  const location = useLocation();
  const navigateTo = location.state?.navigateFrom || "/";
  const navigateFrom = location.pathname;
  const { projectId } = location.state || {};
  const navigate = useNavigate();

  const [pins, setPins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { userDoc, projects, userProjects } = useSharedProps();
  const [loadingProject, setLoadingProject] = useState(true);
  const [project, setProject] = useState({});
  const [isManager, setIsManager] = useState(false);
  const [isManagerContentManager, setIsManagerContentManager] = useState(false);
  const [isManagerContentManagerContributor, setIsManagerContentManagerContributor] =
    useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);

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
      navigate("/project/" + projectId);
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
      isManagerProject(project, userDoc.id) &&
      isManagerContentManagerProject(project, userDoc.id) &&
      isManagerContentManagerContributorProject(project, userDoc.id)
    ) {
    } else {
      // showToast("error", "You don't have access to this portion of the project.");
      // navigate("/planMap/" + projectId);
      // return;
    }
  }, [project, userDoc, navigate, projectId]);

  useEffect(() => {
    if (projectId) {
      fetchPins(projectId, setPins);
    }
  }, [projectId]);

  const savePinLocations = async () => {
    setIsLoading(true);
    try {
      await Promise.all(pins.map((pin) => updatePinLocation(projectId, pin.id, pin.location)));
      console.log("Pin locations updated successfully");
    } catch (error) {
      console.error("Error updating pin locations:", error);
    }
    setIsLoading(false);
    navigate(`/planMap/${projectId}`);
  };

  return (
    <>
      <TopBar state={"Add Pin"} navigateTo={navigateTo} navigateFrom={navigateFrom} />
      <div className="sectionBudget" style={{ background: "none", paddingTop: "74px" }}>
        <div className="budgetSpaceImg">
          <ImageFrame projectId={projectId} alt="design preview" pins={pins} setPins={setPins} />
          <button
            className="add-item-btn"
            onClick={savePinLocations}
            style={{
              opacity: isLoading ? 0.5 : 1,
              cursor: isLoading ? "default" : "pointer",
            }}
            disabled={isLoading}
          >
            {isLoading ? "Save Pin Locations" : "Save Pin Locations"}
          </button>
        </div>
      </div>
    </>
  );
}

export default PinLocation;
