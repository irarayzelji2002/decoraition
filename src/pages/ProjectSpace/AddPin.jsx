import { MuiColorInput } from "mui-color-input";
import { Dropdown, Menu, MenuButton } from "@mui/joy";
import MenuItem from "@mui/joy/MenuItem";
import * as React from "react";
import "../../css/addItem.css";
import "../../css/budget.css";
import TopBar from "../../components/TopBar";
function AddPin({ EditMode }) {
  const [value, setValue] = React.useState("#ffffff");

  const handleChange = (newValue) => {
    setValue(newValue);
  };
  return (
    <div className="app-container">
      <TopBar state={"Add Pin"} />
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div className="budgetSpace">
          <div className="image-frame">
            <img
              src="../../img/logoWhitebg.png"
              alt={`design preview `}
              className="image-preview"
            />
          </div>
        </div>
        <div className="budgetSpace">
          <span className="SubtitleBudget"> Associated Design</span>
          <Dropdown>
            <MenuButton
              sx={{
                color: "white",
                m: 1,
                width: "90%",
                "&:hover": {
                  backgroundColor: "gray",
                  color: "var(--color-white)",
                },
              }}
            >
              Choose Color Palette &#9660;
            </MenuButton>
            <Menu
              sx={{
                backgroundColor: "transparent",
                width: "50%",
                "& .MuiMenuItem-root": {
                  backgroundColor: "gray",
                  color: "var(--color-white)",
                  "&:hover": {
                    backgroundColor: "darkgray",
                  },
                },
              }}
            >
              <MenuItem>Profile</MenuItem>
              <MenuItem>My account</MenuItem>
              <MenuItem>Logout</MenuItem>
            </Menu>
          </Dropdown>
          <span className="SubtitleBudget"> Pin Color</span>
          <MuiColorInput
            style={{ width: "100%" }}
            format="hex"
            value={value}
            onChange={handleChange}
          />
          <button className="add-item-btn">Edit item</button>
        </div>
      </div>
    </div>
  );
}

export default AddPin;
