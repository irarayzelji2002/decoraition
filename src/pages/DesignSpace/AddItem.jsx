import axios from "axios";
import deepEqual from "deep-equal";
import "../../css/addItem.css";
import TopBar from "../../components/TopBar";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "../../css/budget.css";
import {
  TextField,
  IconButton,
  Button,
  Typography,
  InputAdornment,
  Paper,
  Box,
} from "@mui/material";
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
import { isOwnerEditorDesign } from "./Design";
import LoadingPage from "../../components/LoadingPage";
import { CustomMenuItem } from "./CommentContainer";
import { menuItemStyles } from "./DesignSettings";

const AddItem = () => {
  const { designId, budgetId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navigateTo = location.state?.navigateFrom || (designId ? `/budget/${designId}` : "/");
  const navigateFrom = location.pathname;

  const { user, userDoc, designs, userDesigns, designVersions, userDesignVersions } =
    useSharedProps();
  const [design, setDesign] = useState({});
  const [designVersion, setDesignVersion] = useState({});

  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [currency, setCurrency] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [isUploadedImage, setIsUploadedImage] = useState(false);
  const [imageLink, setImageLink] = useState("");
  const [isAddItemBtnDisabled, setIsAddItemBtnDisabled] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [currencyDetails, setCurrencyDetails] = useState([]);
  const [defaultBudgetCurrency, setDefaultBudgetCurrency] = useState({});
  const [dragging, setDragging] = useState(false);

  const [ebaySearchQuery, setEbaySearchQuery] = useState("");
  const [ebaySearchResults, setEbaySearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchItemClicked, setSearchItemClicked] = useState(null);
  const [openSearchResultOptions, setOpenSearchResultOptions] = useState(false);

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

    // Filter to only include USD and PHP
    const filteredCurrencies = currencyDetails.filter(
      (currency) => currency.currencyCode === "PHP" || currency.currencyCode === "USD"
    );
    return filteredCurrencies;
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

      if (!fetchedDesign) {
        console.error("Design not found for design version:", fetchedDesignVersion.id);
      } else if (Object.keys(design).length === 0 || !deepEqual(design, fetchedDesign)) {
        // Check if user has access
        const hasAccess = isOwnerEditorDesign(fetchedDesign, userDoc?.id);
        if (!hasAccess) {
          console.error("No edit access to design. Can't edit item");
          setLoading(false);
          showToast("error", "You don't have access to add an item");
          navigate(`/budget/${designId}`);
          return;
        }

        setDesign(fetchedDesign || {});
      }
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
    setImageLink("");
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
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        message = "Image size must be less than 2MB";
        showToast("error", message);
      }
    }
    return message;
  };

  const triggerFileInput = () => {
    document.getElementById("upload-image").click();
  };

  const handleEbaySearch = async () => {
    if (!ebaySearchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await axios.get(`/api/ebay/search`, {
        params: {
          query: ebaySearchQuery,
        },
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      });
      setEbaySearchResults(response.data.items);
    } catch (error) {
      console.error("Error searching eBay items:", error);
      showToast("error", "Failed to search eBay items");
    } finally {
      setIsSearching(false);
      setOpenSearchResultOptions(true);
    }
  };

  useEffect(() => {
    console.log("clicked item:", searchItemClicked);
    if (searchItemClicked) {
      const item = searchItemClicked;
      console.log("Selected item:", item);
      setItemName(item.title);
      setCost(item.price.value);
      setItemQuantity(1);

      // Currency
      const phCurrency = currencyDetails.find((currency) => currency.countryISO === "PH");
      const usCurrency = currencyDetails.find((currency) => currency.countryISO === "US");
      if (item.price.currency === "USD") setCurrency(usCurrency);
      else if (item.price.currency === "PHP") setCurrency(phCurrency);
      else {
        const currencyToUse = currencyDetails.find(
          (currency) => currency?.currencyCode === item.price.curreny
        );
        setCurrency(currencyToUse);
      }

      // Image
      setImageLink(item?.thumbnailImages?.[0]?.imageUrl || item?.image?.imageUrl);
      setSelectedImagePreview(item?.thumbnailImages?.[0]?.imageUrl || item?.image?.imageUrl);

      setSelectedIndex(-1);
      setOpenSearchResultOptions(false);
      setEbaySearchQuery("");
    }
  }, [searchItemClicked]);

  // Search item key down
  const handleKeyDown = (event) => {
    // Handle arrow keys for navigation when options are open
    if (openSearchResultOptions && ebaySearchResults.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev < ebaySearchResults.length - 1 ? prev + 1 : prev));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }
    }

    // Handle Enter key
    if (event.key === "Enter") {
      event.preventDefault();
      if (openSearchResultOptions && ebaySearchResults.length > 0) {
        // If options are open, select the highlighted item
        const selectedItem =
          selectedIndex >= 0 ? ebaySearchResults[selectedIndex] : ebaySearchResults[0];
        setSearchItemClicked(selectedItem);
        setSelectedIndex(-1);
        setOpenSearchResultOptions(false);
        setEbaySearchQuery("");
      } else if (ebaySearchQuery) {
        // If no options are open, and has search query, trigger search
        handleEbaySearch();
      }
    }
  };

  // Search query change handler
  const handleSearchQueryChange = (e) => {
    const value = e.target.value;
    setEbaySearchQuery(value);
    // Hide options if search query is empty
    if (!value.trim()) {
      setOpenSearchResultOptions(false);
      setSelectedIndex(-1);
    }
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
    if (!itemName?.trim()) formErrors.itemName = "Item name is required";
    else if (itemName.length > 100)
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
        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
        if (selectedImage.size > maxSize) {
          formErrors.image = "Image size must be less than 2MB";
          showToast("error", formErrors.image);
        }
      }
    }
    return formErrors;
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setIsAddItemBtnDisabled(true);
    const formErrors = handleValidation();

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsAddItemBtnDisabled(false);
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
      setIsAddItemBtnDisabled(false);
    }
  };

  if (Object.keys(design).length === 0 || loading) {
    return <LoadingPage message="Checking access." />;
  }

  return (
    <div style={{ overflow: "hidden" }}>
      <TopBar state={"Add Item"} navigateTo={navigateTo} navigateFrom={navigateFrom} />
      <div className="add-item-container">
        <div className="left-column">
          <TextField
            placeholder="Search for an item"
            value={ebaySearchQuery}
            onChange={handleSearchQueryChange}
            onKeyDown={handleKeyDown}
            InputProps={{
              style: { color: "var(--color-white)" },
              startAdornment: (
                <InputAdornment position="start" sx={{ color: "var(--color-white)" }}>
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    onClick={handleEbaySearch}
                    disabled={isSearching}
                    sx={{
                      ...gradientButtonStyles,
                      height: "51px",
                      borderRadius: "0 10px 10px 0",
                      paddingLeft: "15px",
                      paddingRight: "15px",
                      opacity: isSearching ? "0.5" : "1",
                      cursor: isSearching ? "default" : "pointer",
                      "&:hover": {
                        backgroundImage: !isSearching && "var(--gradientButtonHover)",
                      },
                    }}
                  >
                    Search
                  </Button>
                </InputAdornment>
              ),
            }}
            sx={{
              ...textFieldStyles,
              width: "100%",
              marginTop: "22px",
              "&.MuiTextField-root input": {
                padding: "16px 15px 16px 5px !important",
              },
              "& .MuiInputBase-root": {
                paddingRight: 0,
              },
            }}
            fullWidth
            inputProps={{ maxLength: 100 }}
          />
          <div style={{ position: "relative", width: "100%" }}>
            {openSearchResultOptions && ebaySearchResults.length > 0 && (
              <Paper
                sx={{
                  position: "absolute",
                  zIndex: 1000,
                  maxHeight: "500px",
                  overflow: "auto",
                  width: "100%",
                  backgroundColor: "var(--iconBg)",
                  boxShadow: "-4px 4px 10px rgba(0, 0, 0, 0.2)",
                  borderRadius: "10px",
                }}
              >
                {/* {ebaySearchResults.slice(0, 10).map((item, index) => ( */}
                {ebaySearchResults.map((item, index) => (
                  <CustomMenuItem
                    key={item.itemId}
                    onClick={() => setSearchItemClicked(item)}
                    selected={index === selectedIndex}
                    sx={{ ...menuItemStyles }}
                  >
                    <ItemInfoTooltip item={item} />
                  </CustomMenuItem>
                ))}
              </Paper>
            )}
          </div>

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
                value={itemName}
                type="text"
                placeholder="Enter item name"
                onChange={(e) => {
                  setItemName(e.target.value);
                  clearFieldError("itemName");
                }}
                sx={priceTextFieldStyles}
                InputProps={textFieldInputProps}
                inputProps={{ maxLength: 100 }}
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
                InputProps={textFieldInputProps}
                inputProps={{ maxLength: 255 }}
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
                    InputProps={textFieldInputProps}
                    inputProps={{ maxLength: 12 }}
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
              disabled={isAddItemBtnDisabled}
              sx={{
                ...gradientButtonStyles,
                padding: "8px 16px",
                opacity: isAddItemBtnDisabled ? "0.5" : "1",
                cursor: isAddItemBtnDisabled ? "default" : "pointer",
                "&:hover": {
                  backgroundImage: !isAddItemBtnDisabled && "var(--gradientButton)",
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

export const ItemInfoTooltip = ({ item }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: "5px",
    }}
  >
    <Box sx={{ wdith: "45px", marginRight: "20px" }}>
      <div className="select-image-preview item-preview" style={{ margin: "0" }}>
        <img src={item?.image?.imageUrl || "/img/transparent-image.png"} alt="" />
      </div>
    </Box>
    <Box sx={{ flexGrow: "1", minWidth: 0 }}>
      <Typography
        sx={{
          color: "var(--color-white)",
          fontSize: "0.875rem",
          fontWeight: "bold",
          wordBreak: "break-word",
          overflow: "visible",
          textWrap: "wrap",
          textAlign: "justify",
        }}
      >
        {item?.title || "Item"}
      </Typography>
      <Typography
        sx={{
          color: "var(--color-white)",
          fontSize: "0.7rem",
          wordBreak: "break-all",
          overflow: "visible",
        }}
      >
        {`${item?.price?.currency} ${item?.price?.value}`}
      </Typography>
    </Box>
  </Box>
);

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
