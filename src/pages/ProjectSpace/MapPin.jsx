import "../../css/planMap.css";
import EditPen from "../DesignSpace/svg/EditPen";
import ExportIcon, { Draggable } from "./svg/ExportIcon";
import Trash from "../DesignSpace/svg/Trash";
import { IconButton, Modal, Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState } from "react";
import { ChromePicker } from "react-color";

const MapPin = ({ title = "Untitled", editMode = false, pinNo }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [value, setValue] = useState("#ffffff");
  const handleChange = (color) => {
    setValue(color.hex);
  };
  const handleOpenModal = () => {
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
  };
  return (
    <div className="pinHolder" style={{ width: "100%" }}>
      <div className="pinColor" onClick={handleOpenModal}>
        {pinNo}
      </div>
      {editMode && (
        <Modal open={modalOpen} onClose={handleCloseModal}>
          <div className="modalColor" style={{ width: "50%" }}>
            <ChromePicker
              disableAlpha
              color={value}
              onChange={handleChange}
              styles={{
                default: {
                  picker: {
                    background: "transparent",
                    borderRadius: "10px",
                    boxShadow: "0 0 10px rgba(0, 0, 0, 0)",
                    marginTop: "20px",
                    width: "auto",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: "500",
                  },
                  saturation: {
                    borderRadius: "10px",
                  },
                  hue: {
                    borderRadius: "10px",
                  },
                  input: {
                    backgroundImage: "var(--gradientButton)",
                  },
                  swatch: {
                    borderRadius: "10px",
                  },
                  active: {
                    borderRadius: "10px",
                  },
                },
              }}
            />
            <div className="rightBeside">
              <Button
                fullWidth
                variant="contained"
                sx={{
                  background: "var(--gradientButton)",
                  borderRadius: "20px",
                  color: "var(--color-white)",
                  fontWeight: "bold",
                  textTransform: "none",
                  "&:hover": {
                    background: "var(--gradientButtonHover)", // Reverse gradient on hover
                  },
                }}
              >
                Save Color
              </Button>
              <IconButton aria-label="delete">
                <DeleteIcon
                  style={{
                    color: "var(--color-white)",
                  }}
                />
              </IconButton>
            </div>
          </div>
        </Modal>
      )}
      <div className="mapPin" style={{ width: "100%" }}>
        <div
          style={{
            width: "50%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <img src="../../img/logoWhitebg.png" alt={`design preview `} className="image-pin" />
          <span className="pinName">{title}</span>
        </div>
        <div style={{ display: "flex", width: "50%", justifyContent: "flex-end" }}>
          {!editMode ? (
            <>
              <ExportIcon />
              <EditPen />
              <Trash />
            </>
          ) : (
            <>
              <div className="draggable">
                <Draggable />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPin;
