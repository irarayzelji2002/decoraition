import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

const EditItem = () => {
  const navigate = useNavigate();
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

  // Initialize
  useEffect(() => {
    if (userItems.length > 0) {
      const fetchedItem = userItems.find((item) => item.id === itemId);
      setItem(item);

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

  // Updates on Real-time changes on shared props
  useEffect(() => {
    const fetchedDesign = userDesigns.find((design) => design.budgetId === budgetId);

    if (!fetchedDesign) {
      console.error("Design not found");
    } else if (!deepEqual(design, fetchedDesign)) {
      setDesign(fetchedDesign);
    }
  }, [designs, userDesigns]);

  useEffect(() => {
    const fetchedItem = userItems.find((item) => item.id === itemId);

    if (!fetchedItem) {
      console.error("Item not found");
    } else if (!deepEqual(item, fetchedItem)) {
      setItemName(fetchedItem.itemName);
      setDescription(fetchedItem.description);
      setItemPrice(fetchedItem.cost.amount);
      setCurrency(fetchedItem.cost.currency);
      setItemQuantity(fetchedItem.quantity);
      setImagePreview(fetchedItem.image);
      setImageLink(fetchedItem.image);
    }
  }, [items, userItems]);

  // Handle image upload for preview (no actual storage handling here)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setIsUploadedImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
    setIsUploadedImage(true);
  };
  const isProjectPath = window.location.pathname.includes("/project");

  const handleEditItem = async () => {
    if (itemName.trim() === "") {
      showToast("error", "Item name cannot be empty");
      return;
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
        formData.append("image", image);
      } else {
        formData.append("image", imageLink);
      }
      console.log("formData", formData);

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
          error?.response?.data?.error || "Failed to update item. Please try again."
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
      <TopBar state={"Edit Item"} />
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
