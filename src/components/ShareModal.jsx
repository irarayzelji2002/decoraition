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
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "#1F1E22", // Title background color
          color: "whitesmoke", // Title text color
          display: "flex",
          alignItems: "center",
        }}
      >
        <ArrowBackIcon
          sx={{ color: "whitesmoke", cursor: "pointer", marginRight: "16px" }}
          onClick={onClose}
        />
        {isSecondPage ? "Set Roles and Notifications" : "Add Collaborators"}
      </DialogTitle>

      <DialogContent
        sx={{
          backgroundColor: "#1F1E22", // Content background color
          color: "whitesmoke", // Text color in the content
          width: "50vh",
          "& .MuiDialog-paper": {
            width: "100%",
          },
        }}
      >
        {!isSecondPage ? (
          <div w>
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
                  "& .MuiSelect-select": { color: "whitesmoke" }, // Select text color
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
              <p style={{ color: "whitesmoke", marginLeft: "auto" }}>Notify People</p>
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
          </div>
        ) : (
          <div>
            <Typography variant="body1" sx={{ marginBottom: "16px" }}>
              Assign roles and choose notification settings for the added collaborators.
            </Typography>

            {collaborators.map((collaborator, index) => (
              <div key={index} style={{ marginBottom: "16px" }}>
                <Typography variant="body2" color="whitesmoke">
                  {collaborator}
                </Typography>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  sx={{
                    marginRight: "16px",
                    backgroundColor: "#3E3E42",
                    color: "whitesmoke",
                  }}
                >
                  <MenuItem value="Editor">Editor</MenuItem>
                  <MenuItem value="Commenter">Commenter</MenuItem>
                  <MenuItem value="Viewer">Viewer</MenuItem>
                </Select>

                <Checkbox
                  checked={notifyPeople}
                  onChange={() => setNotifyPeople(!notifyPeople)}
                  sx={{ color: "whitesmoke" }} // Checkbox color
                />
                <Typography variant="body2" sx={{ display: "inline", color: "whitesmoke" }}>
                  Notify
                </Typography>
              </div>
            ))}

            <Button
              fullWidth
              variant="contained"
              onClick={onShareProject}
              sx={{
                background: "var(--gradientButton)", // Gradient background
                borderRadius: "20px", // Button border radius
                color: "whitesmoke", // Button text color
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

      <DialogActions sx={{ backgroundColor: "#1F1E22" }}>
        <Button
          fullWidth
          variant="contained"
          onClick={onNext}
          sx={{
            background: "var(--gradientButton)", // Gradient background
            borderRadius: "20px", // Button border radius
            color: "whitesmoke", // Button text color
            fontWeight: "bold",
            textTransform: "none",
            "&:hover": {
              background: "var(--gradientButtonHover)", // Reverse gradient on hover
            },
          }}
        >
          Next
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareModal;
