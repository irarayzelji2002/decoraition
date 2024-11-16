import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../../css/addItem.css";
import "../../css/budget.css";
import TopBar from "../../components/TopBar";
import Select from "@mui/material/Select";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { styled } from "@mui/material/styles";
import Menu from "@mui/material/Menu";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import ColorizeIcon from "@mui/icons-material/Colorize";
import { Modal } from "@mui/material";
import { ChromePicker } from "react-color";
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageFrame from "../../components/ImageFrame";

function AddPin({ EditMode }) {
  const location = useLocation();
  const navigateTo = location.state?.navigateFrom || "/";
  const navigateFrom = location.pathname;

  const [owner, setOwner] = React.useState("");
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [pins, setPins] = useState([]);

  const handleColorChange = (color) => {
    setSelectedColor(color.hex); // Update the selected color
  };
  const StyledMenu = styled(Menu)(({ theme }) => ({
    "& .MuiPaper-root": {
      backgroundColor: "#2c2c2e",
      color: "var(--color-white)",
      borderRadius: "12px",
      padding: 0,
      margin: 0,
      border: "none",
      overflow: "hidden",
    },
    "& .MuiList-root": {
      padding: 0,
    },
    "& .MuiMenuItem-root": {
      "&.Mui-selected": {
        backgroundColor: "transparent", // Custom background color for selected item
        "&:hover": {
          backgroundColor: "transparent", // Custom hover color for selected item
        },
      },
      "&:focus": {
        outline: "none",
        boxShadow: "none", // Remove blue outline effect
      },
    },
  }));

  const formControlStyles = {
    m: 1,
    minWidth: 200,
    backgroundColor: "#2c2c2e",
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

  const [modalOpen, setModalOpen] = React.useState(false);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const addPin = () => {
    const highestId = pins.length > 0 ? Math.max(...pins.map((pin) => pin.id)) : 0;
    setPins([...pins, { id: highestId + 1, x: 0, y: 0, color: selectedColor }]);
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
          />
        </div>
        <div className="budgetSpaceImg">
          <div style={{ width: "100%" }}>
            {" "}
            <label style={{ marginLeft: "12px" }}>Pin number: {pins.length + 1}</label>
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
                onChange={(e) => setOwner(e.target.value)}
                MenuComponent={StyledMenu}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      "& .MuiMenu-list": {
                        padding: 0, // Remove padding from the ul element
                      },
                    },
                  },
                }}
                IconComponent={ArrowDropDownIcon}
                className="custom-select"
              >
                <MenuItem value="" sx={menuItemStyles}>
                  <em>&nbsp;</em>
                </MenuItem>
                <MenuItem sx={menuItemStyles} value="Alice">
                  Alice
                </MenuItem>
                <MenuItem sx={menuItemStyles} value="Bob">
                  Bob
                </MenuItem>
                <MenuItem sx={menuItemStyles} value="Charlie">
                  Charlie
                </MenuItem>
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
                  <Button fullWidth variant="contained" className="confirm-button">
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
              onClick={addPin}
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
