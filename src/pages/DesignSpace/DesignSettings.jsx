import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TopBar from "../../components/TopBar";
import { db } from "../../firebase"; // Import your Firestore instance
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
import "../../css/designSettings.css"; // Import the CSS file
import PublicIcon from "@mui/icons-material/Public"; // Import the globe icon
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

function DesignSettings() {
  const { designId } = useParams(); // Get the designId parameter from the URL
  const [designName, setDesignName] = useState("");
  const [generalAccess, setGeneralAccess] = useState("Anyone with the link");
  const [allowDownload, setAllowDownload] = useState(false);
  const [allowHistory, setAllowHistory] = useState(false);
  const [allowMakeACopy, setAllowMakeACopy] = useState(false);
  const [allowCopyByOwner, setAllowCopyByOwner] = useState(false);
  const [allowCopyByEditor, setAllowCopyByEditor] = useState(false);
  const [inactivityEnabled, setInactivityEnabled] = useState(false);
  const [inactivityDays, setInactivityDays] = useState(90);
  const [deletionDays, setDeletionDays] = useState(30);
  const [notifyDays, setNotifyDays] = useState(7);
  const [activeTab, setActiveTab] = useState("Project"); // Default active tab

  useEffect(() => {
    // Fetch the design name based on the designId
    const fetchDesignName = async () => {
      try {
        const designDoc = await getDoc(doc(db, "designs", designId));
        if (designDoc.exists()) {
          setDesignName(designDoc.data().name);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching design name:", error);
      }
    };

    fetchDesignName();
  }, [designId]);

  const handleTabChange = (tab) => {
    setActiveTab(tab); // Change active tab
  };

  return (
    <div>
      <TopBar state={`Design Settings for ${designName}`} />
      <SettingsContent
        generalAccess={generalAccess}
        setGeneralAccess={setGeneralAccess}
        allowDownload={allowDownload}
        setAllowDownload={setAllowDownload}
        allowHistory={allowHistory}
        setAllowHistory={setAllowHistory}
        allowMakeACopy={allowMakeACopy}
        setAllowMakeACopy={setAllowMakeACopy}
        allowCopyByOwner={allowCopyByOwner}
        setAllowCopyByOwner={setAllowCopyByOwner}
        allowCopyByEditor={allowCopyByEditor}
        setAllowCopyByEditor={setAllowCopyByEditor}
        inactivityEnabled={inactivityEnabled}
        setInactivityEnabled={setInactivityEnabled}
        inactivityDays={inactivityDays}
        setInactivityDays={setInactivityDays}
        deletionDays={deletionDays}
        setDeletionDays={setDeletionDays}
        notifyDays={notifyDays}
        setNotifyDays={setNotifyDays}
        activeTab={activeTab} // Pass activeTab to SettingsContent
        handleTabChange={handleTabChange} // Pass handleTabChange function
      />
    </div>
  );
}

export default DesignSettings;

const SettingsContent = ({
  generalAccess,
  setGeneralAccess,
  allowDownload,
  setAllowDownload,
  allowHistory,
  setAllowHistory,
  allowMakeACopy,
  setAllowMakeACopy,
  allowCopyByOwner,
  setAllowCopyByOwner,
  setAllowCopyByEditor,
  allowCopyByEditor,
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
          <PublicIcon sx={{ color: "var(--color-white)" }} />
        </Box>
        <Select
          value={generalAccess}
          onChange={(e) => setGeneralAccess(e.target.value)}
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
            value="Anyone with the link"
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
            Anyone with the link
          </MenuItem>
          <MenuItem
            value="Restricted"
            sx={{
              backgroundColor: "var(--bgColor)",
              color:
                generalAccess === "Restricted"
                  ? "var(--color-white)"
                  : "var(--color-grey)",
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
            Restricted
          </MenuItem>
        </Select>
      </Box>
      {/* Viewer Settings */}
      <Typography className="viewerSettingsTitle">Viewer settings</Typography>
      <FormControlLabel
        control={
          <Switch
            checked={allowDownload}
            onChange={(e) => setAllowDownload(e.target.checked)}
            color="warning"
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "var(--inputBg)",
              },
              "& .MuiSwitch-thumb": {
                backgroundImage: "var(--color-white)", // Apply gradient to the thumb
              },
              "& .MuiSwitch-track": {
                backgroundColor: "var(--inputBg)", // Track color
              },
            }}
          />
        }
        label="Allow to download"
        labelPlacement="start"
        className="viewerSettingsLabel"
      />{" "}
      {/* Allow to view history */}
      <FormControlLabel
        control={
          <Switch
            checked={allowHistory}
            onChange={(e) => setAllowHistory(e.target.checked)}
            color="warning"
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "var(--inputBg)",
              },
              "& .MuiSwitch-thumb": {
                backgroundImage: "var(--color-white)", // Apply gradient to the thumb
              },
              "& .MuiSwitch-track": {
                backgroundColor: "var(--inputBg)", // Track color
              },
            }}
          />
        }
        label="Allow to view history"
        labelPlacement="start"
        className="viewerSettingsLabel"
      />
      {/* Allow to make a copy */}
      <FormControlLabel
        control={
          <Switch
            checked={allowMakeACopy}
            onChange={(e) => setAllowMakeACopy(e.target.checked)}
            color="warning"
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "var(--inputBg)",
              },
              "& .MuiSwitch-thumb": {
                backgroundImage: "var(--color-white)", // Apply gradient to the thumb
              },
              "& .MuiSwitch-track": {
                backgroundColor: "var(--inputBg)", // Track color
              },
            }}
          />
        }
        label="Allow to make a copy"
        labelPlacement="start"
        className="viewerSettingsLabel"
      />
      {/* History Settings */}
      <Typography className="viewerSettingsTitle">History settings</Typography>
      <FormControlLabel
        control={
          <Switch
            checked={allowCopyByOwner}
            onChange={(e) => setAllowCopyByOwner(e.target.checked)}
            color="warning"
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "var(--inputBg)",
              },
              "& .MuiSwitch-thumb": {
                backgroundImage: "var(--color-white)", // Apply gradient to the thumb
              },
              "& .MuiSwitch-track": {
                backgroundColor: "var(--inputBg)", // Track color
              },
            }}
          />
        }
        label="Document copies made by owner"
        labelPlacement="start"
        className="HistorySettingsLabel"
      />{" "}
      <FormControlLabel
        control={
          <Switch
            checked={allowCopyByEditor}
            onChange={(e) => setAllowCopyByEditor(e.target.checked)}
            color="warning"
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "var(--inputBg)",
              },
              "& .MuiSwitch-thumb": {
                backgroundImage: "var(--color-white)", // Apply gradient to the thumb
              },
              "& .MuiSwitch-track": {
                backgroundColor: "var(--inputBg)", // Track color
              },
            }}
          />
        }
        label="Document copies made by editor"
        labelPlacement="start"
        className="HistorySettingsLabel"
      />{" "}
      {/* General Access */}
      <div className="generalAccessTitle">Associated Project</div>
      <Box className="accessBox">
        <Select
          value={generalAccess}
          onChange={(e) => setGeneralAccess(e.target.value)}
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
            value="Anyone with the link"
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
            Select an existing project
          </MenuItem>
        </Select>
      </Box>
      {/* The following section is only for the Project tab */}
      {activeTab === "Project" && ( // Change this condition based on the active tab
        <>
          {/* Inactivity and Deletion */}
          <Typography className="inactivityTitle">
            Inactivity and deletion
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={inactivityEnabled}
                onChange={(e) => setInactivityEnabled(e.target.checked)}
                color="warning"
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "var(--inputBg)",
                  },
                  "& .MuiSwitch-thumb": {
                    backgroundImage: "var(--color-white)", // Apply gradient to the thumb
                  },
                  "& .MuiSwitch-track": {
                    backgroundColor: "var(--inputBg)", // Track color
                  },
                }}
              />
            }
            label="Enable inactivity and deletion"
            labelPlacement="start"
            className="inactivityLabel"
          />

          {/* Inactivity Settings */}
          {inactivityEnabled && (
            <>
              <Box className="inactivitySettings">
                <Typography>
                  Number of days before inactivity after user inactivity
                </Typography>
                <TextField
                  type="number"
                  value={inactivityDays}
                  onChange={(e) => setInactivityDays(e.target.value)}
                  className="inactivityTextField"
                  inputProps={{
                    style: {
                      backgroundColor: "var(--bgcolor)",
                      color: "var(--color-white)",
                    },
                  }}
                  sx={{
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
                      color: "var(--color-white)",
                    },
                  }}
                />
              </Box>

              <Box className="inactivitySettings">
                <Typography>
                  Number of days before deletion after project inactivity
                </Typography>
                <TextField
                  type="number"
                  value={deletionDays}
                  onChange={(e) => setDeletionDays(e.target.value)}
                  className="inactivityTextField"
                  inputProps={{
                    style: {
                      backgroundColor: "var(--bgcolor)",
                      color: "var(--color-white)",
                    },
                  }}
                  sx={{
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
                      color: "var(--color-white)",
                    },
                  }}
                />
              </Box>

              <Box className="inactivitySettings">
                <Typography>
                  Notify collaborators number of days prior to entering
                  inactivity mode and deletion
                </Typography>
                <TextField
                  type="number"
                  value={notifyDays}
                  onChange={(e) => setNotifyDays(e.target.value)}
                  className="inactivityTextField"
                  inputProps={{
                    style: {
                      backgroundColor: "var(--bgcolor)",
                      color: "var(--color-white)",
                    },
                  }}
                  sx={{
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
                      color: "var(--color-white)",
                    },
                  }}
                />
              </Box>
            </>
          )}
        </>
      )}
      {/* Save Button */}
      <Box className="saveButtonContainer">
        <Button className="saveButton">Save</Button>
      </Box>
    </div>
  </ThemeProvider>
);
