import React from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { countries } from "countries-data-kit";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

// Currency data from countries-data-kit
const currencyDetails = countries
  .map((country) => ({
    flagEmoji: country.flagEmoji,
    currency: country.CFields.currency,
    currencyCode: country.CFields.currencyCode,
    currencySymbol: country.CFields.currencySymbol,
  }))
  .filter((currency) => currency.currencyCode); // Filter out entries without currency code

const CurrencySelect = ({ selectedCurrency, handleSelect }) => {
  return (
    <Select
      labelId="currency-select-label"
      id="currency-select"
      value={selectedCurrency}
      onChange={(e) => handleSelect(e.target.value)}
      IconComponent={(props) => (
        <KeyboardArrowDownRoundedIcon sx={{ color: "var(--color-white) !important" }} />
      )}
      sx={{ width: "200px", color: "var(--color-white)" }}
    >
      {currencyDetails.map((currency) => (
        <MenuItem key={currency.currencyCode} value={currency.currencyCode}>
          <ListItemIcon>
            <span role="img" aria-label={currency.currencyCode} style={{ fontSize: "1.5rem" }}>
              {currency.flagEmoji}
            </span>
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body1" color="var(--color-white)">
              {currency.currencyCode}
            </Typography>
            <Typography variant="body2" color="var(--color-white)">
              {currency.currency}
            </Typography>
          </ListItemText>
          <Typography variant="body2" color="var(--color-white)">
            {currency.currencySymbol}
          </Typography>
        </MenuItem>
      ))}
    </Select>
  );
};

export default CurrencySelect;
