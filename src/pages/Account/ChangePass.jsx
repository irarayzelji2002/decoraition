import ChangePass from "../../components/ChangePass";
import "../../css/forgotPass.css";

export default function ChangePassw({ ...beforeLoginSharedProps }) {
  return (
    <div className="bg-login">
      <div className="headtext">
        <h1>Forgot Password</h1>
      </div>
      <div className="modal-bg">
        <ChangePass />
      </div>
    </div>
  );
}
