const { db } = require("../firebaseConfig");

exports.fetchProjects = async (req, res) => {
  try {
    const { userId } = req.params;
    const projectsSnapshot = await db
      .collection("projects")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const projects = projectsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.handleCreateProject = async (req, res) => {
  try {
    const { userId, projectName } = req.body;
    const newProjectRef = db.collection("projects").doc();
    const projectData = {
      userId,
      projectName,
      createdAt: new Date(),
      // Add other project fields as needed
    };
    await newProjectRef.set(projectData);
    res.json({ id: newProjectRef.id, ...projectData });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.handleDeleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    await db.collection("projects").doc(projectId).delete();
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
