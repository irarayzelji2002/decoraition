import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../../css/addItem.css";
import "../../css/budget.css";
import TopBar from "../../components/TopBar";
import Select from "@mui/material/Select";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { useNavigate } from "react-router-dom";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import ColorizeIcon from "@mui/icons-material/Colorize";
import { Modal } from "@mui/material";
import { ChromePicker } from "react-color";
import Button from "@mui/material/Button";
import { DeleteIcon } from "../../components/svg/DefaultMenuIcons";
import ImageFrame from "../../components/ImageFrame";
import { fetchProjectDesigns, addPinToDatabase } from "./backend/ProjectDetails";


function AddPin({ EditMode }) {
  const location = useLocation();
  const navigateTo = location.state?.navigateFrom || "/";
  const navigateFrom = location.pathname;
  const projectId = location.state?.projectId;
  const CurrentPin = (location.state?.totalPins || 0) + 1;
  const navigate = useNavigate();

  const [owner, setOwner] = React.useState("");
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [pins, setPins] = useState([]);
  const [designs, setDesigns] = useState([]);

  useEffect(() => {
    if (projectId) {
      fetchProjectDesigns(projectId, setDesigns);
      // fetchPins(projectId, setPins); // Fetch pins from the database
      addPin(); // Add a new pin
    }
  }, [projectId]);

  const handleColorChange = (color) => {
    setSelectedColor(color.hex); // Update the selected color
    setPins((prevPins) => {
      const updatedPins = [...prevPins];
      const currentPinIndex = updatedPins.length - 1;
      if (currentPinIndex >= 0) {
        updatedPins[currentPinIndex].color = color.hex;
      }
      return updatedPins;
    });
  };

  const [modalOpen, setModalOpen] = React.useState(false);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };
  const addPin = async () => {
    const newPin = {
      id: CurrentPin,
      location: { x: 10, y: -20 },
      color: selectedColor,
      order: CurrentPin,
      designName: designs.find((design) => design.id === owner)?.designName || "",
    };
    setPins([newPin]);
  };

  const handleSavePin = async () => {
    const currentPin = pins[pins.length - 1];
    if (currentPin) {
      const pinData = {
        designId: owner,
        designName: currentPin.designName,
        location: { x: currentPin.location.x, y: currentPin.location.y },
        color: currentPin.color,
        order: currentPin.id,
      };
      await addPinToDatabase(projectId, pinData);
      navigate(`/planMap/${projectId}`);
    }
  };

  return (
    <>
      <TopBar state={"Add Pin"} navigateTo={navigateTo} navigateFrom={navigateFrom} />
      <div className="sectionBudget" style={{ background: "none" }}>
        <div className="budgetSpaceImg">
          <ImageFrame
            src="../../img/floorplan.png"
            alt="design preview"
            pins={pins}
            setPins={setPins}
            color={selectedColor}
          />
        </div>
        <div className="budgetSpaceImg">
          <div style={{ width: "100%" }}>
            {" "}
            <label style={{ marginLeft: "12px" }}>Pin number: {CurrentPin}</label>
            <br />
            <br />
            <label style={{ marginLeft: "12px" }}>Associated Design</label>
            <FormControl sx={formControlStyles}>
              <Select
                labelId="owner-select-label"
                fullWidth
                id="owner-select"
                label="Owner"
                value={owner}
                onChange={(e) => {
                  setOwner(e.target.value);
                  const selectedDesign = designs.find((design) => design.id === e.target.value);
                  if (selectedDesign) {
                    setPins((prevPins) => {
                      const updatedPins = [...prevPins];
                      const currentPinIndex = updatedPins.length - 1;
                      if (currentPinIndex >= 0) {
                        updatedPins[currentPinIndex].designName = selectedDesign.designName;
                      }
                      return updatedPins;
                    });
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      "& .MuiMenu-list": {
                        padding: 0, // Remove padding from the ul element
                      },
                    },
                  },
                }}
                IconComponent={(props) => (
                  <KeyboardArrowDownRoundedIcon sx={{ color: "var(--color-white) !important" }} />
                )}
                className="custom-select"
              >
                <MenuItem value="" sx={menuItemStyles}>
                  <em>&nbsp;</em>
                </MenuItem>
                {designs.map((design) => (
                  <MenuItem key={design.id} sx={menuItemStyles} value={design.id}>
                    {design.designName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <label style={{ marginLeft: "12px" }}>Pin Color</label>
            <div className="color-picker">
              <div className="color-circle"></div>
              <span className="color-text">Select a color</span>
              <IconButton className="color-dropper" onClick={handleOpenModal}>
                <ColorizeIcon sx={{ color: "var(--color-white)" }} />
              </IconButton>
            </div>
            <Modal open={modalOpen} onClose={handleCloseModal}>
              <div className="modalColor" style={{ width: "50%" }}>
                <ChromePicker
                  disableAlpha
                  color={selectedColor}
                  onChange={handleColorChange}
                  styles={{
                    default: {
                      picker: {
                        background: "transparent",
                        borderRadius: "10px",
                        boxShadow: "0 0 10px rgba(0, 0, 0, 0)",
                        marginTop: "20px",
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
                    onClick={handleCloseModal}
                    fullWidth
                    variant="contained"
                    className="confirm-button"
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
              </div>
            </Modal>
            <button
              className="add-item-btn"
              style={{ width: "100%", margin: "8px" }}
              onClick={handleSavePin}
            >
              Add Pin
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AddPin;

const formControlStyles = {
  m: 1,
  minWidth: 200,
  backgroundColor: "transparent",
  color: "var(--color-white)",
  width: "100%",
  borderRadius: "8px",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "var( --borderInput)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--bright-grey) !important",
  },
  "& .MuiSvgIcon-root": {
    color: "var(--color-white)", // Set the arrow color to white
  },
};

const menuItemStyles = {
  color: "var(--color-white)",
  backgroundColor: "var(--dropdown)",
  transition: "all 0.3s ease",
  "&:hover": {
    backgroundColor: "var(--dropdownHover)",
  },
  "&.Mui-selected": {
    backgroundColor: "var(--dropdownSelected)",
    color: "#d1d1d1",
    fontWeight: "bold",
  },
  "&.Mui-selected:hover": {
    backgroundColor: "var(--dropdownHover)",
  },
};
