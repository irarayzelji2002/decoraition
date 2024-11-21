const { db, auth } = require("../firebase");

// Create Plan Map
exports.createPlanMap = async (req, res) => {
  try {
    const { projectId, name, imageUrl } = req.body;
    const planMapRef = db.collection("planMaps").doc();
    const planMapData = {
      projectId,
      name,
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await planMapRef.set(planMapData);
    res.status(201).json({ id: planMapRef.id, ...planMapData });
  } catch (error) {
    console.error("Error creating plan map:", error);
    res.status(500).json({ error: "Failed to create plan map" });
  }
};

// Read Plan Map
exports.getPlanMap = async (req, res) => {
  try {
    const { planMapId } = req.params;
    const planMapDoc = await db.collection("planMaps").doc(planMapId).get();
    if (!planMapDoc.exists) {
      return res.status(404).json({ error: "Plan map not found" });
    }
    res.json({ id: planMapDoc.id, ...planMapDoc.data() });
  } catch (error) {
    console.error("Error fetching plan map:", error);
    res.status(500).json({ error: "Failed to fetch plan map" });
  }
};

// Update Plan Map
exports.updatePlanMap = async (req, res) => {
  try {
    const { planMapId } = req.params;
    const updateData = req.body;
    updateData.updatedAt = new Date();
    await db.collection("planMaps").doc(planMapId).update(updateData);
    res.json({ message: "Plan map updated successfully" });
  } catch (error) {
    console.error("Error updating plan map:", error);
    res.status(500).json({ error: "Failed to update plan map" });
  }
};

// Delete Plan Map
exports.deletePlanMap = async (req, res) => {
  try {
    const { planMapId } = req.params;
    await db.collection("planMaps").doc(planMapId).delete();
    res.json({ message: "Plan map deleted successfully" });
  } catch (error) {
    console.error("Error deleting plan map:", error);
    res.status(500).json({ error: "Failed to delete plan map" });
  }
};

// Create Pin
exports.createPin = async (req, res) => {
  try {
    const { planMapId } = req.params;
    const { x, y, label, description } = req.body;
    const pinRef = db.collection("planMaps").doc(planMapId).collection("pins").doc();
    const pinData = {
      x,
      y,
      label,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await pinRef.set(pinData);
    res.status(201).json({ id: pinRef.id, ...pinData });
  } catch (error) {
    console.error("Error creating pin:", error);
    res.status(500).json({ error: "Failed to create pin" });
  }
};

// Read Pins
exports.getPins = async (req, res) => {
  try {
    const { projectId } = req.params;

    const planMapSnapshot = await db.collection("pins").where("projectId", "==", projectId).get();

    if (planMapSnapshot.empty) {
      console.log("No matching documents found.");
      return res.status(404).json({ error: "No pins found for the specified projectId." });
    }

    const pins = [];
    planMapSnapshot.forEach((doc) => {
      const planMapData = doc.data();
      planMapData.id = doc.id; // Add the document ID to the pin data
      pins.push(planMapData);
    });

    res.json(pins);
  } catch (error) {
    console.error("Error fetching pins:", error);
    res.status(500).json({ error: "Failed to fetch pins" });
  }
};

// Update Pin
exports.updatePin = async (req, res) => {
  try {
    const { pinId } = req.params;
    const updateData = req.body;
    updateData.updatedAt = new Date();
    await db.collection("pins").doc(pinId).update(updateData);
    res.json({ message: "Pin updated successfully" });
  } catch (error) {
    console.error("Error updating pin:", error);
    res.status(500).json({ error: "Failed to update pin" });
  }
};

// Delete Pin
exports.deletePin = async (req, res) => {
  try {
    const { pinId } = req.params;
    console.log("Delete pin", pinId);
    await db.collection("pins").doc(pinId).delete();
    res.json({ message: "Pin deleted successfully" });
  } catch (error) {
    console.error("Error deleting pin:", error);
    res.status(500).json({ error: "Failed to delete pin" });
  }
};

exports.savePinOrder = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { pins } = req.body;

    const batch = db.batch();

    pins.forEach((pin) => {
      const pinRef = db.collection("pins").doc(pin.id);
      batch.update(pinRef, { order: pin.order });
    });

    await batch.commit();
    res.json({ message: "Pin order saved successfully" });
  } catch (error) {
    console.error("Error saving pin order:", error);
    res.status(500).json({ error: "Failed to save pin order" });
  }
};
