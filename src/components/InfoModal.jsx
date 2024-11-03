import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  IconButton,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const InfoModal = ({ isOpen, onClose }) => {
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
          borderBottom: "1px solid var(--inputBg)",
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
        <Typography variant="h6" sx={{ color: "whitesmoke" }}>
          {" "}
          {/* Set info text color to white */}
          Info
        </Typography>
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: "var(  --nav-card-modal)", // Content background color
          color: "var(--color-white)", // Text color in the content
        }}
      >
        <div className="image-frame">
          <img src={"../../img/logoWhitebg.png"} alt="design preview" className="image-preview" />
        </div>
        <Typography variant="body1">Here is some information about the item.</Typography>
      </DialogContent>
      <DialogActions
        sx={{ backgroundColor: "var(  --nav-card-modal)", margin: "10px" }} // Actions background color
      >
        <Button
          fullWidth
          variant="contained"
          onClick={handleClose}
          sx={{
            background: "var(--gradientButton)",
            borderRadius: "20px",
            color: "var(--color-white)", // Button text color
            fontWeight: "bold",
            textTransform: "none",
            "&:hover": {
              background: "var(--gradientButtonHover)",
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InfoModal;
