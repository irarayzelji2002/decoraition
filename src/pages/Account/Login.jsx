import LoginModal from "./LoginModal.jsx";
import "../../css/loginModal.css";

export default function Login() {
  return (
    <div className="bg-login">
      <div className="headtext">
        <h1 className="h1-welcome">Welcome Back!</h1>
      </div>
      <div className="modal-bg">
        <LoginModal />
      </div>
    </div>
  );
}
