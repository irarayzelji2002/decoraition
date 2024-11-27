const { db, auth } = require("../firebase");

// Create
exports.createProjectBudget = async (req, res) => {
  try {
    const { projectId, totalBudget } = req.body;
    const projectBudgetRef = db.collection("projectBudgets").doc();
    const projectBudgetData = {
      projectId,
      link: `/projectBudget/${projectId}`,
      createdAt: new Date(),
      modifiedAt: new Date(),
      budgetSettings: {
        generalAccessSetting: 0,
        generalAccessRole: 0,
        allowDownload: true,
      },
      budgets: [],
      budget: {
        amount: totalBudget.amount,
        currency: totalBudget.currency.currencyCode, // Extract currencyCode from currency object
      },
    };
    await projectBudgetRef.set(projectBudgetData);
    res.status(201).json({ id: projectBudgetRef.id, ...projectBudgetData });
  } catch (error) {
    console.error("Error creating project budget:", error);
    res.status(500).json({ error: "Failed to create project budget" });
  }
};

// Read
exports.getProjectBudget = async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectBudgetSnapshot = await db
      .collection("projectBudgets")
      .where("projectId", "==", projectId)
      .get();
    if (projectBudgetSnapshot.empty) {
      return res.status(404).json({ error: "Project budget not found" });
    }
    const projectBudget = projectBudgetSnapshot.docs[0].data();
    res.json({ id: projectBudgetSnapshot.docs[0].id, ...projectBudget });
  } catch (error) {
    console.error("Error fetching project budget:", error);
    res.status(500).json({ error: "Failed to fetch project budget" });
  }
};

// Update
exports.updateProjectBudget = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { amount, currency } = req.body; // Expect currency object in request body

    if (amount === undefined || currency === undefined || currency.currencyCode === undefined) {
      return res.status(400).json({ message: "Amount and currencyCode are required" });
    }

    const projectBudgetSnapshot = await db
      .collection("projectBudgets")
      .where("projectId", "==", projectId)
      .get();
    if (projectBudgetSnapshot.empty) {
      return res.status(404).json({ error: "Project budget not found" });
    }

    const projectBudgetRef = projectBudgetSnapshot.docs[0].ref;
    await projectBudgetRef.update({
      budget: { amount, currency: currency.currencyCode }, // Extract currencyCode from currency object
      modifiedAt: new Date(),
    });

    res.status(200).json({ message: "Project budget updated successfully" });
  } catch (error) {
    console.error("Error updating project budget:", error);
    res.status(500).json({ error: "Failed to update project budget" });
  }
};

// Delete
exports.deleteProjectBudget = async (req, res) => {
  try {
    const { projectBudgetId } = req.params;
    await db.collection("projectBudgets").doc(projectBudgetId).delete();
    res.json({ message: "Project budget deleted successfully" });
  } catch (error) {
    console.error("Error deleting project budget:", error);
    res.status(500).json({ error: "Failed to delete project budget" });
  }
};
