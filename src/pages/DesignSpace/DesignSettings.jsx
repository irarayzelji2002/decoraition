import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
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
import "../../css/designSettings.css";
import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material/styles";
import {
  EditorIcon,
  CommenterIcon,
  ViewerIcon as DesignViewerIcon,
  RestrictedIcon,
  AnyoneWithLinkIcon,
} from "./svg/DesignAccessIcons";

export const theme = createTheme({
  components: {
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "& .MuiSwitch-thumb": {
            backgroundColor: "var(--color-white)",
          },
          "&.Mui-checked .MuiSwitch-thumb": {
            backgroundImage: "var(--gradientCircle)",
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

const DesignSettings = () => {
  const { user, userDoc, userDesigns } = useSharedProps();
  const { designId } = useParams({}); // Get the designId parameter from the URL
  const [design, setDesign] = useState({});
  const [designName, setDesignName] = useState("Untitled Design");
  const [generalAccessSetting, setGeneralAccessSetting] = useState(0); //0 for Restricted, 1 for Anyone with the link
  const [generalAccessRole, setGeneralAccessRole] = useState(0); //0 for viewer, 1 for editor, 2 for commenter, 3 for owner
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowViewHistory, setAllowViewHistory] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);
  const [documentCopyByOwner, setDocumentCopyByOwner] = useState(true);
  const [documentCopyByEditor, setDocumentCopyByEditor] = useState(true);
  const [inactivityEnabled, setInactivityEnabled] = useState(true);
  const [inactivityDays, setInactivityDays] = useState(30);
  const [deletionDays, setDeletionDays] = useState(30);
  const [notifyDays, setNotifyDays] = useState(7);
  const [activeTab, setActiveTab] = useState("Design"); // Default active tab

  const [loading, setLoading] = useState(true);
  const [allowEdit, setAllowEdit] = useState(false);

  useEffect(() => {
    if (designId && userDesigns.length > 0) {
      const fetchedDesign = userDesigns.find((design) => design.id === designId);

      if (!fetchedDesign) {
        console.error("Design not found.");
      } else if (Object.keys(design).length === 0 || !deepEqual(design, fetchedDesign)) {
        setDesign(fetchedDesign);
        setDesignName(fetchedDesign?.designName ?? "Untitled Design");
        setGeneralAccessSetting(fetchedDesign?.designSettings?.generalAccessSetting ?? 0);
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
        console.log("fetchedDesign.designSettings", fetchedDesign?.designSettings);
      }
    }
    setLoading(false);
  }, [designId, userDesigns]);

  useEffect(() => {
    if (!design || !user || !userDoc) return;

    let newRole = 0;

    // First check if restricted access
    if (design?.designSettings?.generalAccessSetting === 0) {
      // Only check explicit roles
      if (userDoc.id === design.owner) newRole = 3;
      else if (design.editors?.includes(userDoc.id)) newRole = 1;
      else if (design.commenters?.includes(userDoc.id)) newRole = 2;
      else if (design.viewers?.includes(userDoc.id)) newRole = 0;
    } else {
      // Anyone with link - check both explicit roles and general access
      if (userDoc.id === design.owner) newRole = 3;
      else if (
        design.editors?.includes(userDoc.id) ||
        design?.designSettings?.generalAccessRole === 1
      )
        newRole = 1;
      else if (
        design.commenters?.includes(userDoc.id) ||
        design?.designSettings?.generalAccessRole === 2
      )
        newRole = 2;
      else newRole = design?.designSettings?.generalAccessRole ?? 0;
    }

    // Set role and all dependent flags
    setAllowEdit(newRole === 1 || newRole === 3); // editor or owner
  }, [design, user, userDoc]);

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

  const getAccessRoleText = (generalAccessRole) => {
    switch (generalAccessRole) {
      case 1:
        return "an editor";
      case 2:
        return "a commenter";
      default:
        return "a viewer";
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!design) {
    return <div>Design not found. Please reload or navigate to this design again.</div>;
  }

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
        handleSaveDesignSettings={handleSaveDesignSettings}
        allowEdit={allowEdit}
      />
    </div>
  );
};

export default DesignSettings;

const SettingsContent = ({
  generalAccessSetting = 0,
  setGeneralAccessSetting = () => {},
  generalAccessRole = 0,
  setGeneralAccessRole = () => {},
  allowDownload = true,
  setAllowDownload = () => {},
  allowViewHistory = true,
  setAllowViewHistory = () => {},
  allowCopy = true,
  setAllowCopy = () => {},
  documentCopyByOwner = true,
  setDocumentCopyByOwner = () => {},
  documentCopyByEditor = true,
  setDocumentCopyByEditor = () => {},
  inactivityEnabled = true,
  setInactivityEnabled = () => {},
  inactivityDays = 30,
  setInactivityDays = () => {},
  deletionDays = 30,
  setDeletionDays = () => {},
  notifyDays = 7,
  setNotifyDays = () => {},
  handleSaveDesignSettings = () => {},
  allowEdit = false,
}) => (
  <ThemeProvider theme={theme}>
    <div className="settingsContainer">
      {/* General Access */}
      <div className="generalAccessTitle">General access</div>
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
      <Typography className="viewerSettingsTitle">Viewer settings</Typography>
      <CustomSwitch
        label="Allow to download"
        checked={allowDownload}
        onChange={(e) => setAllowDownload(e.target.checked)}
        disabled={!allowEdit}
      />
      {/* Allow to view history */}
      <CustomSwitch
        label="Allow to view history"
        checked={allowViewHistory}
        onChange={(e) => setAllowViewHistory(e.target.checked)}
        disabled={!allowEdit}
      />
      {/* Allow to make a copy */}
      <CustomSwitch
        label="Allow to make a copy"
        checked={allowCopy}
        onChange={(e) => setAllowCopy(e.target.checked)}
        disabled={!allowEdit}
      />
      {/* History Settings */}
      <Typography className="viewerSettingsTitle">History settings</Typography>
      <CustomSwitch
        label="Document copies made by owner"
        checked={documentCopyByOwner}
        onChange={(e) => setDocumentCopyByOwner(e.target.checked)}
        disabled={!allowEdit}
      />
      <CustomSwitch
        label="Document copies made by editor"
        checked={documentCopyByEditor}
        onChange={(e) => setDocumentCopyByEditor(e.target.checked)}
        disabled={!allowEdit}
      />
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
              { value: 15, label: "15 days" },
              { value: 30, label: "30 days" },
              { value: 45, label: "45 days" },
              { value: 60, label: "60 days" },
            ]}
            disabled={!allowEdit}
          />
          <InactivitySetting
            label="Number of days before deletion after design inactivity"
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
      {/* Save Button */}
      {allowEdit && (
        <Box className="saveButtonContainer">
          <Button
            variant="contained"
            onClick={handleSaveDesignSettings}
            sx={{
              background: "var(--gradientButton)",
              borderRadius: "20px",
              color: "var(--color-white)",
              fontWeight: "bold",
              textTransform: "none",
              paddingLeft: "100px",
              paddingRight: "100px",
              margin: "0px 10px",
              "&:hover": {
                background: "var(--gradientButtonHover)",
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
              paddingLeft: "100px",
              paddingRight: "100px",
              margin: "0px 10px",
            }}
            onMouseOver={(e) =>
              (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButtonHover)")
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
    { value: 0, label: "Viewer", icon: <DesignViewerIcon /> },
    { value: 2, label: "Commenter", icon: <CommenterIcon /> },
    { value: 1, label: "Editor", icon: <EditorIcon /> },
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
export const InactivitySetting = ({ label, value, onChange, options, disabled }) => (
  <Box className="inactivitySettings">
    <Typography sx={{ fontSize: "0.95rem" }}>{label}</Typography>
    {/* <TextField
      type="number"
      value={value}
      onChange={onChange}
      className="inactivityTextField"
      inputProps={textFieldInputProps}
      sx={!disabled ? textFieldStyles : disabledTextFieldStyles}
      disabled={disabled}
    /> */}
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

// Reusable styles for MenuItem
export const menuItemStyles = {
  color: "var(--color-white)",
  backgroundColor: "var(--dropdown)",
  transition: "all 0.3s ease",
  display: "block",
  "&:hover": {
    backgroundColor: "var(--dropdownHover) !important",
  },
  "&.Mui-selected": {
    backgroundColor: "var(--dropdownSelected) !important",
    color: "var(--color-white)",
    fontWeight: "bold",
  },
  "&.Mui-selected:hover": {
    backgroundColor: "var(--dropdownSelectedHover) !important",
  },
};

// Styles for Switch
export const switchStyles = {
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "var(--inputBg)",
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: "var(--color-white)",
    boxSizing: "border-box",
    width: 22,
    height: 22,
    position: "relative",
    top: "50%",
  },
  "& .MuiSwitch-track": {
    backgroundColor: "var(--inputBg)",
    borderRadius: 13, // Half the track height
    opacity: 1,
    transition: theme.transitions.create(["background-color"], {
      duration: 500,
    }),
  },
  width: 50,
  height: 28,
  padding: 0,
  "& .MuiSwitch-switchBase": {
    padding: "3px",
    transitionDuration: "300ms",
    "&.Mui-checked": {
      transform: "translateX(22px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        backgroundColor: "var(--inputBg)",
        opacity: 1,
        border: 0,
      },
      "&.Mui-disabled + .MuiSwitch-track": {
        opacity: 0.5,
      },
    },
    "&.Mui-focusVisible .MuiSwitch-thumb": {
      color: "#33cf4d",
      border: "6px solid #fff",
    },
    "&.Mui-disabled .MuiSwitch-thumb": {
      color: "var(--inputBg)",
      backgroundImage: "var(--gradientCircleDisabled)",
    },
    "&.Mui-disabled + .MuiSwitch-track": {
      opacity: 0.3,
    },
  },
};

// Styles for Select
export const selectStyles = {
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--borderInput)",
    borderWidth: 2,
    borderRadius: "10px",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--borderInput)",
  },
  "& .MuiSelect-select": {
    color: "var(--color-white)",
    WebkitTextFillColor: "var(--color-white)",
  },
  "& .MuiSelect-select.MuiInputBase-input": {
    padding: "12px 40px 12px 20px",
  },
  "& .MuiSelect-icon": {
    color: "var(--color-white)",
    WebkitTextFillColor: "var(--color-white)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--borderInput)",
  },
};

export const selectStylesDisabled = {
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
    borderWidth: 2,
    borderRadius: "10px",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
  },
  "& .MuiSelect-select": {
    color: "var(--color-white) !important",
    WebkitTextFillColor: "var(--color-white)",
    "&:focus": {
      color: "var(--color-white)",
    },
  },
  "& .MuiSelect-select.MuiInputBase-input": {
    padding: "12px 40px 12px 20px",
  },
  "& .MuiSelect-icon": {
    color: "var(--color-white)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
  },
  "&.Mui-disabled": {
    backgroundColor: "transparent",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "transparent",
    },
    "& .MuiSelect-icon": {
      color: "transparent",
    },
    "& .MuiSelect-select": {
      color: "var(--color-white)",
      WebkitTextFillColor: "var(--color-white)",
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
};

// Styles for TextField
export const textFieldStyles = {
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

export const textFieldInputProps = {
  style: { color: "var(--color-white)" }, // Input text color
};
