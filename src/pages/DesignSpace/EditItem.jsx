import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Firebase Firestore methods
import { db } from "../../firebase"; // Your Firebase config file
import "../../css/addItem.css";
import TopBar from "../../components/TopBar";
import { getAuth } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import NoImage from "./svg/NoImage";
import { showToast } from "../../functions/utils";

const EditItem = () => {
  const { itemId, designId, projectId } = useParams(); // Get IDs from URL
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [image, setImage] = useState(null); // For image preview and re-upload

  // Fetch the item details when the component mounts

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      }
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [designId]);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const itemRef = doc(db, "budgets", itemId);

        const itemSnap = await getDoc(itemRef);

        if (itemSnap.exists()) {
          const itemData = itemSnap.data();
          setItemName(itemData.itemName);
          setItemPrice(itemData.cost);
          setItemQuantity(itemData.quantity);
          if (itemData.imageUrl) {
            setImage(itemData.imageUrl); // If the image URL exists, set it
          }
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      }
    };

    fetchItemDetails();
  }, [itemId, designId, userId]);

  // Handle image upload for preview (no actual storage handling here)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file)); // For preview purposes only
    }
  };
  const isProjectPath = window.location.pathname.includes("/project");
  // Handle updating the item in Firestore
  const handleSave = async () => {
    try {
      const itemRef = doc(db, "budgets", itemId);

      await updateDoc(itemRef, {
        itemName,
        cost: itemPrice,
        quantity: itemQuantity,
        // Optionally handle image updates (requires uploading image to Firebase storage)
      });

      showToast("success", `${itemName} has been updated!`);
      setTimeout(() => {
        navigate(-1);
      }, 1000);
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  return (
    <>
      <TopBar state={"Edit Item"} />
      <ToastContainer progressStyle={{ backgroundColor: "var(--brightFont)" }} />
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

            {/* Item Price */}
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
            <button className="add-item-btn" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditItem;
