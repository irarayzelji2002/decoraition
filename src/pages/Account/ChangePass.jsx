import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import ChangePass from "../../components/ChangePass";
import "../../css/forgotPass.css";
import { showToast } from "../../functions/utils";

export default function ChangePassw() {
  const location = useLocation();
  const { email, token } = location.state || {};
  // if (!email || !token) {
  //   showToast("error", "Session invalid");
  //   return <Navigate to="/forgot" replace />;
  // }

  return (
    <div className="bg-login">
      <div className="headtext">
        <h1 className="h1-forgotpw">Forgot Password</h1>
      </div>
      <div className="modal-bg">
        <ChangePass email={email} token={token} />
      </div>
    </div>
  );
}
