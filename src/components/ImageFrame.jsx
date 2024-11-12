import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { MapPinIcon } from "../pages/ProjectSpace/svg/ExportIcon";

const ImageFrame = ({ src, alt, pins = [], setPins }) => {
  const frameRef = useRef(null);
  const imageRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateImageSize = () => {
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        setImageSize({ width: rect.width, height: rect.height });
      }
    };

    updateImageSize();
    window.addEventListener("resize", updateImageSize);

    return () => {
      window.removeEventListener("resize", updateImageSize);
    };
  }, [imageRef]);

  const updatePinPosition = (id, x, y) => {
    const rect = imageRef.current.getBoundingClientRect();
    const relativeX = (x / rect.width) * 100;
    const relativeY = (y / rect.height) * 100;
    setPins(pins.map((pin) => (pin.id === id ? { ...pin, x: relativeX, y: relativeY } : pin)));
  };

  const getPinPosition = (pin) => {
    const rect = imageRef.current.getBoundingClientRect();
    return {
      x: (pin.x / 100) * rect.width,
      y: (pin.y / 100) * rect.height,
    };
  };

  return (
    <div className="image-frame-other" ref={frameRef}>
      <img src={src} alt={alt} className="image-preview-other" ref={imageRef} />
      {pins.map((pin) => {
        const position = getPinPosition(pin);
        return (
          <Draggable
            key={pin.id}
            bounds="parent"
            position={{ x: position.x, y: position.y }}
            onStop={(e, data) => updatePinPosition(pin.id, data.x, data.y)}
          >
            <div className="pin">
              <MapPinIcon />
            </div>
          </Draggable>
        );
      })}
    </div>
  );
};

export default ImageFrame;
