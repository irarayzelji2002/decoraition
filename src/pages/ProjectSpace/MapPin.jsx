import "../../css/planMap.css";
import EditPen from "../DesignSpace/svg/EditPen";
import ExportIcon, { Draggable } from "./svg/ExportIcon";
import Trash from "../DesignSpace/svg/Trash";
import { IconButton, Modal, Button, Icon } from "@mui/material";
import { DeleteIcon, EditIconSmallGradient } from "../../components/svg/DefaultMenuIcons";
import { useState, useEffect } from "react";
import { ChromePicker } from "react-color";
import SimpleDeleteConfirmation from "../../components/SimpleDeleteConfirmation";
import { useNavigate } from "react-router-dom";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { iconButtonStyles } from "../Homepage/DrawerComponent";

const MapPin = ({
  title = "Untitled",
  editMode = false,
  pinNo,
  pinColor,
  pinId,
  deletePin,
  designId,
  editPin,
  manager,
  contributor,
}) => {
  // Convert to booleans
  const isContributor = Boolean(contributor);
  const isManager = Boolean(manager);

  const [modalOpen, setModalOpen] = useState(false);
  const [value, setValue] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const history = useNavigate();
  const [isDeleteBtnDisabled, setIsDeleteBtnDisabled] = useState(false);
  const { designs, userDesigns, designVersions, userDesignVersions } = useSharedProps();

  useEffect(() => {
    const isBright = (color) => {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 155;
    };

    setTextColor(isBright(pinColor) ? "#000000" : "#ffffff");
  }, [pinColor]);

  const handleDelete = () => {
    try {
      setIsDeleteBtnDisabled(true);
      console.log(`Deleting pin with ID: ${pinId}`); // Debug log
      deletePin(pinId);
    } finally {
      setDeleteConfirmOpen(false);
      setIsDeleteBtnDisabled(false);
    }
  };

  const handleChange = (color) => {
    setValue(color.hex);
  };
  const handleOpenModal = () => {
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleExportClick = () => {
    history(`/design/${designId}`);
  };

  const getDesignImage = (designId) => {
    if (!designId) {
      console.log("No design ID provided");
      return "";
    }

    // Get the design
    const fetchedDesign =
      userDesigns.find((design) => design.id === designId) ||
      designs.find((design) => design.id === designId);
    if (!fetchedDesign || !fetchedDesign.history || fetchedDesign.history.length === 0) {
      return "";
    }

    // Get the latest designVersionId
    const latestDesignVersionId = fetchedDesign.history[fetchedDesign.history.length - 1];
    if (!latestDesignVersionId) {
      return "";
    }
    const fetchedLatestDesignVersion =
      userDesignVersions.find((designVer) => designVer.id === latestDesignVersionId) ||
      designVersions.find((designVer) => designVer.id === latestDesignVersionId);
    if (!fetchedLatestDesignVersion?.images?.length) {
      return "";
    }

    // Return the first image's link from the fetched design version
    return fetchedLatestDesignVersion.images[0].link || "";
  };

  return (
    <div className="pinHolder" style={{ width: "100%" }}>
      <div
        className="pinColor"
        style={{ backgroundColor: pinColor, color: textColor }}
        onClick={handleOpenModal}
      >
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
                  color: "var(--always-white)",
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
      <div className="mapPin">
        <div className="mapPinDetails">
          <img
            src={getDesignImage(designId) || "/img/transparent-image.png"}
            className="image-pin"
            alt=""
          />
          {/* {getDesignImage(designId) && (
            <img src={getDesignImage(designId)} className="image-pin" alt={`design preview`} />
          )} */}
          <div className="itemDetailsCont">
            <div className="itemDetailsContText">
              <span className="pinName">{title}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                alignItems: "center",
              }}
              className="itemActions"
            >
              {!editMode ? (
                <>
                  <IconButton
                    aria-label="delete"
                    // style={{ cursor: "pointer", marginRight: "6px" }}
                    sx={{
                      ...iconButtonStyles,
                      width: "40px",
                      height: "40px",
                      padding: "6px",
                      marginTop: "-5px",
                    }}
                    onClick={handleExportClick}
                  >
                    <ExportIcon />
                  </IconButton>
                  {isContributor && (
                    <>
                      <IconButton
                        aria-label="edit"
                        onClick={editPin}
                        sx={{ ...iconButtonStyles, width: "36px", height: "36px" }}
                      >
                        <EditIconSmallGradient />
                      </IconButton>
                    </>
                  )}

                  {isManager && (
                    <IconButton
                      sx={{ ...iconButtonStyles, width: "36px", height: "36px" }}
                      aria-label="delete"
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      <Trash />
                    </IconButton>
                  )}
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
      </div>
      <SimpleDeleteConfirmation
        item={"pin"}
        open={deleteConfirmOpen}
        handleClose={() => setDeleteConfirmOpen(false)}
        handleDelete={handleDelete}
      />
    </div>
  );
};

export default MapPin;
