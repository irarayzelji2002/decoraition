import * as React from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

export default function SelectSmall({
  owners = [],
  onOwnerChange = () => {},
  onDateRangeChange = () => {},
}) {
  const [owner, setOwner] = React.useState("");
  const [dateModified, setDateModified] = React.useState("");
  const [dateCreated, setDateCreated] = React.useState("");
  const [sortBy, setSortBy] = React.useState("");
  const [order, setOrder] = React.useState("");
  const [dateRange, setDateRange] = React.useState({ start: "", end: "" });

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
    onDateRangeChange({ ...dateRange, [name]: value });
  };

  return (
    <div className="scrollable-div">
      {/* Owner Select */}
      <FormControl className="see-dropdown">
        <InputLabel className="label-dropdown">Owner</InputLabel>
        <Select
          labelId="owner-select-label"
          id="owner-select"
          className="custom-selectAll"
          value={owner}
          onChange={(e) => {
            setOwner(e.target.value);
            onOwnerChange(e.target.value);
          }}
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
          {owners.map((owner) => (
            <MenuItem key={owner} value={owner}>
              {owner}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Date Modified Select */}
      <FormControl className="see-dropdown">
        <InputLabel className="label-dropdown">Date Modified</InputLabel>
        <Select
          labelId="date-modified-select-label"
          id="date-modified-select"
          className="custom-selectAll"
          value={dateModified}
          onChange={(e) => {
            setDateModified(e.target.value);
            if (e.target.value !== "dateRange") {
              onDateRangeChange({ start: "", end: "" });
            }
          }}
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
          <MenuItem value="today">Today</MenuItem>
          <MenuItem value="thisWeek">This week</MenuItem>
          <MenuItem value="thisMonth">This Month</MenuItem>
          <MenuItem value="thisYear">This Year</MenuItem>
          <MenuItem value="dateRange">Choose Date Range</MenuItem>
        </Select>
      </FormControl>

      {/* Date Created Select */}
      <FormControl className="see-dropdown">
        <InputLabel className="label-dropdown">Date Created</InputLabel>
        <Select
          labelId="date-created-select-label"
          id="date-created-select"
          className="custom-selectAll"
          value={dateCreated}
          onChange={(e) => {
            setDateCreated(e.target.value);
            if (e.target.value !== "dateRange") {
              onDateRangeChange({ start: "", end: "" });
            }
          }}
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
          <MenuItem value="today">Today</MenuItem>
          <MenuItem value="thisWeek">This week</MenuItem>
          <MenuItem value="thisMonth">This Month</MenuItem>
          <MenuItem value="thisYear">This Year</MenuItem>
          <MenuItem value="dateRange">Choose Date Range</MenuItem>
        </Select>
      </FormControl>

      {/* Sort By Select */}
      <FormControl className="see-dropdown">
        <InputLabel className="label-dropdown">Sort By</InputLabel>
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
        <InputLabel className="label-dropdown">Order</InputLabel>
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

      {/* Date Range Picker */}
      {dateModified === "dateRange" || dateCreated === "dateRange" ? (
        <div className="date-range-picker">
          <input
            type="date"
            name="start"
            value={dateRange.start}
            onChange={handleDateRangeChange}
          />
          <span> to </span>
          <input type="date" name="end" value={dateRange.end} onChange={handleDateRangeChange} />
        </div>
      ) : null}
    </div>
  );
}
