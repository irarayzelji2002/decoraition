import React from "react";
import TopBar from "../../components/TopBar";
import "../../css/searchItem.css";
import SearchIcon from "@mui/icons-material/Search"; // Importing the SearchIcon
import Paper from "@mui/material/Paper";
import InputBase from "@mui/material/InputBase";

import IconButton from "@mui/material/IconButton";

function SearchItem() {
  // TO DO: Search Products API
  const items = new Array(12).fill({
    name: "Clothing Fabric Wedding Fabric Party Fabric Lase...",
    price: "₱246.00",
    store: "Lazada Philippines",
  });

  return (
    <div className="search-item-page">
      <TopBar state="Search Item" />
      <Paper
        component="form"
        sx={{
          p: "2px 4px",
          display: "flex",
          alignItems: "center",
          width: "69%",
          marginTop: "40px",
          backgroundColor: "var(--bgMain)",
          border: "2px solid var(--borderInput)",
          borderRadius: "20px",
          "&:focus-within": {
            borderColor: "var(--brightFont)",
          },
        }}
      >
        <IconButton type="button" sx={{ p: "10px", color: "white" }} aria-label="search">
          <SearchIcon sx={{ color: "white" }} />
        </IconButton>
        <InputBase
          sx={{ ml: 1, flex: 1, color: "white" }}
          placeholder="Search Item"
          inputProps={{ "aria-label": "search google maps" }}
        />
      </Paper>
      <div className="grid-container">
        {items.map((item, index) => (
          <div key={index} className="grid-item">
            <div className="image-placeholder2"></div>
            <div className="item-details">
              <div className="item-name">{item.name}</div>
              <div className="item-price" style={{ fontWeight: "bold" }}>
                {item.price}
              </div>
              <div className="item-store">{item.store}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="select-button-container">
        <button className="select-button">Select item</button>
      </div>
    </div>
  );
}

export default SearchItem;
