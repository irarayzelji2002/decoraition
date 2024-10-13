import * as React from "react";
import { useState } from "react";
import { Button, FormControlLabel, FormGroup, Slider, Switch, Typography } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

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

export default function Notifications() {
  const [allowPushNotifications, setAllowPushNotifications] = useState(true);
  const [deleteNotifications, setDeleteNotifications] = useState(true);
  const [deleteReadNotifications, setDeleteReadNotifications] = useState(15);

  const [commentNotifications, setCommentNotifications] = useState({
    mentioned: true,
    newCommentOwner: true,
    newCommentEditor: true,
    resolvedOwner: true,
    resolvedEditor: true,
  });
  const [timelineNotifications, setTimelineNotifications] = useState(false);
  const [designNotifications, setDesignNotifications] = useState({
    renamed: true,
    inactive: true,
    deleted: true,
    roleChanged: true,
  });
  const [projectNotifications, setProjectNotifications] = useState({
    renamed: true,
    inactive: true,
    deleted: true,
    roleChanged: true,
  });

  const handleCommentNotificationChange = (name, value) => {
    setCommentNotifications({
      ...commentNotifications,
      [name]: value,
    });
  };
  const handleDesignNotificationChange = (name, value) => {
    setDesignNotifications({
      ...designNotifications,
      [name]: value,
    });
  };
  const handleProjectNotificationChange = (name, value) => {
    setProjectNotifications({
      ...projectNotifications,
      [name]: value,
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <div>
        <Typography
          variant="h6"
          gutterBottom
          style={{ color: "var(--color-white)", fontWeight: "bold" }}
        >
          Notification preferences
        </Typography>
        <FormGroup>
          <FormControlLabel
            label="Allow push notifications"
            control={
              <Switch
                checked={allowPushNotifications}
                onChange={(event) => setAllowPushNotifications(event.target.checked)}
                aria-label="Allow push notifications"
              />
            }
          />
          <FormControlLabel
            label="Enable deletion of notifications"
            control={
              <Switch
                checked={deleteNotifications}
                onChange={(event) => setDeleteNotifications(event.target.checked)}
                aria-label="Enable deletion of notifications"
              />
            }
          />
          <Typography
            variant="h6"
            gutterBottom
            style={{ color: "var(--color-white)", fontWeight: "bold" }}
          >
            Delete read notifications after how many days?
          </Typography>
          <Slider
            value={deleteReadNotifications}
            onChange={(event, newValue) => setDeleteReadNotifications(newValue)}
            aria-labelledby="delete-read-notifications-slider"
            valueLabelDisplay="auto"
            min={1}
            max={30}
            sx={{
              color: "var(--slider)", // Slider color
              "& .MuiSlider-thumb": {
                background: "var(--gradientCircle)", // Gradient thumb
              },
              "& .MuiSlider-track": {
                backgroundColor: "var(--slider)", // Track color
              },
              "& .MuiSlider-rail": {
                backgroundColor: "var(--slider)", // Rail color
              },
            }}
          />
        </FormGroup>

        <Typography
          variant="h6"
          gutterBottom
          style={{ color: "var(--color-white)", fontWeight: "bold" }}
        >
          Comment notification preferences
        </Typography>
        <FormGroup>
          <FormControlLabel
            label="Mentioned in a comment or reply"
            control={
              <Switch
                checked={commentNotifications.mentioned}
                onChange={(event) =>
                  handleCommentNotificationChange("mentioned", event.target.checked)
                }
                aria-label="Mentioned in a comment or reply"
              />
            }
          />
          <FormControlLabel
            label="A new comment or reply if I'm the owner"
            control={
              <Switch
                checked={commentNotifications.newCommentOwner}
                onChange={(event) =>
                  handleCommentNotificationChange("newCommentOwner", event.target.checked)
                }
                aria-label="A new comment or reply if I'm the owner"
              />
            }
          />
          <FormControlLabel
            label="A new comment or reply if I'm an editor or commenter"
            control={
              <Switch
                checked={commentNotifications.newCommentEditor}
                onChange={(event) =>
                  handleCommentNotificationChange("newCommentEditor", event.target.checked)
                }
                aria-label="A new comment or reply if I'm an editor or commenter"
              />
            }
          />
          <FormControlLabel
            label="Comment is resolved or reopened if I'm the owner"
            control={
              <Switch
                checked={commentNotifications.resolvedOwner}
                onChange={(event) =>
                  handleCommentNotificationChange("resolvedOwner", event.target.checked)
                }
                aria-label="Comment is resolved or reopened if I'm the owner"
              />
            }
          />
          <FormControlLabel
            label="Comment is resolved or reopened if I'm an editor or commenter"
            control={
              <Switch
                checked={commentNotifications.resolvedEditor}
                onChange={(event) =>
                  handleCommentNotificationChange("resolvedEditor", event.target.checked)
                }
                aria-label="Comment is resolved or reopened if I'm an editor or commenter"
              />
            }
          />
        </FormGroup>

        <Typography
          variant="h6"
          gutterBottom
          style={{ color: "var(--color-white)", fontWeight: "bold" }}
        >
          Timeline notification preferences
        </Typography>
        <FormGroup>
          <FormControlLabel
            label="Calendar event reminders"
            control={
              <Switch
                checked={timelineNotifications}
                onChange={(event) => setTimelineNotifications(event.target.checked)}
                aria-label="Calendar event reminders"
              />
            }
          />
        </FormGroup>

        <Typography
          variant="h6"
          gutterBottom
          style={{ color: "var(--color-white)", fontWeight: "bold" }}
        >
          Design notification preferences
        </Typography>
        <FormGroup>
          <FormControlLabel
            label="Design is renamed by a manager"
            control={
              <Switch
                checked={designNotifications.renamed}
                onChange={(event) =>
                  handleDesignNotificationChange("renamed", event.target.checked)
                }
                aria-label="Design is renamed by a manager"
              />
            }
          />
          <FormControlLabel
            label="Design will be or is in inactive mode"
            control={
              <Switch
                checked={designNotifications.inactive}
                onChange={(event) =>
                  handleDesignNotificationChange("inactive", event.target.checked)
                }
                aria-label="Design will be or is in inactive mode"
              />
            }
          />
          <FormControlLabel
            label="Design will be or is deleted"
            control={
              <Switch
                checked={designNotifications.deleted}
                onChange={(event) =>
                  handleDesignNotificationChange("deleted", event.target.checked)
                }
                aria-label="Design will be or is deleted"
              />
            }
          />
          <FormControlLabel
            label="Your role in the design is changed by an owner or editor"
            control={
              <Switch
                checked={designNotifications.roleChanged}
                onChange={(event) =>
                  handleDesignNotificationChange("roleChanged", event.target.checked)
                }
                aria-label="Your role in the design is changed by an owner or editor"
              />
            }
          />
        </FormGroup>

        <Typography
          variant="h6"
          gutterBottom
          style={{ color: "var(--color-white)", fontWeight: "bold" }}
        >
          Project notification preferences
        </Typography>
        <FormGroup>
          <FormControlLabel
            label="Project is renamed by a manager"
            control={
              <Switch
                checked={projectNotifications.renamed}
                onChange={(event) =>
                  handleProjectNotificationChange("renamed", event.target.checked)
                }
                aria-label="Project is renamed by a manager"
              />
            }
          />
          <FormControlLabel
            label="Project will be or is in inactive mode"
            control={
              <Switch
                checked={projectNotifications.inactive}
                onChange={(event) =>
                  handleProjectNotificationChange("inactive", event.target.checked)
                }
                aria-label="Project will be or is in inactive mode"
              />
            }
          />
          <FormControlLabel
            label="Project will be or is deleted"
            control={
              <Switch
                checked={projectNotifications.deleted}
                onChange={(event) =>
                  handleProjectNotificationChange("deleted", event.target.checked)
                }
                aria-label="Project will be or is deleted"
              />
            }
          />
          <FormControlLabel
            label="Your role in the project is changed by an manager"
            control={
              <Switch
                checked={projectNotifications.roleChanged}
                onChange={(event) =>
                  handleProjectNotificationChange("roleChanged", event.target.checked)
                }
                aria-label="Your role in the project is changed by an manager"
              />
            }
          />

          <Button
            sx={{
              marginTop: "20px",
              marginBottom: "20px",
              backgroundImage: "var(--gradientButton)",
              color: "var(--color-white)",
              fontWeight: "bold",
              borderRadius: "20px",
              textTransform: "none",
              "&:hover": {
                backgroundImage: "var(--gradientButtonHover)",
              },
            }}
          >
            Save Settings
          </Button>
        </FormGroup>
      </div>
    </ThemeProvider>
  );
}
