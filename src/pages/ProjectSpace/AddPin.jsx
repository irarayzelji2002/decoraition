import * as React from "react";
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
import { useState } from "react";

const AddPin = ({ EditMode }) => {
  const [owner, setOwner] = React.useState("");
  const [value, setValue] = useState("#ffffff");
  const handleChange = (color) => {
    setValue(color.hex);
  };

  const [modalOpen, setModalOpen] = React.useState(false);
  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <>
      <TopBar state={"Add Pin"} />
      <div className="sectionBudget" style={{ background: "none" }}>
        <div className="budgetSpaceImg">
          <div className="image-frame">
            <img
              src="../../img/logoWhitebg.png"
              alt={`design preview `}
              className="image-preview"
            />
          </div>
        </div>
        <div className="budgetSpaceImg">
          <div style={{ width: "100%" }}>
            {" "}
            <label style={{ marginLeft: "12px" }}>Pin number: 4</label>
            <br />
            <br />
            <label style={{ marginLeft: "12px" }}>Associated Design</label>
            <FormControl sx={formControlStyles}>
              {/* <InputLabel
                id="owner-select-label"
                sx={{
                  color: "var(--color-white)",
                  "&.Mui-focused": {
                    color: "var(--color-white)", // Ensure label color remains white when focused
                  },
                  "&.MuiInputLabel-shrink": {
                    color: "var(--color-white)", // Ensure label color remains white when shrunk
                  },
                  "&.Mui-focused.MuiInputLabel-shrink": {
                    color: "var(--color-white)", // Ensure label color remains white when focused and shrunk
                  },
                }}
              >
                Select
              </InputLabel> */}
              <Select
                labelId="owner-select-label"
                fullWidth
                id="owner-select"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                MenuComponent={StyledMenu}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      borderRadius: "10px",
                      "& .MuiMenu-list": {
                        padding: 0,
                      },
                    },
                  },
                }}
                IconComponent={ArrowDropDownIcon}
                sx={selectStyles}
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
                  color={value}
                  onChangeComplete={handleChange}
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
              </div>
            </Modal>
            <button className="add-item-btn" style={{ width: "100%", margin: "8px" }}>
              Add Pin
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddPin;

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
  width: "100%",
  backgroundColor: "#2c2c2e",
  color: "var(--color-white)",
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
  display: "block",
  minHeight: "auto",
  "&:hover": {
    backgroundColor: "var(--dropdownHover) !important",
  },
  "&.Mui-selected": {
    backgroundColor: "var(--dropdownSelected) !important",
    color: "var(--color-white)",
    fontWeight: "bold",
  },
  "&.Mui-selected:hover": {
    backgroundColor: "var(--dropdownSelectedHover) !important",
  },
};
// Styles for Select
const selectStyles = {
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--borderInput)",
    borderWidth: 2,
    borderRadius: "10px",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--borderInput)",
  },
  "& .MuiSelect-select": {
    color: "var(--color-white)",
    WebkitTextFillColor: "var(--color-white)",
  },
  "& .MuiSelect-select.MuiInputBase-input": {
    padding: "12px 40px 12px 20px",
  },
  "& .MuiSelect-icon": {
    color: "var(--color-white)",
    WebkitTextFillColor: "var(--color-white)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--borderInput)",
  },
};

const selectStylesDisabled = {
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
    borderWidth: 2,
    borderRadius: "10px",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
  },
  "& .MuiSelect-select": {
    color: "var(--color-white) !important",
    WebkitTextFillColor: "var(--color-white)",
    "&:focus": {
      color: "var(--color-white)",
    },
  },
  "& .MuiSelect-select.MuiInputBase-input": {
    padding: "12px 40px 12px 20px",
  },
  "& .MuiSelect-icon": {
    color: "var(--color-white)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
  },
  "&.Mui-disabled": {
    backgroundColor: "transparent",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "transparent",
    },
    "& .MuiSelect-icon": {
      color: "transparent",
    },
    "& .MuiSelect-select": {
      color: "var(--color-white)",
      WebkitTextFillColor: "var(--color-white)",
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
};
