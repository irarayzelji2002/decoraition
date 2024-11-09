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

  const [errors, setErrors] = useState({});

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
      // Image validation
      let message = "";
      const acceptedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
      if (!acceptedTypes.includes(file.type)) {
        message = "Please upload an image file of png, jpg, jpeg, gif, or webp type";
        showToast("error", message);
      } else {
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
          message = "Image size must be less than 5MB";
          showToast("error", message);
        }
      }

      if (message !== "") return;

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

  const handleValidation = () => {
    let formErrors = {};
    // Item name validation
    if (!budgetItem?.trim()) formErrors.itemName = "Item name is required";
    else if (budgetItem.length > 100)
      formErrors.itemName = "Item name must be less than 100 characters";

    // Cost validation
    if (!cost) {
      formErrors.cost = "Item price is required";
    } else {
      const costValue = parseFloat(cost);
      if (isNaN(costValue)) {
        formErrors.cost = "Item price must be a number";
      } else if (costValue <= 0) {
        formErrors.cost = "Item price must be greater than 0";
      } else if (costValue > 999999999) {
        formErrors.cost = "Item price is too high";
      }
    }

    // Description validation (optional)
    if (description && description.length > 500)
      formErrors.description = "Description must be less than 500 characters";

    // Quantity validation
    if (!itemQuantity || itemQuantity < 1) formErrors.quantity = "Quantity must be at least 1";
    else if (itemQuantity > 999999999) formErrors.quantity = "Quantity is too high";

    // Image validation
    if (isUploadedImage && selectedImage) {
      const acceptedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
      if (!acceptedTypes.includes(selectedImage.type)) {
        formErrors.image = "Please upload an image file of png, jpg, jpeg, gif, or webp type";
        showToast("error", formErrors.image);
      } else {
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (selectedImage.size > maxSize) {
          formErrors.image = "Image size must be less than 5MB";
          showToast("error", formErrors.image);
        }
      }
    }
    return formErrors;
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    const formErrors = handleValidation();

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    } else {
      setErrors({});
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
      formData.append("isUploadedImage", isUploadedImage);

      if (isUploadedImage && selectedImage) {
        formData.append("file", selectedImage);
      } else {
        formData.append("image", imageLink);
      }
      console.log("Form data (adding item):", formData);

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
                  border: "var(--borderInputBrighter) 2px solid",
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
            <div className="error-text">{errors?.itemName}</div>

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
            <div className="error-text">{errors?.description}</div>

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
            <div className="error-text">{errors?.cost}</div>

            <label htmlFor="item-price" className="price-label">
              Item Quantity
            </label>

            <div className="quantity-section">
              <button onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}>&lt;</button>
              <span style={{ color: "var(--color-white)" }}>{itemQuantity}</span>
              <button onClick={() => setItemQuantity(itemQuantity + 1)}>&gt;</button>
            </div>
            <div className="error-text">{errors?.quantity}</div>

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
