import axios from "axios";
import deepEqual from "deep-equal";
import "../../css/addItem.css";
import TopBar from "../../components/TopBar";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { useSharedProps } from "../../contexts/SharedPropsContext";

const AddItem = () => {
  const { budgetId } = useParams();
  const navigate = useNavigate();
  const { user, designs, userDesigns } = useSharedProps();
  const [design, setDesign] = useState({});

  const [itemQuantity, setItemQuantity] = useState(1);
  const [budgetItem, setBudgetItem] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [currency, setCurrency] = useState("PHP");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [isUploadedImage, setIsUploadedImage] = useState(false);
  const [imageLink, setImageLink] = useState("");

  // Initialize
  useEffect(() => {
    const fetchedDesign = userDesigns.find((design) => design.budgetId === budgetId);
    setDesign(fetchedDesign || {});
    if (!fetchedDesign) {
      console.error("Design not found.");
    }
  }, []);

  // Updates on Real-time changes on shared props
  useEffect(() => {
    const fetchedDesign = userDesigns.find((design) => design.budgetId === budgetId);

    if (!fetchedDesign) {
      console.error("Design not found");
    } else if (!deepEqual(design, fetchedDesign)) {
      setDesign(fetchedDesign);
    }
  }, [designs, userDesigns]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setIsUploadedImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImagePreview(reader.result);
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

  const handleAddItem = async () => {
    if (budgetItem.trim() === "") {
      showToast("error", "Item name cannot be empty");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("budgetId", budgetId);
      formData.append("itemName", budgetItem);
      formData.append("description", description);
      formData.append(
        "cost",
        JSON.stringify({
          amount: parseFloat(cost),
          currency: currency,
        })
      );
      formData.append("quantity", itemQuantity);
      formData.append("includedInTotal", true);
      formData.append("isUploadedImage", isUploadedImage);

      if (isUploadedImage && selectedImage) {
        formData.append("file", selectedImage);
      } else {
        formData.append("file", imageLink);
      }

      const response = await axios.post("/api/design/item/add-item", formData, {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        const itemName = budgetItem;
        showToast("success", `${itemName} has been added!`);
        if (design) {
          setTimeout(() => navigate(`/budget/${design.id}`), 1000);
        } else {
          setTimeout(() => window.history.back(), 1000);
        }
      }
    } catch (error) {
      console.error("Error adding item:", error);
      if (error.response) {
        showToast("error", error?.response?.data?.error || "Failed to add item. Please try again.");
      } else if (error.request) {
        showToast("error", "Network error. Please check your connection.");
      } else {
        showToast("error", "Failed to add item. Please try again.");
      }
    }
  };

  return (
    <div style={{ overflow: "hidden" }}>
      <TopBar state={"Add Item"} />
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
            {selectedImagePreview ? (
              <img
                src={selectedImagePreview}
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
                accept="image/png, image/jpeg, image/gif, image/webp"
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

            {/* Item Description */}
            <label htmlFor="item-description" className="item-name-label">
              Item Description
            </label>
            <div className="input-group">
              <input
                id="item-description"
                type="text"
                placeholder="Enter item description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Item price */}
            <label htmlFor="item-price" className="price-label">
              Item price
            </label>
            <div className="input-group">
              <div className="price-quantity-section">
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="PHP">PHP</option>
                  <option value="USD">USD</option>
                </select>
                <input
                  id="item-price"
                  value={cost}
                  type="text"
                  placeholder="Enter item price"
                  onChange={(e) => {
                    let value = e.target.value;
                    // Allow digits and a single decimal point, up to two decimal places
                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                      // Remove leading zeros unless it’s a decimal number
                      if (/^\d+$/.test(value)) {
                        value = value.replace(/^0+/, "");
                      }
                      setCost(value);
                    }
                  }}
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
            <button className="add-item-btn" onClick={handleAddItem}>
              Add item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddItem;
