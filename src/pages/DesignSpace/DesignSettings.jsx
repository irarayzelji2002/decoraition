import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import deepEqual from "deep-equal";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { showToast } from "../../functions/utils";
import TopBar from "../../components/TopBar";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  Typography,
  Box,
  Switch,
  TextField,
  Button,
  FormControlLabel,
  MenuItem,
  Select,
} from "@mui/material";
import "../../css/designSettings.css";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import PublicOffRoundedIcon from "@mui/icons-material/PublicOffRounded";
import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  components: {
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "& .MuiSwitch-thumb": {
            backgroundColor: "var(--color-white)", // Color of the switch thumb
          },
          "&.Mui-checked .MuiSwitch-thumb": {
            backgroundImage: "var(--gradientCircle)", // Color when checked
          },
          "&.Mui-checked + .MuiSwitch-track": {
            backgroundColor: "var(--inputBg)", // Track color when checked
          },
        },
        track: {
          backgroundColor: "var(--inputBg)", // Track color
        },
      },
    },
  },
});

const DesignSettings = () => {
  const { user, designs, userDesigns } = useSharedProps();
  const { designId } = useParams({}); // Get the designId parameter from the URL
  const [design, setDesign] = useState();
  const [designName, setDesignName] = useState(design?.designName ?? "Untitled Design");
  const [generalAccessSetting, setGeneralAccessSetting] = useState(
    design?.designSettings?.generalAccessSetting ?? 1
  ); //0 for Restricted, 1 for Anyone with the link
  const [generalAccessRole, setGeneralAccessRole] = useState(
    design?.designSettings?.generalAccessRole ?? 0
  ); //0 for viewer, 1 for editor, 2 for owner
  const [allowDownload, setAllowDownload] = useState(design?.designSettings?.allowDownload ?? true);
  const [allowViewHistory, setAllowViewHistory] = useState(
    design?.designSettings?.allowViewHistory ?? true
  );
  const [allowCopy, setAllowCopy] = useState(design?.designSettings?.allowCopy ?? true);
  const [documentCopyByOwner, setDocumentCopyByOwner] = useState(
    design?.designSettings?.documentCopyByOwner ?? true
  );
  const [documentCopyByEditor, setDocumentCopyByEditor] = useState(
    design?.designSettings?.documentCopyByEditor ?? true
  );
  const [inactivityEnabled, setInactivityEnabled] = useState(
    design?.designSettings?.inactivityEnabled ?? true
  );
  const [inactivityDays, setInactivityDays] = useState(
    design?.designSettings?.inactivityDays ?? 30
  );
  const [deletionDays, setDeletionDays] = useState(design?.designSettings?.deletionDays ?? 30);
  const [notifyDays, setNotifyDays] = useState(design?.designSettings?.notifyDays ?? 7);
  const [activeTab, setActiveTab] = useState("Design"); // Default active tab

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (designId && userDesigns.length > 0) {
      setLoading(true);
      const fetchedDesign = userDesigns.find((design) => design.id === designId);

      if (!fetchedDesign) {
        console.error("Design not found.");
      } else {
        setDesign(fetchedDesign);
        setDesignName(fetchedDesign?.designName ?? "Untitled Design");
        setGeneralAccessSetting(fetchedDesign?.designSettings?.generalAccessSetting ?? 1);
        setGeneralAccessRole(fetchedDesign?.designSettings?.generalAccessRole ?? 0);
        setAllowDownload(fetchedDesign?.designSettings?.allowDownload ?? true);
        setAllowViewHistory(fetchedDesign?.designSettings?.allowViewHistory ?? true);
        setAllowCopy(fetchedDesign?.designSettings?.allowCopy ?? true);
        setDocumentCopyByOwner(fetchedDesign?.designSettings?.documentCopyByOwner ?? true);
        setDocumentCopyByEditor(fetchedDesign?.designSettings?.documentCopyByEditor ?? true);
        setInactivityEnabled(fetchedDesign?.designSettings?.inactivityEnabled ?? true);
        setInactivityDays(fetchedDesign?.designSettings?.inactivityDays ?? 30);
        setDeletionDays(fetchedDesign?.designSettings?.deletionDays ?? 30);
        setNotifyDays(fetchedDesign?.designSettings?.notifyDays ?? 7);
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (designId && userDesigns.length > 0) {
      const fetchedDesign = userDesigns.find((design) => design.id === designId);

      if (!fetchedDesign) {
        console.error("Design not found.");
      } else if (!deepEqual(design, fetchedDesign)) {
        setDesign(fetchedDesign);
        setDesignName(fetchedDesign?.designName ?? "Untitled Design");
        setGeneralAccessSetting(fetchedDesign?.designSettings?.generalAccessSetting ?? 1);
        setGeneralAccessRole(fetchedDesign?.designSettings?.generalAccessRole ?? 0);
        setAllowDownload(fetchedDesign?.designSettings?.allowDownload ?? true);
        setAllowViewHistory(fetchedDesign?.designSettings?.allowViewHistory ?? true);
        setAllowCopy(fetchedDesign?.designSettings?.allowCopy ?? true);
        setDocumentCopyByOwner(fetchedDesign?.designSettings?.documentCopyByOwner ?? true);
        setDocumentCopyByEditor(fetchedDesign?.designSettings?.documentCopyByEditor ?? true);
        setInactivityEnabled(fetchedDesign?.designSettings?.inactivityEnabled ?? true);
        setInactivityDays(fetchedDesign?.designSettings?.inactivityDays ?? 30);
        setDeletionDays(fetchedDesign?.designSettings?.deletionDays ?? 30);
        setNotifyDays(fetchedDesign?.designSettings?.notifyDays ?? 7);
      }
    }
  }, [designId, userDesigns]);

  const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

  const handleSaveDesignSettings = async () => {
    try {
      const updatedSettings = {
        generalAccessSetting: generalAccessSetting,
        generalAccessRole: generalAccessRole,
        allowDownload: allowDownload,
        allowViewHistory: allowViewHistory,
        allowCopy: allowCopy,
        documentCopyByOwner: documentCopyByOwner,
        documentCopyByEditor: documentCopyByEditor,
        inactivityEnabled: inactivityEnabled,
        inactivityDays: inactivityDays,
        deletionDays: deletionDays,
        notifyDays: notifyDays,
      };
      console.log("updatedSettings", updatedSettings);

      const response = await axios.put(
        `/api/design/${designId}/update-settings`,
        {
          designSettings: updatedSettings,
        },
        {
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
        }
      );

      if (response.status === 200) {
        showToast("success", "Design settings updated successfully");
      }
    } catch (error) {
      console.error("Failed to update design settings:", error);
      showToast("error", "Failed to update design settings");
    }
  };

  return (
    <div>
      <TopBar state={`Design Settings for ${designName}`} />
      <SettingsContent
        generalAccessSetting={generalAccessSetting}
        setGeneralAccessSetting={setGeneralAccessSetting}
        generalAccessRole={generalAccessRole}
        setGeneralAccessRole={setGeneralAccessRole}
        allowDownload={allowDownload}
        setAllowDownload={setAllowDownload}
        allowViewHistory={allowViewHistory}
        setAllowViewHistory={setAllowViewHistory}
        allowCopy={allowCopy}
        setAllowCopy={setAllowCopy}
        documentCopyByOwner={documentCopyByOwner}
        setDocumentCopyByOwner={setDocumentCopyByOwner}
        documentCopyByEditor={documentCopyByEditor}
        setDocumentCopyByEditor={setDocumentCopyByEditor}
        inactivityEnabled={inactivityEnabled}
        setInactivityEnabled={setInactivityEnabled}
        inactivityDays={inactivityDays}
        setInactivityDays={setInactivityDays}
        deletionDays={deletionDays}
        setDeletionDays={setDeletionDays}
        notifyDays={notifyDays}
        setNotifyDays={setNotifyDays}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        handleSaveDesignSettings={handleSaveDesignSettings}
      />
    </div>
  );
};

export default DesignSettings;

const SettingsContent = ({
  generalAccessSetting,
  setGeneralAccessSetting,
  generalAccessRole,
  setGeneralAccessRole,
  allowDownload,
  setAllowDownload,
  allowViewHistory,
  setAllowViewHistory,
  allowCopy,
  setAllowCopy,
  documentCopyByOwner,
  setDocumentCopyByOwner,
  setDocumentCopyByEditor,
  documentCopyByEditor,
  inactivityEnabled,
  setInactivityEnabled,
  inactivityDays,
  setInactivityDays,
  deletionDays,
  setDeletionDays,
  notifyDays,
  setNotifyDays,
  activeTab,
  handleTabChange,
  handleSaveDesignSettings,
}) => (
  <ThemeProvider theme={theme}>
    <div className="settingsContainer">
      {/* Tab Navigation */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      ></Box>
      {/* General Access */}
      <div className="generalAccessTitle">General Access</div>
      <Box className="accessBox">
        <Box className="accessIcon">
          {generalAccessSetting === 1 ? (
            <PublicRoundedIcon sx={{ color: "var(--color-white)" }} />
          ) : (
            generalAccessSetting === 0 && (
              <PublicOffRoundedIcon sx={{ color: "var(--color-white)" }} />
            )
          )}
        </Box>
        <Select
          value={generalAccessSetting}
          onChange={(e) => setGeneralAccessSetting(parseInt(e.target.value, 10))}
          className="accessSelect"
          sx={selectStyles}
        >
          <MenuItem value={0} sx={menuItemStyles}>
            <div>Restricted</div>
            <div>Only collaborators can access</div>
          </MenuItem>
          <MenuItem value={1} sx={menuItemStyles}>
            <div>Anyone with the link</div>
            <div>Anyone on the internet can access</div>
          </MenuItem>
        </Select>
        <Select
          value={generalAccessRole}
          onChange={(e) => setGeneralAccessRole(parseInt(e.target.value, 10))}
          className="accessSelect"
          sx={{
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--borderInput)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--bright-grey)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--bright-grey)",
            },
            "& .MuiSelect-select": {
              color: "var(--color-white)",
            },
            "& .MuiSvgIcon-root": {
              color: "var(--color-white)", // Set the arrow icon color to white
            },
          }}
        >
          <MenuItem
            value={0}
            sx={{
              backgroundColor: "var(--bgColor)",
              color: "var(--color-white)",
              "&:hover": {
                backgroundColor: "var(--dropdownHover)",
                color: "var(--color-white)",
              },
              "&.Mui-selected": {
                backgroundColor: "var(--dropdownSelected)",
                color: "var(--color-white)",
              },
            }}
          >
            <div>Viewer</div>
          </MenuItem>
          <MenuItem
            value={1}
            sx={{
              backgroundColor: "var(--bgColor)",
              color: "var(--color-white)",
              "&.Mui-selected": {
                backgroundColor: "var(--dropdownSelected)",
                color: "var(--color-white)",
              },
            }}
          >
            <div>Editor</div>
          </MenuItem>
          <MenuItem
            value={2}
            sx={{
              backgroundColor: "var(--bgColor)",
              color: generalAccessSetting === 0 ? "var(--color-white)" : "var(--color-grey)",
              "&:hover": {
                backgroundColor: "var(--dropdownHover)",
                color: "var(--color-white)",
              },
              "&.Mui-selected": {
                backgroundColor: "var(--dropdownSelected)",
                color: "var(--color-white)",
              },
            }}
          >
            <div>Owner</div>
          </MenuItem>
        </Select>
      </Box>
      {/* Viewer Settings */}
      <Typography className="viewerSettingsTitle">Viewer settings</Typography>
      <CustomSwitch
        label="Allow to download"
        checked={allowDownload}
        onChange={(e) => setAllowDownload(e.target.checked)}
      />
      {/* Allow to view history */}
      <CustomSwitch
        label="Allow to view history"
        checked={allowViewHistory}
        onChange={(e) => setAllowViewHistory(e.target.checked)}
      />
      {/* Allow to make a copy */}
      <CustomSwitch
        label="Allow to make a copy"
        checked={allowCopy}
        onChange={(e) => setAllowCopy(e.target.checked)}
      />
      {/* History Settings */}
      <Typography className="viewerSettingsTitle">History settings</Typography>
      <CustomSwitch
        label="Document copies made by owner"
        checked={documentCopyByOwner}
        onChange={(e) => setDocumentCopyByOwner(e.target.checked)}
      />
      <CustomSwitch
        label="Document copies made by editor"
        checked={documentCopyByEditor}
        onChange={(e) => setDocumentCopyByEditor(e.target.checked)}
      />
      {/* Inactivity and Deletion */}
      <Typography className="inactivityTitle">Inactivity and deletion</Typography>
      <CustomSwitch
        label="Enable inactivity and deletion"
        checked={inactivityEnabled}
        onChange={(e) => setInactivityEnabled(e.target.checked)}
      />
      {/* Inactivity Settings */}
      {inactivityEnabled && (
        <>
          <InactivitySetting
            label="Number of days before inactivity after user inactivity"
            value={inactivityDays}
            onChange={(e) => setInactivityDays(parseInt(e.target.value, 10))}
          />
          <InactivitySetting
            label="Number of days before deletion after design inactivity"
            value={deletionDays}
            onChange={(e) => setDeletionDays(parseInt(e.target.value, 10))}
          />
          <InactivitySetting
            label="Notify collaborators number of days prior to entering inactivity mode and deletion"
            value={notifyDays}
            onChange={(e) => setNotifyDays(parseInt(e.target.value, 10))}
          />
        </>
      )}
      {/* Save Button */}
      <Box className="saveButtonContainer">
        <Button className="saveButton" onClick={handleSaveDesignSettings}>
          Save
        </Button>
      </Box>
    </div>
  </ThemeProvider>
);

// Custom Switch Component for reusability
const CustomSwitch = ({ label, checked, onChange }) => (
  <Box
    className="customSwitchContainer"
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      marginBottom: "1rem",
    }}
  >
    <Typography className="switchLabel">{label}</Typography>
    <Switch checked={checked} onChange={onChange} color="warning" sx={switchStyles} />
  </Box>
);

// Inactivity Setting Component for input fields
const InactivitySetting = ({ label, value, onChange }) => (
  <Box className="inactivitySettings">
    <Typography>{label}</Typography>
    <TextField
      type="number"
      value={value}
      onChange={onChange}
      className="inactivityTextField"
      inputProps={textFieldInputProps}
      sx={textFieldStyles}
    />
  </Box>
);

// Reusable styles for MenuItem
const menuItemStyles = {
  backgroundColor: "var(--bgColor)",
  color: "var(--color-white)",
  "&:hover": {
    backgroundColor: "var(--dropdownHover)",
    color: "var(--color-white)",
  },
  "&.Mui-selected": {
    backgroundColor: "var(--dropdownSelected)",
    color: "var(--color-white)",
  },
};

// Styles for Switch
const switchStyles = {
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "var(--inputBg)",
  },
  "& .MuiSwitch-thumb": {
    backgroundImage: "var(--color-white)",
  },
  "& .MuiSwitch-track": {
    backgroundColor: "var(--inputBg)",
  },
};

// Styles for Select
const selectStyles = {
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--inputBg)",
    borderWidth: 2, // border thickness
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--bright-grey)", //  hover
  },
  "& .MuiSelect-select": {
    color: "var(--color-white)", //
  },

  "& .MuiSelect-icon": {
    color: "var(--color-white)", // dropdown arrow icon color to white
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--bright-grey)", // focused state
  },
};

// Styles for TextField
const textFieldStyles = {
  "& .MuiOutlinedInput-notchedOutline": {
    borderWidth: 2, // border thickness
  },
  "& .MuiOutlinedInput-root": {
    borderColor: "var(--borderInput)",

    "& fieldset": {
      borderColor: "var(--borderInput)",
    },
    "&:hover fieldset": {
      borderColor: "var(--bright-grey)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "var(--bright-grey)",
    },
  },
  "& input": {
    color: "var(--color-white)", // input text color
  },
};

const textFieldInputProps = {
  style: { color: "var(--color-white)" }, // Input text color
};
