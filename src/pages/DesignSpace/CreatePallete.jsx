import React, { useState } from "react";
import { Box } from "@mui/material";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import { ArrowBackIos } from "@mui/icons-material";
import { ChromePicker } from "react-color";

const CreatePallete = ({ handleCloseModal, modalTitle }) => {
  const [showColorInput, setShowColorInput] = useState(false);
  const [value, setValue] = useState("#ffffff");

  const handlePlusClick = () => {
    setShowColorInput(!showColorInput); // Toggle the state
  };

  const handleChange = (color) => {
    setValue(color.hex);
  };
  return (
    <Box
      sx={{
        backgroundColor: "var(--color-tertiary)",
        color: "var(--color-white)",
        width: "500px",
        maxWidth: "83%",
        borderRadius: "20px",
        p: 3,
        position: "relative",
        margin: "auto",
        top: "20%",
      }}
    >
      {!showColorInput ? (
        <>
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
          <div className="rightBeside">
            <div className="input-group">
              <input placeholder="Name of the color pallete" style={{ border: "none" }} />
            </div>{" "}
            <IconButton
              aria-label="delete"
              style={{
                height: "12px",
              }}
            >
              <DeleteIcon
                style={{
                  color: "var(--color-white)",
                }}
              />
            </IconButton>
          </div>

          <div style={{ marginTop: "10px" }}>
            <div className="circle-container">
              <div className="circle" style={{ backgroundColor: "#efefef" }}></div>
              <div className="circle" style={{ backgroundColor: "#ef4f56" }}></div>
              <div className="circle" style={{ backgroundColor: "#2c8b2a" }}></div>
              <div className="circle" style={{ backgroundColor: "#8f5e5e" }}></div>
              <div className="circle plus-circle" onClick={handlePlusClick}>
                +
              </div>{" "}
              {/* Circle with plus sign */}
            </div>
            <Button
              fullWidth
              variant="contained"
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
              Add color pallete
            </Button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h2 id="modal-title" style={{ color: "var(--color-white)", margin: 0 }}>
              <ArrowBackIos onClick={handlePlusClick} /> Pick A Color
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

          <div
            style={{
              marginTop: "20px !important",
              height: "5px",
              padding: "10px",
              width: "auto",
              margin: "auto",
              backgroundColor: value,
              borderRadius: "10px",
              border: "1px solid var(--color-grey)",
            }}
          ></div>

          <ChromePicker
            disableAlpha
            color={value}
            onChangeComplete={handleChange}
            styles={{
              default: {
                picker: {
                  background: "transparent",
                  borderRadius: "10px",
                  boxShadow: "0 0 10px rgba(0, 0, 0, 0)",
                  padding: "20px",
                  width: "auto",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: "500",
                },
                saturation: {
                  borderRadius: "10px",
                },
                hue: {
                  borderRadius: "10px",
                },
                input: {
                  backgroundImage: "var(--gradientButton)",
                },
                swatch: {
                  borderRadius: "10px",
                },
                active: {
                  borderRadius: "10px",
                },
              },
            }}
          />
          <div className="rightBeside">
            <Button
              fullWidth
              variant="contained"
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
              Save Color
            </Button>
            <IconButton aria-label="delete">
              <DeleteIcon
                style={{
                  color: "var(--color-white)",
                }}
              />
            </IconButton>
          </div>
        </>
      )}
    </Box>
  );
};

export default CreatePallete;
