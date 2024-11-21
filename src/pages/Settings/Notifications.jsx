import React, { useState, useEffect } from "react";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import axios from "axios";
import { showToast } from "../../functions/utils";
import {
  Box,
  Button,
  FormControlLabel,
  FormGroup,
  Slider,
  Switch,
  Typography,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { switchStyles } from "../DesignSpace/DesignSettings";
import { sliderStyles } from "../DesignSpace/SelectMaskCanvas";
import { gradientButtonStyles, outlinedButtonStyles } from "../DesignSpace/PromptBar";

const theme = createTheme({
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
  const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(false);

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

  const handleSaveChangesWithLoading = async () => {
    setIsSaveButtonDisabled(true);
    await handleSaveChanges();
    setIsSaveButtonDisabled(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <div>
        <Typography variant="h6" gutterBottom className="settingsTitle">
          Notification preferences
        </Typography>
        <FormGroup>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.8rem",
            }}
          >
            <Typography style={{ color: "var(--color-white)", marginRight: "20px" }}>
              Allow push notifications
            </Typography>
            <Switch
              checked={allowNotif}
              onChange={(event) => setAllowNotif(event.target.checked)}
              aria-label="Allow push notifications"
              color="warning"
              sx={switchStyles}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.8rem",
            }}
          >
            <Typography style={{ color: "var(--color-white)", marginRight: "20px" }}>
              Enable deletion of notifications
            </Typography>
            <Switch
              checked={deleteNotif}
              onChange={(event) => setDeleteNotif(event.target.checked)}
              aria-label="Enable deletion of notifications"
              color="warning"
              sx={switchStyles}
            />
          </div>

          <Typography variant="h6" gutterBottom className="settingsTitle">
            Delete read notifications after how many days?
          </Typography>
          <Slider
            value={deleteNotifAfter}
            onChange={(event, newValue) => setDeleteNotifAfter(newValue)}
            aria-labelledby="delete-read-notifications-slider"
            valueLabelDisplay="auto"
            min={1}
            max={30}
            defaultValue={15}
            sx={sliderStyles}
          />
        </FormGroup>
        {/* TO DO Region and Time of Notif */}
        <Typography variant="h6" gutterBottom className="settingsTitle">
          Comment notification preferences
        </Typography>
        <FormGroup>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.8rem",
            }}
          >
            <Typography style={{ color: "var(--color-white)", marginRight: "20px" }}>
              Mentioned in a comment or reply
            </Typography>
            <Switch
              checked={commentNotifications.mentionedInComment}
              onChange={(event) =>
                handleCommentNotificationChange("mentionedInComment", event.target.checked)
              }
              aria-label="Mentioned in a comment or reply"
              color="warning"
              sx={switchStyles}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.8rem",
            }}
          >
            <Typography style={{ color: "var(--color-white)", marginRight: "20px" }}>
              A new comment or reply if I'm the owner
            </Typography>
            <Switch
              checked={commentNotifications.newCommentReplyAsOwner}
              onChange={(event) =>
                handleCommentNotificationChange("newCommentReplyAsOwner", event.target.checked)
              }
              aria-label="A new comment or reply if I'm the owner"
              color="warning"
              sx={switchStyles}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.8rem",
            }}
          >
            <Typography style={{ color: "var(--color-white)", marginRight: "20px" }}>
              A new comment or reply if I'm an editor or commenter
            </Typography>
            <Switch
              checked={commentNotifications.newCommentReplyAsCollab}
              onChange={(event) =>
                handleCommentNotificationChange("newCommentReplyAsCollab", event.target.checked)
              }
              aria-label="A new comment or reply if I'm an editor or commenter"
              color="warning"
              sx={switchStyles}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.8rem",
            }}
          >
            <Typography style={{ color: "var(--color-white)", marginRight: "20px" }}>
              Comment is resolved or reopened if I'm the owner
            </Typography>
            <Switch
              checked={commentNotifications.commentStatusChangeAsOwner}
              onChange={(event) =>
                handleCommentNotificationChange("commentStatusChangeAsOwner", event.target.checked)
              }
              aria-label="Comment is resolved or reopened if I'm the owner"
              color="warning"
              sx={switchStyles}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.8rem",
            }}
          >
            <Typography style={{ color: "var(--color-white)", marginRight: "20px" }}>
              Comment is resolved or reopened if I'm an editor or commenter
            </Typography>
            <Switch
              checked={commentNotifications.commentStatusChangeAsCollab}
              onChange={(event) =>
                handleCommentNotificationChange("commentStatusChangeAsCollab", event.target.checked)
              }
              aria-label="Comment is resolved or reopened if I'm an editor or commenter"
              color="warning"
              sx={switchStyles}
            />
          </div>
        </FormGroup>
        <Typography variant="h6" gutterBottom className="settingsTitle">
          Timeline notification preferences
        </Typography>
        <FormGroup>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.8rem",
            }}
          >
            <Typography style={{ color: "var(--color-white)", marginRight: "20px" }}>
              Calendar event reminders
            </Typography>
            <Switch
              checked={calEventReminder}
              onChange={(event) => setCalEventReminder(event.target.checked)}
              aria-label="Calendar event reminders"
              color="warning"
              sx={switchStyles}
            />
          </div>
        </FormGroup>
        <Typography variant="h6" gutterBottom className="settingsTitle">
          Design notification preferences
        </Typography>
        <FormGroup>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.8rem",
            }}
          >
            <Typography style={{ color: "var(--color-white)", marginRight: "20px" }}>
              Design is renamed Project by a manager
            </Typography>
            <Switch
              checked={designNotifications.renamedDesign}
              onChange={(event) =>
                handleDesignNotificationChange("renamedDesign", event.target.checked)
              }
              aria-label="Design is renamed Project by a manager"
              color="warning"
              sx={switchStyles}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.8rem",
            }}
          >
            <Typography style={{ color: "var(--color-white)", marginRight: "20px" }}>
              Design will be or is in inactive mode
            </Typography>
            <Switch
              checked={designNotifications.inactiveDesign}
              onChange={(event) =>
                handleDesignNotificationChange("inactiveDesign", event.target.checked)
              }
              aria-label="Design will be or is in inactive mode"
              color="warning"
              sx={switchStyles}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.8rem",
            }}
          >
            <Typography style={{ color: "var(--color-white)", marginRight: "20px" }}>
              Design will be or is deleted
            </Typography>
            <Switch
              checked={designNotifications.deletedDesign}
              onChange={(event) =>
                handleDesignNotificationChange("deletedDesign", event.target.checked)
              }
              aria-label="Design will be or is deleted"
              color="warning"
              sx={switchStyles}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.8rem",
            }}
          >
            <Typography style={{ color: "var(--color-white)", marginRight: "20px" }}>
              Your role in the design is changed by an owner or editor
            </Typography>
            <Switch
              checked={designNotifications.changeRoleInDesign}
              onChange={(event) =>
                handleDesignNotificationChange("changeRoleInDesign", event.target.checked)
              }
              aria-label="Your role in the design is changed by an owner or editor"
              color="warning"
              sx={switchStyles}
            />
          </div>
        </FormGroup>
        <Typography variant="h6" gutterBottom className="settingsTitle">
          Project notification preferences
        </Typography>
        <FormGroup>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.8rem",
            }}
          >
            <Typography style={{ color: "var(--color-white)", marginRight: "20px" }}>
              Project is renamed by a manager
            </Typography>
            <Switch
              checked={projectNotifications.renamedProject}
              onChange={(event) =>
                handleProjectNotificationChange("renamedProject", event.target.checked)
              }
              aria-label="Project is renamed by a manager"
              color="warning"
              sx={switchStyles}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.8rem",
            }}
          >
            <Typography style={{ color: "var(--color-white)", marginRight: "20px" }}>
              Project will be or is in inactive mode
            </Typography>
            <Switch
              checked={projectNotifications.inactiveProject}
              onChange={(event) =>
                handleProjectNotificationChange("inactiveProject", event.target.checked)
              }
              aria-label="Project will be or is in inactive mode"
              color="warning"
              sx={switchStyles}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.8rem",
            }}
          >
            <Typography style={{ color: "var(--color-white)", marginRight: "20px" }}>
              Project will be or is deleted
            </Typography>
            <Switch
              checked={projectNotifications.deletedProject}
              onChange={(event) =>
                handleProjectNotificationChange("deletedProject", event.target.checked)
              }
              aria-label="Project will be or is deleted"
              color="warning"
              sx={switchStyles}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.8rem",
            }}
          >
            <Typography style={{ color: "var(--color-white)", marginRight: "20px" }}>
              Your role in the project is changed by an manager
            </Typography>
            <Switch
              checked={projectNotifications.changeRoleInProject}
              onChange={(event) =>
                handleProjectNotificationChange("changeRoleInProject", event.target.checked)
              }
              aria-label="Your role in the project is changed by an manager"
              color="warning"
              sx={switchStyles}
            />
          </div>
          <Box
            sx={{
              margin: "40px 0px",
              justifyContent: "center",
              display: "flex",
              gap: "15px",
              marginBottom: "20px",
              padding: 0,
              flexWrap: "nowrap",
              "@media (max-width: 600px)": {
                flexWrap: "wrap",
              },
            }}
          >
            <Button
              fullWidth
              sx={{
                ...gradientButtonStyles,
                height: "fit-content",
                opacity: isSaveButtonDisabled ? "0.5" : "1",
                cursor: isSaveButtonDisabled ? "default" : "pointer",
              }}
              onClick={handleSaveChangesWithLoading}
              disabled={isSaveButtonDisabled}
            >
              Save Settings
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {}}
              sx={{ ...outlinedButtonStyles, height: "fit-content" }}
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
        </FormGroup>
      </div>
    </ThemeProvider>
  );
}
