import React from "react";
import { styled } from "@mui/material/styles";

const ModalContent = styled("div")(({ theme }) => ({
  backgroundColor: "#25232A",
  borderRadius: "20px",
  width: "100%",
  maxWidth: "100%",
  padding: theme.spacing(2),
  color: "white",
}));

const Modal = ({ onClose, content }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <ModalContent className="modal-content" onClick={(e) => e.stopPropagation()}>
        {content}
      </ModalContent>
    </div>
  );
};

export default Modal;
