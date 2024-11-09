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
import { showToast } from "../../functions/utils";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { gradientButtonStyles, outlinedButtonStyles } from "./PromptBar";

const EditDescModal = ({ isOpen, onClose, handleEdit, designVersion, imageId }) => {
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async () => {
    const result = await handleEdit(imageId, description);
    if (!result.success) {
      if (result.message === "Description is the same as the current description")
        setError(result.message);
      else showToast("error", result.message);
      return;
    }
    showToast("success", `Image ${imageId} description updated successfully`);
    handleClose();
  };

  const handleClose = () => {
    setError("");
    setDescription("");
    onClose();
  };

  useEffect(() => {
    console.log("imageId", imageId);
    console.log("designVersion", designVersion);
    const designVersionImages = designVersion?.images;
    const image = designVersionImages.find((image) => image.id === imageId);
    setDescription(image?.description ?? "");
  }, [designVersion, imageId]);

  return (
    <Dialog open={isOpen} onClose={handleClose} sx={dialogStyles}>
      <DialogTitle sx={dialogTitleStyles}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: "bold",
            fontSize: "1.15rem",
            flexGrow: 1,
            maxWidth: "80%",
            whiteSpace: "normal",
          }}
        >
          {`Image ${imageId} Description`}
        </Typography>
        <IconButton
          onClick={handleClose}
          sx={{
            ...iconButtonStyles,
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={dialogContentStyles}>
        <Typography variant="body1" sx={{ marginBottom: "10px" }}>
          Description
        </Typography>
        <TextField
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
                borderColor: "var(--borderInputBrighter)",
              },
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={dialogActionsStyles}>
        <Button fullWidth variant="contained" onClick={onSubmit} sx={gradientButtonStyles}>
          {`${designVersion?.images[imageId]?.description ? "Edit" : "Add"} description`}
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={handleClose}
          sx={outlinedButtonStyles}
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

export default EditDescModal;

export const dialogStyles = {
  "& .MuiDialog-paper": {
    backgroundColor: "var(--nav-card-modal)",
    borderRadius: "20px",
  },
};

export const dialogTitleStyles = {
  backgroundColor: "var(--nav-card-modal)",
  color: "var(--color-white)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid var(--inputBg)",
  fontWeight: "bold",
  padding: "10px 11px 10px 24px",
};

export const dialogContentStyles = {
  backgroundColor: "var(  --nav-card-modal)",
  color: "var(--color-white)",
  marginTop: "20px",
  display: "flex",
  justifyContent: "center",
  flexDirection: "column",
  padding: "20px",
  paddingBottom: 0,
  overflow: "auto",
  width: "min(50vw, 50vh)",
};

export const dialogActionsStyles = {
  backgroundColor: "var(  --nav-card-modal)",
  margin: "20px",
  justifyContent: "center",
  display: "flex",
  gap: "15px",
  marginBottom: "20px",
  padding: 0,
};
