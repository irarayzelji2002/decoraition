import React, { useRef, useEffect, useState } from "react";
import Draggable from "react-draggable";
import { fetchPlanImage } from "../pages/ProjectSpace/backend/ProjectDetails";

const ImageFrame = ({ src, alt, pins = [], setPins, draggable = true, color, projectId }) => {
  const frameRef = useRef(null);
  const imageRef = useRef(null);
  const [planImage, setPlanImage] = useState("");

  useEffect(() => {
    fetchPlanImage(projectId, setPlanImage);

    const updateImageSize = () => {
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        setPins((prevPins) =>
          prevPins.map((pin) => {
            const position = getPinPosition(pin, rect);
            return { ...pin, position };
          })
        );
      }
    };

    updateImageSize();
    window.addEventListener("resize", updateImageSize);

    return () => {
      window.removeEventListener("resize", updateImageSize);
    };
  }, [imageRef, projectId, setPins]);

  const updatePinPosition = (id, x, y) => {
    const rect = imageRef.current.getBoundingClientRect();
    const relativeX = (x / rect.width) * 100;
    const relativeY = (y / rect.height) * 100;
    setPins(
      pins.map((pin) =>
        pin.id === id ? { ...pin, location: { x: relativeX, y: relativeY } } : pin
      )
    );
  };

  const getPinPosition = (pin, rect) => {
    return {
      x: (pin.location.x / 100) * rect.width,
      y: (pin.location.y / 100) * rect.height,
    };
  };

  return (
    <div className="image-frame-other" ref={frameRef} style={{ position: "relative" }}>
      <img
        src={planImage}
        alt={alt}
        className="image-preview-other"
        ref={imageRef}
        style={{ display: "block" }}
      />
      {pins.map((pin) => {
        const position = getPinPosition(pin, imageRef.current.getBoundingClientRect());
        return (
          <Draggable
            key={pin.id}
            bounds="parent"
            disabled={!draggable}
            position={{ x: position.x, y: position.y }}
            onStop={(e, data) => updatePinPosition(pin.id, data.x, data.y)}
          >
            <div className="pin" style={{ position: "absolute" }}>
              <MapPinIcon number={pin.order} fill={pin.color || color} />
            </div>
          </Draggable>
        );
      })}
    </div>
  );
};

export default ImageFrame;

function MapPinIcon({ number, fill }) {
  return (
    <svg width="60" height="60" viewBox="0 0 26 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.614 33.3744L12.6133 33.3739C12.3794 33.2062 9.33636 30.9862 6.35664 27.3999C3.37075 23.806 0.500098 18.9024 0.5 13.3576C0.503837 9.94443 1.82525 6.67486 4.17024 4.26542C6.51471 1.85652 9.69044 0.504016 13 0.5C16.3096 0.504015 19.4853 1.85652 21.8298 4.26542C24.1747 6.67479 25.4961 9.94425 25.5 13.3573C25.5 18.9022 22.6293 23.806 19.6434 27.3999C16.6636 30.9862 13.6206 33.2062 13.3867 33.3739L13.386 33.3744C13.2715 33.4568 13.1368 33.5 13 33.5C12.8632 33.5 12.7285 33.4568 12.614 33.3744ZM15.9093 8.90646C15.0494 8.31609 14.0369 8.00008 13 8.00008C11.6092 8.00008 10.2782 8.56789 9.299 9.57399C8.32025 10.5796 7.77273 11.9408 7.77273 13.3573C7.77273 14.4139 8.0776 15.4478 8.65025 16.3284C9.223 17.2091 10.0385 17.8976 10.9951 18.3048C11.952 18.712 13.0057 18.8188 14.0224 18.611C15.039 18.4032 15.9709 17.8908 16.701 17.1406C17.431 16.3905 17.9266 15.4365 18.1273 14.3999C18.328 13.3633 18.2251 12.2888 17.8312 11.3116C17.4372 10.3342 16.7691 9.49672 15.9093 8.90646Z"
        fill={fill || "#3E3C47"}
        stroke="#3E3C47"
      />
      <g filter="url(#filter0_dd_3632_8092)">
        <ellipse cx="13" cy="13.7098" rx="9" ry="9.32258" fill="white" />
        <text x="13" y="18" textAnchor="middle" fontSize="12" fill="black">
          {number}
        </text>
      </g>

      <defs>
        <filter
          id="filter0_dd_3632_8092"
          x="0"
          y="1.38721"
          width="26"
          height="26.6453"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology
            radius="1"
            operator="dilate"
            in="SourceAlpha"
            result="effect1_dropShadow_3632_8092"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1.5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3632_8092" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0" />
          <feBlend
            mode="normal"
            in2="effect1_dropShadow_3632_8092"
            result="effect2_dropShadow_3632_8092"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect2_dropShadow_3632_8092"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}
