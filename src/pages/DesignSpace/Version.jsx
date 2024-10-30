import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { Drawer } from "@mui/material";

const Version = ({ isDrawerOpen, onClose }) => {
  // State to handle dark mode
  const [darkMode, setDarkMode] = useState(true);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null); // Start with no image selected

  const images = [
    { src: "../img/Logo-WhiteonColor.png", version: "Version 1" },
    { src: "../img/Logo-WhiteonColor.png", version: "Version 2" },
    { src: "../img/Logo-WhiteonColor.png", version: "Version 3" },
    { src: "../img/Logo-WhiteonColor.png", version: "Version 4" },
  ];

  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Drawer
      anchor="left"
      open={isDrawerOpen}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "83%", sm: "38%" },
          minWidth: "300px",
          backgroundColor: darkMode ? "var(--bgMain)" : "var(--nav-card-modal )",
          color: darkMode ? "white" : "black",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
        },
        "& .MuiDrawer-paper::-webkit-scrollbar": {
          display: "none",
        },
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {images.map((image) => (
          <div
            key={image.version}
            onClick={() => handleImageSelect(image)}
            style={{ marginTop: "20px" }}
          >
            <div
              style={{
                display: "inline-block",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid var(--color-primary)",
              }}
            >
              <img
                src={image.src}
                alt={image.version}
                width={100}
                style={{ borderRadius: "50%" }}
              />
            </div>
            <p>{image.version}</p>
          </div>
        ))}

        <div style={{}}>
          {" "}
          <Button
            type="submit"
            variant="contained"
            sx={{
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
            Select image version
          </Button>
        </div>
      </div>
      <Button
        onClick={onClose}
        sx={{
          color: darkMode ? "white" : "black",
          mt: 2,
          marginBottom: "36px",
        }}
      >
        Close
      </Button>
    </Drawer>
  );
};

export default Version;
