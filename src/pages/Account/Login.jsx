import LoginModal from "./LoginModal.jsx";
import "../../css/loginModal.css";

export default function Login({ ...beforeLoginSharedProps }) {
  return (
    <div className="bg-login">
      <div className="headtext">
        <h1>Welcome Back!</h1>
      </div>
      <div className="modal-bg">
        <LoginModal />
      </div>
    </div>
  );
}
