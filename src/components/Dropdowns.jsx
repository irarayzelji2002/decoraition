import * as React from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { Menu, styled } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

export default function SelectSmall() {
  const [owner, setOwner] = React.useState("");
  const [dateModified, setDateModified] = React.useState("");
  const [dateCreated, setDateCreated] = React.useState("");
  const [sortBy, setSortBy] = React.useState("");
  const [order, setOrder] = React.useState("");

  // Custom styles for Menu

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

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",

        justifyContent: "center",
        margin: "16px",
      }}
    >
      {/* Owner Select */}

      <FormControl sx={formControlStyles}>
        <InputLabel
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
          Owner
        </InputLabel>
        <Select
          labelId="owner-select-label"
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
          sx={{
            color: "var(--color-white)",
            backgroundColor: "var(--bgMain)",
            borderBottom: "1px solid #4a4a4d",
            borderRadius: "8px",
            transition: "background-color 0.3s ease",
            "&.Mui-focused": {
              borderBottom: "1px solid var(--focusBorderColor)", // Change border color when focused
              outline: "none",
              boxShadow: "none", // Remove blue outline effect
              color: "var(--color-grey)", // Ensure text color remains white
            },

            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--color-white)",
            },
          }}
        >
          <MenuItem value="" sx={menuItemStyles}>
            <em>None</em>
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

      {/* Date Modified Select */}
      <FormControl sx={formControlStyles}>
        <InputLabel
          id="date-modified-select-label"
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
          Date Modified
        </InputLabel>
        <Select
          labelId="date-modified-select-label"
          id="date-modified-select"
          value={dateModified}
          label="Date Modified"
          onChange={(e) => setDateModified(e.target.value)}
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
          sx={{
            color: "var(--color-white)",
            backgroundColor: "var(--bgMain)",
            borderBottom: "1px solid #4a4a4d",
            borderRadius: "8px",
            transition: "background-color 0.3s ease",
            "&.Mui-focused": {
              borderBottom: "1px solid var(--focusBorderColor)",
              outline: "none",
              boxShadow: "none",
              color: "var(--color-grey)",
            },

            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--color-white)",
            },
          }}
        >
          <MenuItem value="" sx={menuItemStyles}>
            <em>None</em>
          </MenuItem>
          <MenuItem sx={menuItemStyles} value="2023-01-01">
            2023-01-01
          </MenuItem>
          <MenuItem sx={menuItemStyles} value="2023-02-01">
            2023-02-01
          </MenuItem>
          <MenuItem sx={menuItemStyles} value="2023-03-01">
            2023-03-01
          </MenuItem>
        </Select>
      </FormControl>

      {/* Date Created Select */}
      <FormControl sx={formControlStyles}>
        <InputLabel
          id="date-created-select-label"
          sx={{
            color: "var(--color-white)",
            "&.Mui-focused": {
              color: "var(--color-white)",
            },
            "&.MuiInputLabel-shrink": {
              color: "var(--color-white)",
            },
            "&.Mui-focused.MuiInputLabel-shrink": {
              color: "var(--color-white)",
            },
          }}
        >
          Date Created
        </InputLabel>
        <Select
          labelId="date-created-select-label"
          id="date-created-select"
          value={dateCreated}
          label="Date Created"
          onChange={(e) => setDateCreated(e.target.value)}
          MenuProps={{
            PaperProps: {
              sx: {
                "& .MuiMenu-list": {
                  padding: 0,
                },
              },
            },
          }}
          MenuComponent={StyledMenu}
          IconComponent={ArrowDropDownIcon}
          sx={{
            color: "var(--color-white)",
            backgroundColor: "var(--bgMain)",
            borderBottom: "1px solid #4a4a4d",
            borderRadius: "8px",
            transition: "background-color 0.3s ease",
            "&.Mui-focused": {
              borderBottom: "1px solid var(--focusBorderColor)",
              outline: "none",
              boxShadow: "none",
              color: "var(--color-grey)",
            },

            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--color-white)",
            },
          }}
        >
          <MenuItem value="" sx={menuItemStyles}>
            <em>None</em>
          </MenuItem>
          <MenuItem sx={menuItemStyles} value="2023-01-01">
            2023-01-01
          </MenuItem>
          <MenuItem sx={menuItemStyles} value="2023-02-01">
            2023-02-01
          </MenuItem>
          <MenuItem sx={menuItemStyles} value="2023-03-01">
            2023-03-01
          </MenuItem>
        </Select>
      </FormControl>

      {/* Sort By Select */}
      <FormControl sx={formControlStyles}>
        <InputLabel
          id="sort-by-select-label"
          sx={{
            color: "var(--color-white)",
            "&.Mui-focused": {
              color: "var(--color-white)",
            },
            "&.MuiInputLabel-shrink": {
              color: "var(--color-white)",
            },
            "&.Mui-focused.MuiInputLabel-shrink": {
              color: "var(--color-white)",
            },
          }}
        >
          Sort By
        </InputLabel>
        <Select
          labelId="sort-by-select-label"
          id="sort-by-select"
          value={sortBy}
          label="Sort By"
          onChange={(e) => setSortBy(e.target.value)}
          MenuComponent={StyledMenu}
          MenuProps={{
            PaperProps: {
              sx: {
                "& .MuiMenu-list": {
                  padding: 0,
                },
              },
            },
          }}
          IconComponent={ArrowDropDownIcon}
          sx={{
            color: "var(--color-white)",
            backgroundColor: "var(--bgMain)",
            borderBottom: "1px solid #4a4a4d",
            borderRadius: "8px",
            transition: "background-color 0.3s ease",
            "&.Mui-focused": {
              borderBottom: "1px solid var(--focusBorderColor)",
              outline: "none",
              boxShadow: "none",
              color: "var(--color-grey)",
            },

            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--color-white)",
            },
          }}
        >
          <MenuItem value="" sx={menuItemStyles}>
            <em>None</em>
          </MenuItem>
          <MenuItem sx={menuItemStyles} value="Name">
            Name
          </MenuItem>
          <MenuItem sx={menuItemStyles} value="Date">
            Date
          </MenuItem>
        </Select>
      </FormControl>

      {/* Order Select */}
      <FormControl sx={formControlStyles}>
        <InputLabel
          id="order-select-label"
          sx={{
            color: "var(--color-white)",
            "&.Mui-focused": {
              color: "var(--color-white)",
            },
            "&.MuiInputLabel-shrink": {
              color: "var(--color-white)",
            },
            "&.Mui-focused.MuiInputLabel-shrink": {
              color: "var(--color-white)",
            },
          }}
        >
          Order
        </InputLabel>
        <Select
          labelId="order-select-label"
          id="order-select"
          value={order}
          label="Order"
          onChange={(e) => setOrder(e.target.value)}
          MenuComponent={StyledMenu}
          MenuProps={{
            PaperProps: {
              sx: {
                "& .MuiMenu-list": {
                  padding: 0,
                },
              },
            },
          }}
          IconComponent={ArrowDropDownIcon}
          sx={{
            color: "var(--color-white)",
            backgroundColor: "var(--bgMain)",
            borderBottom: "1px solid #4a4a4d",
            borderRadius: "8px",
            transition: "background-color 0.3s ease",
            "&.Mui-focused": {
              borderBottom: "1px solid var(--focusBorderColor)",
              outline: "none",
              color: "var(--color-grey)",
            },

            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--color-white)",
            },
          }}
        >
          <MenuItem value="" sx={menuItemStyles}>
            <em>None</em>
          </MenuItem>
          <MenuItem sx={menuItemStyles} value="Ascending">
            Ascending
          </MenuItem>
          <MenuItem sx={menuItemStyles} value="Descending">
            Descending
          </MenuItem>
        </Select>
      </FormControl>
    </div>
  );
}
