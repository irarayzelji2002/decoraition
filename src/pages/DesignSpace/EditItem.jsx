import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import deepEqual from "deep-equal";
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Firebase Firestore methods
import { db } from "../../firebase"; // Your Firebase config file
import "../../css/addItem.css";
import TopBar from "../../components/TopBar";
import { getAuth } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import NoImage from "./svg/NoImage";
import { showToast } from "../../functions/utils";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

const EditItem = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateTo = location.state?.navigateFrom || "/";
  const navigateFrom = location.pathname;

  const { user, designs, userDesigns, items, userItems } = useSharedProps();
  const { budgetId, itemId } = useParams();
  const [design, setDesign] = useState({});
  const [item, setItem] = useState({});

  const [itemName, setItemName] = useState(item?.itemName ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [itemPrice, setItemPrice] = useState(item?.cost?.amount ?? "");
  const [currency, setCurrency] = useState(item?.cost?.currency ?? "PHP");
  const [itemQuantity, setItemQuantity] = useState(item?.quantity ?? 1);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(item?.image ?? null);
  const [isUploadedImage, setIsUploadedImage] = useState(false);
  const [imageLink, setImageLink] = useState("");

  const [errors, setErrors] = useState({});

  // Initialize
  useEffect(() => {
    if (userItems.length > 0) {
      const fetchedItem = userItems.find((item) => item.id === itemId);
      setItem(fetchedItem || {});

      if (!fetchedItem) {
        console.error("Item not found");
      }
    }
    if (userDesigns.length > 0) {
      const fetchedDesign = userDesigns.find((design) => design.budgetId === budgetId);
      setDesign(fetchedDesign || {});
      if (!fetchedDesign) {
        console.error("Design not found.");
      }
    }
  }, []);

  useEffect(() => {
    if (item && Object.keys(item).length > 0) {
      setItemName(item.itemName);
      setDescription(item.description);
      setItemPrice(item.cost.amount);
      setCurrency(item.cost.currency);
      setItemQuantity(item.quantity);
      setImagePreview(item.image);
      setImageLink(item.image);
    }
  }, [item]);

  // Handle image upload for preview (no actual storage handling here)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
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

      setImage(file);
      setIsUploadedImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const isProjectPath = window.location.pathname.includes("/project");

  const handleValidation = () => {
    let formErrors = {};
    // Item name validation
    if (!itemName?.trim()) formErrors.itemName = "Item name is required";
    else if (itemName.length > 100)
      formErrors.itemName = "Item name must be less than 100 characters";

    // Cost validation
    if (!itemPrice) {
      formErrors.cost = "Item price is required";
    } else {
      const costValue = parseFloat(itemPrice);
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
    if (isUploadedImage && image) {
      const acceptedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
      if (!acceptedTypes.includes(image.type)) {
        formErrors.image = "Please upload an image file of png, jpg, jpeg, gif, or webp type";
        showToast("error", formErrors.image);
      } else {
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (image.size > maxSize) {
          formErrors.image = "Image size must be less than 5MB";
          showToast("error", formErrors.image);
        }
      }
    }
    return formErrors;
  };

  const handleEditItem = async (e) => {
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
      formData.append("itemName", itemName);
      formData.append("description", description);
      formData.append(
        "cost",
        JSON.stringify({
          amount: parseFloat(itemPrice),
          currency: currency,
        })
      );
      formData.append("quantity", itemQuantity);
      formData.append("includedInTotal", true);
      formData.append("isUploadedImage", isUploadedImage);

      if (isUploadedImage && image) {
        formData.append("file", image);
      } else {
        formData.append("image", imageLink);
      }
      console.log("formData (ediitng item): ", formData);

      const response = await axios.put(`/api/design/item/${itemId}/update-item`, formData, {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        console.log("Item updated successfully");
        showToast("success", "Item updated successfully");
        if (design) {
          setTimeout(() => navigate(`/budget/${design.id}`), 1000);
        } else {
          setTimeout(() => window.history.back(), 1000);
        }
      }
    } catch (error) {
      console.error("Error updating item:", error);
      if (error.response) {
        showToast(
          "error",
          error?.response?.data?.message || "Failed to update item. Please try again."
        );
      } else if (error.request) {
        showToast("error", "Network error. Please check your connection.");
      } else {
        showToast("error", "Failed to update item. Please try again.");
      }
    }
  };

  return (
    <>
      <TopBar state={"Edit Item"} navigateTo={navigateTo} navigateFrom={navigateFrom} />
      <div className="add-item-container">
        <div className="left-column">
          <div className="upload-section">
            {imagePreview ? (
              <img src={imagePreview} alt="Item" className="uploaded-image" />
            ) : (
              <div className="image-placeholder-container">
                <NoImage />
                <div className="image-placeholder">Add an image to the item</div>
              </div>
            )}
            <label htmlFor="upload-image" className="upload-btn">
              Reupload the image of item
              <input
                type="file"
                accept="image/png, image/jpeg, image/gif, image/webp"
                id="upload-image"
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </div>
        <div className="right-column">
          <div className="form-section">
            {/* Item Name */}
            <label htmlFor="item-name" className="item-name-label">
              Item name
            </label>
            <div className="input-group">
              <input
                id="item-name"
                type="text"
                placeholder="Enter item name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
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

            {/* Item Price */}
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
                  type="text"
                  placeholder="Enter item price"
                  value={itemPrice}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Allow digits and a single decimal point, up to two decimal places
                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                      // Remove leading zeros unless it’s a decimal number
                      if (/^\d+$/.test(value)) {
                        value = value.replace(/^0+/, "");
                      }
                      setItemPrice(value);
                    }
                  }}
                />
              </div>
            </div>
            <div className="error-text">{errors?.cost}</div>

            {/* Item Quantity */}
            <label htmlFor="item-quantity" className="price-label">
              Item quantity
            </label>
            <div className="quantity-section">
              <button onClick={() => setItemQuantity(Math.max(1, parseInt(itemQuantity) - 1))}>
                &lt;
              </button>
              <span>{itemQuantity}</span>
              <button onClick={() => setItemQuantity(parseInt(itemQuantity) + 1)}>&gt;</button>
            </div>
            <div className="error-text">{errors?.quantity}</div>

            {/* Save Button */}
            <button className="add-item-btn" onClick={handleEditItem}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditItem;
