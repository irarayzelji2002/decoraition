import ForgotPass1 from "./ForgotPass";
import "../../css/forgotPass.css";

export default function ForgotPass({ ...beforeLoginSharedProps }) {
  return (
    <div className="bg-login">
      <div className="headtext">
        <h1>Forgot Password</h1>
      </div>
      <div className="modal-bg">
        <ForgotPass1 />
      </div>
    </div>
  );
}
