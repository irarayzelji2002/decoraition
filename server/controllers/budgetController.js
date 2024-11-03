const { db, storage } = require("../firebase");
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
      budget: { amount: amount, currency: currency },
      modifiedAt: new Date(),
    });

    res
      .status(200)
      .json({ message: "Budget updated successfully", amount: amount, currency: currency });
  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(500).json({ message: "Failed to update budget", error: error.message });
  }
};

// Add Item
exports.addItem = async (req, res) => {
  try {
    const { budgetId, itemName, description, quantity, isUploadedImage } = req.body;
    const cost = JSON.parse(req.body.cost);
    let imageUrl = null;

    if (isUploadedImage === true) {
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

    // Create a new blank item document
    const itemRef = db.collection("items").doc();
    const blankItemData = {
      itemName: "",
      description: "",
      cost: { amount: 0, currency: "PHP" },
      quantity: 0,
      image: "",
      includedInTotal: true,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
    await itemRef.set(blankItemData);

    // Update the budget's items array
    const budgetRef = db.collection("budgets").doc(budgetId);
    const budgetDoc = await budgetRef.get();
    if (!budgetDoc.exists) {
      throw new Error("Budget not found");
    }
    const budgetData = budgetDoc.data();
    const currentItems = budgetData.items || [];
    const updatedItems = [...currentItems, itemRef.id];
    await budgetRef.update({ items: updatedItems, modifiedAt: new Date() });

    // Populate the item document
    const itemData = {
      itemName,
      description,
      cost,
      quantity,
      image: imageUrl,
      includedInTotal: true,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
    await itemRef.update(itemData);

    res.status(200).json({ id: itemRef.id, ...itemData });
  } catch (error) {
    console.error("Error adding item:", error);
    res.status(500).json({ error: "Failed to add item" });
  }
};

// Update Item
exports.updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { itemName, description, quantity, includedInTotal, isUploadedImage } = req.body;
    const cost = JSON.parse(req.body.cost);
    let imageUrl = null;

    if (isUploadedImage === true || isUploadedImage === "true") {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = req.file;
      const fileName = `items/${itemId}/${Date.now()}_${file.originalname}`;
      const storageRef = ref(storage, fileName);

      const snapshot = await uploadBytes(storageRef, file.buffer, {
        contentType: file.mimetype,
      });
      imageUrl = await getDownloadURL(snapshot.ref);
    } else {
      imageUrl = req.body.image; // Use provided image link
    }

    // First get the item to find its budget
    const itemRef = db.collection("items").doc(itemId);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      throw new Error("Item not found");
    }
    const itemData = {
      itemName,
      description,
      cost,
      quantity,
      image: imageUrl,
      includedInTotal,
      modifiedAt: new Date(),
    };

    // Find the budget containing this item to trigger an update
    const budgetsRef = db.collection("budgets");
    const budgetQuery = await budgetsRef.where("items", "array-contains", itemId).get();
    if (!budgetQuery.empty) {
      const budgetDoc = budgetQuery.docs[0];
      await budgetDoc.ref.update({
        modifiedAt: new Date(),
      });
    }

    // Update the item
    await itemRef.update(itemData);

    res.status(200).json({ message: "Item updated successfully", ...itemData });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
};

// Update Item's includedInTotal
exports.updateItemIncludedInTotal = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { includedInTotal } = req.body;

    if (typeof includedInTotal !== "boolean") {
      return res.status(400).json({ error: "Invalid includedInTotal value" });
    }

    const itemRef = db.collection("items").doc(itemId);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      return res.status(404).json({ error: "Item not found" });
    }
    await itemRef.update({
      includedInTotal: includedInTotal,
      modifiedAt: new Date(),
    });

    res
      .status(200)
      .json({ message: "Item updated successfully", includedInTotal: includedInTotal });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
};

// Delete Budget Item
exports.deleteItem = async (req, res) => {
  let deletedItem = null;
  let previousItems = null;
  try {
    const { itemId } = req.params;
    const { budgetId } = req.body;

    // Get item data first to store for potential rollback
    const itemRef = db.collection("items").doc(itemId);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      return res.status(404).json({ error: "Item not found" });
    }
    deletedItem = itemDoc.data();

    // Update budget first
    const budgetRef = db.collection("budgets").doc(budgetId);
    const budgetDoc = await budgetRef.get();
    if (!budgetDoc.exists) {
      return res.status(404).json({ error: "Budget not found" });
    }

    previousItems = budgetDoc.data().items || [];
    const updatedItems = previousItems.filter((id) => id !== itemId);

    // Update the budget document with the new items array then delete the item from items collection
    await budgetRef.update({ items: updatedItems });
    await itemRef.delete();

    res.status(200).json({
      message: "Item deleted successfully and removed from budget",
      items: updatedItems,
    });
  } catch (error) {
    console.error("Error deleting item:", error);

    // Rollback mechanism
    try {
      const { itemId } = req.params;
      const { budgetId } = req.body;

      if (deletedItem) {
        // Restore deleted item if it was deleted
        await db.collection("items").doc(itemId).set(deletedItem);
      }

      if (previousItems) {
        // Restore budget's items array if it was updated
        await db.collection("budgets").doc(budgetId).update({
          items: previousItems,
        });
      }

      console.log("Rollback completed successfully");
    } catch (rollbackError) {
      console.error("Error during rollback:", rollbackError);
    }

    res.status(500).json({
      error: "Failed to delete item",
      details: error.message,
    });
  }
};
