import "../../css/planMap.css";
import EditPen from "../DesignSpace/svg/EditPen";
import ExportIcon from "./svg/ExportIcon";
import Trash from "../DesignSpace/svg/Trash";

function MapPin() {
  return (
    <div className="pinHolder">
      <div className="pinColor"></div>
      <div className="mapPin">
        <div
          style={{
            width: "50%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <img src="../../img/logoWhitebg.png" alt={`design preview `} className="image-pin" />
          <span className="pinName">Living Room</span>
        </div>
        <div style={{ display: "flex", width: "50%", justifyContent: "flex-end" }}>
          <ExportIcon />
          <EditPen />
          <Trash />
        </div>
      </div>
    </div>
  );
}

export default MapPin;
