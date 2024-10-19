import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Item from "./Item";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DesignHead from "../../components/DesignHead";
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
import { showToast } from "../../functions/utils";

function Budget() {
  const { designId, projectId } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [designData, setDesignData] = useState(null);
  const [budget, setBudget] = useState("");
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);

        const designRef = doc(db, "designs", designId);

        const fetchDesignDetails = async () => {
          try {
            const designSnapshot = await getDoc(designRef);
            if (designSnapshot.exists()) {
              const design = designSnapshot.data();
              setDesignData(design);
              setNewName(design.name);
            } else {
              console.error("Design not found");
            }
          } catch (error) {
            console.error("Error fetching design details:", error);
          }
        };

        fetchDesignDetails();

        const unsubscribeSnapshot = onSnapshot(designRef, (doc) => {
          if (doc.exists()) {
            const design = doc.data();
            setDesignData(design);
            setNewName(design.name);
          } else {
            console.error("Design not found");
          }
        });

        return () => unsubscribeSnapshot();
      } else {
        console.error("User is not authenticated");
      }
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [designId]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const handleAddBudget = () => {
    setModalOpen(false);
    setBudget("");
  };

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
        subscribeToPins(user.uid, designId);
      } else {
        console.error("User is not authenticated");
      }
    });
    return () => unsubscribe();
  }, [designId]);
  const subscribeToPins = (userId, designId) => {
    let pinRef;

    pinRef = collection(db, "budgets");

    const q = query(pinRef, where("designId", "==", designId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pinList = snapshot.docs.map((doc) => ({
        id: doc.id, // Capture the document ID
        ...doc.data(), // Spread the item data
      }));
      setItems(pinList); // Set items with IDs
    });
    return unsubscribe;
  };

  const handleDelete = async (itemId) => {
    try {
      let itemRef = doc(db, "budgets", itemId);

      await deleteDoc(itemRef); // Delete the document from Firestore
      setItems(items.filter((item) => item.id !== itemId)); // Update local state
      showToast("success", "Item has been deleted!");
    } catch (error) {
      console.error("Error deleting item:", error);
      showToast("error", "Error deleting item:");
    }
  };

  const handleNameChange = async () => {
    if (newName.trim() === "") {
      alert("Design name cannot be empty");
      return;
    }

    try {
      const designRef = doc(db, "designs", designId);
      await updateDoc(designRef, { name: newName });
      setIsEditingName(false);
      showToast("success", "Design name updated successfully!");
    } catch (error) {
      console.error("Error updating design name:", error);
      alert("Failed to update design name");
    }
  };

  const totalCost = items
    .reduce((sum, item) => sum + parseFloat(item.cost || 0) * (item.quantity || 1), 0)
    .toFixed(2);

  const formattedTotalCost = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalCost);

  if (!designData) {
    return (
      <>
        <Loading />
      </>
    );
  }
  return (
    <div className={`budget-page ${menuOpen ? "" : ""}`}>
      <ToastContainer progressStyle={{ backgroundColor: "var(--brightFont)" }} />
      <DesignHead
        designData={designData}
        newName={newName}
        setNewName={setNewName}
        isEditingName={isEditingName}
        handleNameChange={handleNameChange}
        setIsEditingName={setIsEditingName}
      />
      {menuOpen && <div className="overlay" onClick={toggleMenu}></div>}
      <div className="cutoff">
        <div className="budgetSpace">
          <span
            className="priceSum"
            style={{
              backgroundColor: totalCost > 0 ? "#397438" : "var(--inputBg)",
            }}
          >
            Total Budget: ₱ <strong>{formattedTotalCost}</strong>
          </span>
          <div className="image-frame">
            <img src={"../../img/logoWhitebg.png"} alt="design preview" className="image-preview" />
          </div>
        </div>
        <div className="budgetSpace" style={{ marginBottom: "10%" }}>
          {items.length === 0 ? (
            <div>
              {" "}
              <p>No items yet</p>
              <img
                src={"../../img/project-placeholder.png"}
                style={{ width: "100px" }}
                alt="project placeholder"
              />
            </div>
          ) : (
            items.map((item, index) => (
              <Item
                key={index}
                item={item}
                onDelete={() => handleDelete(item.id)}
                onEdit={() =>
                  projectId
                    ? navigate(`/editItem/${designId}/${item.id}/${projectId}/project`)
                    : navigate(`/editItem/${designId}/${item.id}`)
                }
              />
            ))
          )}
        </div>
      </div>
      <div className="circle-button-container">
        {menuOpen && (
          <div className="small-buttons">
            <div className="small-button-container" onClick={toggleModal}>
              <span className="small-button-text">Add a Budget</span>
              <div className="small-circle-button">
                <AddBudget />
              </div>
            </div>
            <div
              className="small-button-container"
              onClick={() =>
                projectId
                  ? navigate(`/addItem/${designId}/${projectId}/project`)
                  : navigate(`/addItem/${designId}`)
              }
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
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ color: "var(--color-white)" }}>Add a Budget</h2>
              <CloseIcon className="close-icon" onClick={toggleModal} />
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="rounded-input"
                placeholder="Enter budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>

            <button className="add-item-btn" style={{ height: "40px" }} onClick={handleAddBudget}>
              Add Budget
            </button>
          </div>
        </div>
      )}{" "}
      <BottomBar designId={designId} design={false} projectId={projectId} />
    </div>
  );
}

export default Budget;
