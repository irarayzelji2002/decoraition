import Signup from "../../components/Signup";
import "../../css/registerModal.css";

export default function Register({ ...beforeLoginSharedProps }) {
  return (
    <div className="bg-login">
      <div className="headtext">
        <h1>Register Now!</h1>
      </div>
      <div className="modal-bg">
        <Signup />
      </div>
    </div>
  );
}
