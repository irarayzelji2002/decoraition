import axios from "axios";
import deepEqual from "deep-equal";
import "../../css/addItem.css";
import TopBar from "../../components/TopBar";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "../../css/budget.css";
import { TextField, IconButton, Button, Typography, InputAdornment } from "@mui/material";
import {
  KeyboardArrowLeftRounded as KeyboardArrowLeftRoundedIcon,
  KeyboardArrowRightRounded as KeyboardArrowRightRoundedIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import NoImage from "./svg/NoImage";
import { showToast } from "../../functions/utils";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import CurrencySelect from "../../components/CurrencySelect";
import { getAllISOCodes, getAllInfoByISO } from "iso-country-currency";
import { gradientButtonStyles, outlinedButtonStyles } from "./PromptBar";
import { iconButtonStyles } from "../Homepage/DrawerComponent";

const AddItem = () => {
  const { designId, budgetId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navigateTo = location.state?.navigateFrom || (designId ? `/budget/${designId}` : "/");
  const navigateFrom = location.pathname;

  const { user, designs, userDesigns, designVersions, userDesignVersions } = useSharedProps();
  const [design, setDesign] = useState({});
  const [designVersion, setDesignVersion] = useState({});

  const [itemQuantity, setItemQuantity] = useState(1);
  const [budgetItem, setBudgetItem] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [currency, setCurrency] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [isUploadedImage, setIsUploadedImage] = useState(false);
  const [imageLink, setImageLink] = useState("");
  const [isDesignButtonDisabled, setIsDesignButtonDisabled] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [currencyDetails, setCurrencyDetails] = useState([]);
  const [defaultBudgetCurrency, setDefaultBudgetCurrency] = useState({});
  const [dragging, setDragging] = useState(false);

  const isoToFlagEmoji = (isoCode) => {
    return isoCode
      .toUpperCase() // Ensure uppercase
      .replace(
        /./g,
        (char) => String.fromCodePoint(127397 + char.charCodeAt(0)) // Offset to flag Unicode range
      );
  };

  const getCurrencyData = () => {
    const allISO = getAllISOCodes(); // Returns an array of objects, not just ISO codes

    const currencyDetails = allISO.map((country) => {
      const countryInfo = getAllInfoByISO(country.iso); // Pass the ISO code string
      const currencyCode = countryInfo?.currency || country.currency;
      const currencyName = countryInfo?.countryName || currencyCode;
      const currencySymbol = countryInfo?.symbol || currencyCode;
      return {
        currencyCode,
        flagEmoji: isoToFlagEmoji(country.iso), // Alpha-2 ISO code for FlagIcon
        currencyName,
        currencySymbol,
        countryISO: country.iso,
      };
    });

    return currencyDetails;
  };

  useEffect(() => {
    const currencyArray = getCurrencyData();
    setCurrencyDetails(currencyArray);
    const phCurrency = currencyArray.find((currency) => currency.countryISO === "PH");
    setDefaultBudgetCurrency(phCurrency);
    setCurrency(phCurrency);
  }, []);

  // Updates on Real-time changes on shared props
  useEffect(() => {
    setLoading(true);
    try {
      // Find design version
      const fetchedDesignVersion =
        userDesignVersions.find((designVersion) => designVersion?.budgetId === budgetId) ||
        designVersions.find((designVersion) => designVersion?.budgetId === budgetId);
      if (!fetchedDesignVersion) {
        console.error("Design version not found for budgetId:", budgetId);
        setDesignVersion({});
        console.error("Design version not found");
        return;
      } else if (!deepEqual(designVersion, fetchedDesignVersion)) {
        setDesignVersion(fetchedDesignVersion);
      }

      // Only find design if we have a valid design version
      const fetchedDesign =
        userDesigns.find((design) => design?.history?.includes(fetchedDesignVersion.id)) ||
        designs.find((design) => design?.history?.includes(fetchedDesignVersion.id));
      setDesign(fetchedDesign);
    } catch (error) {
      console.error("Error in initialization:", error);
    } finally {
      setLoading(false);
    }
  }, [designs, userDesigns, designVersions, userDesignVersions, designVersion, budgetId]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e, setInitImage, setImagePreview) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      const message = handleImageValidation(file);
      if (message !== "") return;
      handleFileChange(file, setInitImage, setImagePreview);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const onFileUpload = (event, setInitImage, setImagePreview) => {
    const file = event.target.files[0];
    if (file) handleFileChange(file, setInitImage, setImagePreview);
  };

  const handleFileChange = (file, setInitImage, setImagePreview) => {
    const message = handleImageValidation(file);
    if (message !== "") return;

    setInitImage(file);
    setIsUploadedImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log("FileReader result:", reader.result);
      setImagePreview(reader.result);
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };
    reader.readAsDataURL(file);
    console.log("File uploaded:", file);
  };

  // Image validation
  const handleImageValidation = (file) => {
    let message = "";
    const acceptedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
    if (!acceptedTypes?.includes(file.type)) {
      message = "Please upload an image file of png, jpg, or jpeg type";
      showToast("error", message);
    } else {
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        message = "Image size must be less than 5MB";
        showToast("error", message);
      }
    }
    return message;
  };

  const triggerFileInput = () => {
    document.getElementById("upload-image").click();
  };

  // Remove only the specified field error
  const clearFieldError = (field) => {
    setErrors((prevErrors) => {
      if (prevErrors && prevErrors[field]) {
        const { [field]: _, ...remainingErrors } = prevErrors;
        return remainingErrors;
      }
      return prevErrors;
    });
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
    if (selectedImage) {
      const acceptedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
      if (!acceptedTypes?.includes(selectedImage.type)) {
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
    setIsDesignButtonDisabled(true);
    const formErrors = handleValidation();

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsDesignButtonDisabled(false);
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
          setTimeout(() => navigate(navigateTo), 1000);
        }
      }
    } catch (error) {
      console.error("Error adding item:", error);
      if (error.response) {
        showToast(
          "error",
          error?.response?.data?.message || "Failed to add item. Please try again."
        );
      } else if (error.request) {
        showToast("error", "Network error. Please check your connection.");
      } else {
        showToast("error", "Failed to add item. Please try again.");
      }
    } finally {
      setIsDesignButtonDisabled(false);
    }
  };

  return (
    <div style={{ overflow: "hidden" }}>
      <TopBar state={"Add Item"} navigateTo={navigateTo} navigateFrom={navigateFrom} />
      <div className="add-item-container">
        <div className="left-column">
          {/* <TextField
            placeholder="Search for an item"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ color: "var(--color-white)" }}>
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              ...textFieldStyles,
              width: "100%",
              marginBottom: "20px",
              margiTop: "22px",
              "&.MuiTextField-root input": {
                padding: "16px 15px 16px 5px !important",
              },
            }}
            fullWidth
            inputProps={{ ...textFieldInputProps, maxLength: 100 }}
          /> */}

          <div
            className="upload-section"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, setSelectedImage, setSelectedImagePreview)}
          >
            {selectedImagePreview ? (
              <img
                src={selectedImagePreview}
                alt=""
                style={{
                  objectFit: "cover",
                  width: "100%",
                  height: "350px",
                  borderRadius: "20px",
                }}
              />
            ) : (
              <div
                className="image-placeholder-container add"
                onClick={triggerFileInput}
                style={{ cursor: "pointer", height: "350px !important" }}
              >
                <NoImage />
                <div className="image-placeholder">Add an image to the item</div>
              </div>
            )}
          </div>
          <Button
            fullWidth
            variant="contained"
            onClick={triggerFileInput}
            sx={{
              ...outlinedButtonStyles,
              marginTop: "22px !important",
              backgroundImage: "var(--darkGradient), var(--gradientButtonHover)",
            }}
            onMouseOver={(e) =>
              (e.target.style.backgroundImage = "var(--darkGradient), var(--gradientButtonHover)")
            }
            onMouseOut={(e) =>
              (e.target.style.backgroundImage = "var(--darkGradient), var(--gradientButton)")
            }
          >
            Upload image of item
          </Button>
          <input
            type="file"
            accept="image/png, image/jpeg, image/gif, image/webp"
            id="upload-image"
            style={{ display: "none" }}
            onChange={(e) => onFileUpload(e, setSelectedImage, setSelectedImagePreview)}
          />
        </div>
        <div className="right-column">
          <div className="form-section">
            {/* Item name */}
            <label htmlFor="item-name" className="item-name-label">
              Item name
            </label>
            <div className="input-group add">
              <TextField
                fullWidth
                id="item-name"
                value={budgetItem}
                type="text"
                placeholder="Enter item name"
                onChange={(e) => {
                  setBudgetItem(e.target.value);
                  clearFieldError("itemName");
                }}
                sx={priceTextFieldStyles}
                inputProps={{ ...textFieldInputProps, maxLength: 100 }}
              />
            </div>
            {errors?.itemName && <div className="error-text">{errors.itemName}</div>}
            <div style={{ marginBottom: "33px" }}></div>

            {/* Item Description */}
            <label htmlFor="item-description" className="item-name-label">
              Item Description
            </label>
            <div className="input-group add">
              <TextField
                fullWidth
                id="item-description"
                type="text"
                placeholder="Enter item description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  clearFieldError("description");
                }}
                sx={priceTextFieldStyles}
                inputProps={{ ...textFieldInputProps, maxLength: 255 }}
              />
            </div>
            {errors?.description && <div className="error-text">{errors.description}</div>}
            <div style={{ marginBottom: "33px" }}></div>

            {/* Item price */}
            <label htmlFor="item-price" className="price-label">
              Item price
            </label>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div className="input-group add" style={{ marginTop: "12px" }}>
                <div style={{ flexWrap: "nowrap", display: "flex" }}>
                  <CurrencySelect
                    selectedCurrency={currency}
                    setSelectedCurrency={setCurrency}
                    currencyDetails={currencyDetails}
                  />
                  <TextField
                    id="item-price"
                    type="text"
                    placeholder="Enter item price"
                    value={cost}
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
                      clearFieldError("cost");
                    }}
                    sx={priceTextFieldStyles}
                    inputProps={{ ...textFieldInputProps, maxLength: 12 }}
                  />
                </div>
              </div>
              {errors?.cost && <div className="error-text">{errors.cost}</div>}
              <div style={{ marginBottom: "33px" }}></div>
            </div>

            {/* Item Quantity */}
            <label htmlFor="item-price" className="price-label">
              Item Quantity
            </label>
            <div className="quantity-section">
              <Button
                onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                sx={{ ...iconButtonStyles }}
                className="left"
              >
                <KeyboardArrowLeftRoundedIcon sx={{ color: "var(color-white)" }} />
              </Button>
              <Typography style={{ color: "var(--color-white)" }}>{itemQuantity}</Typography>
              <Button
                onClick={() => setItemQuantity(itemQuantity + 1)}
                sx={{ ...iconButtonStyles }}
                className="right"
              >
                <KeyboardArrowRightRoundedIcon sx={{ color: "var(color-white)" }} />
              </Button>
            </div>
            {errors?.quantity && <div className="error-text">{errors.quantity}</div>}
            <div style={{ marginBottom: "43px" }}></div>

            {/* Add Item Button */}
            <Button
              fullWidth
              variant="contained"
              onClick={handleAddItem}
              disabled={isDesignButtonDisabled}
              sx={{
                ...gradientButtonStyles,
                padding: "8px 16px",
                opacity: isDesignButtonDisabled ? "0.5" : "1",
                cursor: isDesignButtonDisabled ? "default" : "pointer",
                "&:hover": {
                  backgroundImage: !isDesignButtonDisabled && "var(--gradientButton)",
                },
              }}
            >
              Add item
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddItem;

// Styles for TextField
export const textFieldStyles = {
  input: { color: "var(--color-white)" },
  height: "fit-content",
  borderRadius: "10px",
  "& .MuiOutlinedInput-notchedOutline": {
    borderWidth: 2, // border thickness
  },
  "& .MuiOutlinedInput-root": {
    borderColor: "var(--borderInput)",
    borderRadius: "10px",
    backgroundColor: "var(--bg-image)",
    "& fieldset": {
      borderColor: "var(--borderInput)",
      borderRadius: "10px",
    },
    "&:hover fieldset": {
      borderColor: "var(--borderInput)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "var(--borderInputBrighter)",
    },
  },
  "& input": {
    color: "var(--color-white)",
    padding: "15px",
  },
  "& .MuiFormHelperText-root": {
    color: "var(--color-quaternary)",
    textAlign: "left",
    marginLeft: 0,
    marginTop: "5px",
  },
  "& .Mui-error": {
    color: "var(--color-quaternary) !important",
    "& fieldset": {
      borderColor: "var(--color-quaternary) !important",
      borderRadius: "10px",
    },
    "&:hover fieldset": {
      borderColor: "var(--color-quaternary) !important",
    },
  },
};

export const textFieldInputProps = {
  style: { color: "var(--color-white)" }, // Input text color
};

export const priceTextFieldStyles = {
  input: { color: "var(--color-white)" },
  height: "fit-content",
  width: "100%",
  borderRadius: "10px",
  "& .MuiOutlinedInput-notchedOutline": {
    borderWidth: 2, // border thickness
  },
  "& .MuiOutlinedInput-root": {
    borderColor: "transparent",
    borderRadius: "10px",
    backgroundColor: "transparent",
    "& fieldset": {
      borderColor: "transparent",
      borderRadius: "10px",
    },
    "&:hover fieldset": {
      borderColor: "transparent",
    },
    "&.Mui-focused fieldset": {
      borderColor: "transparent",
    },
  },
  "& input": {
    color: "var(--color-white)",
    padding: "15px",
  },
  "& .MuiFormHelperText-root": {
    color: "var(--color-quaternary)",
    textAlign: "left",
    marginLeft: 0,
    marginTop: "5px",
  },
};
