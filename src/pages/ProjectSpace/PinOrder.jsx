import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import update from "immutability-helper";
import TopBar from "../../components/TopBar";
import MapPin from "./MapPin";
import { fetchPins, savePinOrder } from "./backend/ProjectDetails";
import { useParams } from "react-router-dom";

const ItemType = {
  PIN: "pin",
};

function DraggablePin({ id, index, movePin, title, editMode, pinNo, color }) {
  const ref = useRef(null);
  const [, drop] = useDrop({
    accept: ItemType.PIN,
    hover(item) {
      if (item.index !== index) {
        movePin(item.index, index);
        item.index = index;
      }
    },
  });

  const [, drag] = useDrag({
    type: ItemType.PIN,
    item: { id, index },
  });

  drag(drop(ref));

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <MapPin title={title} editMode={editMode} pinNo={pinNo} pinColor={color} />
    </div>
  );
}

function PinOrder() {
  const location = useLocation();
  const navigateTo = location.state?.navigateFrom || "/";
  const navigateFrom = location.pathname;
  const { projectId } = useParams();
  const [pins, setPins] = useState([]);

  useEffect(() => {
    if (projectId) {
      fetchPins(projectId, (fetchedPins) => {
        const sortedPins = fetchedPins.sort((a, b) => a.order - b.order);
        setPins(sortedPins);
      });
    }
  }, [projectId]);

  const movePin = (fromIndex, toIndex) => {
    const movedPin = pins[fromIndex];
    const updatedPins = update(pins, {
      $splice: [
        [fromIndex, 1],
        [toIndex, 0, movedPin],
      ],
    }).map((pin, index) => ({
      ...pin,
      order: index + 1,
    }));
    setPins(updatedPins);
  };

  const handleSave = () => {
    savePinOrder(projectId, pins);
  };

  const isMobile = window.innerWidth <= 768;

  return (
    <DndProvider
      backend={isMobile ? TouchBackend : HTML5Backend}
      options={isMobile ? { enableMouseEvents: true } : undefined}
    >
      <TopBar state={"Change pins order"} navigateTo={navigateTo} navigateFrom={navigateFrom} />
      <div style={{ width: "95%" }}>
        <div className="pinSpace">
          {pins.map((pin, index) => (
            <DraggablePin
              key={pin.id}
              id={pin.id}
              index={index}
              movePin={movePin}
              title={pin.designName}
              editMode={true}
              pinNo={pin.order}
              color={pin.color}
            />
          ))}
          <button className="add-item-btn" onClick={handleSave}>
            Save pins order and color
          </button>
          {/* onClick={handleSave}  */}
        </div>
      </div>
    </DndProvider>
  );
}

export default PinOrder;
