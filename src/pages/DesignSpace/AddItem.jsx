import "../../css/addItem.css";
import TopBar from "../../components/TopBar";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../../css/budget.css";
import { db } from "../../firebase"; // Assuming you have firebase setup
import { collection, addDoc, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";

const AddItem = ({ ...sharedProps }) => {
  const [itemQuantity, setItemQuantity] = useState(1);
  const [image, setImage] = useState(null);
  const { designId, projectId } = useParams();
  const [userId, setUserId] = useState(null);
  const [budgetItem, setBudgetItem] = useState("");
  const [cost, setCost] = useState(0);

  const handleImageUpload = (e) => {
    setImage(URL.createObjectURL(e.target.files[0]));
  };

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        console.error("User is not authenticated");
      }
    });
    return () => unsubscribe();
  }, [designId]);

  const handleInputChange = (e) => {
    setBudgetItem(e.target.value);
  };

  const handleCost = (e) => {
    setCost(e.target.value);
  };

  const isProjectPath = window.location.pathname.includes("/project");

  const handleInputSubmit = async () => {
    if (budgetItem.trim() === "") {
      alert("Pin cannot be empty");
      return;
    }

    try {
      let pinRef;

      if (isProjectPath) {
        pinRef = collection(
          db,
          "users",
          userId,
          "projects",
          projectId,
          "designs",
          designId,
          "budgets"
        );
      } else {
        pinRef = collection(db, "budgets");
      }

      await addDoc(pinRef, {
        itemName: budgetItem,
        description: "",
        cost: cost,
        quantity: itemQuantity,
        designId,
      });
      setBudgetItem("");

      const itemName = budgetItem;
      toast.success(`${itemName} has been added!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          color: "var(--color-white)",
          backgroundColor: "var(--inputBg)",
        },
        progressStyle: {
          backgroundColor: "var(--brightFont)",
        },
      });
      setTimeout(() => {
        window.history.back();
      }, 1000);
    } catch (error) {
      console.error("Error adding pin:", error);
      alert("Failed to add pin");
    }
  };

  return (
    <>
      <TopBar state={"Add Item"} />
      <ToastContainer progressStyle={{ backgroundColor: "var(--brightFont)" }} />
      <div className="add-item-container">
        <div className="left-column">
          <div className="search-section">
            <input type="text" placeholder="Search for an item" />
          </div>

          <div className="upload-section">
            {image ? (
              <img src={image} alt="Item" className="uploaded-image" />
            ) : (
              <div className="image-placeholder">Add an image to the item</div>
            )}
            <label htmlFor="upload-image" className="upload-btn">
              Upload image of item
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
                />
              </div>
            </div>

            <div className="quantity-section">
              <button onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}>&lt;</button>
              <span>{itemQuantity}</span>
              <button onClick={() => setItemQuantity(itemQuantity + 1)}>&gt;</button>
            </div>

            {/* Add Item Button */}
            <button className="add-item-btn" onClick={handleInputSubmit}>
              Add item
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddItem;
