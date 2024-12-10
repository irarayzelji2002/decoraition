const { db, auth } = require("../firebase");

// Update Project Budget
exports.updateProjectBudget = async (req, res) => {
  const updatedDocuments = [];
  try {
    const { projectBudgetId } = req.params;
    const { amount, currency } = req.body; // Expect currency object in request body

    if (amount === undefined || currency === undefined) {
      return res.status(400).json({ message: "Amount and currency are required" });
    }

    const projectBudgetRef = db.collection("projectBudgets").doc(projectBudgetId);
    const projectBudgetDoc = await projectBudgetRef.get();
    if (!projectBudgetDoc.exists) {
      return res.status(404).json({ error: "Project budget not found" });
    }
    updatedDocuments.push({
      ref: projectBudgetRef,
      data: {
        budget: projectBudgetDoc.data().budget,
        modifiedAt: projectBudgetDoc.data().modifiedAt,
      },
      collection: "projectBudgets",
      id: projectBudgetRef.id,
    });
    await projectBudgetRef.update({
      budget: { amount, currency },
      modifiedAt: new Date(),
    });

    res.status(200).json({ message: "Project budget updated successfully" });
  } catch (error) {
    console.error("Error updating project budget:", error);

    // Rollback
    for (const doc of updatedDocuments) {
      try {
        await doc.ref.update(doc.data);
        console.log(`Rolled back ${doc.data} in ${doc.collection} document ${doc.id}`);
      } catch (rollbackError) {
        console.error(`Error rolling back ${doc.collection} document ${doc.id}:`, rollbackError);
      }
    }

    res.status(500).json({ error: "Failed to update project budget" });
  }
};
