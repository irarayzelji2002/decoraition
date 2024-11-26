import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import ProjectHead from "./ProjectHead";
import BottomBarProject from "./BottomBarProject";
import { useSharedProps } from "../../contexts/SharedPropsContext";

function ProjectSpace({
  project,
  projectId,
  inDesign,
  inPlanMap,
  inTimeline,
  inBudget,
  changeMode,
  setChangeMode,
  children,
}) {
  const { user, userDoc } = useSharedProps();
  const location = useLocation();

  useEffect(() => {
    if (!project || !user || !userDoc) return;

    let newRole = 0;

    // First check if restricted access
    if (project?.projectSettings?.generalAccessSetting === 0) {
      // Only check explicit roles
      if (project.managers?.includes(userDoc.id)) newRole = 3;
      else if (project.contentManagers?.includes(userDoc.id)) newRole = 2;
      else if (project.contributors?.includes(userDoc.id)) newRole = 1;
      else if (project.viewers?.includes(userDoc.id)) newRole = 0;
    } else {
      // Anyone with link - check both explicit roles and general access
      if (project.managers?.includes(userDoc.id)) newRole = 3;
      else if (
        project.contentManagers?.includes(userDoc.id) ||
        project?.projectSettings?.generalAccessRole === 2
      )
        newRole = 1;
      else if (
        project.contributors?.includes(userDoc.id) ||
        project?.projectSettings?.generalAccessRole === 1
      )
        newRole = 2;
      else newRole = project?.projectSettings?.generalAccessRole ?? 0;
    }

    // Always set the changeMode based on role if current mode doesn't match
    const expectedMode =
      newRole === 3
        ? "Managing"
        : newRole === 2
        ? "Managing Content"
        : newRole === 1
        ? "Contributing"
        : "Viewing";

    if (changeMode !== expectedMode) {
      setChangeMode(expectedMode);
    }
  }, [project, user, userDoc]);

  return (
    <div className="project-space">
      <ProjectHead project={project} changeMode={changeMode} setChangeMode={setChangeMode} />
      {children}
      <BottomBarProject
        Design={inDesign}
        PlanMap={inPlanMap}
        Timeline={inTimeline}
        Budget={inBudget}
        projId={projectId}
        changeMode={changeMode}
      />
    </div>
  );
}

export default ProjectSpace;
