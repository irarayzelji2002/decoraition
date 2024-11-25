import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import deepEqual from "deep-equal";
import { debounce } from "lodash";
import { getAllISOCodes, getAllInfoByISO } from "iso-country-currency";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { showToast } from "../../functions/utils";

import Item from "./Item";
import {
  AddIconGradient,
  EditIconSmallGradient,
  DeleteIconWhite,
  AddIcon,
  EditIconWhite,
  DeleteIconGradient,
} from "../../components/svg/DefaultMenuIcons";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DesignSpace from "./DesignSpace";
import {
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Typography,
} from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import "../../css/budget.css";
import { AddBudget, AddItem, BlankImage } from "./svg/AddImage";
import { getDesignImage, handleNameChange, createDefaultBudget } from "./backend/DesignActions";
import LoadingPage from "../../components/LoadingPage";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { gradientButtonStyles, outlinedButtonStyles } from "./PromptBar";
import CurrencySelect from "../../components/CurrencySelect";
import {
  dialogActionsStyles,
  dialogContentStyles,
  dialogStyles,
  dialogTitleStyles,
} from "../../components/RenameModal";
import { textFieldInputProps } from "./DesignSettings";
import {
  isOwnerDesign,
  isOwnerEditorDesign,
  isOwnerEditorCommenterDesign,
  isCollaboratorDesign,
} from "./Design";

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

const getPHCurrency = () => {
  let currency = {
    countryISO: "PH",
    currencyCode: "PHP",
    currencyName: "Philippines",
    currencySymbol: "₱",
    flagEmoji: "🇵🇭",
  };
  return currency;
};

function Budget() {
  const {
    user,
    userDoc,
    designs,
    userDesigns,
    designVersions,
    userDesignVersions,
    budgets,
    userBudgets,
    items,
    userItems,
  } = useSharedProps();
  const { designId } = useParams();
  const { isDarkMode } = useSharedProps();
  const navigate = useNavigate();
  const location = useLocation();
  const navigateFrom = location.pathname;
  const [changeMode, setChangeMode] = useState(location?.state?.changeMode || "");

  const [design, setDesign] = useState({});
  const [isOwner, setIsOwner] = useState(false);
  const [isOwnerEditor, setIsOwnerEditor] = useState(false);
  const [isOwnerEditorCommenter, setIsOwnerEditorCommenter] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [designVersion, setDesignVersion] = useState({});
  const [budget, setBudget] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isRemoveBudgetModalOpen, setIsRemoveBudgetModalOpen] = useState(false);
  const [budgetCurrency, setBudgetCurrency] = useState(budget?.budget?.currency ?? getPHCurrency());
  const [budgetAmount, setBudgetAmount] = useState(budget?.budget?.amount ?? 0);
  const [budgetCurrencyForInput, setBudgetCurrencyForInput] = useState(
    budget?.budget?.currency ?? getPHCurrency()
  );
  const [budgetAmountForInput, setBudgetAmountForInput] = useState(budget?.budget?.amount ?? "");
  const [defaultBudgetCurrency, setDefaultBudgetCurrency] = useState({});
  const [designItems, setDesignItems] = useState([]);
  const [designName, setDesignName] = useState(design?.designName ?? "Untitled Design");
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [formattedTotalCost, setFormattedTotalCost] = useState("0.00");
  const [exceededBudget, setExceededBudget] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBudgetButtonDisabled, setIsBudgetButtonDisabled] = useState(false);
  const [isConfirmRemoveBudgetBtnDisabled, setIsConfirmRemoveBudgetBtnDisabled] = useState(false);
  const [viewingImage, setViewingImage] = useState(0);
  const [imagesLink, setImagesLink] = useState([]);

  const [currencyDetails, setCurrencyDetails] = useState([]);

  // Initialize access rights
  useEffect(() => {
    if (!design?.designSettings || !userDoc?.id) return;
    // Check if user has any access
    const hasAccess = isCollaboratorDesign(design, userDoc.id);
    if (!hasAccess) {
      showToast("error", "You don't have access to this design");
      navigate("/");
      return;
    }
    // If they have access, proceed with setting roles
    setIsOwner(isOwnerDesign(design, userDoc.id));
    setIsOwnerEditor(isOwnerEditorDesign(design, userDoc.id));
    setIsOwnerEditorCommenter(isOwnerEditorCommenterDesign(design, userDoc.id));
    setIsCollaborator(isCollaboratorDesign(design, userDoc.id));
  }, [design, userDoc]);

  useEffect(() => {
    if (!changeMode) {
      if (isOwner) setChangeMode("Editing");
      else if (isOwnerEditor) setChangeMode("Editing");
      else if (isOwnerEditorCommenter) setChangeMode("Commenting");
      else if (isCollaborator) setChangeMode("Viewing");
    }
    console.log(
      `commentCont - isOwner: ${isOwner}, isOwnerEditor: ${isOwnerEditor}, isOwnerEditorCommenter: ${isOwnerEditorCommenter}, isCollaborator: ${isCollaborator}`
    );
  }, [isOwner, isOwnerEditor, isOwnerEditorCommenter, isCollaborator]);

  // Currency Functions
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
  }, []);

  useEffect(() => {
    console.log("budgetCurrencyForInput - ", budgetCurrencyForInput);
  }, [budgetCurrency, budgetCurrencyForInput]);

  // Item Functions
  const computeTotalCostAndExceededBudget = (designItems, budgetAmount) => {
    if (!designItems || designItems.length === 0) {
      setTotalCost(0);
      setFormattedTotalCost("0.00");
      setExceededBudget(false);
      return;
    }

    const totalCost = designItems
      .filter((item) => item.includedInTotal !== false) // Exclude items not included in total
      .reduce((sum, item) => sum + parseFloat(item.cost.amount || 0) * (item.quantity || 1), 0)
      .toFixed(2);
    setTotalCost(totalCost);

    // Currency
    const currenyDisplay =
      items[0]?.cost?.currency?.currencyCode || items[0]?.cost?.currency || "PHP";

    const formattedTotalCost =
      currenyDisplay +
      " " +
      new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(totalCost);
    setFormattedTotalCost(formattedTotalCost);

    const exceededBudget = parseFloat(totalCost) > budgetAmount; //true/false
    setExceededBudget(exceededBudget);
  };

  const formatNumber = (num) => (typeof num === "number" ? num.toFixed(2) : "0.00");

  // Get design
  useEffect(() => {
    if (designId && userDesigns.length > 0) {
      const fetchedDesign =
        userDesigns.find((d) => d.id === designId) || designs.find((d) => d.id === designId);

      if (!fetchedDesign) {
        console.error("Design not found.");
      } else if (Object.keys(design).length === 0 || !deepEqual(design, fetchedDesign)) {
        setDesign(fetchedDesign);
        console.log("current design:", fetchedDesign);
      }
    }
  }, [designId, design, userDesigns]);

  // Get latest design version
  useEffect(() => {
    console.log("Init Budget page - design", design);
    console.log("Init Budget page - design?.history", design?.history);
    if (design?.history && design.history.length > 0) {
      const latestDesignVersionId = design.history[design.history.length - 1];
      const fetchedLatestDesignVersion =
        designVersions.find((v) => v.id === latestDesignVersionId) ||
        userDesignVersions.find((v) => v.id === latestDesignVersionId);

      if (!fetchedLatestDesignVersion) {
        console.error("Init Budget page - Latest design version not found.");
      } else if (
        Object.keys(designVersion).length === 0 ||
        !deepEqual(designVersion, fetchedLatestDesignVersion)
      ) {
        setDesignVersion(fetchedLatestDesignVersion);
        console.log("Init Budget page - fetchedLatestDesignVersion", fetchedLatestDesignVersion);
      }
    } else {
      setDesignVersion({});
    }
  }, [design, designVersions, userDesignVersions]);

  // Get budget and items
  useEffect(() => {
    let mounted = true;

    const fetchBudgetData = async () => {
      if (!mounted) return;
      try {
        if (!designVersion?.id) {
          console.error("Init Budget page - No design version available");
          return;
        }

        const fetchedBudget =
          userBudgets.find((budget) => budget?.designVersionId === designVersion.id) ||
          budgets.find((budget) => budget?.designVersionId === designVersion.id);
        setBudget(fetchedBudget || {});

        if (!fetchedBudget) {
          console.error(
            `Init Budget page - No budget found for design version ${designVersion.id}`
          );
          // Create new budget if none exists
          const newBudget = await createDefaultBudget(designVersion.id, user, userDoc);
          setBudget(newBudget);
        } else {
          setBudget(fetchedBudget);
        }

        // Only proceed to get items & compute total if we have a valid budget
        if (!fetchedBudget.items?.length) {
          console.log("No items in budget");
          return;
        }
        const fetchedItems =
          fetchedBudget && fetchedBudget.items
            ? userItems.filter((item) => fetchedBudget.items?.includes(item.id)) ||
              items.filter((item) => fetchedBudget.items?.includes(item.id))
            : [];
        setDesignItems(fetchedItems);

        if (fetchedBudget && fetchedItems.length > 0) {
          computeTotalCostAndExceededBudget(fetchedItems, fetchedBudget.budget?.amount);
        }
      } catch (err) {
        console.error("Init Budget page - Error fetching budget:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchImagesLink = () => {
      if (!designVersion?.images) return;
      const imagesLink = designVersion?.images.map((image, index) => {
        return designVersion.images[index].link || "";
      });
      setImagesLink(imagesLink);
    };

    fetchBudgetData();
    fetchImagesLink();

    return () => {
      mounted = false;
    };
  }, [designVersion, budgets, userBudgets, items, userItems]);

  const updateItems = useCallback(() => {
    if (budget && budget.items) {
      // Keep existing items that are in the budget
      const updatedItems = designItems.filter((item) => budget.items?.includes(item.id));
      console.log("updatedItems - init", updatedItems);

      // Add or update items from userItems
      budget.items.forEach((itemId) => {
        const userItem =
          userItems.find((item) => item.id === itemId) || items.find((item) => item.id === itemId);
        if (userItem) {
          const existingIndex = updatedItems.findIndex((item) => item.id === itemId);
          if (existingIndex !== -1) {
            updatedItems[existingIndex] = userItem;
          } else {
            updatedItems.push(userItem);
          }
        }
      });
      console.log("updatedItems - modified", updatedItems);

      if (!deepEqual(designItems, updatedItems)) {
        setDesignItems(updatedItems);
        console.log("updatedItems - setDesignItems", updatedItems);
      }

      if (updatedItems.length > 0) {
        computeTotalCostAndExceededBudget(updatedItems, budget.budget?.amount);
      }
    } else {
      setDesignItems([]);
      setTotalCost(0);
      setFormattedTotalCost("0.00");
      setExceededBudget(false);
    }
  }, [budget, items, userItems, designItems]);

  const updateImagesLink = useCallback(() => {
    if (designVersion && designVersion?.images && designVersion?.images?.length > 0) {
      const imagesLink = designVersion?.images.map((image, index) => {
        return designVersion.images[index].link || "";
      });
      setImagesLink(imagesLink);
    } else {
      setImagesLink([]);
    }
  }, [designVersion]);

  useEffect(() => {
    const fetchedBudget =
      userBudgets.find((budget) => budget?.designVersionId === designId) ||
      budgets.find((budget) => budget?.designVersionId === designId);

    if (fetchedBudget && !deepEqual(budget, fetchedBudget)) {
      setBudget(fetchedBudget);
      setBudgetCurrencyForInput(fetchedBudget.budget?.currency ?? getPHCurrency());
      setBudgetAmountForInput(fetchedBudget.budget?.amount ?? 0);
      setBudget(fetchedBudget);
      setBudgetCurrency(fetchedBudget.budget?.currency ?? getPHCurrency());
      setBudgetAmount(fetchedBudget.budget?.amount ?? 0);
      updateItems();
    }
  }, [budgets, userBudgets]);

  useEffect(() => {
    console.log("User Items changed:", userItems);
    const timer = setTimeout(() => {
      updateItems();
    }, 100);
    return () => clearTimeout(timer);
  }, [items, userItems, budget, updateItems]);

  useEffect(() => {
    console.log("Design version changed:", designVersion);
    const timer = setTimeout(() => {
      updateImagesLink();
    }, 100);
    return () => clearTimeout(timer);
  }, [designVersion, updateImagesLink]);

  useEffect(() => {
    setBudgetAmount(budget?.budget?.amount ?? 0);
    setBudgetCurrency(budget?.budget?.currency ?? getPHCurrency());
  }, [budget]);

  useEffect(() => {
    console.log("designItems updated - ", designItems);
    if (budgetAmount && designItems.length > 0) {
      computeTotalCostAndExceededBudget(designItems, budgetAmount);
    }
  }, [designItems]);

  if (loading) {
    return <LoadingPage />;
  }

  if (!design || !designVersion) {
    return (
      <LoadingPage message="Design not found. Please reload or navigate to this design again." />
    );
  }

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Budget Functions
  const toggleBudgetModal = (opening, editing) => {
    setMenuOpen(false);
    if (opening && editing) setIsEditingBudget(true);
    else setIsEditingBudget(false);
    if (!opening) {
      setBudgetAmountForInput(budgetAmount);
      setBudgetCurrencyForInput(budgetCurrency);
    }
    setIsBudgetModalOpen(!isBudgetModalOpen);
  };

  const getBudgetColor = (budgetAmount, totalCost, isDarkMode) => {
    if (budgetAmount === 0) {
      return isDarkMode ? "var(--inputBg)" : "var(--bright-grey)"; // no budget
    } else if (totalCost <= budgetAmount) {
      return "var(--green)"; // within budget
    } else {
      return "var(--red)"; // over budget
    }
  };

  const handleValidation = (budgetAmount) => {
    let error = "";
    if (!budgetAmount || budgetAmount === 0) {
      error = "Budget is required";
    } else {
      const budgetAmountNum = parseFloat(budgetAmount);
      if (isNaN(budgetAmountNum)) {
        error = "Budget must be a number";
      } else if (budgetAmountNum <= 0) {
        error = "Budget must be greater than 0";
      } else if (budgetAmountNum > 999999999) {
        error = "Budget is too high";
      }
    }
    console.log("budgetAmount", budgetAmount);
    console.log("error", error);
    return error;
  };

  const handleUpdateBudget = async (budgetAmount, budgetCurrency) => {
    setIsBudgetButtonDisabled(true);
    setIsConfirmRemoveBudgetBtnDisabled(true);
    const error = handleValidation(budgetAmount);
    if (error !== "") {
      setError(error);
      setIsBudgetButtonDisabled(false);
      setIsConfirmRemoveBudgetBtnDisabled(false);
      return;
    } else {
      setError("");
    }

    try {
      const response = await axios.put(
        `/api/design/budget/${budget.id}/update-budget`,
        { amount: parseFloat(budgetAmount), currency: budgetCurrency },
        {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        }
      );
      if (response.status === 200) {
        showToast("success", "Budget added successfully");
        setIsBudgetModalOpen(false);
      } else {
        throw new Error("Error adding budget");
      }
    } catch (error) {
      console.error("Error adding budget:", error);
      showToast("error", "Failed to add budget");
    }
    setIsBudgetButtonDisabled(false);
    setIsConfirmRemoveBudgetBtnDisabled(false);
  };

  const handleRemoveBudget = async (budgetCurrency) => {
    setBudgetAmount(0);
    try {
      const response = await axios.put(
        `/api/design/budget/${budget.id}/update-budget`,
        { amount: 0, currency: budgetCurrency },
        {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        }
      );
      if (response.status === 200) {
        showToast("success", "Budget deleted successfully");
        setIsRemoveBudgetModalOpen(false);
      } else {
        throw new Error("Error deleting budget");
      }
    } catch (error) {
      console.error("Error deleting budget:", error);
      showToast("error", "Failed to delete budget");
    }
  };

  return (
    <div className={`budget-page ${menuOpen ? "" : ""}`}>
      <DesignSpace
        design={design}
        isDesign={false}
        designId={designId}
        changeMode={changeMode}
        setChangeMode={setChangeMode}
      >
        {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}
        <div className="previewBudgetCont">
          <span
            className="priceSum budget"
            style={{
              backgroundColor: getBudgetColor(budgetAmount, totalCost, isDarkMode),
            }}
          >
            {(() => {
              if (formattedTotalCost === "0.00" && budgetAmount === 0) {
                return <>No cost and added budget</>;
              } else if (formattedTotalCost === "0.00") {
                return (
                  <>
                    No cost, Budget:{" "}
                    <strong>
                      {budgetCurrency?.currencyCode} {formatNumber(budgetAmount)}
                    </strong>
                  </>
                );
              } else if (budgetAmount === 0) {
                return (
                  <>
                    Total Cost: <strong>{formattedTotalCost}</strong>, No added budget
                  </>
                );
              } else {
                return (
                  <>
                    Total Cost: <strong>{formattedTotalCost}</strong>, Budget:{" "}
                    <strong>
                      {budgetCurrency?.currencyCode} {formatNumber(budgetAmount)}
                    </strong>
                  </>
                );
              }
            })()}
          </span>
          {isOwnerEditor && changeMode === "Editing" && (
            <div style={{ display: "flex", gap: "5px" }}>
              {budgetAmount > 0 ? (
                <>
                  <IconButton onClick={() => toggleBudgetModal(true, true)} sx={iconButtonStyles}>
                    <EditIconSmallGradient />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setIsRemoveBudgetModalOpen(true);
                      setMenuOpen(false);
                    }}
                    sx={iconButtonStyles}
                  >
                    <DeleteIconGradient />
                  </IconButton>
                </>
              ) : (
                <IconButton onClick={() => toggleBudgetModal(true, false)} sx={iconButtonStyles}>
                  <AddIconGradient />
                </IconButton>
              )}
            </div>
          )}
        </div>
        <div className="cutoff">
          <div className="budgetSpaceImg pic">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                position: "relative",
                gap: "5px",
                marginBottom: "10px",
              }}
            >
              {imagesLink.map((img, index) => {
                return (
                  <div style={{ border: index !== viewingImage && "1px solid transparent" }}>
                    <div
                      key={index}
                      className="select-image-preview budget"
                      style={{ border: index === viewingImage && "2px solid var(--brightFont)" }}
                      onClick={() => setViewingImage(index)}
                    >
                      <img src={img || "/img/transparent-image.png"} alt="" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="image-frame budget">
              <div className="image-frame-icon">
                <BlankImage />
                <span>No design yet</span>
              </div>
              <img
                src={imagesLink[viewingImage] || "/img/transparent-image.png"}
                alt=""
                className="image-preview"
              />
            </div>
          </div>
          <div
            className="budgetSpaceImg items"
            style={{ alignItems: designItems.length === 0 ? "center" : "start" }}
          >
            {designItems.length > 0 ? (
              designItems.map((item, index) => (
                <Item
                  key={index}
                  item={item}
                  onEdit={() =>
                    navigate(`/editItem/${budget.id}/${item.id}`, {
                      state: { navigateFrom: navigateFrom },
                    })
                  }
                  setDesignItems={setDesignItems}
                  budgetId={budget.id}
                  isOwnerEditor={isOwnerEditor}
                  changeMode={changeMode}
                />
              ))
            ) : (
              <div className="placeholderDiv">
                <img
                  src={`/img/design-placeholder${!isDarkMode ? "-dark" : ""}.png`}
                  style={{ width: "100px" }}
                  alt=""
                />
                <p className="grey-text center">No items added yet.</p>
                <p className="grey-text center">Start adding.</p>
              </div>
            )}
          </div>
        </div>
        {isOwnerEditor && changeMode === "Editing" && (
          <div className="circle-button-container">
            {menuOpen && (
              <div className="small-buttons">
                {budgetAmount > 0 && (
                  <div
                    className="small-button-container budget"
                    onClick={() => {
                      setIsRemoveBudgetModalOpen(true);
                      setMenuOpen(false);
                    }}
                  >
                    <span className="small-button-text">Delete Budget</span>
                    <div className="small-circle-button">
                      <DeleteIconWhite />
                    </div>
                  </div>
                )}
                <div
                  className="small-button-container budget"
                  onClick={() => toggleBudgetModal(true, budgetAmount > 0)}
                >
                  <span className="small-button-text">
                    {budgetAmount > 0 ? "Edit the budget" : "Add a Budget"}
                  </span>
                  <div className="small-circle-button">
                    {budgetAmount > 0 ? <EditIconWhite /> : <AddBudget />}
                  </div>
                </div>
                <div
                  className="small-button-container budget"
                  onClick={() =>
                    navigate(`/addItem/${budget.id}`, {
                      state: { navigateFrom: navigateFrom },
                    })
                  }
                >
                  <span className="small-button-text">Add an Item</span>
                  <div className="small-circle-button">
                    <AddItem />
                  </div>
                </div>
              </div>
            )}
            <div className={`circle-button ${menuOpen ? "rotate" : ""} add`} onClick={toggleMenu}>
              {menuOpen ? <AddIcon /> : <AddIcon />}
            </div>
          </div>
        )}

        {/* {isBudgetModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ color: "var(--color-white)" }}>
                {setIsEditingBudget ? "Edit the budget" : "Add a Budget"}
              </h2>
              <CloseRoundedIcon
                className="close-icon"
                onClick={() => toggleBudgetModal(false, isEditingBudget)}
              />
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="rounded-input"
                placeholder="Currency"
                value={budgetCurrency}
                onChange={(e) => setBudgetCurrency(e.target.value)}
              />
              <input
                type="text"
                className="rounded-input"
                placeholder="Enter budget"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
              />
            </div>

            <button
              className="add-item-btn"
              style={{ height: "40px" }}
              onClick={() => handleUpdateBudget(budgetAmount, budgetCurrency)}
            >
              {setIsEditingBudget ? "Edit budget" : "Add Budget"}
            </button>
          </div>
        </div>
      )} */}
        {isBudgetModalOpen && (
          <Dialog
            open={isBudgetModalOpen}
            onClose={() => toggleBudgetModal(false, isEditingBudget)}
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
                {isEditingBudget ? "Edit the budget" : "Add a Budget"}
              </Typography>
              <IconButton
                onClick={() => toggleBudgetModal(false, isEditingBudget)}
                sx={{
                  ...iconButtonStyles,
                  flexShrink: 0,
                  marginLeft: "auto",
                }}
              >
                <CloseRoundedIcon />
              </IconButton>
            </DialogTitle>
            <div style={{ wrap: "nowrap" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div className="input-group budget" style={{ marginTop: "12px", margin: "18px" }}>
                  <div style={{ flexWrap: "nowrap", display: "flex" }}>
                    <CurrencySelect
                      selectedCurrency={budgetCurrencyForInput}
                      setSelectedCurrency={setBudgetCurrencyForInput}
                      currencyDetails={currencyDetails}
                    />
                    <TextField
                      id="item-price"
                      type="text"
                      placeholder="Enter item price"
                      value={budgetAmountForInput}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Allow digits and a single decimal point, up to two decimal places
                        if (/^\d*\.?\d{0,2}$/.test(value)) {
                          // Remove leading zeros unless it’s a decimal number
                          if (/^\d+$/.test(value)) {
                            value = value.replace(/^0+/, "");
                          }
                          setBudgetAmountForInput(value);
                        }
                      }}
                      sx={priceTextFieldStyles}
                      inputProps={{ ...textFieldInputProps, maxLength: 22 }}
                    />
                  </div>
                </div>
                {error !== "" && (
                  <div className="error-text" style={{ marginLeft: "20px" }}>
                    {error}
                  </div>
                )}
              </div>
            </div>
            <DialogActions sx={{ ...dialogActionsStyles, marginTop: "0 !important" }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => handleUpdateBudget(budgetAmountForInput, budgetCurrencyForInput)}
                sx={{
                  ...gradientButtonStyles,
                  opacity: isBudgetButtonDisabled ? "0.5" : "1",
                  cursor: isBudgetButtonDisabled ? "default" : "pointer",
                  "&:hover": {
                    backgroundImage: !isBudgetButtonDisabled && "var(--gradientButton)",
                  },
                }}
                disabled={isBudgetButtonDisabled}
              >
                {isEditingBudget ? "Edit budget" : "Add Budget"}
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => toggleBudgetModal(false, isEditingBudget)}
                sx={outlinedButtonStyles}
                onMouseOver={(e) =>
                  (e.target.style.backgroundImage =
                    "var(--lightGradient), var(--gradientButtonHover)")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
                }
              >
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
        )}
        {isRemoveBudgetModalOpen && (
          <Dialog
            open={isRemoveBudgetModalOpen}
            onClose={() => setIsRemoveBudgetModalOpen(false)}
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
                Confirm budget removal
              </Typography>
              <IconButton
                onClick={() => setIsRemoveBudgetModalOpen(false)}
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
                Are you sure you want to remove the budget?
              </span>
            </DialogContent>
            <DialogActions sx={{ ...dialogActionsStyles, marginTop: "0 !important" }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => handleRemoveBudget(budgetCurrency)}
                sx={{
                  ...gradientButtonStyles,
                  opacity: isConfirmRemoveBudgetBtnDisabled ? "0.5" : "1",
                  cursor: isConfirmRemoveBudgetBtnDisabled ? "default" : "pointer",
                  "&:hover": {
                    backgroundImage: !isConfirmRemoveBudgetBtnDisabled && "var(--gradientButton)",
                  },
                }}
                disabled={isConfirmRemoveBudgetBtnDisabled}
              >
                Yes
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setIsRemoveBudgetModalOpen(false)}
                sx={outlinedButtonStyles}
                onMouseOver={(e) =>
                  (e.target.style.backgroundImage =
                    "var(--lightGradient), var(--gradientButtonHover)")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
                }
              >
                No
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </DesignSpace>
    </div>
  );
}

export default Budget;

const priceTextFieldStyles = {
  input: { color: "var(--color-white)" },
  height: "fit-content",
  borderRadius: "10px",
  "& .MuiOutlinedInput-notchedOutline": {
    borderWidth: 2, // border thickness
  },
  "& .MuiOutlinedInput-root": {
    borderColor: "transparent",
    borderRadius: "10px",
    backgroundColor: "var(--nav-card-modal)",
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
    padding: "15px 16px 15px 10px",
  },
  "& .MuiFormHelperText-root": {
    color: "var(--color-quaternary)",
    textAlign: "left",
    marginLeft: 0,
    marginTop: "5px",
  },
};
