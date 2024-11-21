import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../../css/addItem.css";
import "../../css/budget.css";
import { useNavigate } from "react-router-dom";
import TopBar from "../../components/TopBar";
import ImageFrame from "../../components/ImageFrame";
import { fetchPins, updatePinLocation } from "./backend/ProjectDetails"; // Assuming this is the correct path

function PinLocation({ EditMode }) {
  const location = useLocation();
  const navigateTo = location.state?.navigateFrom || "/";
  const navigateFrom = location.pathname;
  const { projectId } = location.state || {};
  const navigate = useNavigate();

  const [pins, setPins] = useState([]);

  useEffect(() => {
    if (projectId) {
      fetchPins(projectId, setPins);
    }
  }, [projectId]);

  const savePinLocations = async () => {
    try {
      await Promise.all(pins.map((pin) => updatePinLocation(projectId, pin.id, pin.location)));
      console.log("Pin locations updated successfully");
    } catch (error) {
      console.error("Error updating pin locations:", error);
    }
    navigate(`/planMap/${projectId}`);
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
          />
          <button className="add-item-btn" onClick={savePinLocations}>
            Save Pin Locations
          </button>
        </div>
      </div>
    </>
  );
}

export default PinLocation;
