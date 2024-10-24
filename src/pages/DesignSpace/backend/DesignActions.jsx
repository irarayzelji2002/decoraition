import axios from "axios";
import { showToast } from "../../../functions/utils";

export const handleCommentTabClick = (side, setActiveCommentTab) => {
  setActiveCommentTab(side);
};

export const handleStatusTabClick = (side, setActiveStatusTab) => {
  setActiveStatusTab(side);
};

export const handleContainerClick = (setClicked) => {
  setClicked((prev) => !prev); // Toggle clicked state
};

export const toggleComments = (setShowComments) => {
  setShowComments((prev) => !prev);
};

export const togglePromptBar = (setShowPromptBar) => {
  setShowPromptBar((prev) => !prev);
};

export const handleSidebarEffect = (isSidebarOpen) => {
  if (isSidebarOpen) {
    document.body.style.overflow = "hidden"; // Disable body scroll
  } else {
    document.body.style.overflow = "auto"; // Enable body scroll
  }

  return () => {
    document.body.style.overflow = "auto"; // Clean up on component unmount
  };
};

export const getDesignImage = (designId, userDesigns, userDesignVersions, index = 0) => {
  // Check if userDesigns and userDesignVersions are defined and are arrays
  if (!Array.isArray(userDesigns) || !Array.isArray(userDesignVersions)) {
    console.error("userDesigns or userDesignVersions is not an array");
    return "";
  }

  // Get the design
  const fetchedDesign = userDesigns.find((design) => design.id === designId);
  if (!fetchedDesign || !fetchedDesign.history || fetchedDesign.history.length === 0) {
    console.log("Design not found or has no history");
    return "";
  }

  // Get the latest designVersionId
  const latestDesignVersionId = fetchedDesign.history[fetchedDesign.history.length - 1];
  const fetchedLatestDesignVersion = userDesignVersions.find(
    (designVer) => designVer.id === latestDesignVersionId
  );
  if (
    !fetchedLatestDesignVersion ||
    !fetchedLatestDesignVersion.images ||
    fetchedLatestDesignVersion.images.length === 0
  ) {
    console.log("Latest design version not found or has no images");
    return "";
  }

  // Check if the requested index exists
  if (index >= fetchedLatestDesignVersion.images.length) {
    console.error("Requested image index out of bounds");
    return "";
  }

  // Return the first image's link from the fetched design version
  return fetchedLatestDesignVersion.images[index].link || "";
};

export const handleNameChange = async (designId, newName, user, setIsEditingName) => {
  try {
    const response = await axios.put(
      `/api/design/${designId}/update-name`,
      { name: newName },
      {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      }
    );
    if (response.status === 200) {
      setIsEditingName(false);
      showToast("success", "Design name updated successfully");
    }
  } catch (error) {
    console.error("Error updating design name:", error);
    showToast("error", "Failed to update design name");
  }
};
