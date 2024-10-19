import ForgotPass1 from "./ForgotPass";
import "../../css/forgotPass.css";

export default function ForgotPass() {
  return (
    <div className="bg-login">
      <div className="headtext">
        <h1 className="h1-forgotpw">Forgot Password</h1>
      </div>
      <div className="modal-bg">
        <ForgotPass1 />
      </div>
    </div>
  );
}
