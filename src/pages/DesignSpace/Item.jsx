import axios from "axios";
import React, { useState, useEffect, useCallback } from "react";
import debounce from "lodash/debounce";
import { showToast } from "../../functions/utils";
import "../../css/budget.css";
import "../../css/design.css";
import Box from "@mui/material/Box";
import CloseIcon from "@mui/icons-material/Close";
import Modal from "@mui/material/Modal";
import { Divider } from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import EditPen from "./svg/EditPen";
import Trash from "./svg/Trash";
import { ToastContainer, toast } from "react-toastify";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { useSharedProps } from "../../contexts/SharedPropsContext";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "var(--nav-card-modal)",
  borderRadius: "12px",
  boxShadow: 24,
};

function Item({ item, onEdit, setDesignItems, budgetId }) {
  const { user } = useSharedProps();
  const [itemPrice, setItemPrice] = useState("");
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [openDelete, setOpenDelete] = useState(false);
  const handleOpenDelete = () => setOpenDelete(true);
  const handleCloseDelete = () => setOpenDelete(false);
  const [pendingUpdates, setPendingUpdates] = useState({});

  const handleDeleteItem = async (itemToDelete, budgetId) => {
    try {
      const response = await axios.post(
        `/api/design/item/${itemToDelete.id}/delete-item`,
        { budgetId: budgetId },
        {
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
        }
      );

      if (response.status === 200) {
        handleCloseDelete();
        console.log("Item deleted successfully");
        showToast("success", "Item deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
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

  // Immediate UI update
  const toggleIncludedInTotal = useCallback(
    (itemId) => {
      setDesignItems((prevItems) =>
        prevItems.map((prevItem) =>
          prevItem.id === itemId
            ? { ...prevItem, includedInTotal: !prevItem.includedInTotal }
            : prevItem
        )
      );
    },
    [setDesignItems]
  );

  // Debounced database update
  const debouncedUpdateDatabase = useCallback(
    debounce(async (itemId, includedInTotal) => {
      try {
        await axios.put(
          `/api/design/item/${itemId}/update-item-included-in-total`,
          {
            includedInTotal: includedInTotal,
          },
          {
            headers: {
              Authorization: `Bearer ${await user.getIdToken()}`,
            },
          }
        );
        console.log("Item updated successfully");
      } catch (error) {
        console.error("Error updating item:", error);
        toast.error("Failed to update item");
        // Revert the UI change if the server update fails
        setDesignItems((prevItems) =>
          prevItems.map((prevItem) =>
            prevItem.id === itemId ? { ...prevItem, includedInTotal: !includedInTotal } : prevItem
          )
        );
      }
    }, 2000), // 2 second delay
    [setDesignItems, user]
  );

  // Combined function to handle both UI update and debounced database update
  const handleIncludedInTotalChange = useCallback(
    (itemId) => {
      setDesignItems((prevItems) => {
        const updatedItems = prevItems.map((prevItem) =>
          prevItem.id === itemId
            ? { ...prevItem, includedInTotal: !prevItem.includedInTotal }
            : prevItem
        );
        const updatedItem = updatedItems.find((item) => item.id === itemId);
        if (updatedItem) {
          debouncedUpdateDatabase(itemId, updatedItem.includedInTotal);
        } else {
          console.error(`Item with id ${itemId} not found`);
        }
        return updatedItems;
      });
    },
    [debouncedUpdateDatabase]
  );

  return (
    <div className="itemSpace" style={{ display: "flex", flexDirection: "row" }}>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", marginBottom: "12px", margin: "18px" }}>
              <span id="modal-modal-title" style={{ fontSize: "18px", fontWeight: "600" }}>
                Edit Budget
              </span>{" "}
              <CloseIcon sx={{ marginLeft: "auto" }} onClick={handleClose} cursor={"pointer"} />
            </div>
            <Divider sx={{ borderColor: "var(--color-grey)" }} />
            <div className="input-group" style={{ marginTop: "12px", margin: "18px" }}>
              <div className="price-quantity-section">
                <select
                  style={{
                    border: "none",
                    background: "transparent",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    appearance: "none",
                    outline: "none",
                  }}
                >
                  <option value="PHP">PHP</option>
                </select>
                <KeyboardArrowDownRoundedIcon
                  sx={{
                    color: "var(--color-grey)",
                    marginLeft: "-50px",
                    marginTop: "18px",
                  }}
                />
                <input
                  id="item-price"
                  type="number"
                  placeholder="Enter item price"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    appearance: "none",
                    outline: "none",
                  }}
                />
              </div>
            </div>
            <button className="add-item-btn" style={{ margin: "18px" }}>
              Edit Price
            </button>
          </div>
        </Box>
      </Modal>
      <Modal
        open={openDelete}
        onClose={handleCloseDelete}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", marginBottom: "12px", margin: "18px" }}>
              <span id="modal-modal-title" style={{ fontSize: "18px", fontWeight: "600" }}>
                Confirm item removal
              </span>
              <CloseIcon
                sx={{ marginLeft: "auto" }}
                onClick={handleCloseDelete}
                cursor={"pointer"}
              />
            </div>
            <Divider sx={{ borderColor: "var(--color-grey)" }} />
            <span style={{ textAlign: "center", margin: "18px" }}>
              Are you sure you want to remove {item.quantity} {item.itemName}?
            </span>
            <div
              style={{
                display: "flex",
                gap: "12px",
                margin: "18px",
                marginTop: "-24px",
                justifyContent: "center",
              }}
            >
              <button
                className="add-item-btn"
                style={{
                  background: "transparent",
                  border: "2px solid transparent",
                  backgroundImage: " var(--lightGradient), var(--gradientButton)",
                  backgroundOrigin: "border-box",
                  backgroundClip: " padding-box, border-box",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundImage =
                    " var(--lightGradient), var(--gradientButtonHover)")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundImage = " var(--lightGradient), var(--gradientButton)")
                }
                onClick={handleCloseDelete}
              >
                Cancel
              </button>
              <button className="add-item-btn" onClick={() => handleDeleteItem(item, budgetId)}>
                Confirm
              </button>
            </div>
          </div>
        </Box>
      </Modal>
      {/* <div
        style={{
          alignContent: "center",
          marginLeft: "8px",
          marginRight: "-6px",
        }}
      >
        <span style={{ fontSize: "12px" }}> x {item.quantity}</span>
      </div> */}
      <img src={item.image} alt="" className="thumbnail" />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          margin: "12px",
          width: "auto  ",
        }}
      >
        <span className="itemName">{item.quantity + " " + item.itemName}</span>
        <span className="itemPrice">{item.cost.currency + " " + item.cost.amount}</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          marginLeft: "auto",
          marginRight: "10px",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <div>
          <input
            type="checkbox"
            checked={item.includedInTotal === true || item.includedInTotal === "true"}
            onChange={() => {
              toggleIncludedInTotal();
              handleIncludedInTotalChange(item.id);
            }}
          />
        </div>
        <div onClick={onEdit}>
          <EditPen />
        </div>
        <div onClick={handleOpenDelete} style={{ marginRight: "10px" }}>
          <Trash />
        </div>
      </div>
    </div>
  );
}

export default Item;
