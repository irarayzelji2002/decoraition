import React, { version } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Menu, styled } from "@mui/material";

const DownloadModal = ({ isOpen, onClose }) => {
  const [version, setVersion] = React.useState("");
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "var(  --nav-card-modal)", // Custom background color for the dialog
          borderRadius: "20px", // Custom border radius for the dialog
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "var(--nav-card-modal)", // Title background color
          color: "var(--color-white)", // Title text color
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconButton onClick={onClose} sx={{ color: "var(--color-white)", marginRight: 1 }}>
          <ArrowBackIcon sx={{ color: "var(--color-white)" }} />
        </IconButton>
        Download
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: "var(--nav-card-modal)",
          color: "var(--color-white)",
        }}
      >
        <Typography variant="body1">Choose your download options and format.</Typography>
      </DialogContent>
      <div style={{ display: "flex", justifyContent: "center" }}>
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
            File Type
          </InputLabel>
          <Select
            labelId="date-modified-select-label"
            id="date-modified-select"
            value={version}
            label="Date Modified"
            onChange={(e) => setVersion(e.target.value)}
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
              JPEG
            </MenuItem>
            <MenuItem sx={menuItemStyles} value="2023-02-01">
              PNG
            </MenuItem>
            <MenuItem sx={menuItemStyles} value="2023-03-01">
              PDF
            </MenuItem>
          </Select>
        </FormControl>
      </div>
      <DialogActions sx={{ backgroundColor: "var(--nav-card-modal)", margin: "10px" }}>
        {/* Download Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            background: "var(--gradientButton)", // Gradient background
            borderRadius: "20px", // Button border radius
            color: "var(--color-white)", // Button text color
            fontWeight: "bold",
            textTransform: "none",
            "&:hover": {
              background: "var(--gradientButtonHover)", // Reverse gradient on hover
            },
          }}
        >
          Download
        </Button>

        {/* Cancel Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            color: "var(--color-white)",
            border: "2px solid transparent",
            borderRadius: "20px",
            backgroundImage: "var(--lightGradient), var(--gradientButton)",
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
            fontWeight: "bold",
            textTransform: "none",
          }}
          onMouseOver={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButtonHover)")
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
          }
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DownloadModal;

const StyledMenu = styled(Menu)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "var(--nav-card-modal)",
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
  width: "80%",
  backgroundColor: "var(--nav-card-modal)",
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
    color: "var(--nav-card-modal)",
    fontWeight: "bold",
  },
  "&.Mui-selected:hover": {
    backgroundColor: "var(--dropdownHover)",
  },
};
