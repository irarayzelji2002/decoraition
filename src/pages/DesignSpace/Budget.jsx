import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import deepEqual from "deep-equal";
import { debounce } from "lodash";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { showToast } from "../../functions/utils";

import Item from "./Item";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
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
import { AddBudget, AddItem } from "./svg/AddImage";

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
  const { user, designs, userDesigns, budgets, userBudgets, items, userItems } = useSharedProps();
  const { designId, projectId } = useParams();
  const navigate = useNavigate();
  const [design, setDesign] = useState({});
  const [budget, setBudget] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isRemoveBudgetModalOpen, setIsRemoveBudgetModalOpen] = useState(false);
  const [budgetCurrency, setBudgetCurrency] = useState(0);
  const [budgetAmount, setBudgetAmount] = useState(0);
  const [designItems, setDesignItems] = useState([]);
  const [newName, setNewName] = useState("");
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [formattedTotalCost, setFormattedTotalCost] = useState("");
  const [exceededBudget, setExceededBudget] = useState(0);

  // Initialize
  useEffect(() => {
    const fetchedDesign = userDesigns.find((design) => design.id === designId);
    setDesign(fetchedDesign);

    if (!fetchedDesign) {
      return <div>Design not found. Please reload or navigate to this design again.</div>;
    }

    const fetchedBudget = userBudgets.find((budget) => budget.designId === designId);
    setBudget(fetchedBudget);

    const fetchedItems = userItems.filter((item) => fetchedBudget.items.includes(item.id));
    setDesignItems(fetchedItems);

    computeTotalCostAndExceededBudget(fetchedItems, fetchedBudget?.budget?.amount);
  }, []);

  // Updates on Real-time changes on shared props
  useEffect(() => {
    const fetchedDesign = userDesigns.find((design) => design.id === designId);

    if (!fetchedDesign) {
      return <div>Design not found</div>;
    } else if (!deepEqual(design, fetchedDesign)) {
      setDesign(fetchedDesign);
    }
  }, [designs, userDesigns]);

  useEffect(() => {
    const fetchedBudget = userBudgets.find((budget) => budget.designId === designId);

    if (fetchedBudget && !deepEqual(budget, fetchedBudget)) {
      setBudget(fetchedBudget);
    }
  }, [budgets, userBudgets]);

  useEffect(() => {
    const fetchedItems = userItems.filter((item) => budget.items.includes(item.id));

    if (budget && !deepEqual(designItems, fetchedItems)) {
      setDesignItems(fetchedItems);
    }

    computeTotalCostAndExceededBudget(fetchedItems, budget?.budget?.amount);
  }, [items, userItems]);

  useEffect(() => {
    setBudgetAmount(budget?.budget?.amount);
    setBudgetCurrency(budget?.budget?.currency);
  }, [budget]);

  useEffect(() => {
    computeTotalCostAndExceededBudget(designItems, budgetAmount);
  }, [designItems]);

  // Design Name
  const handleNameChange = async (designId, newName) => {
    try {
      const repsonse = await axios.put(
        `/api/design/${designId}/update-name`,
        { name: newName },
        {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        }
      );
      if (repsonse === 200) {
        setIsEditingName(false);
        showToast("success", "Design name updated successfully");
      }
    } catch (error) {
      console.error("Error updating design name:", error);
      showToast("error", "Failed to update design name");
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Budget Functions
  const toggleBudgetModal = (opening, editing) => {
    if (opening && editing) setIsEditingBudget(true);
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
    try {
      const response = await axios.put(
        `/api/design/budget/${budget.id}/update-budget`,
        { amount: budgetAmount, currency: budgetCurrency },
        {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        }
      );
      if (response === 200) {
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
      if (response === 200) {
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

  // Item Functions
  const computeTotalCostAndExceededBudget = (designItems, budgetAmount) => {
    const totalCost = designItems
      .filter((item) => item.includedInTotal !== false) // Exclude items not included in total
      .reduce((sum, item) => sum + parseFloat(item.cost.amount || 0) * (item.quantity || 1), 0)
      .toFixed(2);
    setTotalCost(totalCost);

    const formattedTotalCost =
      designItems[0].cost.currency + // Assuming all items have the same currency
      new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(totalCost);
    setFormattedTotalCost(formattedTotalCost);

    const exceededBudget = parseFloat(totalCost) > budgetAmount; //true/false
    setExceededBudget(exceededBudget);
  };

  return (
    <div className={`budget-page ${menuOpen ? "" : ""}`}>
      <DesignHead
        design={design}
        newName={newName}
        setNewName={setNewName}
        isEditingName={isEditingName}
        handleNameChange={() => handleNameChange(designId, newName)}
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
            Total Cost: ₱ <strong>{formattedTotalCost}</strong> Budget:{budgetAmount}
          </span>
          {budgetAmount > 0 && (
            <>
              <button onClick={() => toggleBudgetModal(true, true)}>Edit Budget</button>
              <button onClick={() => setIsRemoveBudgetModalOpen(true)}>Remove Budget</button>
            </>
          )}
          <div className="image-frame">
            <img src={"../../img/logoWhitebg.png"} alt="design preview" className="image-preview" />
          </div>
        </div>
        <div className="budgetSpace" style={{ marginBottom: "10%" }}>
          {designItems.length === 0 ? (
            <div>
              <p>No items yet</p>
              <img
                src={"../../img/project-placeholder.png"}
                style={{ width: "100px" }}
                alt="project placeholder"
              />
            </div>
          ) : (
            designItems.map((item, index) => (
              <Item
                key={index}
                item={item}
                onEdit={() => navigate(`/editItem/${budget.id}/${item.id}`)}
                setDesignItems={setDesignItems}
                budgetId={budget.id}
              />
            ))
          )}
        </div>
      </div>
      <div className="circle-button-container">
        {menuOpen && (
          <div className="small-buttons">
            <div
              className="small-button-container"
              onClick={() => toggleBudgetModal(true, budgetAmount > 0)}
            >
              <span className="small-button-text">
                {budgetAmount > 0 ? "Edit the budget" : "Add a Budget"}
              </span>
              <div className="small-circle-button">
                {budgetAmount > 0 ? <AddBudget /> : <EditIcon />}
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
                  {setIsEditingBudget ? "Edit the budget" : "Add a Budget"}
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
                    value={budgetCurrency}
                    onChange={(e) => setBudgetCurrency(e.target.value)}
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
                    type="number"
                    placeholder="Enter item price"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
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
                onClick={() => handleUpdateBudget(budgetAmount, budgetCurrency)}
              >
                {setIsEditingBudget ? "Edit budget" : "Add Budget"}
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
