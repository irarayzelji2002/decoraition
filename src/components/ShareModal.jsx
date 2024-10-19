import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmailInput from "./EmailInput";

const ShareModal = ({
  isOpen,
  onClose,
  onAddCollaborator,
  onNext,
  onShareProject,
  collaborators,
  isSecondPage,
}) => {
  const [newCollaborator, setNewCollaborator] = useState("");
  const [role, setRole] = useState("Viewer");
  const [notifyPeople, setNotifyPeople] = useState(false);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "#2E2E32", // Custom background color for the dialog
          borderRadius: "20px", // Custom border radius for the dialog
          width: "90%", // Custom width for the dialog
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "var(--nav-card-modal)", // Title background color
          color: "var(--color-white)", // Title text color
          display: "flex",
          alignItems: "center",
        }}
      >
        <ArrowBackIcon
          sx={{
            color: "var(--color-white)",
            cursor: "pointer",
            marginRight: "16px",
          }}
          onClick={onClose}
        />
        {isSecondPage ? "Set Roles and Notifications" : "Add Collaborators"}
      </DialogTitle>

      <DialogContent
        sx={{
          backgroundColor: "var(--nav-card-modal)", // Content background color
          color: "var(--color-white)", // Text color in the content
          width: "auto",
          padding: "0px",

          "& .MuiDialog-paper": {
            width: "100%",
          },
        }}
      >
        {!isSecondPage ? (
          <div style={{ width: "auto", padding: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <EmailInput />
            </div>
            <Divider sx={{ backgroundColor: "grey", marginBottom: "16px" }} />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                sx={{
                  width: "50%",
                  backgroundColor: "transparent", // Select background color
                  "& .MuiSelect-select": { color: "var(--color-white)" }, // Select text color
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "transparent", // Border color
                  },
                  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "transparent", // Hover border color
                  },
                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "transparent", // Focused border color
                  },
                }}
              >
                <MenuItem value="Editor">Editor</MenuItem>
                <MenuItem value="Commenter">Commenter</MenuItem>
                <MenuItem value="Viewer">Viewer</MenuItem>
              </Select>
              <p style={{ color: "var(--color-white)", marginLeft: "auto" }}>Notify People</p>
              <Checkbox
                checked={notifyPeople}
                onChange={(e) => setNotifyPeople(e.target.checked)}
                sx={{
                  color: "var(--color-white)",
                  "&.Mui-checked": {
                    color: "var(--brightFont)", // Change color when checked
                  },
                }}
              />
            </div>

            <br />
            <Divider sx={{ backgroundColor: "grey", marginBottom: "16px" }} />

            <TextField
              multiline
              minRows={1}
              variant="standard"
              placeholder="Optional message"
              sx={{
                marginBottom: "16px",
                padding: "16px",
                width: "90%",
                backgroundColor: "transparent",
                "& .MuiInput-root": {
                  color: "var(--color-white)",
                },
              }}
            />
            <Button
              variant="contained"
              onClick={onNext}
              sx={{
                width: "95%", // Button width
                background: "var(--gradientButton)", // Gradient background
                borderRadius: "20px", // Button border radius
                color: "var(--color-white)", // Button text color
                margin: "10px",
                fontWeight: "bold",
                textTransform: "none",
                "&:hover": {
                  background: "var(--gradientButtonHover)", // Reverse gradient on hover
                },
              }}
            >
              Next
            </Button>
          </div>
        ) : (
          <div>
            <Typography variant="body1" sx={{ marginBottom: "16px", padding: "12px" }}>
              Assign roles and choose notification settings for the added collaborators.
            </Typography>

            {collaborators.map((collaborator, index) => (
              <div key={index} style={{ marginBottom: "16px" }}>
                <Typography variant="body2" color="var(--color-white)">
                  {collaborator}
                </Typography>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  sx={{
                    marginRight: "16px",
                    backgroundColor: "#3E3E42",
                    color: "var(--color-white)",
                  }}
                >
                  <MenuItem value="Editor">Editor</MenuItem>
                  <MenuItem value="Commenter">Commenter</MenuItem>
                  <MenuItem value="Viewer">Viewer</MenuItem>
                </Select>

                <Checkbox
                  checked={notifyPeople}
                  onChange={() => setNotifyPeople(!notifyPeople)}
                  sx={{ color: "var(--color-white)" }} // Checkbox color
                />
                <Typography variant="body2" sx={{ display: "inline", color: "var(--color-white)" }}>
                  Notify
                </Typography>
              </div>
            ))}

            <Button
              fullWidth
              variant="contained"
              onClick={onShareProject}
              sx={{
                width: "92%", // Button width
                background: "var(--gradientButton)", // Gradient background
                borderRadius: "20px", // Button border radius
                color: "var(--color-white)", // Button text color
                margin: "16px",
                fontWeight: "bold",
                textTransform: "none",
                "&:hover": {
                  background: "var(--gradientButtonHover)", // Reverse gradient on hover
                },
              }}
            >
              Share
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
