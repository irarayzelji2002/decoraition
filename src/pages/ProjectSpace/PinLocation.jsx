import React, { useState } from "react";
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
          <button className="add-item-btn">Save Pin Locations</button>
        </div>{" "}
      </div>
    </>
  );
}

export default PinLocation;
