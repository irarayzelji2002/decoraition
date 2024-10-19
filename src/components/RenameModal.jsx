import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const RenameModal = ({ isOpen, onClose }) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "var(  --nav-card-modal)",
          borderRadius: "20px",
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "var(  --nav-card-modal)",
          color: "var(--color-white)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconButton onClick={onClose} sx={{ color: "var(--color-white)", marginRight: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        Rename
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: "var(  --nav-card-modal)",
          color: "var(--color-white)",
        }}
      >
        <TextField
          placeholder="New Name"
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
          onClick={onClose}
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
          onClick={onClose}
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
