import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { showToast } from "../../functions/utils";
import LoadingPage from "../../components/LoadingPage";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isSubscribed = true;
    let deleteAttempted = false;

    const verifyEmail = async () => {
      try {
        const response = await axios.get(`/api/confirm-email-verification/${token}`);
        if (response.status === 200 && isSubscribed) {
          showToast("success", "Email verified successfully! You can now login.");
          setTimeout(() => navigate("/login"), 2000);
        }
      } catch (error) {
        console.error("Verification error:", error);
        setError(error.response?.data?.message || "Verification failed");
        // If token expired, attempt to delete the unverified account
        if (error.response?.data?.expired && !deleteAttempted) {
          deleteAttempted = true;
          try {
            const result = await axios.delete(`/api/delete-unverified-user/${token}`);
            if (result.status === 200 && isSubscribed) {
              console.log("Unverified user deleted successfully");
              showToast("error", "Verification link expired. Please register again.");
              setTimeout(() => navigate("/register"), 2000);
            }
          } catch (deleteError) {
            console.error(
              "Error deleting unverified user:",
              deleteError.response?.data?.message || deleteError
            );
          }
        }
      } finally {
        if (isSubscribed) setVerifying(false);
      }
    };

    verifyEmail();

    // Cleanup function
    return () => (isSubscribed = false);
  }, [token, navigate]);

  return (
    <LoadingPage
      message={
        verifying
          ? "Verifying your email"
          : error
          ? error
          : "Email verified successfully! Redirecting to login"
      }
    />
  );
};

export default VerifyEmail;
