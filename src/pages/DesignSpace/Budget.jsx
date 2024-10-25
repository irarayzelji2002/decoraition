import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import deepEqual from "deep-equal";
import { debounce } from "lodash";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { showToast } from "../../functions/utils";

import Item from "./Item";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import DesignHead from "../../components/DesignHead";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import { Divider } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import InventoryIcon from "@mui/icons-material/Inventory";
import { onSnapshot } from "firebase/firestore";
import "../../css/budget.css";
import { db } from "../../firebase"; // Assuming you have firebase setup
import { ToastContainer, toast } from "react-toastify";
import { collection, updateDoc, doc, deleteDoc, getDoc } from "firebase/firestore";
import Loading from "../../components/Loading";
import { getAuth, prodErrorMap } from "firebase/auth";
import BottomBar from "./BottomBar";
import { query, where } from "firebase/firestore";
import { AddBudget, AddItem, BlankImage } from "./svg/AddImage";
import { getDesignImage, handleNameChange } from "./backend/DesignActions";

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

function Budget() {
  const { user, designs, userDesigns, userDesignVersions, budgets, userBudgets, items, userItems } =
    useSharedProps();
  const { designId, projectId } = useParams();
  const navigate = useNavigate();
  const [design, setDesign] = useState({});
  const [budget, setBudget] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isRemoveBudgetModalOpen, setIsRemoveBudgetModalOpen] = useState(false);
  const [budgetCurrency, setBudgetCurrency] = useState(budget?.budget?.currency ?? 0);
  const [budgetAmount, setBudgetAmount] = useState(budget?.budget?.amount ?? 0);
  const [budgetCurrencyForInput, setBudgetCurrencyForInput] = useState(
    budget?.budget?.currency ?? 0
  );
  const [budgetAmountForInput, setBudgetAmountForInput] = useState(budget?.budget?.amount ?? "");
  const [designItems, setDesignItems] = useState([]);
  const [newName, setNewName] = useState(design?.designName ?? "Untitled Design");
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [formattedTotalCost, setFormattedTotalCost] = useState("0.00");
  const [exceededBudget, setExceededBudget] = useState(0);

  const [loading, setLoading] = useState(true);

  // Icons
  const GradientAddIcon = () => (
    <>
      <svg width={0} height={0}>
        <linearGradient id="linearColors" gradientTransform="rotate(180)">
          <stop offset={0} stopColor="#F9A754" />
          <stop offset={0.5} stopColor="#F26B27" />
          <stop offset={1} stopColor="#EF4E59" />
        </linearGradient>
      </svg>
      <AddIcon sx={{ fill: "url(#linearColors)" }} />
    </>
  );
  const GradientEditIcon = () => (
    <>
      <svg width={0} height={0}>
        <linearGradient id="linearColors" gradientTransform="rotate(180)">
          <stop offset={0} stopColor="#F9A754" />
          <stop offset={0.5} stopColor="#F26B27" />
          <stop offset={1} stopColor="#EF4E59" />
        </linearGradient>
      </svg>
      <EditIcon sx={{ fill: "url(#linearColors)" }} />
    </>
  );
  const GradientDeleteIcon = () => (
    <>
      <svg width={0} height={0}>
        <linearGradient id="linearColors" gradientTransform="rotate(180)">
          <stop offset={0} stopColor="#F9A754" />
          <stop offset={0.5} stopColor="#F26B27" />
          <stop offset={1} stopColor="#EF4E59" />
        </linearGradient>
      </svg>
      <DeleteIcon sx={{ fill: "url(#linearColors)" }} />
    </>
  );

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

    // Assuming all items have the same currency
    const formattedTotalCost =
      designItems[0].cost.currency +
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

  // Initialize
  useEffect(() => {
    setLoading(true);
    const fetchedDesign = userDesigns.find((design) => design.id === designId);
    setDesign(fetchedDesign || {});
    setNewName(fetchedDesign?.designName ?? "Untitled Design");

    if (!fetchedDesign) {
      console.error("Design not found.");
      navigate("/homepage");
      setLoading(false);
      return;
    }

    const fetchedBudget = userBudgets.find((budget) => budget.designId === designId);
    setBudget(fetchedBudget || {});

    const fetchedItems =
      fetchedBudget && fetchedBudget.items
        ? userItems.filter((item) => fetchedBudget.items.includes(item.id))
        : [];
    setDesignItems(fetchedItems);

    if (fetchedBudget && fetchedItems.length > 0) {
      computeTotalCostAndExceededBudget(fetchedItems, fetchedBudget.budget?.amount);
    }
    setLoading(false);
  }, []);

  // Updates on Real-time changes on shared props
  useEffect(() => {
    const fetchedDesign = userDesigns.find((design) => design.id === designId);

    if (!fetchedDesign) {
      console.error("Design not found");
      navigate("/homepage");
    } else if (!deepEqual(design, fetchedDesign)) {
      setDesign(fetchedDesign);
      setNewName(fetchedDesign?.designName ?? "Untitled Design");
    }
  }, [designs, userDesigns]);

  const updateItems = () => {
    const fetchedItems =
      userBudgets && userBudgets.items && userItems
        ? userItems.filter((item) => budget.items.includes(item.id))
        : [];

    if (budget && !deepEqual(designItems, fetchedItems)) {
      setDesignItems(fetchedItems);
      console.log("design items length", fetchedItems.length);
      console.log("design items", fetchedItems);
    }

    if (budget && fetchedItems.length > 0) {
      computeTotalCostAndExceededBudget(fetchedItems, budget.budget?.amount);
    }
  };

  useEffect(() => {
    const fetchedBudget = userBudgets.find((budget) => budget.designId === designId);

    if (fetchedBudget && !deepEqual(budget, fetchedBudget)) {
      setBudgetCurrencyForInput(fetchedBudget.budget?.currency ?? "PHP");
      setBudgetAmountForInput(fetchedBudget.budget?.amount ?? 0);
      setBudget(fetchedBudget);
      setBudgetCurrency(fetchedBudget.budget?.currency ?? "PHP");
      setBudgetAmount(fetchedBudget.budget?.amount ?? 0);
      updateItems();
    }
  }, [budgets, userBudgets]);

  useEffect(() => {
    updateItems();
  }, [items, userItems]);

  useEffect(() => {
    setBudgetAmount(budget?.budget?.amount ?? 0);
    setBudgetCurrency(budget?.budget?.currency ?? "PHP");
  }, [budget]);

  useEffect(() => {
    if (budgetAmount && designItems.length > 0) {
      computeTotalCostAndExceededBudget(designItems, budgetAmount);
    }
  }, [designItems]);

  if (loading) {
    return <Loading />;
  }

  if (!design) {
    return <div>Design not found. Please reload or navigate to this design again.</div>;
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

  const getBudgetColor = (budgetAmount, totalCost) => {
    if (budgetAmount === 0) {
      return "var(--inputBg)"; // Default background color when no budget is set
    } else if (totalCost <= budgetAmount) {
      return "#397438"; // Green if within budget
    } else {
      return "#EF4F56"; // Red if over budget
    }
  };

  const handleUpdateBudget = async (budgetAmount, budgetCurrency) => {
    const budgetAmountNum = parseFloat(budgetAmount);
    if (isNaN(budgetAmountNum)) {
      console.error("Invalid input, unable to process as a number.");
      return;
    }

    try {
      const response = await axios.put(
        `/api/design/budget/${budget.id}/update-budget`,
        { amount: budgetAmountNum, currency: budgetCurrency },
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
      <DesignHead
        design={design}
        newName={newName}
        setNewName={setNewName}
        isEditingName={isEditingName}
        handleNameChange={() => handleNameChange(designId, newName, user, setIsEditingName)}
        setIsEditingName={setIsEditingName}
      />
      {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}
      <div className="cutoff">
        <div className="budgetSpace">
          <span
            className="priceSum"
            style={{
              backgroundColor: getBudgetColor(budgetAmount, totalCost),
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
                      {budgetCurrency} {formatNumber(budgetAmount)}
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
                      {budgetCurrency} {formatNumber(budgetAmount)}
                    </strong>
                  </>
                );
              }
            })()}
          </span>

          {budgetAmount > 0 ? (
            <>
              <IconButton
                onClick={() => toggleBudgetModal(true, true)}
                sx={{ color: "var(--color-white)" }}
              >
                <GradientEditIcon />
              </IconButton>
              <IconButton
                onClick={() => {
                  setIsRemoveBudgetModalOpen(true);
                  setMenuOpen(false);
                }}
                sx={{ color: "var(--color-white)" }}
              >
                <GradientDeleteIcon />
              </IconButton>
            </>
          ) : (
            <IconButton
              onClick={() => toggleBudgetModal(true, false)}
              sx={{ color: "var(--gradientIcon)" }}
            >
              <GradientAddIcon />
            </IconButton>
          )}
          <div className="image-frame">
            <div className="image-frame-icon">
              <BlankImage />
              <span>No design yet</span>
            </div>
            <img
              src={getDesignImage(design.id, userDesigns, userDesignVersions, 0)}
              alt=""
              className="image-preview"
            />
          </div>
        </div>
        <div className="budgetSpace" style={{ marginBottom: "10%" }}>
          {designItems.length > 0 ? (
            designItems.map((item, index) => (
              <Item
                key={index}
                item={item}
                onEdit={() => navigate(`/editItem/${budget.id}/${item.id}`)}
                setDesignItems={setDesignItems}
                budgetId={budget.id}
              />
            ))
          ) : (
            <div>
              <img
                src={"../../img/project-placeholder.png"}
                style={{ width: "100px" }}
                alt="project placeholder"
              />
              <p className="grey-text">No items yet</p>
            </div>
          )}
        </div>
      </div>
      <div className="circle-button-container">
        {menuOpen && (
          <div className="small-buttons">
            {budgetAmount > 0 && (
              <div
                className="small-button-container"
                onClick={() => {
                  setIsRemoveBudgetModalOpen(true);
                  setMenuOpen(false);
                }}
              >
                <span className="small-button-text">Delete Budget</span>
                <div className="small-circle-button">
                  <DeleteIcon />
                </div>
              </div>
            )}
            <div
              className="small-button-container"
              onClick={() => toggleBudgetModal(true, budgetAmount > 0)}
            >
              <span className="small-button-text">
                {budgetAmount > 0 ? "Edit the budget" : "Add a Budget"}
              </span>
              <div className="small-circle-button">
                {budgetAmount > 0 ? <EditIcon /> : <AddBudget />}
              </div>
            </div>
            <div
              className="small-button-container"
              onClick={() => navigate(`/addItem/${budget.id}`)}
            >
              <span className="small-button-text">Add an Item</span>
              <div className="small-circle-button">
                <AddItem />
              </div>
            </div>
          </div>
        )}
        <div className={`circle-button ${menuOpen ? "rotate" : ""}`} onClick={toggleMenu}>
          {menuOpen ? <CloseIcon /> : <AddIcon />}
        </div>
      </div>

      {/* {isBudgetModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ color: "var(--color-white)" }}>
                {setIsEditingBudget ? "Edit the budget" : "Add a Budget"}
              </h2>
              <CloseIcon
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
        <Modal
          open={isBudgetModalOpen}
          onClose={() => toggleBudgetModal(false, isEditingBudget)}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", marginBottom: "12px", margin: "18px" }}>
                <span id="modal-modal-title" style={{ fontSize: "18px", fontWeight: "600" }}>
                  {isEditingBudget ? "Edit the budget" : "Add a Budget"}
                </span>{" "}
                <CloseIcon
                  sx={{ marginLeft: "auto" }}
                  onClick={() => toggleBudgetModal(false, isEditingBudget)}
                  cursor={"pointer"}
                />
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
                    value={budgetCurrencyForInput}
                    onChange={(e) => setBudgetCurrencyForInput(e.target.value)}
                  >
                    <option value="PHP">PHP</option>
                    <option value="USD">USD</option>
                  </select>
                  <KeyboardArrowDownIcon
                    sx={{
                      color: "var(--color-grey)",
                      marginLeft: "-50px",
                      marginTop: "18px",
                    }}
                  />
                  <input
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
              <button
                className="add-item-btn"
                style={{ margin: "18px" }}
                onClick={() => handleUpdateBudget(budgetAmountForInput, budgetCurrencyForInput)}
              >
                {isEditingBudget ? "Edit budget" : "Add Budget"}
              </button>
              <div onClick={() => toggleBudgetModal(false, isEditingBudget)}>Cancel</div>
            </div>
          </Box>
        </Modal>
      )}
      {isRemoveBudgetModalOpen && (
        <Modal
          open={isRemoveBudgetModalOpen}
          onClose={() => setIsRemoveBudgetModalOpen(false)}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", marginBottom: "12px", margin: "18px" }}>
                <span id="modal-modal-title" style={{ fontSize: "18px", fontWeight: "600" }}>
                  Confirm budget removal
                </span>
                <CloseIcon
                  sx={{ marginLeft: "auto" }}
                  onClick={() => setIsRemoveBudgetModalOpen(false)}
                  cursor={"pointer"}
                />
              </div>
              <Divider sx={{ borderColor: "var(--color-grey)" }} />
              <span style={{ textAlign: "center", margin: "18px" }}>
                Are you sure you want to remove the budget?
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
                    (e.target.style.backgroundImage =
                      " var(--lightGradient), var(--gradientButton)")
                  }
                  onClick={() => setIsRemoveBudgetModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="add-item-btn" onClick={() => handleRemoveBudget(budgetCurrency)}>
                  Confirm
                </button>
              </div>
            </div>
          </Box>
        </Modal>
      )}
      <BottomBar designId={designId} design={false} projectId={projectId} />
    </div>
  );
}

export default Budget;
