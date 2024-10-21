const { db, storage } = require("../firebaseConfig");
const { ref, uploadBytes, getDownloadURL } = require("firebase/storage");

// Add, Edit, Remove Budget
exports.updateBudget = async (req, res) => {
  try {
    const { budgetId } = req.params;
    const { amount, currency } = req.body;

    // Validate input
    if (amount === undefined || currency === undefined) {
      return res.status(400).json({ message: "Amount and currency are required" });
    }

    // Update the budget
    const budgetRef = db.collection("budgets").doc(budgetId);
    await budgetRef.update({
      amount: amount,
      currency: currency,
    });

    res.status(200).json({ message: "Budget updated successfully" });
  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(500).json({ message: "Failed to update budget", error: error.message });
  }
};

// Read Budget
exports.getBudget = async (req, res) => {
  try {
    const { budgetId } = req.params;
    const budgetDoc = await db.collection("budgets").doc(budgetId).get();
    if (!budgetDoc.exists) {
      return res.status(404).json({ error: "Budget not found" });
    }
    res.json({ id: budgetDoc.id, ...budgetDoc.data() });
  } catch (error) {
    console.error("Error fetching budget:", error);
    res.status(500).json({ error: "Failed to fetch budget" });
  }
};

// Add Item
exports.addItem = async (req, res) => {
  try {
    const { budgetId, itemName, description, cost, quantity, includedInTotal, isUploadedImage } =
      req.body;
    let imageUrl = null;

    if (isUploadedImage) {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = req.file;
      const fileName = `items/${budgetId}/${Date.now()}_${file.originalname}`;
      const storageRef = ref(storage, fileName);

      const snapshot = await uploadBytes(storageRef, file.buffer, {
        contentType: file.mimetype,
      });
      imageUrl = await getDownloadURL(snapshot.ref);
    } else {
      imageUrl = req.body.image; // Use provided image link
    }

    // Create a new item document
    const itemRef = db.collection("items").doc();
    const itemData = {
      itemName,
      description,
      cost,
      quantity,
      image: imageUrl,
      includedInTotal,
    };
    await itemRef.set(itemData);

    // Update the budget's items array
    const budgetRef = db.collection("budgets").doc(budgetId);
    const budgetDoc = await budgetRef.get();
    if (!budgetDoc.exists) {
      throw new Error("Budget not found");
    }
    const budgetData = budgetDoc.data();
    const currentItems = budgetData.items || [];
    const updatedItems = [...currentItems, itemRef.id];
    await budgetRef.update({
      items: updatedItems,
    });

    res.status(201).json({ id: itemRef.id, ...itemData });
  } catch (error) {
    console.error("Error adding item:", error);
    res.status(500).json({ error: "Failed to add item" });
  }
};

// Update Budget Item
exports.updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { budgetId, ...updateData } = req.body;
    updateData.modifiedAt = new Date();
    const itemRef = db.collection("items").doc(itemId);
    await itemRef.update(updateData);
    res.json({ message: "Item updated successfully" });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
};

// Delete Budget Item
exports.deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { budgetId } = req.body;

    // Delete the item from the items collection
    await db.collection("items").doc(itemId).delete();

    // Remove item from budget
    const budgetRef = db.collection("budgets").doc(budgetId);
    const budgetDoc = await budgetRef.get();
    if (!budgetDoc.exists) {
      return res.status(404).json({ error: "Budget not found" });
    }
    const currentItems = budgetDoc.data().items || [];
    const updatedItems = currentItems.filter((id) => id !== itemId);

    // Update the budget document with the new items array
    await budgetRef.update({ items: updatedItems });

    res.json({ message: "Item deleted successfully and removed from budget" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
};
