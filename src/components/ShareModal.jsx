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
  IconButton,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EmailInput from "./EmailInput";
import { Avatar } from "@mui/material";

const ShareModal = ({ isOpen, onClose, onNext, onShareProject, isSecondPage }) => {
  const [role, setRole] = useState("Viewer");
  const [notifyPeople, setNotifyPeople] = useState(false);
  const [isViewer, setIsViewer] = useState(false);
  const [genAccess, setGenAccess] = useState("Restrict");
  const [genRole, setGenRole] = useState("Viewer");
  const users = [
    { name: "Guest 1", email: "email1@gmail.com" },
    { name: "Guest 2", email: "email2@gmail.com" },
    { name: "Guest 3", email: "email3@gmail.com" },
  ];

  const handleClose = () => {
    onClose();
    //resett values
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "#2E2E32",
          borderRadius: "20px",
          width: "90%",
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "var(--nav-card-modal)",
          color: "var(--color-white)",
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--color-grey)",
          fontWeight: "bold",
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            color: "var(--color-white)",
            position: "absolute",
            right: 8,
            top: 8,
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
        {isSecondPage ? "Manage Access" : "Add Collaborators"}
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
          <div style={{ width: "auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <EmailInput />
            </div>
            <Divider sx={{ backgroundColor: "grey" }} />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginLeft: "8px",
              }}
            >
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
              <p
                style={{
                  color: "var(--color-white)",
                  marginLeft: "auto",
                }}
              >
                Notify People
              </p>
              <Checkbox
                checked={notifyPeople}
                onChange={(e) => setNotifyPeople(e.target.checked)}
                sx={{
                  marginRight: "16px",
                  color: "var(--color-white)",
                  "&.Mui-checked": {
                    color: "var(--brightFont)",
                  },
                }}
              />
            </div>

            <Divider sx={{ backgroundColor: "grey", marginBottom: "16px" }} />

            <TextField
              multiline
              minRows={1}
              variant="standard"
              placeholder="Optional message"
              sx={{
                padding: "20px",
                width: "93%",
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
                width: "95%",
                background: "var(--gradientButton)",
                borderRadius: "20px",
                color: "var(--color-white)",
                margin: "10px",
                fontWeight: "bold",
                textTransform: "none",
                "&:hover": {
                  background: "var(--gradientButtonHover)",
                },
              }}
            >
              Next
            </Button>
          </div>
        ) : (
          <div>
            <Typography variant="body1" sx={{ marginBottom: "16px", padding: "12px" }}>
              People with access
            </Typography>
            {users.map((user, index) => (
              <div className="drawerUser" key={index}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    marginBottom: "10px",
                  }}
                  src={""}
                >
                  {user.name.charAt(0)}
                </Avatar>
                <div>
                  <Typography variant="body1" style={{ fontWeight: "bold" }}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption">{user.email}</Typography>
                </div>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  sx={{
                    marginRight: "16px",
                    backgroundColor: "#3E3E42",
                    color: "var(--color-white)",
                    marginLeft: "auto",
                  }}
                >
                  <MenuItem value="Editor">Editor</MenuItem>
                  <MenuItem value="Commenter">Commenter</MenuItem>
                  <MenuItem value="Viewer">Viewer</MenuItem>
                </Select>
              </div>
            ))}
            <Typography variant="body1" sx={{ marginBottom: "16px", padding: "12px" }}>
              General Access
            </Typography>

            <div className="drawerUser" style={{ gap: "0px" }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  marginBottom: "10px",
                  marginRight: "16px",
                }}
                src={""}
              >
                W
              </Avatar>
              {isViewer ? (
                <div>
                  <Typography variant="body1" style={{ fontWeight: "bold" }}>
                    Anyone with link
                  </Typography>
                  <Typography variant="caption">
                    Anyone on the Internet can access as an Editor
                  </Typography>
                </div>
              ) : (
                <>
                  <Select
                    value={genAccess}
                    onChange={(e) => setGenAccess(e.target.value)}
                    sx={{
                      backgroundColor: "#3E3E42",
                      color: "var(--color-white)",
                      width: "60%",
                    }}
                  >
                    <MenuItem value="Public">
                      <Typography variant="body1" style={{ fontWeight: "bold" }}>
                        Anyone with link&nbsp;
                      </Typography>
                      <Typography variant="caption">
                        Anyone on the Internet can access as an Editor
                      </Typography>
                    </MenuItem>
                    <MenuItem value="Restrict">
                      <Typography variant="body1" style={{ fontWeight: "bold" }}>
                        Restricted&nbsp;
                      </Typography>
                      <Typography variant="caption">Only collaborators have access</Typography>
                    </MenuItem>
                  </Select>
                  <Select
                    value={genRole}
                    onChange={(e) => setGenRole(e.target.value)}
                    sx={{
                      backgroundColor: "#3E3E42",
                      color: "var(--color-white)",
                      width: "15%",
                    }}
                  >
                    <MenuItem value="Editor">Editor</MenuItem>
                    <MenuItem value="Commenter">Commenter</MenuItem>
                    <MenuItem value="Viewer">Viewer</MenuItem>
                  </Select>
                </>
              )}
            </div>

            <Button
              fullWidth
              variant="contained"
              onClick={onShareProject}
              sx={{
                width: "92%",
                background: "var(--gradientButton)",
                borderRadius: "20px",
                color: "var(--color-white)",
                margin: "16px",
                fontWeight: "bold",
                textTransform: "none",
                "&:hover": {
                  background: "var(--gradientButtonHover)",
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
