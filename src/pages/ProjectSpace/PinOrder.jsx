import TopBar from "../../components/TopBar";
import MapPin from "./MapPin";

function PinOrder() {
  return (
    <div>
      <TopBar state={"Change pins order"} />
      <div className="pinSpace">
        <MapPin title="Pin 1" editMode={true} pinNo={1} />
        <MapPin title="Pin 2" editMode={true} pinNo={2} />
        <MapPin title="Pin 3" editMode={true} pinNo={3} />
      </div>
    </div>
  );
}

export default PinOrder;
