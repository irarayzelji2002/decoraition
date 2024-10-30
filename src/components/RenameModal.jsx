import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  IconButton,
  Link,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const RenameModal = ({ isOpen, onClose, handleRename, isDesign, object }) => {
  // if isDesign is true, object is a design object, else it is a project object
  const [newName, setNewName] = useState(
    isDesign ? object?.designName ?? "Untitled Design" : object?.projectName ?? "Untitled Project"
  );
  const [error, setError] = useState("");

  const onSubmit = async () => {
    const result = await handleRename(newName);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setError("");
    onClose();
  };

  const handleClose = () => {
    setError("");
    setNewName(
      isDesign ? object?.designName ?? "Untitled Design" : object?.projectName ?? "Untitled Project"
    );
    onClose();
  };

  useEffect(() => {
    console.log("isDesign", isDesign);
    console.log("object", object);
  }, []);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "var(--nav-card-modal)",
          borderRadius: "20px",
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
        Rename
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: "var(  --nav-card-modal)",
          color: "var(--color-white)",
          marginTop: "20px",
        }}
      >
        <Typography variant="body1" sx={{ marginBottom: "10px" }}>
          {isDesign ? "Design" : "Project"} Name
        </Typography>
        <TextField
          placeholder="New Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          helperText={error}
          variant="outlined"
          fullWidth
          sx={{
            marginBottom: "16px",
            backgroundColor: "var(  --nav-card-modal)",
            input: { color: "var(--color-white)" }, //placehold color
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "var( --borderInput)",
              },
              "&:hover fieldset": {
                borderColor: "var( --borderInput)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "var(--brightFont)",
              },
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ backgroundColor: "var(  --nav-card-modal)", margin: "10px" }}>
        <Button
          fullWidth
          variant="contained"
          onClick={onSubmit}
          sx={{
            background: "var(--gradientButton)",
            borderRadius: "20px",
            color: "var(--color-white)",
            fontWeight: "bold",
            textTransform: "none",
            "&:hover": {
              background: "var(--gradientButtonHover)", // Reverse gradient on hover
            },
          }}
        >
          Rename
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={handleClose}
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
      </DialogActions>
    </Dialog>
  );
};

export default RenameModal;
