import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../../css/addItem.css";
import "../../css/budget.css";
import TopBar from "../../components/TopBar";
import ImageFrame from "../../components/ImageFrame";

function PinLocation({ EditMode }) {
  const location = useLocation();
  const navigateTo = location.state?.navigateFrom || "/";
  const navigateFrom = location.pathname;

  const [pins, setPins] = useState([]);

  const addPin = () => {
    setPins([...pins, { id: Date.now(), x: 0, y: 0 }]);
  };

  return (
    <>
      <TopBar state={"Add Pin"} navigateTo={navigateTo} navigateFrom={navigateFrom} />
      <div className="sectionBudget" style={{ background: "none" }}>
        <div className="budgetSpaceImg">
          <ImageFrame
            src="../../img/floorplan.png"
            alt="design preview"
            pins={pins}
            setPins={setPins}
          />{" "}
          <button
            className="add-item-btn"
            style={{ width: "100%", margin: "8px" }}
            onClick={addPin}
          >
            Add Pin
          </button>
        </div>{" "}
      </div>
    </>
  );
}

export default PinLocation;
