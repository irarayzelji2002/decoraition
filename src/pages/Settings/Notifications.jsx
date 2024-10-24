import React, { useState, useEffect } from "react";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import axios from "axios";
import { showToast } from "../../functions/utils";

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
  const { user, userDoc } = useSharedProps();
  const [allowNotif, setAllowNotif] = useState(userDoc?.notifSettings?.allowNotif ?? true);
  const [deleteNotif, setDeleteNotif] = useState(userDoc?.notifSettings?.deleteNotif ?? true);
  const [deleteNotifAfter, setDeleteNotifAfter] = useState(
    userDoc?.notifSettings?.deleteNotifAfter ?? 15
  );
  const [timeForCalEventReminder, setTimeForCalEventReminder] = useState(
    userDoc?.notifSettings?.timeForCalEventReminder ?? "0800"
  );
  const [commentNotifications, setCommentNotifications] = useState({
    mentionedInComment: userDoc?.notifSettings?.mentionedInComment ?? true,
    newCommentReplyAsOwner: userDoc?.notifSettings?.newCommentReplyAsOwner ?? true,
    newCommentReplyAsCollab: userDoc?.notifSettings?.newCommentReplyAsCollab ?? false,
    commentStatusChangeAsOwner: userDoc?.notifSettings?.commentStatusChangeAsOwner ?? true,
    commentStatusChangeAsCollab: userDoc?.notifSettings?.commentStatusChangeAsCollab ?? false,
  });
  const [calEventReminder, setCalEventReminder] = useState(
    userDoc?.notifSettings?.calEventReminder ?? true
  );
  const [designNotifications, setDesignNotifications] = useState({
    renamedDesign: userDoc?.notifSettings?.renamedDesign ?? true,
    inactiveDesign: userDoc?.notifSettings?.inactiveDesign ?? false,
    deletedDesign: userDoc?.notifSettings?.deletedDesign ?? false,
    changeRoleInDesign: userDoc?.notifSettings?.changeRoleInDesign ?? false,
  });
  const [projectNotifications, setProjectNotifications] = useState({
    renamedProject: userDoc?.notifSettings?.renamedProject ?? true,
    inactiveProject: userDoc?.notifSettings?.inactiveProject ?? false,
    deletedProject: userDoc?.notifSettings?.deletedProject ?? false,
    changeRoleInProject: userDoc?.notifSettings?.changeRoleInProject ?? false,
  });

  useEffect(() => {
    if (userDoc) {
      setAllowNotif(userDoc.notifSettings?.allowNotif ?? true);
      setDeleteNotif(userDoc.notifSettings?.deleteNotif ?? true);
      setDeleteNotifAfter(userDoc.notifSettings?.deleteNotifAfter ?? 15);
      setTimeForCalEventReminder(userDoc.notifSettings?.timeForCalEventReminder ?? "0800");
      setCommentNotifications({
        mentionedInComment: userDoc.notifSettings?.mentionedInComment ?? true,
        newCommentReplyAsOwner: userDoc.notifSettings?.newCommentReplyAsOwner ?? true,
        newCommentReplyAsCollab: userDoc.notifSettings?.newCommentReplyAsCollab ?? false,
        commentStatusChangeAsOwner: userDoc.notifSettings?.commentStatusChangeAsOwner ?? true,
        commentStatusChangeAsCollab: userDoc.notifSettings?.commentStatusChangeAsCollab ?? false,
      });
      setCalEventReminder(userDoc.notifSettings?.calEventReminder ?? true);
      setDesignNotifications({
        renamedDesign: userDoc.notifSettings?.renamedDesign ?? true,
        inactiveDesign: userDoc.notifSettings?.inactiveDesign ?? false,
        deletedDesign: userDoc.notifSettings?.deletedDesign ?? false,
        changeRoleInDesign: userDoc.notifSettings?.changeRoleInDesign ?? false,
      });
      setProjectNotifications({
        renamedProject: userDoc.notifSettings?.renamedProject ?? true,
        inactiveProject: userDoc.notifSettings?.inactiveProject ?? false,
        deletedProject: userDoc.notifSettings?.deletedProject ?? false,
        changeRoleInProject: userDoc.notifSettings?.changeRoleInProject ?? false,
      });
    }
  }, [userDoc]);

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

  const handleSaveChanges = async () => {
    try {
      const {
        mentionedInComment,
        newCommentReplyAsOwner,
        newCommentReplyAsCollab,
        commentStatusChangeAsOwner,
        commentStatusChangeAsCollab,
      } = commentNotifications;
      const { renamedDesign, inactiveDesign, deletedDesign, changeRoleInDesign } =
        designNotifications;
      const { renamedProject, inactiveProject, deletedProject, changeRoleInProject } =
        projectNotifications;

      const updatedSettings = {
        allowNotif,
        deleteNotif,
        deleteNotifAfter,
        timeForCalEventReminder,
        mentionedInComment,
        newCommentReplyAsOwner,
        newCommentReplyAsCollab,
        commentStatusChangeAsOwner,
        commentStatusChangeAsCollab,
        calEventReminder,
        renamedDesign,
        inactiveDesign,
        deletedDesign,
        changeRoleInDesign,
        renamedProject,
        inactiveProject,
        deletedProject,
        changeRoleInProject,
      };
      const idToken = await user.getIdToken();
      const response = await axios.put(
        "/api/user/update-notifications",
        {
          userId: userDoc.id,
          notifSettings: updatedSettings,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      if (response.status === 200) {
        // setUser({ ...user, notifSettings: response.data.notifSettings });
        console.log("Notification settings updated successfully");
        showToast("success", "Notification settings updated successfully!");
      }
    } catch (error) {
      console.error("Error updating notification settings:", error.response?.data || error.message);
      showToast("error", "Error updating notification settings. Please try again.");
    }
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
                checked={allowNotif}
                onChange={(event) => setAllowNotif(event.target.checked)}
                aria-label="Allow push notifications"
              />
            }
          />
          <FormControlLabel
            label="Enable deletion of notifications"
            control={
              <Switch
                checked={deleteNotif}
                onChange={(event) => setDeleteNotif(event.target.checked)}
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
            value={deleteNotifAfter}
            onChange={(event, newValue) => setDeleteNotifAfter(newValue)}
            aria-labelledby="delete-read-notifications-slider"
            valueLabelDisplay="auto"
            min={1}
            max={30}
            sx={{
              marginTop: "24px",
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
        {/* TO DO Region and Time of Notif */}
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
                checked={commentNotifications.mentionedInComment}
                onChange={(event) =>
                  handleCommentNotificationChange("mentionedInComment", event.target.checked)
                }
                aria-label="Mentioned in a comment or reply"
              />
            }
          />
          <FormControlLabel
            label="A new comment or reply if I'm the owner"
            control={
              <Switch
                checked={commentNotifications.newCommentReplyAsOwner}
                onChange={(event) =>
                  handleCommentNotificationChange("newCommentReplyAsOwner", event.target.checked)
                }
                aria-label="A new comment or reply if I'm the owner"
              />
            }
          />
          <FormControlLabel
            label="A new comment or reply if I'm an editor or commenter"
            control={
              <Switch
                checked={commentNotifications.newCommentReplyAsCollab}
                onChange={(event) =>
                  handleCommentNotificationChange("newCommentReplyAsCollab", event.target.checked)
                }
                aria-label="A new comment or reply if I'm an editor or commenter"
              />
            }
          />
          <FormControlLabel
            label="Comment is resolved or reopened if I'm the owner"
            control={
              <Switch
                checked={commentNotifications.commentStatusChangeAsOwner}
                onChange={(event) =>
                  handleCommentNotificationChange(
                    "commentStatusChangeAsOwner",
                    event.target.checked
                  )
                }
                aria-label="Comment is resolved or reopened if I'm the owner"
              />
            }
          />
          <FormControlLabel
            label="Comment is resolved or reopened if I'm an editor or commenter"
            control={
              <Switch
                checked={commentNotifications.commentStatusChangeAsCollab}
                onChange={(event) =>
                  handleCommentNotificationChange(
                    "commentStatusChangeAsCollab",
                    event.target.checked
                  )
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
                checked={calEventReminder}
                onChange={(event) => setCalEventReminder(event.target.checked)}
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
                checked={designNotifications.renamedDesign}
                onChange={(event) =>
                  handleDesignNotificationChange("renamedDesign", event.target.checked)
                }
                aria-label="Design is renamed by a manager"
              />
            }
          />
          <FormControlLabel
            label="Design will be or is in inactive mode"
            control={
              <Switch
                checked={designNotifications.inactiveDesign}
                onChange={(event) =>
                  handleDesignNotificationChange("inactiveDesign", event.target.checked)
                }
                aria-label="Design will be or is in inactive mode"
              />
            }
          />
          <FormControlLabel
            label="Design will be or is deleted"
            control={
              <Switch
                checked={designNotifications.deletedDesign}
                onChange={(event) =>
                  handleDesignNotificationChange("deletedDesign", event.target.checked)
                }
                aria-label="Design will be or is deleted"
              />
            }
          />
          <FormControlLabel
            label="Your role in the design is changed by an owner or editor"
            control={
              <Switch
                checked={designNotifications.changeRoleInDesign}
                onChange={(event) =>
                  handleDesignNotificationChange("changeRoleInDesign", event.target.checked)
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
                checked={projectNotifications.renamedProject}
                onChange={(event) =>
                  handleProjectNotificationChange("renamedProject", event.target.checked)
                }
                aria-label="Project is renamed by a manager"
              />
            }
          />
          <FormControlLabel
            label="Project will be or is in inactive mode"
            control={
              <Switch
                checked={projectNotifications.inactiveProject}
                onChange={(event) =>
                  handleProjectNotificationChange("inactiveProject", event.target.checked)
                }
                aria-label="Project will be or is in inactive mode"
              />
            }
          />
          <FormControlLabel
            label="Project will be or is deleted"
            control={
              <Switch
                checked={projectNotifications.deletedProject}
                onChange={(event) =>
                  handleProjectNotificationChange("deletedProject", event.target.checked)
                }
                aria-label="Project will be or is deleted"
              />
            }
          />
          <FormControlLabel
            label="Your role in the project is changed by an manager"
            control={
              <Switch
                checked={projectNotifications.changeRoleInProject}
                onChange={(event) =>
                  handleProjectNotificationChange("changeRoleInProject", event.target.checked)
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
            onClick={handleSaveChanges}
          >
            Save Settings
          </Button>
        </FormGroup>
      </div>
    </ThemeProvider>
  );
}
