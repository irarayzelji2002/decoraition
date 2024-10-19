import Signup from "../../components/Signup";
import "../../css/registerModal.css";

export default function Register() {
  return (
    <div className="bg-login">
      <div className="headtext">
        <h1 className="h1-register">Register Now!</h1>
      </div>
      <div className="modal-bg">
        <Signup />
      </div>
    </div>
  );
}
