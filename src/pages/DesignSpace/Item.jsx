import axios from "axios";
import React, { useState, useEffect, useCallback } from "react";
import debounce from "lodash/debounce";
import { showToast } from "../../functions/utils";
import "../../css/budget.css";
import "../../css/design.css";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Divider,
  IconButton,
  Box,
  Modal,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import EditPen from "./svg/EditPen";
import Trash from "./svg/Trash";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { CheckboxIcon, CheckboxCheckedIcon } from "../../components/svg/SharedIcons";
import { DeleteIconGradient, EditIconSmallGradient } from "../../components/svg/DefaultMenuIcons";
import {
  dialogActionsStyles,
  dialogContentStyles,
  dialogStyles,
  dialogTitleStyles,
} from "../../components/RenameModal";
import { gradientButtonStyles, outlinedButtonStyles } from "./PromptBar";

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

function Item({ item, onEdit, setDesignItems, budgetId, isOwnerEditor, changeMode }) {
  const { user } = useSharedProps();
  const [itemPrice, setItemPrice] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const handleOpenDelete = () => setOpenDelete(true);
  const handleCloseDelete = () => setOpenDelete(false);
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [isConfirmRemoveItemBtnDisabled, setIsConfirmRemoveItemBtnDisabled] = useState(false);

  const formatNumber = (num) => (typeof num === "number" ? num.toFixed(2) : "0.00");

  const handleDeleteItem = async (itemToDelete, budgetId) => {
    try {
      setIsConfirmRemoveItemBtnDisabled(true);
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
          error?.response?.data?.message || "Failed to update item. Please try again."
        );
      } else if (error.request) {
        showToast("error", "Network error. Please check your connection.");
      } else {
        showToast("error", "Failed to update item. Please try again.");
      }
    } finally {
      setIsConfirmRemoveItemBtnDisabled(false);
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
        showToast("error", "Failed to update item");
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
      <Dialog
        open={openDelete}
        onClose={handleCloseDelete}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={dialogStyles}
      >
        <DialogTitle sx={dialogTitleStyles}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: "bold",
              fontSize: "1.15rem",
              flexGrow: 1,
              maxWidth: "80%",
              whiteSpace: "normal",
            }}
          >
            Confirm item removal
          </Typography>
          <IconButton
            onClick={handleCloseDelete}
            sx={{
              ...iconButtonStyles,
              flexShrink: 0,
              marginLeft: "auto",
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ ...dialogContentStyles, marginTop: "0 !important" }}>
          <span style={{ textAlign: "center", margin: "18px" }}>
            Are you sure you want to remove {item.quantity} {item.itemName}?
          </span>
        </DialogContent>
        <DialogActions sx={{ ...dialogActionsStyles, marginTop: "0 !important" }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => handleDeleteItem(item, budgetId)}
            sx={{
              ...gradientButtonStyles,
              opacity: isConfirmRemoveItemBtnDisabled ? "0.5" : "1",
              cursor: isConfirmRemoveItemBtnDisabled ? "default" : "pointer",
              "&:hover": {
                backgroundImage: !isConfirmRemoveItemBtnDisabled && "var(--gradientButton)",
              },
            }}
            disabled={isConfirmRemoveItemBtnDisabled}
          >
            Yes
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleCloseDelete}
            sx={outlinedButtonStyles}
            onMouseOver={(e) =>
              (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButtonHover)")
            }
            onMouseOut={(e) =>
              (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
            }
          >
            No
          </Button>
        </DialogActions>
      </Dialog>
      <img src={item.image || "/img/transparent-image.png"} alt="" className="thumbnail" />
      <div className="itemDetailsCont">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            margin: "12px 12px 12px 0px",
            width: "auto  ",
            justifyContent: "center",
          }}
        >
          <span className="itemName">{item.quantity + " " + item.itemName}</span>
          <span className="itemPrice">
            {item.cost.currency?.currencyCode + " " + formatNumber(item.cost.amount)}
          </span>
        </div>
        {isOwnerEditor && changeMode === "Editing" && (
          <div className="itemActions">
            {/* CheckBox */}
            <div>
              <Checkbox
                checked={item.includedInTotal === true || item.includedInTotal === "true"}
                onChange={() => {
                  toggleIncludedInTotal();
                  handleIncludedInTotalChange(item.id);
                }}
                value="included-in-total"
                sx={{
                  color: "var(--color-white)",
                  "&.Mui-checked": {
                    color: "var(--brightFont)",
                  },
                  borderRadius: "50%",
                  "& .MuiSvgIcon-root": {
                    fontSize: 28,
                  },
                  "&:hover": {
                    backgroundColor: "var(--iconButtonHover)",
                  },
                  "&:active": {
                    backgroundColor: "var(--iconButtonActive)",
                  },
                  "& svg": {
                    transform: "scale(0.88)",
                  },
                }}
                icon={<CheckboxIcon />}
                checkedIcon={<CheckboxCheckedIcon />}
              />
            </div>
            {/* Edit */}
            <IconButton
              onClick={onEdit}
              sx={{ ...iconButtonStyles, width: "36px", height: "36px" }}
            >
              <EditIconSmallGradient />
            </IconButton>
            {/* Delete */}
            <IconButton
              onClick={handleOpenDelete}
              sx={{ ...iconButtonStyles, width: "36px", height: "36px" }}
            >
              <DeleteIconGradient />
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
}

export default Item;
