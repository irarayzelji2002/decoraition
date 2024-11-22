import React, { useEffect } from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { menuItemStyles, selectStyles } from "../pages/DesignSpace/DesignSettings";

const CurrencySelect = ({ selectedCurrency, setSelectedCurrency, currencyDetails }) => {
  useEffect(() => {
    if (Object.keys(selectedCurrency).length === 0) {
      const phCurrency = currencyDetails.find((currency) => currency.countryISO === "PH");
      setSelectedCurrency(phCurrency);
    }
  }, []);

  useEffect(() => {
    console.log("selectedCurrency", selectedCurrency);
  }, [selectedCurrency]);

  return (
    <Select
      labelId="currency-select-label"
      id="currency-select"
      value={selectedCurrency}
      onChange={(e) => setSelectedCurrency(e.target.value)}
      sx={{
        ...selectStyles,
        ...currencySelectStyles,
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            minWidth: "250px !important",
            transform: "translateY(2px) !important",
            borderRadius: "10px",
            "& .MuiMenu-list": {
              borderRadius: "10px",
              padding: 0,
              maxHeight: "393px",
            },
          },
        },
      }}
      IconComponent={(props) => (
        <KeyboardArrowDownRoundedIcon sx={{ color: "var(--color-white) !important" }} />
      )}
      renderValue={(selected) => selected?.currencyCode || ""}
    >
      {currencyDetails.map((currency) => (
        <MenuItem
          key={currency.countryISO}
          value={currency}
          sx={{ ...menuItemStyles, display: "flex" }}
        >
          <ListItemIcon sx={{ flexShrink: 1, marginRight: "5px", color: "rgba(0, 0, 0, 1)" }}>
            <span role="img" aria-label={currency.currencyCode} style={{ fontSize: "1.5rem" }}>
              {currency.flagEmoji}
            </span>
          </ListItemIcon>
          <ListItemText
            sx={{
              flexGrow: 1,
              maxWidth: "200px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "wrap",
            }}
          >
            <Typography variant="body1" color="var(--color-white)">
              {currency.currencyCode}
            </Typography>
            <Typography variant="body2" color="var(--color-white)">
              {currency.currencyName}
            </Typography>
          </ListItemText>
          <Typography
            variant="body2"
            color="var(--greyText)"
            sx={{ flexShrink: 1, marginLeft: "auto", paddingLeft: "15px", textAlign: "right" }}
          >
            {currency.currencySymbol}
          </Typography>
        </MenuItem>
      ))}
    </Select>
  );
};

export default CurrencySelect;

const currencySelectStyles = {
  width: "102px",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
    borderWidth: 2,
    borderRadius: "10px",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
  },
  "& .MuiSelect-select.MuiInputBase-input": {
    padding: "15px 12px 15px 16px !important",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
  },
  "& .MuiSvgIcon-root": {
    marginRight: "8px",
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
    "& .MuiSvgIcon-root": {
      color: "transparent !important",
    },
  },
};
