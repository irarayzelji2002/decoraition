import React, { useState } from "react";
import "../../css/design.css";
import Slider from "@mui/joy/Slider";
import Button from "@mui/joy/Button";
import { MuiColorInput } from "mui-color-input";
import { Modal, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Textarea from "@mui/joy/Textarea";
import AddImage from "./svg/AddImage";
import { Add } from "@mui/icons-material";
import AddColor from "./svg/AddColor";

function PromptBar() {
  const [modalOpen, setModalOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [value, setValue] = React.useState("#ffffff");

  const handleChange = (newValue) => {
    setValue(newValue);
  };

  const handleOpenModal = (title) => {
    setModalTitle(title);
    setModalOpen(true);
  };

  const handleOpenColor = (title) => {
    setModalTitle(title);
    setColorOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setColorOpen(false);
  };

  return (
    <div className="promptBar">
      <h3>
        Describe your Idea
        <span style={{ color: "var(--color-quaternary)" }}> *</span>
      </h3>
      <Textarea
        placeholder="Type in here…"
        maxRows={2}
        sx={{
          color: "var(--color-white)",
          border: "2px solid var(--borderInput)",
          backgroundColor: "transparent",
          "&::before": {
            display: "none",
          },
          "&:focus-within": {
            borderColor: "var(--brightFont)",
          },
        }}
      />

      <h3>
        Number of images to generate
        <span style={{ color: "var(--color-quaternary)" }}> *</span>
      </h3>
      <Slider
        defaultValue={1}
        valueLabelDisplay="on"
        max={4}
        sx={{
          marginTop: "10px",
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

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h3>Upload image of the space</h3>
          <h6>optional</h6>
        </div>

        <Button
          size="md"
          sx={{
            borderRadius: "100%",
            marginLeft: "auto",
            padding: "12px",
            backgroundImage: "var(--gradientCircle)",
            "&:hover": {
              backgroundImage: "var(--gradientCircleHover)",
            },
          }}
          onClick={() => handleOpenModal("Upload an image of the space")}
        >
          <AddImage />
        </Button>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <div>
          <h3>Upload image for style reference</h3>
          <h6>optional</h6>
        </div>

        <Button
          size="md"
          sx={{
            borderRadius: "100%",
            marginLeft: "auto",
            padding: "12px",
            backgroundImage: "var(--gradientCircle)",
            "&:hover": {
              backgroundImage: "var(--gradientCircleHover)",
            },
          }}
          onClick={() => handleOpenModal("Upload an image for style reference")}
        >
          <AddImage />
        </Button>
      </div>

      <br />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <div>
          <h3>Choose a Color Palette</h3>
          <h6>optional</h6>
        </div>

        <Button
          size="md"
          sx={{
            borderRadius: "100%",
            marginLeft: "auto",
            padding: "12px",
            backgroundImage: "var(--gradientCircle)",
            "&:hover": {
              backgroundImage: "var(--gradientCircleHover)",
            },
          }}
          onClick={() => handleOpenColor("Add a Color Palette")}
        >
          <AddColor />
        </Button>
      </div>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{
          marginBottom: "40%",
          color: "white",
          mt: 3,
          mb: 2,
          backgroundImage: "var(--gradientButton)",
          borderRadius: "20px",
          textTransform: "none",
          fontWeight: "bold",
          "&:hover": {
            backgroundImage: "var(--gradientButtonHover)",
          },
        }}
      >
        Generate Image
      </Button>

      {/* Modal component */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            backgroundColor: "var(--color-tertiary)",
            color: "var(--color-white)",
            width: "500px",
            maxWidth: "90%",
            borderRadius: "20px",
            p: 3,
            position: "relative",
            margin: "auto",
            top: "20%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h2 id="modal-title" style={{ color: "var(--color-white)", margin: 0 }}>
              {modalTitle}
            </h2>
            <Button
              onClick={handleCloseModal}
              sx={{
                backgroundColor: "transparent",
                color: "var(--color-white)",
                minWidth: "auto",
                padding: "0",
                "&:hover": { backgroundColor: "transparent" },
              }}
            >
              <CloseIcon />
            </Button>
          </div>

          <div style={{ marginTop: "30px" }}>
            <Button
              fullWidth
              size="md"
              sx={{
                backgroundImage: "var(--gradientButton)",
                borderRadius: "20px",
                color: "white",
                marginBottom: "20px",
                "&:hover": {
                  backgroundImage: "var(--gradientButtonHover)",
                },
              }}
              onClick={() => {
                console.log("Take a photo clicked");
              }}
            >
              Take a Photo
            </Button>

            <Button
              fullWidth
              size="md"
              sx={{
                backgroundImage: "var(--gradientButton)",
                borderRadius: "20px",
                color: "white",
                marginBottom: "20px",
                "&:hover": {
                  backgroundImage: "var(--gradientButtonHover)",
                },
              }}
              onClick={() => {
                document.getElementById("fileInput").click();
              }}
            >
              Browse from gallery
            </Button>

            <input
              type="file"
              id="fileInput"
              style={{ display: "none" }}
              onChange={(e) => console.log(e.target.files[0])}
            />
            {/* 
            <MuiColorInput
              sx={{
                width: "100%",
                margin: "10px",
                "& .MuiInputBase-root": {
                  color: "var(--color-white)", // Set input text color to white
                },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    border: "2px solid var(--borderInput)",
                  },
                  "&:hover fieldset": {
                    borderColor: "var(--borderInput)", // Set border color on hover
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "var(--brightFont)", // Set border color on focus
                  },
                },
              }}
              format="hex"
              value={value}
              onChange={handleChange}
            /> */}
          </div>
        </Box>
      </Modal>
      <Modal
        open={colorOpen}
        onClose={handleCloseModal}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            backgroundColor: "var(--color-tertiary)",
            color: "var(--color-white)",
            width: "500px",
            maxWidth: "90%",
            borderRadius: "20px",
            p: 3,
            position: "relative",
            margin: "auto",
            top: "20%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h2 id="modal-title" style={{ color: "var(--color-white)", margin: 0 }}>
              {modalTitle}
            </h2>
            <Button
              onClick={handleCloseModal}
              sx={{
                backgroundColor: "transparent",
                color: "var(--color-white)",
                minWidth: "auto",
                padding: "0",
                "&:hover": { backgroundColor: "transparent" },
              }}
            >
              <CloseIcon />
            </Button>
          </div>

          <div style={{ marginTop: "30px" }}>
            <MuiColorInput
              sx={{
                width: "100%",
                margin: "10px",
                "& .MuiInputBase-root": {
                  color: "var(--color-white)", // Set input text color to white
                },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    border: "2px solid var(--borderInput)",
                  },
                  "&:hover fieldset": {
                    borderColor: "var(--borderInput)", // Set border color on hover
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "var(--brightFont)", // Set border color on focus
                  },
                },
              }}
              format="hex"
              value={value}
              onChange={handleChange}
            />
          </div>
        </Box>
      </Modal>
    </div>
  );
}

export default PromptBar;
