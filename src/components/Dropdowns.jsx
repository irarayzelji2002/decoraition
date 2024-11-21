import * as React from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { selectStyles, menuItemStyles } from "../pages/DesignSpace/DesignSettings";

export default function SelectSmall({
  sortBy = "",
  order = "",
  onSortByChange = () => {},
  onOrderChange = () => {},
  isDesign = true,
}) {
  return (
    <div className="scrollable-div">
      {/* Sort By Select */}
      <FormControl className="see-dropdown">
        <Select
          labelId="sort-by-select-label"
          id="sort-by-select"
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
          IconComponent={(props) => (
            <KeyboardArrowDownRoundedIcon sx={{ color: "var(--color-white) !important" }} />
          )}
          sx={{
            ...selectStyles,
            "& .MuiInputBase-input": {
              WebkitTextFillColor: sortBy === "none" ? "var(--greyText)" : "var(--color-white)",
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                borderRadius: "10px",
                "& .MuiMenu-list": {
                  padding: 0,
                },
                "& .MuiMenuItem-root[aria-disabled='true']": {
                  display: "none",
                },
              },
            },
          }}
          renderValue={(selected) => {
            if (selected === "none") {
              return "Sort by";
            } else if (selected === "name") {
              return "Name";
            } else if (selected === "owner") {
              return "Owner";
            } else if (selected === "created") {
              return "Date Created";
            } else if (selected === "modified") {
              return "Date Modified";
            }
            return selected;
          }}
        >
          <MenuItem disabled value="none" sx={menuItemStyles}>
            Sort by
          </MenuItem>
          <MenuItem value="name" sx={menuItemStyles}>
            Name
          </MenuItem>
          {isDesign && (
            <MenuItem value="owner" sx={menuItemStyles}>
              Owner
            </MenuItem>
          )}
          <MenuItem value="created" sx={menuItemStyles}>
            Date Created
          </MenuItem>
          <MenuItem value="modified" sx={menuItemStyles}>
            Date Modified
          </MenuItem>
        </Select>
      </FormControl>

      {/* Order Select */}
      <FormControl className="see-dropdown">
        <Select
          labelId="order-select-label"
          id="order-select"
          value={order}
          onChange={(e) => onOrderChange(e.target.value)}
          IconComponent={(props) => (
            <KeyboardArrowDownRoundedIcon sx={{ color: "var(--color-white) !important" }} />
          )}
          sx={{
            ...selectStyles,
            "& .MuiInputBase-input": {
              WebkitTextFillColor: order === "none" ? "var(--greyText)" : "var(--color-white)",
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                borderRadius: "10px",
                "& .MuiMenu-list": {
                  padding: 0,
                },
                "& .MuiMenuItem-root[aria-disabled='true']": {
                  display: "none",
                },
              },
            },
          }}
          renderValue={(selected) => {
            if (selected === "none") {
              return "Order";
            } else if (selected === "ascending") {
              return "Ascending";
            } else if (selected === "descending") {
              return "Descending";
            }
            return selected;
          }}
        >
          <MenuItem disabled value="none" sx={menuItemStyles}>
            Order
          </MenuItem>
          <MenuItem value="ascending" sx={menuItemStyles}>
            Ascending
          </MenuItem>
          <MenuItem value="descending" sx={menuItemStyles}>
            Descending
          </MenuItem>
        </Select>
      </FormControl>
    </div>
  );
}
