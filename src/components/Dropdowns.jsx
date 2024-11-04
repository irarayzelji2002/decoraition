import * as React from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

export default function SelectSmall() {
  const [owner, setOwner] = React.useState("");
  const [dateModified, setDateModified] = React.useState("");
  const [dateCreated, setDateCreated] = React.useState("");
  const [sortBy, setSortBy] = React.useState("");
  const [order, setOrder] = React.useState("");

  return (
    <div className="scrollable-div">
      {/* Owner Select */}
      <FormControl className="see-dropdown">
        {/* <InputLabel className="label-dropdown">Owner</InputLabel> */}
        <Select
          labelId="owner-select-label"
          id="owner-select"
          className="custom-selectAll"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
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
          <MenuItem value="">Owner</MenuItem>
          <MenuItem value="userId1">Jakob</MenuItem>
          <MenuItem value="userId2">Aliah</MenuItem>
          <MenuItem value="userId3">Yna</MenuItem>
          <MenuItem value="userId4">Ira</MenuItem>
        </Select>
      </FormControl>

      {/* Date Modified Select */}
      <FormControl className="see-dropdown">
        {/* <InputLabel className="label-dropdown">Date Modified</InputLabel> */}
        <Select
          labelId="date-modified-select-label"
          id="date-modified-select"
          className="custom-selectAll"
          value={dateModified}
          onChange={(e) => setDateModified(e.target.value)}
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
          <MenuItem value="">Date Modified</MenuItem>
          <MenuItem value="timestamp">01/01/24</MenuItem>
          <MenuItem value="timestamp">10/20/24</MenuItem>
          <MenuItem value="timestamp">07/19/23</MenuItem>
          <MenuItem value="timestamp">10/03/24</MenuItem>
        </Select>
      </FormControl>

      {/* Date Created Select */}
      <FormControl className="see-dropdown">
        {/* <InputLabel className="label-dropdown">Date Created</InputLabel> */}
        <Select
          labelId="date-created-select-label"
          id="date-created-select"
          className="custom-selectAll"
          value={dateCreated}
          onChange={(e) => setDateCreated(e.target.value)}
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
          <MenuItem value="">Date Created</MenuItem>
          <MenuItem value="timestamp">01/01/24</MenuItem>
          <MenuItem value="timestamp">10/20/24</MenuItem>
          <MenuItem value="timestamp">07/19/23</MenuItem>
          <MenuItem value="timestamp">10/03/24</MenuItem>
        </Select>
      </FormControl>

      {/* Sort By Select */}
      <FormControl className="see-dropdown">
        {/* <InputLabel className="label-dropdown">Sort By</InputLabel> */}
        <Select
          labelId="sort-by-select-label"
          id="sort-by-select"
          className="custom-selectAll"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
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
          <MenuItem value="dateModified">Date Modified</MenuItem>
          <MenuItem value="dateCreated">Date Created</MenuItem>
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="owner">Owner</MenuItem>
        </Select>
      </FormControl>

      {/* Order Select */}
      <FormControl className="see-dropdown">
        {/* <InputLabel className="label-dropdown">Order</InputLabel> */}
        <Select
          labelId="order-select-label"
          id="order-select"
          className="custom-selectAll"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
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
