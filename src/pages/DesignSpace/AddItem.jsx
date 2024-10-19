import "../../css/addItem.css";
import TopBar from "../../components/TopBar";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../../css/budget.css";
import { db } from "../../firebase"; // Assuming you have firebase setup
import { collection, addDoc, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import { InputAdornment } from "@mui/material";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import NoImage from "./svg/NoImage";
import { showToast } from "../../functions/utils";

const AddItem = () => {
  const [itemQuantity, setItemQuantity] = useState(1);
  const { designId } = useParams();
  const [budgetItem, setBudgetItem] = useState("");
  const [cost, setCost] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    document.getElementById("upload-image").click();
  };

  const handleInputChange = (e) => {
    setBudgetItem(e.target.value);
  };

  const handleCost = (e) => {
    setCost(e.target.value);
  };

  const handleInputSubmit = async () => {
    if (budgetItem.trim() === "") {
      alert("Pin cannot be empty");
      return;
    }

    try {
      let pinRef;

      pinRef = collection(db, "budgets");

      await addDoc(pinRef, {
        itemName: budgetItem,
        description: "",
        cost: cost,
        quantity: itemQuantity,
        designId,
      });
      setBudgetItem("");

      const itemName = budgetItem;
      showToast("success", `${itemName} has been added!`);
      setTimeout(() => {
        window.history.back();
      }, 1000);
    } catch (error) {
      console.error("Error adding pin:", error);
      alert("Failed to add pin");
    }
  };

  return (
    <div style={{ overflow: "hidden" }}>
      <TopBar state={"Add Item"} />
      <ToastContainer progressStyle={{ backgroundColor: "var(--brightFont)" }} />
      <div className="add-item-container">
        <div className="left-column">
          <TextField
            placeholder="Search for an item"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ color: "var(--color-white)" }}>
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              width: "100%",
              marginBottom: "20px",

              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  border: "var(--borderInput) 2px solid",
                  borderRadius: "20px",
                },
                "&:hover fieldset": {
                  border: "var(--borderInput) 2px solid",
                },
                "&.Mui-focused fieldset": {
                  border: "var(--brightFont) 2px solid",
                },
                "& input": {
                  color: "var(--color-white)", // Change the text color
                },
              },
            }}
            fullWidth
          />

          <div className="upload-section">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Selected"
                style={{
                  objectFit: "cover",
                  width: "100%",
                  height: "350px",
                  marginBottom: "40px",
                  borderRadius: "20px",
                }}
              />
            ) : (
              <div className="image-placeholder-container">
                <NoImage />
                <div className="image-placeholder">Add an image to the item</div>
              </div>
            )}
            <button onClick={triggerFileInput} className="upload-btn">
              Upload image of item
              <input
                type="file"
                id="upload-image"
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />
            </button>
          </div>
        </div>
        <div className="right-column">
          <div className="form-section">
            {/* Item name */}
            <label htmlFor="item-name" className="item-name-label">
              Item name
            </label>
            <div className="input-group">
              <input
                id="item-name"
                value={budgetItem}
                type="text"
                placeholder="Enter item name"
                onChange={handleInputChange}
                style={{ outline: "none" }}
                className="focus-border"
              />
            </div>

            {/* Item price */}
            <label htmlFor="item-price" className="price-label">
              Item price
            </label>
            <div className="input-group">
              <div className="price-quantity-section">
                <select>
                  <option value="PHP">PHP</option>
                </select>
                <input
                  id="item-price"
                  value={cost}
                  type="number"
                  placeholder="Enter item price"
                  onChange={handleCost}
                  style={{ outline: "none" }}
                />
              </div>
            </div>
            <label htmlFor="item-price" className="price-label">
              Item Quantity
            </label>

            <div className="quantity-section">
              <button onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}>&lt;</button>
              <span style={{ color: "var(--color-white)" }}>{itemQuantity}</span>
              <button onClick={() => setItemQuantity(itemQuantity + 1)}>&gt;</button>
            </div>

            {/* Add Item Button */}
            <button className="add-item-btn" onClick={handleInputSubmit}>
              Add item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddItem;
