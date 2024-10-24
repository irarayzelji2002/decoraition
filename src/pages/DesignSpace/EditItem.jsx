import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
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
  const { userItems } = useSharedProps;
  const { budgetId, itemId } = useParams();
  const [item, setItem] = useState(null);

  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [currency, setCurrency] = useState("PHP");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [image, setImage] = useState(null);
  const [isUploadedImage, setIsUploadedImage] = useState(false);
  const [imageLink, setImageLink] = useState("");

  // Initialize
  useEffect(() => {
    const fetchedItem = userItems.find((item) => item.id === itemId);
    setItem(item);

    if (!fetchedItem) {
      return <div>Item not found.</div>;
    }
  }, []);

  useEffect(() => {
    setItemName(item.itemName);
    setDescription(item.description);
    setItemPrice(item.cost.amount);
    setCurrency(item.cost.currency);
    setItemQuantity(item.quantity);
    setImage(item.image);
  }, [item]);

  // Handle image upload for preview (no actual storage handling here)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploadedImage(true);
      setImage(URL.createObjectURL(file)); // For preview purposes only
    }
  };
  const isProjectPath = window.location.pathname.includes("/project");

  const handleEditItem = async () => {
    if (itemName.trim() === "") {
      alert("Item name cannot be empty");
      return;
    }

    try {
      const response = await axios.put(`/api/design/item/${itemId}/update-item`, {
        budgetId: budgetId,
        itemName: itemName,
        description: description,
        cost: { amount: parseFloat(itemPrice), currency: currency },
        quantity: itemQuantity,
        image: isUploadedImage ? image : imageLink,
        includedInTotal: true,
        isUploadedImage: isUploadedImage, // for indication only
      });

      if (response.status === 200) {
        console.log("Item updated successfully");
        showToast("success", "Item updated successfully");
        setTimeout(() => {
          window.history.back();
        }, 1000);
      }
    } catch (error) {
      console.error("Error updating item:", error);
      showToast("error", "Failed to update item. Please try again.");
    }
  };

  return (
    <>
      <TopBar state={"Edit Item"} />
      <div className="add-item-container">
        <div className="left-column">
          <div className="upload-section">
            {image ? (
              <img src={image} alt="Item" className="uploaded-image" />
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
                  type="number"
                  placeholder="Enter item price"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Item Quantity */}
            <label htmlFor="item-quantity" className="price-label">
              Item quantity
            </label>
            <div className="quantity-section">
              <button onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}>&lt;</button>
              <span>{itemQuantity}</span>
              <button onClick={() => setItemQuantity(itemQuantity + 1)}>&gt;</button>
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
