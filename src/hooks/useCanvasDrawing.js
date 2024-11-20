import { useState, useCallback, useEffect, useMemo } from "react";

export const useCanvasDrawing = (canvasRef, color, opacity, brushMode) => {
  const [drawing, setDrawing] = useState(false);
  const [path, setPath] = useState(new Path2D());
  const [erasedRegions, setErasedRegions] = useState([]);
  const [erasedPath, setErasedPath] = useState(new Path2D());
  const [hasDrawnPath, setHasDrawnPath] = useState(false);
  const [needsRedraw, setNeedsRedraw] = useState(false);

  const setCustomCursor = useCallback(
    (brushSize) => {
      if (!canvasRef.current) return;

      // Create cursor div
      let cursor = document.querySelector(".brush-cursor");
      if (!cursor) {
        cursor = document.createElement("div");
        cursor.className = "brush-cursor";
        document.body.appendChild(cursor);
      }

      // Create SVG for brush cursor
      const zoomLevel = window.devicePixelRatio;
      const scaledBrushSize = brushSize * zoomLevel;
      const strokeWidth = 4;
      const shadowBlur = 5;
      const padding = Math.max(strokeWidth, shadowBlur * 2);
      const circleRadius = scaledBrushSize / 2 - strokeWidth / 2;
      const svgSize = scaledBrushSize + padding * 2;
      cursor.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">
        <defs>
          <filter id="dropshadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5"/>
            <feOffset dx="0" dy="0" result="offsetblur"/>
            <feFlood flood-color="rgba(0, 0, 0, 0.3)"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="${svgSize / 2}" cy="${svgSize / 2}" r="${circleRadius}" 
          fill="rgba(255,255,255,0.5)" 
          stroke="rgb(255,255,255)" 
          stroke-width="4" filter="url(#dropshadow)"/>
      </svg>`;

      // Add event listeners to canvas
      const updateCursor = (e) => {
        cursor.style.display = "block";
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        cursor.style.marginTop = `-${brushSize / 2 - 2}px`;
        cursor.style.marginLeft = `-${brushSize / 2 - 2}px`;
      };

      const handleMouseEnter = () => {
        cursor.style.display = "block";
        canvasRef.current.style.cursor = "none";
      };

      const handleMouseLeave = () => {
        cursor.style.display = "none";
        canvasRef.current.style.cursor = "auto";
      };

      canvasRef.current.addEventListener("mousemove", updateCursor);
      canvasRef.current.addEventListener("mouseenter", handleMouseEnter);
      canvasRef.current.addEventListener("mouseleave", handleMouseLeave);

      // Cleanup function
      return () => {
        if (canvasRef.current) {
          canvasRef.current.removeEventListener("mousemove", updateCursor);
          canvasRef.current.removeEventListener("mouseenter", handleMouseEnter);
          canvasRef.current.removeEventListener("mouseleave", handleMouseLeave);
        }
        if (cursor && document.body.contains(cursor)) {
          document.body.removeChild(cursor);
        }
      };
    },
    [canvasRef]
  );

  const getBrushArcPoints = useCallback((centerX, centerY, radius) => {
    const points = [];
    const numPoints = 10;
    for (let i = 0; i < numPoints; i++) {
      const angle = (2 * Math.PI * i) / numPoints;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push({ x, y });
    }
    return points;
  }, []);

  const rebuildErasedPath = useCallback(() => {
    const erasedPath = new Path2D();
    for (let i = 0; i < erasedRegions.length; i++) {
      erasedPath.addPath(erasedRegions[i]);
    }
    setErasedPath(erasedPath);
  }, [erasedRegions]);

  const draw = useCallback(
    (event, brushSize) => {
      console.log("Drawing with brush size:", brushSize);
      if (!canvasRef.current) return;
      console.log("Drawing on canvas");

      const context = canvasRef.current.getContext("2d");
      const rect = canvasRef.current.getBoundingClientRect();
      const zoomLevel = window.devicePixelRatio;
      const scaleX = (canvasRef.current.width / rect.width) * zoomLevel;
      const scaleY = (canvasRef.current.height / rect.height) * zoomLevel;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      const strokePath = new Path2D();
      strokePath.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
      const scaledBrushSize = brushSize * zoomLevel;

      if (brushMode) {
        let isErased = false;
        for (let i = 0; i < erasedRegions.length; i++) {
          const erasedRegion = erasedRegions[i];
          const checkPoints = getBrushArcPoints(x, y, scaledBrushSize / 2);
          for (const point of checkPoints) {
            if (context.isPointInPath(erasedRegion, point.x, point.y)) {
              isErased = true;
              setErasedRegions((prev) => {
                const newRegions = [...prev];
                newRegions.splice(i, 1);
                const newErasedPath = new Path2D();
                newRegions.forEach((region) => newErasedPath.addPath(region));
                setErasedPath(newErasedPath);
                return newRegions;
              });
              break;
            }
          }
          if (isErased) break;
        }
        if (isErased) rebuildErasedPath();
        path.addPath(strokePath);
        setHasDrawnPath(true);
        context.globalAlpha = 1;
        context.fillStyle = color;
        context.fill(strokePath);
      } else {
        if (hasDrawnPath) {
          // Direct canvas manipulation for smoother erasing
          setErasedRegions((prev) => [...prev, strokePath]);
          context.globalCompositeOperation = "destination-out";
          context.globalAlpha = 1;
          context.fill(strokePath);
          context.globalCompositeOperation = "source-over";
          rebuildErasedPath();
        }
      }
      setNeedsRedraw(true);
    },
    [
      canvasRef,
      brushMode,
      rebuildErasedPath,
      path,
      color,
      erasedRegions,
      getBrushArcPoints,
      hasDrawnPath,
    ]
  );

  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current || !needsRedraw) return;

    const context = canvasRef.current.getContext("2d");
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    context.globalAlpha = opacity;
    context.fillStyle = color;
    context.fill(path);
    context.globalCompositeOperation = "destination-out";
    context.globalAlpha = 1;
    context.fill(erasedPath);
    context.globalCompositeOperation = "source-over";

    setNeedsRedraw(false);
  }, [canvasRef, needsRedraw, opacity, color, path, erasedPath]);

  const clearCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const context = canvasRef.current.getContext("2d");
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Reset all related states
    setPath(new Path2D());
    setErasedPath(new Path2D());
    setErasedRegions([]);
    setHasDrawnPath(false);
    setNeedsRedraw(false);

    // Reset the context state
    context.globalAlpha = 1;
    context.fillStyle = color;
    context.globalCompositeOperation = "source-over";
  }, [canvasRef, opacity, color]);

  useEffect(() => {
    if (needsRedraw) {
      redrawCanvas();
    }
  }, [color, opacity, needsRedraw, redrawCanvas]);

  useEffect(() => {
    if (!drawing) {
      redrawCanvas();
    }
  }, [drawing]);

  const isCanvasEmpty = useCallback(() => {
    if (!canvasRef.current) return true;
    const context = canvasRef.current.getContext("2d");
    const imgData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
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
  }, [canvasRef]);

  const getBase64Mask = useCallback(() => {
    if (!canvasRef.current) return null;
    const ctx = canvasRef.current.getContext("2d");
    const imgData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    const bwCanvas = document.createElement("canvas");
    const bwCtx = bwCanvas.getContext("2d");

    bwCanvas.width = canvasRef.current.width;
    bwCanvas.height = canvasRef.current.height;
    const bwImageData = bwCtx.createImageData(imgData.width, imgData.height);

    for (let i = 0; i < imgData.data.length; i += 4) {
      const alpha = imgData.data[i + 3];
      bwImageData.data[i] = alpha > 0 ? 255 : 0; // R
      bwImageData.data[i + 1] = alpha > 0 ? 255 : 0; // G
      bwImageData.data[i + 2] = alpha > 0 ? 255 : 0; // B
      bwImageData.data[i + 3] = 255; // A
    }

    bwCtx.putImageData(bwImageData, 0, 0);
    return bwCanvas.toDataURL();
  }, [canvasRef]);

  const userMaskBase64BAW = useCallback(() => {
    return new Promise((resolve) => {
      // Ensure that the canvas is available
      if (!canvasRef.current) return resolve(null);

      // Create a new canvas to store black and white image data
      const bwCanvas = document.createElement("canvas");
      const bwContext = bwCanvas.getContext("2d");
      bwCanvas.width = canvasRef.current.width;
      bwCanvas.height = canvasRef.current.height;

      // Fill the entire canvas with black
      bwContext.fillStyle = "black";
      bwContext.fillRect(0, 0, bwCanvas.width, bwCanvas.height);

      // Get the drawn path from the current canvas context
      const ctx = canvasRef.current.getContext("2d");
      const imgData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
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

      // Convert the black-and-white canvas to a base64 string and resolve it
      const base64Image = bwCanvas.toDataURL();
      resolve(base64Image);
    });
  }, [canvasRef]);

  const redrawCanvasVisibility = useCallback(
    (visible) => {
      if (!canvasRef.current) return;
      const context = canvasRef.current.getContext("2d");
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      context.globalAlpha = visible ? opacity : 0;
      context.fillStyle = color;
      context.fill(path);
      context.globalCompositeOperation = "destination-out";
      context.globalAlpha = 1;
      context.fill(erasedPath);
      context.globalCompositeOperation = "source-over";
    },
    [canvasRef, color, opacity, path, erasedPath]
  );

  return {
    drawing,
    setDrawing,
    draw,
    clearCanvas,
    setCustomCursor,
    redrawCanvas,
    isCanvasEmpty,
    getBase64Mask,
    userMaskBase64BAW,
    redrawCanvasVisibility,
    setNeedsRedraw,
  };
};
