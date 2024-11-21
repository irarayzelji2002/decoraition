import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import deepEqual from "deep-equal";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { showToast } from "../../functions/utils";
import TopBar from "../../components/TopBar";
import Loading from "../../components/Loading";
import {
  Typography,
  Box,
  Switch,
  TextField,
  Button,
  FormControlLabel,
  MenuItem,
  Select,
  Avatar,
} from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import "../../css/projSettings.css";
import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material/styles";
import {
  ContributorIcon,
  ContentManagerIcon,
  ManagerIcon,
  ViewerIcon as ProjectViewerIcon,
  RestrictedIcon,
  AnyoneWithLinkIcon,
} from "./svg/ProjectAccessIcons";
import { set } from "lodash";
import { switchStyles } from "../DesignSpace/DesignSettings";
import LoadingPage from "../../components/LoadingPage";
import { selectStyles, selectStylesDisabled, menuItemStyles } from "../DesignSpace/DesignSettings";

export const theme = createTheme({
  components: {
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "& .MuiSwitch-thumb": {
            backgroundColor: "var(--switchThumbGrey)",
            boxShadow: "inset 0px 0px 0px 1px var(--switchThumbStroke)",
          },
          "&.Mui-checked .MuiSwitch-thumb": {
            backgroundImage: "var(--gradientButton)",
            boxShadow: "none",
          },
          "&.Mui-checked + .MuiSwitch-track": {
            backgroundColor: "var(--inputBg)",
          },
        },
        track: {
          backgroundColor: "var(--inputBg)",
        },
      },
    },
  },
});

const ProjectSettings = () => {
  const {
    user,
    userDoc,
    projects,
    userProjects,
    timelines,
    userTimelines,
    planMaps,
    userPlanMaps,
    projectBudgets,
    userProjectBudgets,
  } = useSharedProps();
  const { projectId } = useParams({}); // Get the projectId parameter from the URL
  const location = useLocation();
  const navigateTo = location.state?.navigateFrom || "/";
  const navigateFrom = location.pathname;

  const [project, setProject] = useState({});
  const [projectName, setProjectName] = useState("Untitled Project");
  const [timeline, setTimeline] = useState({});
  const [planMap, setPlanMap] = useState({});
  const [projectBudget, setProjectBudget] = useState({});

  // General Access Setting: 0 for Restricted, 1 for Anyone with the link
  // General Access Role: 0 for viewer, 1 for contributor, 2 for content manager, 3 for manager
  // Project Tab
  const [generalAccessSettingProject, setGeneralAccessSettingProject] = useState(0);
  const [generalAccessRoleProject, setGeneralAccessRoleProject] = useState(0);
  const [allowDownloadProject, setAllowDownloadProject] = useState(true);
  const [inactivityEnabled, setInactivityEnabled] = useState(true);
  const [inactivityDays, setInactivityDays] = useState(90);
  const [deletionDays, setDeletionDays] = useState(30);
  const [notifyDays, setNotifyDays] = useState(7);

  // Timeline Tab
  const [generalAccessSettingTimeline, setGeneralAccessSettingTimeline] = useState(0);
  const [generalAccessRoleTimeline, setGeneralAccessRoleTimeline] = useState(0);
  const [allowDownloadTimeline, setAllowDownloadTimeline] = useState(true);

  // Plan Map Tab
  const [generalAccessSettingPlanMap, setGeneralAccessSettingPlanMap] = useState(0);
  const [generalAccessRolePlanMap, setGeneralAccessRolePlanMap] = useState(0);
  const [allowDownloadPlanMap, setAllowDownloadPlanMap] = useState(true);

  // Budget Tab
  const [generalAccessSettingBudget, setGeneralAccessSettingBudget] = useState(0);
  const [generalAccessRoleBudget, setGeneralAccessRoleBudget] = useState(0);
  const [allowDownloadBudget, setAllowDownloadBudget] = useState(true);

  const [activeTab, setActiveTab] = useState("Project"); // Default active tab
  const [loading, setLoading] = useState(true);
  const [allowEdit, setAllowEdit] = useState(false);
  const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(false);

  // Effect to set the project once userProjects are loaded
  useEffect(() => {
    if (projectId && userProjects.length > 0) {
      const fetchedProject =
        userProjects.find((project) => project.id === projectId) ||
        projects.find((project) => project.id === projectId);

      if (!fetchedProject) {
        console.error("Project not found.");
      } else if (Object.keys(project).length === 0 || !deepEqual(project, fetchedProject)) {
        setProject(fetchedProject);
        setProjectName(fetchedProject?.projectName ?? "Untitled Project");
        setGeneralAccessSettingProject(fetchedProject?.projectSettings?.generalAccessSetting ?? 0);
        setGeneralAccessRoleProject(fetchedProject?.projectSettings?.generalAccessRole ?? 0);
        setAllowDownloadProject(fetchedProject?.projectSettings?.allowDownload ?? true);
        setInactivityEnabled(fetchedProject?.projectSettings?.inactivityEnabled ?? true);
        setInactivityDays(fetchedProject?.projectSettings?.inactivityDays ?? 90);
        setDeletionDays(fetchedProject?.projectSettings?.deletionDays ?? 30);
        setNotifyDays(fetchedProject?.projectSettings?.notifyDays ?? 7);
        console.log(
          `fetchedProject.projectSettings (${projectId})`,
          fetchedProject?.projectSettings
        );
      }
    }
  }, [projectId, projects, userProjects]);

  // Effect to update the timeline once userTimelines and project data are available
  useEffect(() => {
    if (project && userTimelines.length > 0) {
      const timelineId = project.timelineId;
      const fetchedTimeline =
        userTimelines.find((timeline) => timeline.id === timelineId) ||
        timelines.find((timeline) => timeline.id === timelineId);
      if (!fetchedTimeline) {
        console.error("Timeline not found.");
      } else if (Object.keys(timeline).length === 0 || !deepEqual(timeline, fetchedTimeline)) {
        setTimeline(fetchedTimeline);
        setGeneralAccessSettingTimeline(
          fetchedTimeline?.timelineSettings?.generalAccessSetting ?? 0
        );
        setGeneralAccessRoleTimeline(fetchedTimeline?.timelineSettings?.generalAccessRole ?? 0);
        setAllowDownloadTimeline(fetchedTimeline?.timelineSettings?.allowDownload ?? true);
        console.log(
          `fetchedTimeline.timelineSettings (${timelineId})`,
          fetchedTimeline?.timelineSettings
        );
      }
    }
  }, [project, timelines, userTimelines]);

  // Effect to update the plan map once userPlanMaps and project data are available
  useEffect(() => {
    if (project && userPlanMaps.length > 0) {
      const planMapId = project.planMapId;
      const fetchedPlanMap =
        userPlanMaps.find((planMap) => planMap.id === planMapId) ||
        planMaps.find((planMap) => planMap.id === planMapId);
      if (!fetchedPlanMap) {
        console.error("Plan Map not found.");
      } else if (Object.keys(planMap).length === 0 || !deepEqual(planMap, fetchedPlanMap)) {
        setPlanMap(fetchedPlanMap);
        setGeneralAccessSettingPlanMap(fetchedPlanMap?.planMapSettings?.generalAccessSetting ?? 0);
        setGeneralAccessRolePlanMap(fetchedPlanMap?.planMapSettings?.generalAccessRole ?? 0);
        setAllowDownloadPlanMap(fetchedPlanMap?.planMapSettings?.allowDownload ?? true);
        console.log(
          `fetchedPlanMap.planMapSettings (${planMapId})`,
          fetchedPlanMap?.planMapSettings
        );
      }
    }
  }, [project, planMaps, userPlanMaps]);

  // Effect to update the budget once userProjectBudgets and project data are available
  useEffect(() => {
    if (project && userProjectBudgets.length > 0) {
      const projectBudgetId = project.projectBudgetId;
      const fetchedProjectBudget =
        userProjectBudgets.find((budget) => budget.id === projectBudgetId) ||
        projectBudgets.find((budget) => budget.id === projectBudgetId);
      if (!fetchedProjectBudget) {
        console.error("Project Budget not found.");
      } else if (
        Object.keys(projectBudget).length === 0 ||
        !deepEqual(projectBudget, fetchedProjectBudget)
      ) {
        setProjectBudget(fetchedProjectBudget);
        setGeneralAccessSettingBudget(
          fetchedProjectBudget?.budgetSettings?.generalAccessSetting ?? 0
        );
        setGeneralAccessRoleBudget(fetchedProjectBudget?.budgetSettings?.generalAccessRole ?? 0);
        setAllowDownloadBudget(fetchedProjectBudget?.budgetSettings?.allowDownload ?? true);
        console.log(
          `fetchedProjectBudget.budgetSettings (${projectBudgetId})`,
          fetchedProjectBudget?.budgetSettings
        );
      }
    }
  }, [project, projectBudgets, userProjectBudgets]);

  // useEffect to check if all required data is populated
  useEffect(() => {
    if (
      Object.keys(project).length > 0 &&
      Object.keys(timeline).length > 0 &&
      Object.keys(planMap).length > 0 &&
      Object.keys(projectBudget).length > 0
    ) {
      setLoading(false);
    }
  }, [project, timeline, planMap, projectBudget]);

  // useEffect to check if user is a manager to allow editing
  useEffect(() => {
    if (!project || !user || !userDoc) return;

    let newRole = 0;

    // First check if restricted access
    if (project?.projectSettings?.generalAccessSetting === 0) {
      // Only check explicit roles
      if (project.managers?.includes(userDoc.id)) newRole = 3;
      else if (project.contributors?.includes(userDoc.id)) newRole = 1;
      else if (project.contentManagers?.includes(userDoc.id)) newRole = 2;
      else if (project.viewers?.includes(userDoc.id)) newRole = 0;
    } else {
      // Anyone with link - check both explicit roles and general access
      if (project.managers?.includes(userDoc.id)) newRole = 3;
      else if (
        project.contributors?.includes(userDoc.id) ||
        project?.projectSettings?.generalAccessRole === 1
      )
        newRole = 1;
      else if (
        project.contentManagers?.includes(userDoc.id) ||
        project?.projectSettings?.generalAccessRole === 2
      )
        newRole = 2;
      else newRole = project?.projectSettings?.generalAccessRole ?? 0;
    }

    // Set role and all dependent flags
    setAllowEdit(newRole === 3); // managers
  }, [project, user, userDoc]);

  const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

  const handleSaveProjectSettings = async () => {
    try {
      const updatedProjectSettings = {
        generalAccessSettingProject: generalAccessSettingProject,
        generalAccessRoleProject: generalAccessRoleProject,
        allowDownloadProject: allowDownloadProject,
        inactivityEnabled: inactivityEnabled,
        inactivityDays: inactivityDays,
        deletionDays: deletionDays,
        notifyDays: notifyDays,
      };
      console.log("updatedProjectSettings", updatedProjectSettings);

      const updatedTimelineSettings = {
        generalAccessSettingTimeline: generalAccessSettingTimeline,
        generalAccessRoleTimeline: generalAccessRoleTimeline,
        allowDownloadTimeline: allowDownloadTimeline,
      };
      console.log("updatedTimelineSettings", updatedTimelineSettings);

      const updatedPlanMapSettings = {
        generalAccessSettingPlanMap: generalAccessSettingPlanMap,
        generalAccessRolePlanMap: generalAccessRolePlanMap,
        allowDownloadPlanMap: allowDownloadPlanMap,
      };
      console.log("updatedPlanMapSettings", updatedPlanMapSettings);

      const updatedBudgetSettings = {
        generalAccessSettingBudget: generalAccessSettingBudget,
        generalAccessRoleBudget: generalAccessRoleBudget,
        allowDownloadBudget: allowDownloadBudget,
      };
      console.log("updatedBudgetSettings", updatedBudgetSettings);

      const response = await axios.put(
        `/api/project/${projectId}/update-settings`,
        {
          projectSettings: updatedProjectSettings,
          timelineId: timeline.id,
          timelineSettings: updatedTimelineSettings,
          planMapId: planMap.id,
          planMapSettings: updatedPlanMapSettings,
          projectBudgetId: projectBudget.id,
          budgetSettings: updatedBudgetSettings,
          userId: userDoc.id,
        },
        {
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
        }
      );

      if (response.status === 200) {
        showToast("success", "Project settings updated successfully");
      }
    } catch (error) {
      console.error("Failed to update project settings:", error);
      showToast("error", "Failed to update project settings");
    }
  };

  const handleSaveProjectSettingsWithLoading = async () => {
    setIsSaveButtonDisabled(true);
    await handleSaveProjectSettings();
    setIsSaveButtonDisabled(false);
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!project) {
    return <div>Project not found. Please reload or navigate to this project again.</div>;
  }

  return (
    <div>
      <TopBar
        state={`Project Settings for ${projectName}`}
        navigateTo={navigateTo}
        navigateFrom={navigateFrom}
      />
      {/* Tab Navigation */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-around",
          flexWrap: "wrap",
          marginBottom: "20px",
          paddingTop: 2,
          paddingLeft: "15px",
          paddingRight: "15px",
          borderBottom: "1px solid var(--inputBg)",
        }}
      >
        {["Project", "Timeline", "Plan Map", "Budget"].map((tab) => (
          <Typography
            key={tab}
            onClick={() => handleTabChange(tab)}
            sx={{
              fontSize: 18,
              fontWeight: "bold",
              textTransform: "none",
              cursor: "pointer",
              padding: 1,
              paddingTop: 2,
              paddingBottom: 2,
              marginBottom: "1px",
              position: "relative",

              // Apply gradient border bottom if active
              "&::after": {
                content: '""',
                position: "absolute",
                left: 0,
                right: 0,
                bottom: "-2px",
                height: "4px",
                background: activeTab === tab ? "var(--gradientFont)" : "transparent",
                borderRadius: "0px",
              },

              color: activeTab === tab ? "transparent" : "var(--color-white)",
              backgroundImage: activeTab === tab ? "var(--gradientFont)" : "none",
              backgroundClip: activeTab === tab ? "text" : "unset",
              WebkitBackgroundClip: activeTab === tab ? "text" : "unset",

              "&:focus, &:active": {
                outline: "none",
                backgroundColor: "transparent",
              },

              "@media (max-width: 350px)": {
                justifyContent: "center",
              },
            }}
          >
            {tab}
          </Typography>
        ))}
      </Box>
      <ThemeProvider theme={theme}>
        <div className="settingsContainerProj">
          <Box sx={{ minHeight: "67vh" }}>
            {activeTab === "Project" ? (
              <SettingsContent
                generalAccessSetting={generalAccessSettingProject}
                setGeneralAccessSetting={setGeneralAccessSettingProject}
                generalAccessRole={generalAccessRoleProject}
                setGeneralAccessRole={setGeneralAccessRoleProject}
                allowDownload={allowDownloadProject}
                setAllowDownload={setAllowDownloadProject}
                inactivityEnabled={inactivityEnabled}
                setInactivityEnabled={setInactivityEnabled}
                inactivityDays={inactivityDays}
                setInactivityDays={setInactivityDays}
                deletionDays={deletionDays}
                setDeletionDays={setDeletionDays}
                notifyDays={notifyDays}
                setNotifyDays={setNotifyDays}
                allowEdit={allowEdit}
                activeTab={activeTab} // determines tab
              />
            ) : activeTab === "Timeline" ? (
              <SettingsContent
                generalAccessSetting={generalAccessSettingTimeline}
                setGeneralAccessSetting={setGeneralAccessSettingTimeline}
                generalAccessRole={generalAccessRoleTimeline}
                setGeneralAccessRole={setGeneralAccessRoleTimeline}
                allowDownload={allowDownloadTimeline}
                setAllowDownload={setAllowDownloadTimeline}
                allowEdit={allowEdit}
                activeTab={activeTab}
              />
            ) : activeTab === "Plan Map" ? (
              <SettingsContent
                generalAccessSetting={generalAccessSettingPlanMap}
                setGeneralAccessSetting={setGeneralAccessSettingPlanMap}
                generalAccessRole={generalAccessRolePlanMap}
                setGeneralAccessRole={setGeneralAccessRolePlanMap}
                allowDownload={allowDownloadPlanMap}
                setAllowDownload={setAllowDownloadPlanMap}
                allowEdit={allowEdit}
                activeTab={activeTab}
              />
            ) : (
              activeTab === "Budget" && (
                <SettingsContent
                  generalAccessSetting={generalAccessSettingBudget}
                  setGeneralAccessSetting={setGeneralAccessSettingBudget}
                  generalAccessRole={generalAccessRoleBudget}
                  setGeneralAccessRole={setGeneralAccessRoleBudget}
                  allowDownload={allowDownloadBudget}
                  setAllowDownload={setAllowDownloadBudget}
                  allowEdit={allowEdit}
                  activeTab={activeTab}
                />
              )
            )}
          </Box>
          {/* Save Button */}
          {allowEdit && (
            <Box
              className="saveButtonContainer"
              sx={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                margin: "30px auto 0px auto",
                gap: 2,
              }}
            >
              <Button
                variant="contained"
                onClick={handleSaveProjectSettingsWithLoading}
                disabled={isSaveButtonDisabled}
                sx={{
                  background: "var(--gradientButton)",
                  borderRadius: "20px",
                  color: "var(--always-white) !important",
                  fontWeight: "bold",
                  textTransform: "none",
                  width: "230px",
                  margin: "0px 10px",
                  opacity: isSaveButtonDisabled ? "0.5" : "1",
                  cursor: isSaveButtonDisabled ? "default" : "pointer",
                  "&:hover": {
                    background: !isSaveButtonDisabled && "var(--gradientButtonHover)",
                  },
                }}
              >
                Save
              </Button>
              <Button
                variant="contained"
                onClick={() => window.history.back()}
                sx={{
                  color: "var(--color-white)",
                  background: "transparent",
                  border: "2px solid transparent",
                  borderRadius: "20px",
                  backgroundImage: "var(--lightGradient), var(--gradientButton)",
                  backgroundOrigin: "border-box",
                  backgroundClip: "padding-box, border-box",
                  fontWeight: "bold",
                  textTransform: "none",
                  width: "230px",
                  margin: "0px 10px",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundImage =
                    "var(--lightGradient), var(--gradientButtonHover)")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
                }
              >
                Cancel
              </Button>
            </Box>
          )}
        </div>
      </ThemeProvider>
    </div>
  );
};

export default ProjectSettings;

const SettingsContent = ({
  generalAccessSetting = 0,
  setGeneralAccessSetting = () => {},
  generalAccessRole = 0,
  setGeneralAccessRole = () => {},
  allowDownload = true,
  setAllowDownload = () => {},
  inactivityEnabled = true,
  setInactivityEnabled = () => {},
  inactivityDays = 90,
  setInactivityDays = () => {},
  deletionDays = 30,
  setDeletionDays = () => {},
  notifyDays = 7,
  setNotifyDays = () => {},
  allowEdit = false,
  activeTab = "Project",
}) => (
  <div>
    {/* General Access */}
    <div className="generalAccessTitle">General access for {activeTab.toLowerCase()}</div>
    <Box>
      <GeneralAccessSelect
        generalAccessSetting={generalAccessSetting}
        setGeneralAccessSetting={setGeneralAccessSetting}
        generalAccessRole={generalAccessRole}
        setGeneralAccessRole={setGeneralAccessRole}
        disabled={!allowEdit}
      />
    </Box>
    {/* Viewer Settings */}
    <Typography className="viewerSettingsTitle">
      Viewer settings for {activeTab.toLowerCase()}
    </Typography>
    <CustomSwitch
      label="Allow to download"
      checked={allowDownload}
      onChange={(e) => setAllowDownload(e.target.checked)}
      disabled={!allowEdit}
    />
    {activeTab === "Project" && (
      <>
        {/* Inactivity and Deletion */}
        <Typography className="inactivityTitle">Inactivity and deletion</Typography>
        <CustomSwitch
          label="Enable inactivity and deletion"
          checked={inactivityEnabled}
          onChange={(e) => setInactivityEnabled(e.target.checked)}
          disabled={!allowEdit}
        />
        {/* Inactivity Settings */}
        {inactivityEnabled && (
          <>
            <InactivitySetting
              label="Number of days before inactivity after user inactivity"
              value={inactivityDays}
              onChange={(e) => setInactivityDays(parseInt(e.target.value, 10))}
              options={[
                { value: 30, label: "30 days" },
                { value: 60, label: "60 days" },
                { value: 90, label: "90 days" },
                { value: 120, label: "120 days" },
                { value: 180, label: "180 days" },
              ]}
              disabled={!allowEdit}
            />
            <InactivitySetting
              label="Number of days before deletion after project inactivity"
              value={deletionDays}
              onChange={(e) => setDeletionDays(parseInt(e.target.value, 10))}
              options={[
                { value: 15, label: "15 days" },
                { value: 30, label: "30 days" },
                { value: 45, label: "45 days" },
                { value: 60, label: "60 days" },
              ]}
              disabled={!allowEdit}
            />
            <InactivitySetting
              label="Notify collaborators number of days prior to entering inactivity mode and deletion"
              value={notifyDays}
              onChange={(e) => setNotifyDays(parseInt(e.target.value, 10))}
              options={[
                { value: 3, label: "3 days and below" },
                { value: 7, label: "7 days and below" },
                { value: 15, label: "14 days and below" },
                { value: 30, label: "30 days and below" },
              ]}
              disabled={!allowEdit}
            />
          </>
        )}
      </>
    )}
  </div>
);

const GeneralAccessSelect = ({
  generalAccessSetting = 0,
  setGeneralAccessSetting = () => {},
  generalAccessRole = 0,
  setGeneralAccessRole = () => {},
  disabled = true,
}) => {
  const [isWrapped, setIsWrapped] = useState(false);
  const containerRef = useRef(null);
  const generalAccessRoles = [
    { value: 0, label: "Viewer", icon: <ProjectViewerIcon /> },
    { value: 1, label: "Contributor", icon: <ContributorIcon /> },
    { value: 2, label: "Content Manager", icon: <ContentManagerIcon /> },
  ];

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { inlineSize } = entry.borderBoxSize[0];
        setIsWrapped(inlineSize < 585); // Adjust width as needed
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "35px",
      }}
    >
      <Avatar
        sx={{
          width: 56,
          height: 56,
          marginRight: isWrapped ? "0px" : "16px",
          background: "var(--gradientButton)",
          marginBottom: isWrapped ? "16px" : "0px",
        }}
        src=""
      >
        {generalAccessSetting === 0 ? <RestrictedIcon /> : <AnyoneWithLinkIcon />}
      </Avatar>

      <Select
        value={generalAccessSetting}
        onChange={(e) => setGeneralAccessSetting(parseInt(e.target.value, 10))}
        disabled={disabled}
        sx={{
          ...(disabled ? selectStylesDisabled : selectStyles),
          flexGrow: 1,
          minWidth: isWrapped ? "100%" : "200px",
          "& .MuiOutlinedInput-notchedOutline": {
            borderTopLeftRadius: isWrapped ? "10px" : "10px",
            borderTopRightRadius: isWrapped ? "10px" : "0px",
            borderBottomLeftRadius: isWrapped ? "0px" : "10px",
            borderBottomRightRadius: isWrapped ? "0px" : "0px",
            border: "2px solid var(--borderInput)",
          },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              borderRadius: "10px",
              "& .MuiMenu-list": {
                padding: 0,
              },
            },
          },
        }}
        IconComponent={(props) => (
          <KeyboardArrowDownRoundedIcon sx={{ color: "var(--color-white) !important" }} />
        )}
      >
        <MenuItem value={0} sx={menuItemStyles}>
          <Typography variant="body1" sx={{ fontWeight: "bold", display: "block" }}>
            Restricted&nbsp;
          </Typography>
          <Typography variant="caption" sx={{ display: "block" }}>
            Only collaborators have access
          </Typography>
        </MenuItem>
        <MenuItem value={1} sx={menuItemStyles}>
          <Typography variant="body1" sx={{ fontWeight: "bold", display: "block" }}>
            Anyone with link&nbsp;
          </Typography>
          <Typography variant="caption" sx={{ display: "block" }}>
            Anyone on the Internet can access
          </Typography>
        </MenuItem>
      </Select>

      <Select
        value={generalAccessRole}
        onChange={(e) => setGeneralAccessRole(parseInt(e.target.value, 10))}
        disabled={disabled}
        sx={{
          ...(disabled ? selectStylesDisabled : selectStyles),
          minHeight: isWrapped ? "auto" : "68px",
          marginLeft: isWrapped ? "0px" : "-2px",
          marginTop: isWrapped ? "-1px" : "0px",
          width: isWrapped ? "100%" : "185px",
          "& .MuiOutlinedInput-notchedOutline": {
            borderTopLeftRadius: isWrapped ? "0px" : "0px",
            borderTopRightRadius: isWrapped ? "0px" : "10px",
            borderBottomLeftRadius: isWrapped ? "10px" : "0px",
            borderBottomRightRadius: isWrapped ? "10px" : "10px",
            border: "2px solid var(--borderInput)",
          },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              borderRadius: "10px",
              "& .MuiMenu-list": {
                padding: 0,
              },
            },
          },
        }}
        IconComponent={(props) => (
          <KeyboardArrowDownRoundedIcon sx={{ color: "var(--color-white) !important" }} />
        )}
      >
        {generalAccessRoles.map((roleOption) => (
          <MenuItem key={roleOption.value} value={roleOption.value} sx={menuItemStyles}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ marginRight: "10px" }}>{roleOption.icon}</div>
              {roleOption.label}
            </div>
          </MenuItem>
        ))}
      </Select>
    </div>
  );
};

// Custom Switch Component for reusability
export const CustomSwitch = ({ label, checked, onChange, disabled }) => (
  <Box
    className="customSwitchContainer"
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      marginBottom: "0.8rem",
    }}
  >
    <Typography className="switchLabel">{label}</Typography>

    <Switch
      checked={checked}
      onChange={onChange}
      color="warning"
      sx={switchStyles}
      disabled={disabled}
    />
  </Box>
);

// Inactivity Setting Component for input fields
const InactivitySetting = ({ label, value, onChange, options, disabled }) => (
  <Box className="inactivitySettings">
    <Typography sx={{ fontSize: "0.95rem" }}>{label}</Typography>
    <Select
      value={value}
      onChange={onChange}
      className="inactivityTextField"
      sx={{
        ...(!disabled ? selectStyles : selectStylesDisabled),
        marginTop: "10px",
        "&.Mui-disabled .MuiSelect-select": {
          color: "var(--color-white)",
          WebkitTextFillColor: "var(--color-white)",
          padding: 0,
        },
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            borderRadius: "10px",
            "& .MuiMenu-list": {
              padding: 0,
            },
          },
        },
      }}
      IconComponent={(props) => (
        <KeyboardArrowDownRoundedIcon sx={{ color: "var(--color-white) !important" }} />
      )}
      disabled={disabled}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value} sx={menuItemStyles}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  </Box>
);
