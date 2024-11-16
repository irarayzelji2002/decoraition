import * as React from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

export default function SelectSmall({
  sortBy = "",
  order = "",
  onSortByChange = () => {},
  onOrderChange = () => {},
}) {
  return (
    <div className="scrollable-div">
      {/* Sort By Select */}
      <FormControl className="see-dropdown">
        <InputLabel className="label-dropdown">Sort By</InputLabel>
        <Select
          labelId="sort-by-select-label"
          id="sort-by-select"
          className="custom-selectAll"
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
          IconComponent={(props) => (
            <KeyboardArrowDownRoundedIcon sx={{ color: "var(--color-white) !important" }} />
          )}
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
        >
          <MenuItem value="">Sort by</MenuItem>
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="owner">Owner</MenuItem>
          <MenuItem value="created">Date Created</MenuItem>
          <MenuItem value="modified">Date Modified</MenuItem>
        </Select>
      </FormControl>

      {/* Order Select */}
      <FormControl className="see-dropdown">
        <InputLabel className="label-dropdown">Order</InputLabel>
        <Select
          labelId="order-select-label"
          id="order-select"
          className="custom-selectAll"
          value={order}
          onChange={(e) => onOrderChange(e.target.value)}
          IconComponent={(props) => (
            <KeyboardArrowDownRoundedIcon sx={{ color: "var(--color-white) !important" }} />
          )}
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
        >
          <MenuItem value="">Order</MenuItem>
          <MenuItem value="ascending">Ascending</MenuItem>
          <MenuItem value="descending">Descending</MenuItem>
        </Select>
      </FormControl>
    </div>
  );
}
