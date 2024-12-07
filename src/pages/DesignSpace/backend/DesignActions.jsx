import axios from "axios";
import { showToast } from "../../../functions/utils";
import { set } from "lodash";

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

export const getDesignImage = (
  designId,
  designs,
  userDesigns,
  designVersions,
  userDesignVersions,
  index = 0
) => {
  if (!designId) {
    console.log("No design ID provided");
    return "";
  }
  // Check if userDesigns and userDesignVersions are defined and are arrays
  if (!Array.isArray(userDesigns) || !Array.isArray(userDesignVersions)) {
    console.error("userDesigns or userDesignVersions is not an array");
    return "";
  }

  // Get the design
  const fetchedDesign =
    userDesigns.find((design) => design.id === designId) ||
    designs.find((design) => design.id === designId);
  if (!fetchedDesign || !fetchedDesign.history || fetchedDesign.history.length === 0) {
    console.log("Design not found or has no history");
    return "";
  }

  // Get the latest designVersionId
  const latestDesignVersionId = fetchedDesign.history[fetchedDesign.history.length - 1];
  if (!latestDesignVersionId) {
    return "";
  }

  const fetchedLatestDesignVersion =
    userDesignVersions.find((designVer) => designVer.id === latestDesignVersionId) ||
    designVersions.find((designVer) => designVer.id === latestDesignVersionId);
  if (!fetchedLatestDesignVersion?.images?.length) {
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

export const getProjectImage = (
  projectId,
  userProjects,
  projects,
  designs,
  userDesigns,
  designVersions,
  userDesignVersions,
  index = 0
) => {
  // Get the project
  const fetchedProject =
    userProjects.find((project) => project.id === projectId) ||
    projects.find((project) => project.id === projectId);
  if (!fetchedProject || fetchedProject.designs.length === 0) {
    return "";
  }

  // Get all designs for this project
  const projectDesigns = designs.filter((design) => fetchedProject.designs.includes(design.id));

  // Sort designs by modifiedAt timestamp (most recent first)
  const sortedDesigns = projectDesigns.sort(
    (a, b) => (b.modifiedAt?.toMillis() || 0) - (a.modifiedAt?.toMillis() || 0)
  );

  // Get the latest designId (the first one after sorting)
  const latestDesignId = sortedDesigns[0]?.id;

  // Return the design image by calling getDesignImage
  return getDesignImage(
    latestDesignId,
    designs,
    userDesigns,
    designVersions,
    userDesignVersions,
    index
  );
};

export const handleNameChange = async (designId, newName, user, userDoc, setIsEditingName) => {
  console.log("handleNameChange - newName", { designId, newName, user, userDoc, setIsEditingName });
  try {
    const response = await axios.put(
      `/api/design/${designId}/update-name`,
      { name: newName, userId: userDoc.id },
      {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      }
    );
    if (response.status === 200) {
      setIsEditingName(false);
      return { success: true, message: "Design name updated successfully" };
    }
  } catch (error) {
    console.error("Error updating design name:", error);
    return { success: false, message: "Failed to update design name" };
  }
};

export const fetchVersionDetails = async (design, user) => {
  if (design?.history && design.history.length > 0) {
    try {
      const response = await axios.get(`/api/design/${design.id}/version-details`, {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      });
      return { success: true, versionDetails: response.data.versionDetails };
    } catch (error) {
      console.error("Error fetching version details:", error);
      return { success: false, versionDetails: [], message: "Failed to fetch version details" };
    }
  }
  return { success: false, versionDetails: [], message: "No history available" };
};

export const handleRestoreDesignVersion = async (design, designVersionId, user, userDoc) => {
  try {
    const response = await axios.post(
      `/api/design/${design.id}/restore/${designVersionId}`,
      { userId: userDoc.id },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );

    if (response.data.success) {
      return {
        success: true,
        message: "Design version restored successfully",
      };
    } else {
      return {
        success: false,
        message: "Failed to restore design version",
      };
    }
  } catch (error) {
    console.error("Error restoring design version:", error);
    return {
      success: false,
      message: error.response?.data?.error || "Failed to restore design version",
    };
  }
};

export const handleCopyDesign = async (
  design,
  designVersionId,
  shareWithCollaborators,
  user,
  userDoc
) => {
  try {
    const response = await axios.post(
      `/api/design/${design.id}/copy/${designVersionId}`,
      { userId: userDoc.id, shareWithCollaborators },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );

    if (response.data.success) {
      return {
        success: true,
        message: "Design copied successfully",
        designId: response.data.designId,
      };
    } else {
      return {
        success: false,
        message: "Failed to copy design",
      };
    }
  } catch (error) {
    console.error("Error copying design:", error);
    return {
      success: false,
      message: error.response?.data?.error || "Failed to copy design",
    };
  }
};

export const handleAddCollaborators = async (
  design,
  emails,
  role,
  message,
  notifyPeople,
  user,
  userDoc
) => {
  try {
    const response = await axios.post(
      `/api/design/${design.id}/share`,
      { userId: userDoc.id, emails, role, message, notifyPeople },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );

    if (response.data.success) {
      return {
        success: true,
        message: "Design shared successfully",
      };
    } else {
      return {
        success: false,
        message: "Failed to share design",
      };
    }
  } catch (error) {
    console.error("Error sharing design:", error.message);
    return {
      success: false,
      message: error.response?.data?.error || "Failed to share design",
    };
  }
};

export const handleAccessChange = async (
  design,
  initEmailsWithRole,
  emailsWithRole,
  generalAccessSetting,
  generalAccessRole,
  user,
  userDoc
) => {
  try {
    const response = await axios.post(
      `/api/design/${design.id}/change-access`,
      {
        userId: userDoc.id,
        initEmailsWithRole,
        emailsWithRole,
        generalAccessSetting,
        generalAccessRole,
      },
      {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      }
    );

    if (response.data.success) {
      return {
        success: true,
        message: "Design access changed",
      };
    } else {
      return {
        success: false,
        message: "Failed to change access of design",
      };
    }
  } catch (error) {
    console.error("Error changing access of design:", error);
    return {
      success: false,
      message: error.response?.data?.error || "Failed to change access of design",
    };
  }
};

export const handleEditDescription = async (
  designId,
  designVersionId,
  imageId,
  description,
  user,
  userDoc
) => {
  try {
    console.log("editdesc - data", { description, imageId, userId: userDoc.id });
    const response = await axios.put(
      `/api/design/${designId}/design-version/${designVersionId}/update-desc`,
      { description, imageId, userId: userDoc.id },
      {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      }
    );
    if (response.status === 200) {
      return { success: true, message: `Image ${imageId} description updated successfully` };
    }
  } catch (error) {
    console.error(
      `Error updating design version ${designVersionId} image ${imageId} description:`,
      error
    );
    return { success: false, message: `Failed to update image ${imageId} description` };
  }
};

export const handleAddColorPalette = async (colorPalette, user, userDoc) => {
  if (!colorPalette) {
    console.error("Color palette is empty");
    return { success: false, message: "No color palette passed" };
  } else {
    if (!colorPalette.paletteName) {
      console.error("Color palette name is required");
      return { success: false, message: "Color palette name is required" };
    } else if (!colorPalette.colors || colorPalette.colors.length === 0) {
      console.error("Color palette colors are required");
      return { success: false, message: "Color palette must have at least one color" };
    }
  }
  try {
    const response = await axios.post(
      `/api/user/add-color-palette`,
      { userId: userDoc.id, colorPalette: colorPalette },
      {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      }
    );
    if (response.status === 200) {
      return { success: true, message: "Color palette added successfully" };
    }
  } catch (error) {
    console.error("Error adding color palette:", error);
    return { success: false, message: "Failed to add color palette" };
  }
};

export const handleEditColorPalette = async (colorPalette, colorPaletteToEdit, user, userDoc) => {
  if (!colorPalette || !colorPalette.colorPaletteId) {
    console.error("Color palette is empty");
    return { success: false, message: "No color palette passed" };
  } else {
    if (!colorPalette.paletteName) {
      console.error("Color palette name is required");
      return { success: false, message: "Color palette name is required" };
    } else if (colorPalette.paletteName === colorPaletteToEdit.paletteName) {
      console.error("Color palette name is the same as the current name");
      return { success: false, message: "Name is the same as the current name" };
    } else if (!colorPalette.colors || colorPalette.colors.length === 0) {
      console.error("Color palette colors are required");
      return { success: false, message: "Color palette must have at least one color" };
    }
  }
  try {
    const response = await axios.put(
      `/api/user/update-color-palette`,
      { userId: userDoc.id, colorPalette: colorPalette },
      {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      }
    );
    if (response.status === 200) {
      return { success: true, message: "Color palette updated successfully" };
    }
  } catch (error) {
    console.error("Error updating color palette:", error);
    return { success: false, message: "Failed to update color palette" };
  }
};

export const handleDeleteColorPalette = async (colorPalette, user, userDoc) => {
  if (!colorPalette || !colorPalette.colorPaletteId) {
    console.error("Color palette is empty");
    return { success: false, message: "No color palette to delete" };
  }
  try {
    const response = await axios.put(
      `/api/user/delete-color-palette`,
      { userId: userDoc.id, colorPalette: colorPalette },
      {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      }
    );
    if (response.status === 200) {
      return { success: true, message: "Color palette deleted successfully" };
    }
  } catch (error) {
    console.error("Error deleting color palette:", error);
    return { success: false, message: "Failed to delete color palette" };
  }
};

// Image Generation Functions
// Get task position message
export const getQueuePositionMessage = (position) => {
  // Adjusting position to get the correct "in line" position
  const truePosition = position;

  const ordinalSuffix = (num) => {
    const lastDigit = num % 10;
    const suffix =
      lastDigit === 1 && num !== 11
        ? "st"
        : lastDigit === 2 && num !== 12
        ? "nd"
        : lastDigit === 3 && num !== 13
        ? "rd"
        : "th";
    return `${num}${suffix}`;
  };

  if (truePosition === 1) {
    return "You're next in line.";
  } else if (truePosition <= 20) {
    return `You're ${ordinalSuffix(truePosition)} in line.`;
  } else {
    return `You're in queue. There are ${truePosition - 1} tasks in front of you.`;
  }
};

// Check task status
export const checkTaskStatus = async (
  taskId,
  setStatusMessage,
  setProgress,
  setEta,
  setIsGenerating,
  setGeneratedImagesPreview,
  setGeneratedImages,
  numberOfImages
) => {
  try {
    let running = false;
    console.log("Tracking Status: ");
    while (!running) {
      const response = await fetch(
        `https://ai-api.decoraition.org/generate-image/task-status?task_id=${taskId}`
      );

      if (!response.ok) {
        const errorMessage = await response.json();
        throw new Error(errorMessage.error || "Failed to get task results");
      }

      const data = await response.json();

      if (data.position !== 1) {
        let message = getQueuePositionMessage(data.position);
        setStatusMessage(message);
        console.log(message);
      } else {
        running = true;
        setStatusMessage("Image generation in progress");
        // Track progress until task is complete
        console.log("Tracking Image: ");
        const progressResult = await trackImageGenerationProgress(
          taskId,
          setStatusMessage,
          setProgress,
          setEta,
          setIsGenerating,
          setGeneratedImagesPreview,
          numberOfImages
        );
        if (!progressResult.success) {
          throw new Error(progressResult.message);
        }
        // Fetch and display the generated images
        console.log("Displaying Image: ");
        const retryCount = 0;
        const displayResult = await displayGeneratedImages(taskId, retryCount, setGeneratedImages);
        if (!displayResult.success) {
          throw new Error(displayResult.message);
        }
        return { success: true, data: displayResult.data };
      }
      if (!running) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Track progress of image generation
export const trackImageGenerationProgress = async (
  taskId,
  setStatusMessage,
  setProgress,
  setEta,
  setIsGenerating,
  setGeneratedImagesPreview,
  numberOfImages
) => {
  try {
    let attempts = 0;
    const MAX_ATTEMPTS = 300;

    setIsGenerating(true);
    let progress = 0;
    let eta_relative = 0;
    let current_image_index = 0;
    let current_image = null;
    let previous_image = null;
    let completed = false;
    let status = "pending";
    let curr_step = 0;
    let prev_step = -1;
    const number_of_images = numberOfImages || 1;

    // Create image tags in the image container
    for (let i = 0; i < number_of_images; i++) {
      setGeneratedImagesPreview((prev) => [...prev, { id: i, src: "" }]);
    }

    while (!completed && attempts < MAX_ATTEMPTS) {
      attempts++;
      // Fetch API
      const response = await fetch(
        `https://ai-api.decoraition.org/generate-image/image-status?task_id=${taskId}`
      );

      if (!response.ok) {
        const errorMessage = await response.json();
        throw new Error(errorMessage.error || "Failed to get progress.");
      }

      const data = await response.json();
      progress = data.progress;
      eta_relative = data.eta_relative;
      current_image = data.current_image;
      status = data.status;
      curr_step = data.state.sampling_step;

      // Display progress for each image
      if (current_image_index < number_of_images) {
        setStatusMessage(`Generating image ${current_image_index + 1} of ${number_of_images}`);
      }
      const progress_percent = Math.round(progress * 100);
      setProgress(progress_percent);
      setEta(`${Math.round(eta_relative).toFixed(0)} seconds left`);
      console.log(
        `Progress: ${progress_percent}%; ETA: ${Math.round(eta_relative).toFixed(
          0
        )}s; Sampling Step: ${curr_step}`
      );

      // Display image if current_image changes
      if (current_image !== null && previous_image !== current_image) {
        // eslint-disable-next-line no-loop-func
        setGeneratedImagesPreview((prev) =>
          prev.map((img) =>
            img.id === current_image_index
              ? { ...img, src: `data:image/png;base64,${data.current_image}` }
              : img
          )
        );
        previous_image = current_image;
      }

      // Check if we completed the image based on sampling steps
      if ((prev_step === 29 || prev_step === 30) && curr_step === 0) {
        current_image_index++;
      }
      prev_step = curr_step;

      // Mark the task as completed if current_image becomes null after being non-null & status is success/failed
      if (
        previous_image !== null &&
        current_image === null &&
        (status === "success" || status === "failed")
      ) {
        completed = true;
        console.log("Image generation completed.");
        setStatusMessage("Image generation complete");
        setProgress(100);
        setEta("");
        setProgress(0);
        return { success: true, data: { progress: 100, status: status } };
      }

      if (!completed) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    throw new Error("Image generation timed out");
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Fetch and display the generated images
export const displayGeneratedImages = async (taskId, retryCount = 0, setGeneratedImages) => {
  try {
    const MAX_RETRIES = 10;
    if (retryCount >= MAX_RETRIES) {
      throw new Error("Max retries exceeded waiting for images");
    }

    const response = await fetch(
      `https://ai-api.decoraition.org/generate-image/get-results?task_id=${taskId}`,
      {
        method: "GET",
      }
    );

    if (response.status === 202) {
      console.log("Request accepted, still processing. Please wait...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await displayGeneratedImages(taskId, retryCount + 1, setGeneratedImages);
    } else if (!response.ok) {
      const errorMessage = await response.json();
      throw new Error(errorMessage?.error || "Failed to get task results");
    }

    const data = await response.json();
    console.log("Image generation response:", data);
    if (!data?.image_paths || data?.image_paths?.length === 0) {
      throw new Error("Failed to get image results");
    }
    // Transform all paths at once instead of using forEach
    const formattedImages = data.image_paths.map((path) => ({
      link: path,
      description: "",
      comments: [],
    }));
    setGeneratedImages(formattedImages);
    return { success: true, data: data.image_paths };
  } catch (error) {
    console.error("Error in displayGeneratedImages:", error);
    return { success: false, message: error.message };
  }
};

// Generate Mask is clicked
export const generateMask = async (
  maskPrompt,
  initImage,
  setErrors,
  setStatusMessage,
  setIsGeneratingMask
) => {
  let formErrors = {};
  const err_msgs = document.querySelectorAll(".err_msg");
  for (let i = 0; i < err_msgs.length; i++) {
    err_msgs[i].innerHTML = "";
  }
  // Get form elements
  const mask_prompt = maskPrompt.trim();
  const init_image = initImage; //initImage.files[0]

  // Validation
  if (!mask_prompt) {
    formErrors.maskPrompt = "Mask prompt is required to generate a mask.";
  }
  if (!init_image) {
    formErrors.initImage = "Initial image is required to generate a mask.";
  }
  if (Object.keys(formErrors).length > 0) {
    setErrors(formErrors);
    return {
      success: false,
      message: "Invalid inputs.",
      formErrors: formErrors,
    };
  }

  // Create FormData object
  const formData = new FormData();
  formData.append("mask_prompt", mask_prompt);
  formData.append("init_image", init_image);

  // Fetch API
  try {
    setIsGeneratingMask(true);
    setStatusMessage("Generating mask");
    const response = await fetch("https://ai-api.decoraition.org/generate-sam-mask", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let formErrors = {};
      setStatusMessage("");
      const errMessage =
        "Failed to generate mask. Make sure to type an object present in the image in the mask prompt.";
      showToast("error", errMessage);
      setErrors(formErrors);
      return {
        success: false,
        message: errMessage,
      };
    }

    const data = await response.json();
    const origImagePaths = data.image_paths;
    const baseURL = "https://ai-api.decoraition.org/";
    // Create a new object with updated paths
    const imageLinks = Object.fromEntries(
      Object.entries(origImagePaths).map(([key, paths]) => [
        key,
        paths.map((path) => `${baseURL}${path.replace(/^\/+/, "")}`),
      ])
    );
    console.log("Updated Image Links:", imageLinks);

    return {
      success: true,
      data: imageLinks,
      message: "Masks generated successfully",
    };
  } catch (error) {
    console.error("Error:", error);
    let errorMessage = "";
    if (
      error.message === "NetworkError when attempting to fetch resource." ||
      error.message === "Failed to fetch"
    )
      errorMessage = "Server is offline. Please try again later.";
    else errorMessage = error.message || "Failed to generate mask";
    return {
      success: false,
      message: errorMessage,
    };
  }
};

// Preview Mask is clicked/called
export const previewMask = async (
  samMaskImage,
  base64ImageAdd,
  base64ImageRemove,
  selectedSamMask,
  setErrors,
  refineMaskOption,
  showPreview,
  setPreviewMask,
  setStatusMessage,
  setIsPreviewingMask,
  setCombinedMask
) => {
  let formErrors = {};
  // Validate data
  if (!selectedSamMask) {
    formErrors.samMask = "Please select a SAM mask.";
  }
  const sam_mask_path = samMaskImage;
  const user_mask_add = base64ImageAdd;
  const user_mask_remove = base64ImageRemove;
  if (!user_mask_add) {
    formErrors.userMaskAdd = "Please provide the add mask.";
    console.log("Please provide the add mask.");
  }
  if (!user_mask_remove) {
    formErrors.userMaskRemove = "Please provide the remove mask.";
    console.log("Please provide the remove mask.");
  }
  if (Object.keys(formErrors).length > 0) {
    setErrors((prev) => ({ ...prev, ...formErrors }));
    return {
      success: false,
      message: "Invalid inputs.",
      formErrors: formErrors,
    };
  }
  const refineOptionIndex = refineMaskOption ? 0 : 1;

  // Create FormData object
  const formData = new FormData();
  formData.append("refine_option", refineOptionIndex);
  formData.append("sam_mask", sam_mask_path);
  formData.append("user_mask_add", user_mask_add);
  formData.append("user_mask_remove", user_mask_remove);
  // console.log("Form Data:");
  // console.log(formData);

  // Fetch API
  try {
    setIsPreviewingMask(true);
    setStatusMessage("Combining masks");
    const response = await fetch("https://ai-api.decoraition.org/preview-mask", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.log("error repsonse not ok", error);
      throw new Error(error.error || "Failed to combine masks");
    }

    const data = await response.json();
    const { mask, masked_image } = data;

    if (!mask || !masked_image) throw new Error("Failed to combine masks");

    const fetchImage = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Image load failed");
      const blob = await response.blob();
      return URL.createObjectURL(blob); // Convert Blob to a local URL
    };

    const baseURL = "https://ai-api.decoraition.org/";
    const formattedMaskURL = `${baseURL}${mask.replace(/^\/+/, "")}`;
    const formattedMaskedImageURL = `${baseURL}${masked_image.replace(/^\/+/, "")}`;

    const updatedData = {
      mask: {
        url: formattedMaskURL,
        data: await fetchImage(formattedMaskURL),
      },
      masked_image: {
        url: formattedMaskedImageURL,
        data: await fetchImage(formattedMaskedImageURL),
      },
    };
    setCombinedMask(updatedData);
    if (showPreview) setPreviewMask(updatedData.masked_image.data);
    return {
      success: true,
      message: "Masks combined successfully",
      data: updatedData,
    };
  } catch (error) {
    console.error("Error:", error);
    console.log("error catch", error.message);
    let formErrors = {};
    let errorMessage = "";
    if (
      error.message === "NetworkError when attempting to fetch resource." ||
      error.message === "Failed to fetch"
    )
      errorMessage = "Server is offline. Please try again later.";
    else errorMessage = error.message || "Failed to combine masks";
    formErrors.combinedMask = errorMessage;
    setErrors(formErrors);
    return {
      success: false,
      message: errorMessage,
      data: null,
    };
  }
};

// Generate is clicked (first image) - TO FIX
export const generateNextImage = async (
  prompt, // actual generation args
  numberOfImages,
  colorPalette, // string of hex colors sepaarted by ','
  selectedImage,
  styleReference,
  setGenerationErrors,
  setStatusMessage, // checkTaskStatus args
  setProgress,
  setEta,
  setIsGenerating,
  setGeneratedImagesPreview,
  setGeneratedImages,
  samMaskImage, // previewMask args
  base64ImageAdd,
  base64ImageRemove,
  selectedSamMask,
  setMaskErrors,
  refineMaskOption,
  setPreviewMask,
  setCombinedMask,
  combinedMask,
  design,
  designVersion,
  user,
  userDoc,
  samMasks,
  setSamMaskImage,
  setSamMaskMask,
  samDrawing,
  handleClearAllCanvas,
  setIsSelectingMask,
  isSamMaskOnly
) => {
  const initImage = selectedImage.link;
  let combinedMaskBW = "";
  let combinedMaskData;

  // Apply Mask
  const imageId = selectedImage?.imageId;
  if (!isSamMaskOnly) {
    console.log("Applying Mask - next image");
    if (!combinedMask) {
      console.log("applying mask - inside if");
      const result = await previewMask(
        samMaskImage,
        base64ImageAdd,
        base64ImageRemove,
        selectedSamMask,
        setMaskErrors,
        refineMaskOption,
        false, // showPreview to not set previewMask
        setPreviewMask,
        setStatusMessage,
        setIsGenerating,
        setCombinedMask
      );
      if (result.success) {
        // Upload Combined masks
        setStatusMessage("Uploading images of masks");
        combinedMaskData = {
          samMaskImage: result?.data?.mask?.url || "",
          samMaskMask: result?.data?.masked_image?.url || "",
        };
        console.log("combinedMaskData", combinedMaskData);
      } else {
        let formErrors = {};
        formErrors.combinedMask = result.message;
        setMaskErrors(formErrors);
        return {
          success: false,
          message: result.message,
          formErrors: result.formErrors,
        };
      }
    } else {
      console.log("applying mask - inside else");
      setIsGenerating(true);
      setStatusMessage("Uploading images of masks");
      combinedMaskData = {
        samMaskImage: combinedMask?.mask?.url || "",
        samMaskMask: combinedMask?.masked_image?.url || "",
      };
      console.log("applying mask - combinedMaskData", combinedMaskData);
    }
    const resultUpdateCombinedMask = await updateDesignVersionCombinedMask(
      design?.id,
      designVersion?.id, //designVersionId,
      imageId, //designVersionImageId,
      combinedMaskData,
      user,
      userDoc
    );
    if (!resultUpdateCombinedMask.success) {
      showToast("error", "Failed to apply mask");
      return;
    }
    setStatusMessage("Uploading images of masks complete");
    const images = resultUpdateCombinedMask?.data || designVersion.images;
    const image = images.find((i) => i.imageId === imageId) ?? null;
    const newSamMaskImage = image?.masks?.combinedMask?.samMaskImage || samMasks?.[0]?.mask || null;
    const newSamMaskMask =
      image?.masks?.combinedMask?.samMaskMask ||
      samMasks?.[0]?.masked ||
      "/img/transparent-image.png";
    console.log("applying mask - setSamMaskImage", newSamMaskImage);
    console.log("applying mask - newSamMaskMask", newSamMaskMask);
    setSamMaskImage(newSamMaskImage);
    setSamMaskMask(newSamMaskMask);
    setCombinedMask(null);
    setPreviewMask(null);
    if (samDrawing) samDrawing.setNeedsRedraw(true);
    if (handleClearAllCanvas) handleClearAllCanvas();
    combinedMaskBW = newSamMaskImage;
  } else {
    const image = designVersion?.images.find((i) => i.imageId === imageId) ?? null;
    const samMaskImage =
      image?.masks?.combinedMask?.samMaskImage?.trim() || samMasks?.[0]?.mask?.trim() || null;
    combinedMaskBW = samMaskImage;
  }

  // Create FormData object
  console.log("Generating - next image");
  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("number_of_images", numberOfImages);
  if (colorPalette) {
    const colorsArray = colorPalette.split(",").map((color) => color.trim());
    formData.append("color_palette", JSON.stringify(colorsArray));
  }
  formData.append("init_image", initImage);
  formData.append("combined_mask", combinedMaskBW);
  if (styleReference) {
    formData.append("style_reference", styleReference);
  }
  console.log("Form Data:");
  console.log(formData);

  // Fetch API call to generate the next image
  try {
    const generateResponse = await fetch("https://ai-api.decoraition.org/generate-next-image", {
      method: "POST",
      body: formData,
    });

    if (!generateResponse.ok) {
      let formErrors = {};
      const error = await generateResponse.json();
      const errMessage = error.error || "Failed to queue task";
      formErrors.general = errMessage;
      return {
        success: false,
        message: errMessage,
        formErrors: formErrors,
      };
    }
    setIsSelectingMask(false);
    const generateData = await generateResponse.json();
    const taskId = generateData.task.task_id;
    console.log(`Task ID: ${taskId}`);
    const taskResult = await checkTaskStatus(
      taskId,
      setStatusMessage,
      setProgress,
      setEta,
      setIsGenerating,
      setGeneratedImagesPreview,
      setGeneratedImages,
      numberOfImages
    );
    if (!taskResult.success) {
      throw new Error(taskResult.message);
    }
    if (!taskResult.data || !Array.isArray(taskResult.data) || taskResult.data.length === 0) {
      throw new Error("No images were generated");
    }
    console.log("Generated images:", taskResult.data);
    setGeneratedImages(taskResult.data);
    return {
      success: true,
      data: taskResult.data,
      message: `Image${numberOfImages > 1 ? "s" : ""} generated successfully`,
    };
  } catch (error) {
    console.error("Error:", error);
    let errorMessage = "";
    if (
      error.message === "NetworkError when attempting to fetch resource." ||
      error.message === "Failed to fetch"
    )
      errorMessage = "Server is offline. Please try again later.";
    else errorMessage = error.message || `Failed to generate image${numberOfImages > 1 ? "s" : ""}`;
    return {
      success: false,
      message: errorMessage,
    };
  }
};

// Generate is clicked (next image) - TO FIX
export const generateFirstImage = async (
  prompt,
  numberOfImages,
  colorPalette,
  baseImage,
  styleReference,
  setGenerationErrors,
  setStatusMessage, // checkTaskStatus args
  setProgress,
  setEta,
  setIsGenerating,
  setGeneratedImagesPreview,
  setGeneratedImages
) => {
  // Create FormData object
  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("number_of_images", numberOfImages);
  if (colorPalette) {
    const colorsArray = colorPalette.split(",").map((color) => color.trim());
    formData.append("color_palette", JSON.stringify(colorsArray));
  }
  if (baseImage) {
    formData.append("base_image", baseImage);
  }
  if (styleReference) {
    formData.append("style_reference", styleReference);
  }
  console.log("Form Data:", formData);

  // Fetch API call to generate the first image
  try {
    const generateResponse = await fetch("https://ai-api.decoraition.org/generate-first-image", {
      method: "POST",
      body: formData,
    });

    if (!generateResponse.ok) {
      let formErrors = {};
      const error = await generateResponse.json();
      const errMessage = error.error || "Failed to queue task";
      formErrors.general = errMessage;
      return {
        success: false,
        message: errMessage,
        formErrors: formErrors,
      };
    }

    const generateData = await generateResponse.json();
    const taskId = generateData.task.task_id;
    console.log(`Task ID: ${taskId}`);
    const taskResult = await checkTaskStatus(
      taskId,
      setStatusMessage,
      setProgress,
      setEta,
      setIsGenerating,
      setGeneratedImagesPreview,
      setGeneratedImages,
      numberOfImages
    );
    if (!taskResult.success) {
      throw new Error(taskResult.message);
    }
    if (!taskResult.data || !Array.isArray(taskResult.data) || taskResult.data.length === 0) {
      throw new Error("No images were generated");
    }
    console.log("Generated images:", taskResult.data);
    setGeneratedImages(taskResult.data);
    return {
      success: true,
      data: taskResult.data,
      message: `Image${numberOfImages > 1 ? "s" : ""} generated successfully`,
    };
  } catch (error) {
    console.error("Error:", error);
    let errorMessage = "";
    if (
      error.message === "NetworkError when attempting to fetch resource." ||
      error.message === "Failed to fetch"
    )
      errorMessage = "Server is offline. Please try again later.";
    else errorMessage = error.message || `Failed to generate image${numberOfImages > 1 ? "s" : ""}`;
    return {
      success: false,
      message: errorMessage,
    };
  }
};

export const createDesignVersion = async (designId, generatedImages, prompt, user, userDoc) => {
  try {
    const response = await axios.post(
      `/api/design/${designId}/design-version/create-design-version`,
      { userId: userDoc.id, images: generatedImages, prompt },
      {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      }
    );
    if (response.status === 200) {
      return { success: true, message: "Images uploaded successfully" };
    }
    return { success: false, message: "Failed to create design version", status: response.status };
  } catch (error) {
    console.error("Error creating design version created:", error);
    return { success: false, message: "Failed to upload images" };
  }
};

export const updateDesignVersionSamMask = async (
  designId,
  designVersionId,
  designVersionImageId,
  samMasks,
  user,
  userDoc
) => {
  try {
    const token = await user.getIdToken();
    if (!token)
      return { success: false, message: "Failed to upload generated masks. Please try again." };
    const response = await axios.post(
      `/api/design/${designId}/design-version/${designVersionId}/update-sam-masks`,
      { userId: userDoc.id, designVersionImageId, samMasks },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (response.status === 200) {
      return {
        success: true,
        message: "SAM masks uploaded successfully",
        data: response.data.images || null,
      };
    }
    return { success: false, message: "Failed to upload SAM masks", status: response.status };
  } catch (error) {
    console.error("Error uploading SAM masks:", error);
    return { success: false, message: "Failed to upload generated masks. Please try again." };
  }
};

export const updateDesignVersionCombinedMask = async (
  designId,
  designVersionId,
  designVersionImageId,
  combinedMask,
  user,
  userDoc
) => {
  try {
    const response = await axios.post(
      `/api/design/${designId}/design-version/${designVersionId}/update-combined-mask`,
      { userId: userDoc.id, designVersionImageId, combinedMask },
      {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      }
    );
    if (response.status === 200) {
      return {
        success: true,
        message: "Combined mask uploaded successfully",
        data: response.data.images || null,
      };
    }
    return { success: false, message: "Failed to upload combined mask", status: response.status };
  } catch (error) {
    console.error("Error uploading combined mask:", error);
    return { success: false, message: "Failed to upload combined mask" };
  }
};

export const addComment = async (
  designId,
  designVersionImageId,
  location,
  message,
  mentions,
  user,
  userDoc
) => {
  try {
    const response = await axios.post(
      `/api/design/${designId}/comment/add-comment`,
      { userId: userDoc.id, designVersionImageId, location, message, mentions },
      {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      }
    );
    if (response.status === 200) {
      return { success: true, message: "Comment added successfully" };
    } // "Mentioned user not found"/"Mentioned users not found"
  } catch (error) {
    console.error("Error adding comment:", error?.response?.data?.error || error.message);
    // "Mentioned user not found"/"Mentioned users not found"
    return { success: false, message: error?.response?.data?.error || "Failed to add comment" };
  }
};

export const editComment = async (designId, commentId, message, mentions, user, userDoc) => {
  try {
    const response = await axios.put(
      `/api/design/${designId}/comment/${commentId}/edit-comment`,
      { userId: userDoc.id, message, mentions },
      {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      }
    );
    if (response.status === 200) {
      return { success: true, message: "Comment edited successfully" };
    }
  } catch (error) {
    console.error("Error editing comment:", error?.response?.data?.error || error.message);
    return { success: false, message: error?.response?.data?.error || "Failed to edit comment" };
  }
};

export const changeCommentStatus = async (designId, commentId, status, user, userDoc) => {
  // status: false for open, true for resolved
  try {
    const response = await axios.put(
      `/api/design/${designId}/comment/${commentId}/edit-comment-status`,
      { userId: userDoc.id, status },
      {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      }
    );
    if (response.status === 200) {
      return { success: true, message: `Comment ${status ? "resolved" : "reopened"} successfully` };
    }
  } catch (error) {
    console.error(
      `Error ${status ? "resolving" : "reopening"} comment:`,
      error?.response?.data?.error || error.message
    );
    return {
      success: false,
      message: error?.response?.data?.error || `Failed to ${status ? "resolve" : "reopen"} comment`,
    };
  }
};

export const deleteComment = async (designId, commentId, user, userDoc) => {
  try {
    const response = await axios.post(
      `/api/design/${designId}/comment/${commentId}/delete-comment`,
      { userId: userDoc.id },
      {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      }
    );
    if (response.status === 200) {
      return { success: true, message: "Comment deleted successfully" };
    }
  } catch (error) {
    console.error("Error deleting comment:", error?.response?.data?.error || error.message);
    return { success: false, message: error?.response?.data?.error || "Failed to delete comment" };
  }
};

export const addReply = async (
  designId,
  commentId = "",
  message,
  mentions,
  replyTo,
  user,
  userDoc
) => {
  try {
    const apiLink = !replyTo
      ? `/api/design/${designId}/comment/${commentId}/add-reply`
      : `/api/design/${designId}/comment/${replyTo.commentId}/add-reply`;
    const response = await axios.put(
      apiLink,
      { userId: userDoc.id, message, mentions, replyTo },
      {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      }
    );
    if (response.status === 200) {
      return { success: true, message: "Reply added successfully" };
    }
  } catch (error) {
    console.error("Error adding reply:", error?.response?.data?.error || error.message);
    return { success: false, message: error?.response?.data?.error || "Failed to add reply" };
  }
};

export const editReply = async (
  designId,
  commentId = "",
  replyId = "",
  message,
  mentions,
  user,
  userDoc
) => {
  console.log("edit reply function");
  try {
    const response = await axios.put(
      `/api/design/${designId}/comment/${commentId}/edit-reply`,
      { userId: userDoc.id, replyId, message, mentions },
      {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      }
    );
    if (response.status === 200) {
      return { success: true, message: "Reply edited successfully" };
    }
  } catch (error) {
    console.error("Error editing reply:", error?.response?.data?.error || error.message);
    return { success: false, message: error?.response?.data?.error || "Failed to edit reply" };
  }
};

export const deleteReply = async (designId, commentId, replyId, user, userDoc) => {
  try {
    const response = await axios.post(
      `/api/design/${designId}/comment/${commentId}/delete-reply`,
      { userId: userDoc.id, replyId },
      {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      }
    );
    if (response.status === 200) {
      return { success: true, message: "Reply deleted successfully" };
    }
  } catch (error) {
    console.error("Error deleting reply:", error?.response?.data?.error || error.message);
    return { success: false, message: error?.response?.data?.error || "Failed to delete reply" };
  }
};

export const createDefaultBudget = async (designVersionId, user, useDoc) => {
  try {
    const response = await axios.post(
      `/api/design/budget/create-default-budget`,
      { designVersionId },
      {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      }
    );

    if (response.status === 200) {
      const newBudget = await response.json();
      console.log("Default Budget created successfully:", newBudget);
      return { success: true, message: "Budget for design version added successfully", newBudget };
    }
  } catch (error) {
    console.error("Error creating default budget:", error?.response?.data?.error || error.message);
    return {
      success: false,
      message: error?.response?.data?.error || "Error creating default budget",
    };
  }
};
