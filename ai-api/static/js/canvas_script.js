document.addEventListener("DOMContentLoaded", function () {
  // Buttons
  const previewMask = document.getElementById("preview_mask");
  const applyMask = document.getElementById("apply_mask");

  // Canvas Mode
  const canvasMode = document.getElementById("canvas_mode");
  const canvasModeDescription = document.getElementById("canvas_mode_desc");

  // SAM div
  const samCanvas = document.getElementById("sam_canvas");
  const isSAM = document.getElementById("is_sam");
  const selectedColorInputSAM = isSAM.querySelector("#selected_color");
  const opacityInputSAM = isSAM.querySelector("#selected_opacity");
  const getSAMMaskPath = document.getElementById("get_sam_mask_path");

  // Add to SAM elements
  const addToSAM = document.getElementById("add_to_sam");
  const addCanvas = document.getElementById("add_canvas");
  const addContext = addCanvas.getContext("2d");
  const brushSizeInputAdd = addToSAM.querySelector("#brush_size");
  const selectedColorInputAdd = addToSAM.querySelector("#selected_color");
  const opacityInputAdd = addToSAM.querySelector("#selected_opacity");
  const brushModeCheckboxAdd = addToSAM.querySelector("#selected_brush_mode");
  const brushModeDescriptionAdd = addToSAM.querySelector("#selected_brush_mode_desc");
  const getUserMaskAdd = document.getElementById("get_user_mask_add");

  // Remove from SAM elements (independent)
  const removeFromSAM = document.getElementById("remove_from_sam");
  const removeCanvas = document.getElementById("remove_canvas");
  const removeContext = removeCanvas.getContext("2d");
  const brushSizeInputRemove = removeFromSAM.querySelector("#brush_size");
  const selectedColorInputRemove = removeFromSAM.querySelector("#selected_color");
  const opacityInputRemove = removeFromSAM.querySelector("#selected_opacity");
  const brushModeCheckboxRemove = removeFromSAM.querySelector("#selected_brush_mode");
  const brushModeDescriptionRemove = removeFromSAM.querySelector("#selected_brush_mode_desc");
  const getUserMaskRemove = document.getElementById("get_user_mask_remove");

  // Separate state for add and remove operations
  let brushSizeAdd = brushSizeInputAdd.value;
  let selectedColorAdd = selectedColorInputAdd.value;
  let selectedOpacityAdd = opacityInputAdd.value;

  let brushSizeRemove = brushSizeInputRemove.value;
  let selectedColorRemove = selectedColorInputRemove.value;
  let selectedOpacityRemove = opacityInputRemove.value;

  let pathAdd = new Path2D(); // For add paths
  let pathRemove = new Path2D(); // For remove paths
  let erasedRegionsAdd = []; // Store erased regions for add
  let erasedRegionsRemove = []; // Store erased regions for remove
  let erasedPathAdd = new Path2D();
  let erasedPathRemove = new Path2D();

  let drawingAdd = false;
  let drawingRemove = false;
  let hasDrawnPathAdd = false;
  let hasDrawnPathRemove = false;
  let needsRedrawAdd = false; // To flag when redraw is necessary for add
  let needsRedrawRemove = false; // To flag when redraw is necessary for remove

  let originalImage = null;
  let samMaskImage = new Image();

  // Handle image upload
  const initImagePreview = document.getElementById("init_image_preview");
  const initImage = document.getElementById("init_image");
  const userMaskCanvas = document.getElementById("user_mask_canvas");
  initImage.addEventListener("change", function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result;
      img.onload = function () {
        let img_width = img.width;
        let img_height = img.height;
        userMaskCanvas.width = img_width;
        userMaskCanvas.height = img_height;
        addCanvas.width = img_width;
        addCanvas.height = img_height;
        removeCanvas.width = img_width;
        removeCanvas.height = img_height;
        initImagePreview.width = img_width;
        initImagePreview.height = img_height;
        initImagePreview.src = img.src;
        originalImage = img; // Store the original image
        // addContext.drawImage(originalImage, 0, 0); // Draw the image on the canvas
      };
    };

    reader.readAsDataURL(file);
  });

  // Handle SAM mask change (new logic to apply color and opacity)
  window.useSelectedMask = function () {
    if (window.selected_sam_mask) {
      const currSAMMaskPathInput = getSAMMaskPath.querySelector("#sam_mask_path");
      const { masks } = window.sam_image_paths;

      // Check if the input value is not empty
      if (currSAMMaskPathInput.value !== "") {
        // Check if the value does not match any mask in the masks array
        const isValueInMasks = masks.includes(currSAMMaskPathInput.value);

        // If the current value is not in masks, show confirmation dialog
        if (!isValueInMasks) {
          if (
            !window.confirm(
              "Are you sure you want to change the generated mask? It will reset your previous changes."
            )
          ) {
            return; // Exit if the user cancels
          }
        }
      }

      // Proceed to update the mask path input and display the selected mask
      currSAMMaskPathInput.value = window.selected_sam_mask["mask"];
      const maskSrc = window.selected_sam_mask["masked_image"];
      console.log("Selected Mask Source:", maskSrc);
      samMaskImage.src = maskSrc;
      samMaskImage.onload = function () {
        samCanvas.width = samMaskImage.width;
        samCanvas.height = samMaskImage.height;
        applySAMMaskStyling(); // Apply color and opacity styling
        samCanvas.innerHTML = `
                <img src="${maskSrc}" alt="Blended Image" width="512" height="512"/>
            `;
      };
    } else {
      console.log("No selected SAM mask found.");
    }
  };

  // Apply SAM mask styling
  function applySAMMaskStyling() {
    const samImage = samCanvas.querySelector("img");
    const selectedColor = selectedColorInputSAM.value;
    const selectedOpacity = opacityInputSAM.value;
    if (samImage) {
      samImage.style.filter = `drop-shadow(0px 1000px 0px rgba(${hexToRgb(
        selectedColor
      )}, ${selectedOpacity}))`;
    }
  }
  window.applySAMMaskStyling = function () {
    const samImage = samCanvas.querySelector("img");
    const selectedColor = selectedColorInputSAM.value;
    const selectedOpacity = opacityInputSAM.value;
    if (samImage) {
      samImage.style.filter = `drop-shadow(0px 1000px 0px rgba(${hexToRgb(
        selectedColor
      )}, ${selectedOpacity}))`;
    }
  };

  // Hex to RGB conversion function
  function hexToRgb(hex) {
    let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });
    let bigint = parseInt(hex.slice(1), 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return `${r},${g},${b}`;
  }

  // Opacity and Color Inputs for SAM Mask
  opacityInputSAM.addEventListener("input", applySAMMaskStyling);
  selectedColorInputSAM.addEventListener("input", applySAMMaskStyling);

  // Canvas Mode Toggle Logic
  canvasMode.addEventListener("change", function () {
    if (canvasMode.checked) {
      // Switch to "Add to SAM Mask" mode
      canvasModeDescription.textContent = "Add to SAM Mask";

      // Show both canvases and set appropriate z-index
      addToSAM.style.display = "block";
      addCanvas.style.zIndex = 2;
      removeFromSAM.style.display = "none";
      removeCanvas.style.zIndex = 1;

      // Make removeCanvas non-interactive
      removeCanvas.classList.add("inactive-canvas");
      addCanvas.classList.remove("inactive-canvas"); // Ensure addCanvas is interactive
    } else {
      // Switch to "Remove from SAM Mask" mode
      canvasModeDescription.textContent = "Remove from SAM Mask";

      // Show both canvases and set appropriate z-index
      removeFromSAM.style.display = "block";
      removeCanvas.style.zIndex = 2;
      addToSAM.style.display = "none";
      addCanvas.style.zIndex = 1;

      // Make addCanvas non-interactive
      addCanvas.classList.add("inactive-canvas");
      removeCanvas.classList.remove("inactive-canvas"); // Ensure removeCanvas is interactive
    }
  });

  // Opacity and Color Inputs for SAM Mask
  opacityInputSAM.addEventListener("input", applySAMMaskStyling);
  selectedColorInputSAM.addEventListener("input", applySAMMaskStyling);

  // Function to set custom cursor
  function setCustomCursor(brushSize, canvas) {
    const sizeOffset = Math.max(0, -1.1 * brushSize + 83);
    const svgWidth = brushSize + sizeOffset;

    // Dynamically create the SVG with consistent stroke width and drop shadow
    const svgCursor = `
		<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgWidth}" viewBox="-10 -10 84 84">
			<defs>
				<filter id="dropshadow" x="-30%" y="-30%" width="160%" height="160%">
					<feGaussianBlur in="SourceAlpha" stdDeviation="5"/> <!-- Increase the blur -->
					<feOffset dx="0" dy="0" result="offsetblur"/> <!-- Shadow offset set to 0 -->
					<feFlood flood-color="rgba(0, 0, 0, 0.3)"/> <!-- Set shadow color and opacity -->
					<feComposite in2="offsetblur" operator="in"/> <!-- Composite the shadow -->
					<feMerge>
						<feMergeNode/> <!-- Shadow -->
						<feMergeNode in="SourceGraphic"/> <!-- Original graphic -->
					</feMerge>
				</filter>
			</defs>
			<circle cx="32" cy="32" r="${brushSize / 2}" 
				fill="rgba(255,255,255,0.5)" 
				stroke="rgb(255,255,255)" 
				stroke-width="4" filter="url(#dropshadow)"/>
		</svg>`;

    // Convert the SVG to a base64 URL, ensuring proper encoding
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgCursor)))}`;

    // Set the canvas cursor to the dynamically generated SVG
    canvas.style.cursor = `url('${svgDataUrl}') ${svgWidth / 2} ${svgWidth / 2}, auto`;
  }

  // Initialize the cursors on page load
  setCustomCursor(30, addCanvas);
  setCustomCursor(30, removeCanvas);

  // addCanvas brush Size inout change
  brushSizeInputAdd.addEventListener("input", function (e) {
    brushSizeAdd = parseInt(brushSizeInputAdd.value);
    setCustomCursor(brushSizeAdd, addCanvas);
  });

  // removeCanvas brush Size inout change
  brushSizeInputRemove.addEventListener("input", function (e) {
    brushSizeRemove = parseInt(brushSizeInputRemove.value);
    setCustomCursor(brushSizeRemove, removeCanvas);
  });

  // Debounce utility function to reduce redraw frequency
  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Function to trigger a redraw for Add canvas
  function requestRedrawAdd() {
    requestAnimationFrame(() => {
      redrawCanvasAdd();
    });
  }

  // Function to trigger a redraw for Remove canvas
  function requestRedrawRemove() {
    requestAnimationFrame(() => {
      redrawCanvasRemove();
    });
  }

  selectedColorInputAdd.addEventListener(
    "input",
    debounce(function () {
      selectedColorAdd = selectedColorInputAdd.value;
      requestRedrawAdd();
    }, 100)
  );

  selectedColorInputRemove.addEventListener(
    "input",
    debounce(function () {
      selectedColorRemove = selectedColorInputRemove.value;
      requestRedrawRemove();
    }, 100)
  );

  opacityInputAdd.addEventListener(
    "input",
    debounce(function () {
      selectedOpacityAdd = opacityInputAdd.value;
      requestRedrawAdd();
    }, 100)
  );

  opacityInputRemove.addEventListener(
    "input",
    debounce(function () {
      selectedOpacityRemove = opacityInputRemove.value;
      requestRedrawRemove();
    }, 100)
  );

  brushModeCheckboxAdd.addEventListener("change", function () {
    brushModeDescriptionAdd.textContent = brushModeCheckboxAdd.checked ? "Draw" : "Erase";
  });

  brushModeCheckboxRemove.addEventListener("change", function () {
    brushModeDescriptionRemove.textContent = brushModeCheckboxRemove.checked ? "Draw" : "Erase";
  });

  // Canvas Mode Toggle Logic
  canvasMode.addEventListener("change", function () {
    if (canvasMode.checked) {
      canvasModeDescription.textContent = "Add to SAM Mask";
      addToSAM.classList.remove("display_none");
      addToSAM.classList.add("display_block");
      removeFromSAM.classList.remove("display_block");
      removeFromSAM.classList.add("display_none");
    } else {
      canvasModeDescription.textContent = "Remove from SAM Mask";
      removeFromSAM.classList.remove("display_none");
      removeFromSAM.classList.add("display_block");
      addToSAM.classList.remove("display_block");
      addToSAM.classList.add("display_none");
    }
  });

  // Add mode logic
  addCanvas.addEventListener("mousedown", function (event) {
    drawingAdd = true;
    drawAdd(event);
  });

  addCanvas.addEventListener("mousemove", function (event) {
    if (drawingAdd) {
      drawAdd(event);
    }
  });

  addCanvas.addEventListener("mouseup", function () {
    drawingAdd = false;
    if (needsRedrawAdd) {
      redrawCanvasAdd();
      needsRedrawAdd = false; // Reset after redraw
    }
  });

  addCanvas.addEventListener("mouseout", function () {
    drawingAdd = false;
    if (needsRedrawAdd) {
      redrawCanvasAdd();
      needsRedrawAdd = false; // Reset after redraw
    }
  });

  // Remove mode logic
  removeCanvas.addEventListener("mousedown", function (event) {
    drawingRemove = true;
    drawRemove(event);
  });

  removeCanvas.addEventListener("mousemove", function (event) {
    if (drawingRemove) {
      drawRemove(event);
    }
  });

  removeCanvas.addEventListener("mouseup", function () {
    drawingRemove = false;
    if (needsRedrawRemove) {
      redrawCanvasRemove();
      needsRedrawRemove = false; // Reset after redraw
    }
  });

  removeCanvas.addEventListener("mouseout", function () {
    drawingRemove = false;
    if (needsRedrawRemove) {
      redrawCanvasRemove();
      needsRedrawRemove = false; // Reset after redraw
    }
  });

  // Drawing logic for Add
  function drawAdd(event) {
    const rect = addCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const strokePath = new Path2D();
    strokePath.arc(x, y, brushSizeInputAdd.value / 2, 0, 2 * Math.PI);

    if (brushModeCheckboxAdd.checked) {
      let isErased = false;
      for (let i = 0; i < erasedRegionsAdd.length; i++) {
        const erasedRegion = erasedRegionsAdd[i];
        const checkPoints = getBrushArcPoints(x, y, brushSizeInputAdd.value / 2);
        for (const point of checkPoints) {
          if (addContext.isPointInPath(erasedRegion, point.x, point.y)) {
            isErased = true;
            erasedRegionsAdd.splice(i, 1);
            break;
          }
        }
        if (isErased) break;
      }
      if (isErased) rebuildErasedPathAdd();
      pathAdd.addPath(strokePath);
      hasDrawnPathAdd = true;
      addContext.globalAlpha = 1;
      addContext.fillStyle = selectedColorInputAdd.value;
      addContext.fill(strokePath);
    } else {
      if (hasDrawnPathAdd) {
        erasedRegionsAdd.push(strokePath);
        addContext.globalCompositeOperation = "destination-out";
        addContext.globalAlpha = 1;
        addContext.fill(strokePath);
        addContext.globalCompositeOperation = "source-over";
        rebuildErasedPathAdd();
      }
    }
    needsRedrawAdd = true;
  }

  // Drawing logic for Remove
  function drawRemove(event) {
    const rect = removeCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const strokePath = new Path2D();
    strokePath.arc(x, y, brushSizeInputRemove.value / 2, 0, 2 * Math.PI);

    if (brushModeCheckboxRemove.checked) {
      let isErased = false;
      for (let i = 0; i < erasedRegionsRemove.length; i++) {
        const erasedRegion = erasedRegionsRemove[i];
        const checkPoints = getBrushArcPoints(x, y, brushSizeInputRemove.value / 2);
        for (const point of checkPoints) {
          if (removeContext.isPointInPath(erasedRegion, point.x, point.y)) {
            isErased = true;
            erasedRegionsRemove.splice(i, 1);
            break;
          }
        }
        if (isErased) break;
      }
      if (isErased) rebuildErasedPathRemove();
      pathRemove.addPath(strokePath);
      hasDrawnPathRemove = true;
      removeContext.globalAlpha = 1;
      removeContext.fillStyle = selectedColorInputRemove.value;
      removeContext.fill(strokePath);
    } else {
      if (hasDrawnPathRemove) {
        erasedRegionsRemove.push(strokePath);
        removeContext.globalCompositeOperation = "destination-out";
        removeContext.globalAlpha = 1;
        removeContext.fill(strokePath);
        removeContext.globalCompositeOperation = "source-over";
        rebuildErasedPathRemove();
      }
    }
    needsRedrawRemove = true;
  }

  // Helper function
  function getBrushArcPoints(centerX, centerY, radius) {
    const points = [];
    const numPoints = 10;
    for (let i = 0; i < numPoints; i++) {
      const angle = (2 * Math.PI * i) / numPoints;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push({ x, y });
    }
    return points;
  }

  // Rebuild erased paths for Add
  function rebuildErasedPathAdd() {
    erasedPathAdd = new Path2D();
    for (let i = 0; i < erasedRegionsAdd.length; i++) {
      erasedPathAdd.addPath(erasedRegionsAdd[i]);
    }
  }

  // Rebuild erased paths for Remove
  function rebuildErasedPathRemove() {
    erasedPathRemove = new Path2D();
    for (let i = 0; i < erasedRegionsRemove.length; i++) {
      erasedPathRemove.addPath(erasedRegionsRemove[i]);
    }
  }

  // Redraw Canvas for Add
  function redrawCanvasAdd() {
    addContext.clearRect(0, 0, addCanvas.width, addCanvas.height);
    addContext.globalAlpha = opacityInputAdd.value;
    addContext.fillStyle = selectedColorInputAdd.value;
    addContext.fill(pathAdd);
    addContext.globalCompositeOperation = "destination-out";
    addContext.globalAlpha = 1;
    addContext.fill(erasedPathAdd);
    addContext.globalCompositeOperation = "source-over";
  }

  // Redraw Canvas for Remove
  function redrawCanvasRemove() {
    removeContext.clearRect(0, 0, removeCanvas.width, removeCanvas.height);
    removeContext.globalAlpha = opacityInputRemove.value;
    removeContext.fillStyle = selectedColorInputRemove.value;
    removeContext.fill(pathRemove);
    removeContext.globalCompositeOperation = "destination-out";
    removeContext.globalAlpha = 1;
    removeContext.fill(erasedPathRemove);
    removeContext.globalCompositeOperation = "source-over";
  }

  // Clear canvas for Add
  addToSAM.querySelector("#clear_canvas").addEventListener("click", function () {
    addContext.clearRect(0, 0, addCanvas.width, addCanvas.height);
    pathAdd = new Path2D(); // Clear the path
    erasedPathAdd = new Path2D(); // Clear the erased path
    erasedRegionsAdd = []; // Clear erased regions
    hasDrawnPathAdd = false;
    // if (originalImage) {
    // 	addContext.drawImage(originalImage, 0, 0); // Redraw the original image
    // }
  });

  // Clear canvas for Remove
  removeFromSAM.querySelector("#clear_canvas").addEventListener("click", function () {
    removeContext.clearRect(0, 0, removeCanvas.width, removeCanvas.height);
    pathRemove = new Path2D();
    erasedPathRemove = new Path2D();
    erasedRegionsRemove = [];
    hasDrawnPathRemove = false;
  });

  window.clearAddRemoveCanvas = function () {
    addContext.clearRect(0, 0, addCanvas.width, addCanvas.height);
    pathAdd = new Path2D(); // Clear the path
    erasedPathAdd = new Path2D(); // Clear the erased path
    erasedRegionsAdd = []; // Clear erased regions
    hasDrawnPathAdd = false;
    removeContext.clearRect(0, 0, removeCanvas.width, removeCanvas.height);
    pathRemove = new Path2D();
    erasedPathRemove = new Path2D();
    erasedRegionsRemove = [];
    hasDrawnPathRemove = false;
  };

  window.isCanvasEmpty = function (canvas) {
    const context = canvas.getContext("2d");
    const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;

    // Loop through pixels (rgba channels)
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const alpha = pixels[i + 3];

      // If any pixel is not fully black or transparent, the canvas is not empty
      if (r !== 0 || g !== 0 || b !== 0 || alpha !== 0) {
        return false; // Canvas is not empty
      }
    }
    return true; // Canvas is empty (no strokes/masks)
  };

  // Visibility for Add
  function redrawCanvasVisibilityAdd(opacity) {
    // Clear the canvas
    addContext.clearRect(0, 0, addCanvas.width, addCanvas.height);

    // Set opacity for the drawn path
    addContext.globalAlpha = opacity;
    addContext.fillStyle = selectedColorAdd;
    addContext.fill(pathAdd); // Redraw the combined path

    // Erase the areas in the erasedPath
    addContext.globalCompositeOperation = "destination-out";
    addContext.globalAlpha = 1;
    addContext.fill(erasedPathAdd); // Apply erasing
    addContext.globalCompositeOperation = "source-over"; // Reset to default
  }

  const maskVisibilityCheckboxAdd = addToSAM.querySelector("#mask_visibility");

  maskVisibilityCheckboxAdd.addEventListener("change", function () {
    if (maskVisibilityCheckboxAdd.checked) {
      redrawCanvasVisibilityAdd(selectedOpacityAdd);
    } else {
      redrawCanvasVisibilityAdd(0);
    }
  });

  // Visibility for Remove
  function redrawCanvasVisibilityRemove(opacity) {
    // Clear the canvas
    removeContext.clearRect(0, 0, removeCanvas.width, removeCanvas.height);

    // Set opacity for the drawn path
    removeContext.globalAlpha = opacity;
    removeContext.fillStyle = selectedColorRemove;
    removeContext.fill(pathRemove); // Redraw the combined path

    // Erase the areas in the erasedPath
    removeContext.globalCompositeOperation = "destination-out";
    removeContext.globalAlpha = 1;
    removeContext.fill(erasedPathRemove); // Apply erasing
    removeContext.globalCompositeOperation = "source-over"; // Reset to default
  }

  const maskVisibilityCheckboxRemove = removeFromSAM.querySelector("#mask_visibility");

  maskVisibilityCheckboxRemove.addEventListener("change", function () {
    if (maskVisibilityCheckboxRemove.checked) {
      redrawCanvasVisibilityRemove(selectedOpacityRemove);
    } else {
      redrawCanvasVisibilityRemove(0);
    }
  });

  // Convert to base64 black-and-white image (not changed)
  getUserMaskAdd.addEventListener("click", function () {
    userMaskBase64BAW(addCanvas, addContext, getUserMaskAdd, "user_mask_add_base64_output");
  });

  getUserMaskRemove.addEventListener("click", function () {
    userMaskBase64BAW(
      removeCanvas,
      removeContext,
      getUserMaskRemove,
      "user_mask_remove_base64_output"
    );
  });

  window.getUserMasks = async function () {
    await userMaskBase64BAW(addCanvas, addContext, getUserMaskAdd, "user_mask_add_base64_output");
    await userMaskBase64BAW(
      removeCanvas,
      removeContext,
      getUserMaskRemove,
      "user_mask_remove_base64_output"
    );
  };

  function getCanvasBase64(getUserMask, id) {
    // Ensure that the original image is loaded before proceeding
    if (!originalImage) {
      return;
    }

    // Convert the current canvas content to a base64-encoded string
    const base64Image = addCanvas.toDataURL("image/png");
    getUserMask.querySelector("#" + id).value = base64Image;
    return base64Image;
  }

  function userMaskBase64BAW(canvas, context, getUserMask, id) {
    return new Promise((resolve) => {
      // Ensure that the original image is loaded before proceeding
      if (!originalImage) {
        return;
      }

      // Create a new canvas to store black and white image data
      const bwCanvas = document.createElement("canvas");
      const bwContext = bwCanvas.getContext("2d");
      bwCanvas.width = canvas.width;
      bwCanvas.height = canvas.height;

      // Fill the entire canvas with black
      bwContext.fillStyle = "black";
      bwContext.fillRect(0, 0, bwCanvas.width, bwCanvas.height);

      // Get the drawn path from the current canvas context
      const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
      const bwImageData = bwContext.createImageData(imgData.width, imgData.height);

      for (let i = 0; i < imgData.data.length; i += 4) {
        const r = imgData.data[i];
        const g = imgData.data[i + 1];
        const b = imgData.data[i + 2];
        const alpha = imgData.data[i + 3];

        // Check if this pixel is part of a drawn path (non-black and fully opaque)
        const isDrawnPath = alpha > 0 && (r !== 0 || g !== 0 || b !== 0);
        const isErasedPath = alpha === 0; // Alpha 0 represents an erased area

        if (isDrawnPath) {
          // For drawn paths, set the color to white
          bwImageData.data[i] = 255;
          bwImageData.data[i + 1] = 255;
          bwImageData.data[i + 2] = 255;
          bwImageData.data[i + 3] = 255; // Fully opaque
        } else if (isErasedPath) {
          // Erased path - remains black (0), already black so no change needed
          bwImageData.data[i] = 0;
          bwImageData.data[i + 1] = 0;
          bwImageData.data[i + 2] = 0;
          bwImageData.data[i + 3] = 255; // Fully opaque
        } else {
          // Unaffected background - keep it black
          bwImageData.data[i] = 0;
          bwImageData.data[i + 1] = 0;
          bwImageData.data[i + 2] = 0;
          bwImageData.data[i + 3] = 255; // Fully opaque
        }
      }

      // Put the adjusted black and white image data back on the canvas
      bwContext.putImageData(bwImageData, 0, 0);

      // Convert the black-and-white canvas to a base64 string
      const base64Image = bwCanvas.toDataURL();
      getUserMask.querySelector("#" + id).value = base64Image;

      resolve();
    });
  }
});
