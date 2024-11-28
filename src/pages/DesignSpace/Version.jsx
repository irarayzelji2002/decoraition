import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
} from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VersionOverviewModal from "./VersionOverviewModal";
import { formatDateDetail, formatDateDetailComma } from "../Homepage/backend/HomepageActions";
import { fetchVersionDetails } from "./backend/DesignActions";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { showToast } from "../../functions/utils";
import { handleRestoreDesignVersion } from "./backend/DesignActions";
import "../../css/design.css";
import TwoFrames from "./svg/TwoFrames";
import FourFrames from "./svg/FourFrames";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { gradientButtonStyles, outlinedButtonStyles } from "./PromptBar";
import {
  dialogStyles,
  dialogTitleStyles,
  dialogContentStyles,
  dialogActionsStyles,
} from "../../components/RenameModal";
import { GradientCircularLoading } from "../../components/ManageAccessModal";

const Version = ({ isDrawerOpen, onClose, design, isHistory, handleSelect, title }) => {
  const navigate = useNavigate();
  const designLinkRef = useRef(null);
  const { user, userDoc, designs, designVersions } = useSharedProps();
  const [selectedDesignVersionId, setSelectedDesignVersionId] = useState("");
  const [selectedDesignVersionDetails, setSelectedVersionDetails] = useState({});
  const [versionDetails, setVersionDetails] = useState([]);
  const [copiedVersionDetails, setCopiedVersionDetails] = useState([]);
  const [isCopySelected, setIsCopySelected] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [viewingImage, setViewingImage] = useState(0);
  const [openConfirmRestoreModal, setOpenConfirmRestoreModal] = useState(false);
  const [isRestoreButttonDisabled, setIsRestoreButtonDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleSelectVersion = (e, versionId) => {
    if (e) e.stopPropagation();
    console.log("Selected version:", versionId);
    setSelectedDesignVersionId(versionId);
    // Find the matching version and set its formatted date
    if (versionId) {
      const selectedVersion = versionDetails.find((v) => v.id === versionId);
      const selectedVersionCopy = copiedVersionDetails.find((v) => v.id === versionId);
      if (selectedVersion || selectedVersionCopy) {
        setSelectedDesignVersionId(versionId);
        if (selectedVersion) {
          setSelectedVersionDetails(selectedVersion);
          setIsCopySelected(false);
        } else {
          setSelectedVersionDetails(selectedVersionCopy);
          setIsCopySelected(true);
        }
      }
    } else {
      setSelectedVersionDetails({});
    }
  };

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    onClose();
    if (isHistory) {
      setSelectedDesignVersionId("");
      setSelectedVersionDetails({});
    }
  };

  // Restore utton function
  const onConfirmRestore = async () => {
    try {
      setIsRestoreButtonDisabled(true);
      const result = await handleRestore(design, selectedDesignVersionId);
      if (!result.success) {
        showToast("error", result.message);
        return;
      }
      showToast(
        "success",
        `Design restored${
          selectedDesignVersionDetails.displayDate
            ? ` to version on ${selectedDesignVersionDetails.displayDate}`
            : ""
        }`
      );
    } finally {
      handleClose();
      setIsRestoreButtonDisabled(false);
    }
  };

  // Function call
  const handleRestore = async (design, designVersionId) => {
    if (!design?.id || !designVersionId) {
      return {
        success: false,
        message: "Invalid design or version",
      };
    }
    try {
      console.log("Restoring version:", {
        designId: design.id,
        versionId: designVersionId,
        user,
      });
      const result = await handleRestoreDesignVersion(design, designVersionId, user, userDoc);
      if (result.success) {
        return { success: true, message: "Design restored" };
      } else {
        return { success: false, message: "Failed to restore design" };
      }
    } catch (error) {
      console.error("Error restoring design:", error);
      return { success: false, message: "Failed to restore design" };
    }
  };

  useEffect(() => {
    const getVersionDetails = async () => {
      setIsLoading(true);
      try {
        if (design?.history && design.history.length > 0) {
          // Get version details
          const result = await fetchVersionDetails(design, user);
          if (!result.success) {
            console.error("Error:", result.message);
            setSelectedDesignVersionId("");
            setSelectedVersionDetails({});
            setVersionDetails([]);
            return;
          }

          // Create new array with modified versions instead of modifying in place
          let versionDetails = result.versionDetails.map((version) => {
            const displayDate = formatDateDetailComma(version.createdAt);
            let restoredFromCreatedAt, restoredFromDisplayDate;
            if (version.isRestored && version.isRestoredFrom?.versionId) {
              const isRestoredFrom = result.versionDetails.find(
                (v) => v.id === version.isRestoredFrom.versionId
              );
              if (isRestoredFrom) {
                restoredFromCreatedAt = isRestoredFrom.createdAt;
                restoredFromDisplayDate = formatDateDetailComma(restoredFromCreatedAt);
              }
            }
            return {
              ...version,
              displayDate,
              isRestoredFrom: {
                designId: version.isRestoredFrom?.designId,
                versionId: version.isRestoredFrom?.versionId,
                createdAt: restoredFromCreatedAt,
                displayDate: restoredFromDisplayDate,
              },
              imagesLink: version.images?.map((img) => img.link) || [],
            };
          });

          // Reverse after mapping
          versionDetails = versionDetails.reverse();
          setVersionDetails(versionDetails);
          console.log("versionDetails - versionDetails", versionDetails);

          // Set latest version
          const latestVersion = versionDetails[0];
          if (latestVersion) {
            setSelectedDesignVersionId(latestVersion.id);
            setSelectedVersionDetails(latestVersion);
          }
          console.log("versionDetails - latestVersion", latestVersion);

          // Get copied versions
          const copiedVersionDetails = await Promise.all(
            versionDetails.flatMap(async (version) => {
              if (!version.copiedDesigns || version.copiedDesigns.length === 0) {
                return [];
              }

              return Promise.all(
                version.copiedDesigns.map(async (copiedDesignId) => {
                  const copiedDesign = designs.find((d) => d.id === copiedDesignId);
                  if (!copiedDesign) return null;

                  const latestVersionId = copiedDesign.history[copiedDesign.history.length - 1];
                  const copiedVersion = designVersions.find((v) => v.id === latestVersionId);

                  if (!copiedVersion) return null;

                  return {
                    id: copiedVersion.id,
                    description: copiedVersion.description,
                    images: copiedVersion.images,
                    createdAt: copiedVersion.createdAt,
                    copiedDesigns: copiedVersion.copiedDesigns,
                    isRestored: copiedVersion.isRestored,
                    design: {
                      id: copiedDesign.id,
                      designName: copiedDesign.designName,
                      owner: copiedDesign.owner,
                    },
                    copiedFrom: version.id,
                    imagesLink: copiedVersion.images?.map((img) => img.link) || [],
                    displayDate: formatDateDetailComma(copiedVersion.createdAt),
                  };
                })
              );
            })
          ).then((results) => results.flat().filter(Boolean));
          setCopiedVersionDetails(copiedVersionDetails.reverse());
          console.log("versionDetails - copiedVersionDetails", copiedVersionDetails.reverse());
        }
      } catch (error) {
        console.error("Error fetching version details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (
      dummyVersionDetails &&
      dummyVersionDetails.length > 0 &&
      dummyCopiedVersionDetails &&
      dummyCopiedVersionDetails.length > 0
    ) {
      setVersionDetails(dummyVersionDetails.reverse());
      setCopiedVersionDetails(dummyCopiedVersionDetails.reverse());
      const latestVersion = dummyVersionDetails[0];
      if (latestVersion) {
        setSelectedDesignVersionId(latestVersion.id);
        setSelectedVersionDetails(latestVersion);
      }
      return;
    }
    if (isDrawerOpen) {
      getVersionDetails();
    }
  }, [isDrawerOpen, design, designVersions, designs, user]);

  useEffect(() => {
    console.log("openConfirmRestoreModal", openConfirmRestoreModal);
  }, [openConfirmRestoreModal]);

  return (
    <>
      <Drawer
        anchor="left"
        open={isDrawerOpen}
        onClose={onClose}
        sx={{
          zIndex: "1300 !important",
          "& .MuiDrawer-paper": {
            width: { xs: "100%", sm: "85%", md: "50%", xl: "40%" },
            minWidth: "300px",
            backgroundColor: "var(--bgMain)",
            color: "var(--color-white)",
            padding: "0px",
            display: "flex",
            flexDirection: "column",
          },
          "& .MuiDrawer-paper::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        <AppBar
          position="sticky"
          sx={{
            zIndex: 1300,
            backgroundColor: "var(--color-tertiary)",
            boxShadow: "none",
            padding: "10px 20px",
          }}
        >
          <Toolbar sx={{ backgroundColor: "transparent", padding: "0 !important" }}>
            <IconButton
              size="large"
              edge="start"
              color="var(--color-white)"
              aria-label="open drawer"
              sx={{ mr: 0.2, backgroundColor: "transparent" }}
              onClick={(e) => handleClose(e)}
            >
              <ArrowBackIosNewRoundedIcon sx={{ color: "var(--color-white)" }} />
            </IconButton>
            <Typography
              variant="body1"
              sx={{ fontSize: "1.3em", fontWeight: "bold", color: "var(--color-white)" }}
            >
              {title}
            </Typography>
          </Toolbar>
        </AppBar>
        <div className="historyContainer">
          {!isLoading ? (
            <>
              {versionDetails.map((version) => (
                <div key={version.id}>
                  <div
                    className="versionItem"
                    style={{ marginLeft: copiedVersionDetails.length > 0 ? "-220px" : "0px" }}
                  >
                    {/* Original Version */}
                    <div className="origDesign">
                      <div
                        onClick={(e) => handleSelectVersion(e, version.id)}
                        style={{ marginBottom: "11px" }}
                      >
                        <div
                          className="selectVersionImgContainer"
                          style={{
                            background:
                              selectedDesignVersionId === version.id
                                ? "var(--gradientButton)"
                                : "transparent",
                          }}
                        >
                          <img src={version.imagesLink[0]} alt="" />
                        </div>
                        <div className="versionTitle">{version.displayDate}</div>
                        {version.isRestored && (
                          <div className="copyByTitle">
                            <span>{`Restored from version ${
                              version.isRestoredFrom.displayDate?.includes(",") ? "at" : ""
                            }`}</span>
                            <span>{version.isRestoredFrom.displayDate}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Copied Versions */}
                    {version.copiedDesigns.length > 0 && (
                      <div
                        className={`${
                          versionDetails.indexOf(version) === versionDetails.length - 1
                            ? "conditionalPadding"
                            : ""
                        } copiedDesigns`}
                      >
                        {/* Horizontal line */}
                        <div className="versionLine horizontal"></div>

                        {copiedVersionDetails
                          .filter((cv) => cv.copiedFrom === version.id)
                          .map((copiedVersion, index, array) => (
                            <React.Fragment key={copiedVersion.id}>
                              <div key={copiedVersion.id} className="copiedVersionItem">
                                <div onClick={(e) => handleSelectVersion(e, copiedVersion.id)}>
                                  <div
                                    className="selectVersionImgContainer"
                                    style={{
                                      background:
                                        selectedDesignVersionId === copiedVersion.id
                                          ? "var(--gradientButton)"
                                          : "transparent",
                                    }}
                                  >
                                    <img src={copiedVersion.imagesLink[0]} alt="" />
                                  </div>
                                  <div className="versionTitle">{copiedVersion.displayDate}</div>
                                  <div className="copiedDesignTitle">
                                    {copiedVersion.design.designName}
                                  </div>
                                  <div className="copyByTitle">
                                    Copied by {copiedVersion.design.owner}
                                  </div>
                                </div>
                              </div>
                              {/* Show vertical line except for the last copiedVersion item */}
                              {index < array.length - 1 && (
                                <>
                                  <div className="versionLine vertical copy"></div>
                                  <div className="versionLine horizontal copy"></div>
                                </>
                              )}
                            </React.Fragment>
                          ))}
                      </div>
                    )}

                    {/* Vertical lines for Original Version */}
                    {versionDetails.indexOf(version) !== versionDetails.length - 1 && (
                      <div style={{ marginTop: version.isRestored ? "0px" : "-43px" }}>
                        {(version.copiedDesigns.length > 0 ||
                          versionDetails.indexOf(version) !== versionDetails.length - 1) &&
                          version.copiedDesigns.map((copiedDesign, index) => (
                            <div
                              key={copiedDesign.id}
                              className="versionLine vertical orig"
                              style={{
                                height:
                                  index > 0 && version.isRestored
                                    ? "204px"
                                    : index > 0 && !version.isRestored
                                    ? "220.5px"
                                    : version.isRestored
                                    ? "0px"
                                    : "10px",
                              }}
                            ></div>
                          ))}
                        {version.copiedDesigns.length > 0 && (
                          <div className="origDesignExtraVertLine"></div>
                        )}
                        {(version.copiedDesigns.length > 0 ||
                          versionDetails.indexOf(version) !== versionDetails.length - 1) && (
                          <div className="versionLine vertical orig1"></div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <GradientCircularLoading />
          )}
        </div>
        {/* Buttons */}
        {!isLoading && (
          <Toolbar
            sx={{
              backgroundColor: "var(--bgMain)",
              padding: "0px !important",
              position: "fixed",
              bottom: 0,
              width: "inherit",
            }}
          >
            <div className="versionButtonsDiv">
              {isHistory && !isCopySelected ? (
                <>
                  <Button
                    variant="contained"
                    onClick={(e) => {
                      if (e) e.stopPropagation();
                      setOpenViewModal(true);
                      handleSelectVersion(e, selectedDesignVersionId);
                      setViewingImage(0);
                    }}
                    sx={{
                      background: "var(--gradientButton)", // Gradient background
                      borderRadius: "20px", // Button border radius
                      color: "var(--always-white)", // Button text color
                      fontWeight: "bold",
                      textTransform: "none",
                      minWidth: "200px",
                      "&:hover": {
                        background: "var(--gradientButtonHover)", // Reverse gradient on hover
                      },
                    }}
                  >
                    View
                  </Button>
                  {selectedDesignVersionId !== versionDetails[0]?.id && (
                    <Button
                      variant="contained"
                      onClick={(e) => {
                        if (e) e.stopPropagation();
                        setOpenConfirmRestoreModal(true);
                        handleSelectVersion(e, selectedDesignVersionId);
                      }}
                      sx={{
                        background: "var(--gradientButton)", // Gradient background
                        borderRadius: "20px", // Button border radius
                        color: "var(--always-white)", // Button text color
                        fontWeight: "bold",
                        textTransform: "none",
                        minWidth: "200px",
                        "&:hover": {
                          background: "var(--gradientButtonHover)", // Reverse gradient on hover
                        },
                      }}
                    >
                      Restore
                    </Button>
                  )}
                </>
              ) : isHistory && isCopySelected ? (
                <>
                  <Button
                    variant="contained"
                    onClick={(e) => {
                      if (e) e.stopPropagation();
                      setOpenViewModal(true);
                      handleSelectVersion(e, selectedDesignVersionId);
                      setViewingImage(0);
                    }}
                    sx={{
                      background: "var(--gradientButton)", // Gradient background
                      borderRadius: "20px", // Button border radius
                      color: "var(--always-white)", // Button text color
                      fontWeight: "bold",
                      textTransform: "none",
                      minWidth: "200px",
                      "&:hover": {
                        background: "var(--gradientButtonHover)", // Reverse gradient on hover
                      },
                    }}
                  >
                    View
                  </Button>
                  <Button
                    variant="contained"
                    onClick={(e) => {
                      if (e) e.stopPropagation();
                      if (designLinkRef.current && !designLinkRef.current.contains(e.target)) {
                        designLinkRef.current.click();
                      }
                    }}
                    sx={{
                      background: "var(--gradientButton)", // Gradient background
                      borderRadius: "20px", // Button border radius
                      color: "var(--color-white)", // Button text color
                      fontWeight: "bold",
                      textTransform: "none",
                      minWidth: "200px",
                      "&:hover": {
                        background: "var(--gradientButtonHover)", // Reverse gradient on hover
                      },
                    }}
                  >
                    Go to design
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`/design/${selectedDesignVersionDetails.design?.id}`}
                      ref={designLinkRef}
                      style={{ display: "none" }}
                    >
                      Hidden Link
                    </a>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    onClick={(e) => {
                      if (e) e.stopPropagation();
                      handleSelect(selectedDesignVersionId);
                      handleClose(e);
                    }}
                    sx={{
                      background: "var(--gradientButton)", // Gradient background
                      borderRadius: "20px", // Button border radius
                      color: "var(--color-white)", // Button text color
                      fontWeight: "bold",
                      textTransform: "none",
                      minWidth: "200px",
                      "&:hover": {
                        background: "var(--gradientButtonHover)", // Reverse gradient on hover
                      },
                    }}
                  >
                    Select
                  </Button>
                  <Button
                    variant="contained"
                    onClick={(e) => handleClose(e)}
                    sx={{
                      color: "var(--color-white)",
                      background: "transparent",
                      border: "2px solid transparent",
                      borderRadius: "20px",
                      backgroundImage: "var(--lightGradient), var(--gradientButton)",
                      backgroundOrigin: "border-box",
                      backgroundClip: "padding-box, border-box",
                      fontWeight: "bold",
                      textTransform: "none",
                      minWidth: "200px",
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundImage =
                        "var(--lightGradient), var(--gradientButtonHover)")
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundImage =
                        "var(--lightGradient), var(--gradientButton)")
                    }
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </Toolbar>
        )}
      </Drawer>
      {openViewModal && (
        <VersionOverviewModal
          openViewModal={openViewModal}
          setOpenViewModal={setOpenViewModal}
          selectedDesignVersionDetails={selectedDesignVersionDetails}
          viewingImage={viewingImage}
          setViewingImage={setViewingImage}
          design={design}
        />
      )}
      {openConfirmRestoreModal && (
        <ConfirmRestoreModal
          openConfirmRestoreModal={openConfirmRestoreModal}
          setOpenConfirmRestoreModal={setOpenConfirmRestoreModal}
          selectedDesignVersionDetails={selectedDesignVersionDetails}
          handleRestore={onConfirmRestore}
          selectedDesignVersionId={selectedDesignVersionId}
          isRestoreButttonDisabled={isRestoreButttonDisabled}
        />
      )}
    </>
  );
};

const ConfirmRestoreModal = ({
  openConfirmRestoreModal,
  setOpenConfirmRestoreModal,
  selectedDesignVersionDetails,
  handleRestore,
  selectedDesignVersionId,
  isRestoreButttonDisabled,
}) => {
  return (
    <Dialog
      open={openConfirmRestoreModal}
      onClose={() => setOpenConfirmRestoreModal(false)}
      sx={{
        ...dialogStyles,
        zIndex: "13002",
      }}
    >
      <DialogTitle sx={dialogTitleStyles}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: "bold",
            fontSize: "1.15rem",
            flexGrow: 1,
            maxWidth: "80%",
            whiteSpace: "normal",
          }}
        >
          Confirm Restore
        </Typography>
        <IconButton
          onClick={(e) => {
            if (e) e.stopPropagation();
            setOpenConfirmRestoreModal(false);
          }}
          sx={{
            ...iconButtonStyles,
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={dialogContentStyles}>
        <Typography variant="body1" sx={{ textAlign: "center", maxWidth: "500px" }}>
          {`Are you sure you want to restore the design to the version created ${
            selectedDesignVersionDetails.displayDate?.includes(",") ? "at " : ""
          }${selectedDesignVersionDetails.displayDate}?`}
        </Typography>
      </DialogContent>
      <DialogActions sx={dialogActionsStyles}>
        {/* Yes Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={(e) => handleRestore(e, selectedDesignVersionId)}
          sx={{
            ...gradientButtonStyles,
            opacity: isRestoreButttonDisabled ? "0.5" : "1",
            cursor: isRestoreButttonDisabled ? "default" : "pointer",
            "&:hover": {
              backgroundImage: !isRestoreButttonDisabled && "var(--gradientButtonHover)",
            },
          }}
          disabled={isRestoreButttonDisabled}
        >
          Yes
        </Button>

        {/* No Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={(e) => {
            if (e) e.stopPropagation();
            setOpenConfirmRestoreModal(false);
          }}
          sx={outlinedButtonStyles}
          onMouseOver={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButtonHover)")
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundImage = "var(--lightGradient), var(--gradientButton)")
          }
        >
          No
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Version;

// Dummy Data for Testing
// const dummyVersionDetails = [
//   {
//     id: "version1",
//     description: "Initial design version",
//     images: [
//       {
//         id: "img1",
//         link: "../test-img/1.png",
//         comments: ["comment1", "comment2"],
//       },
//     ],
//     createdAt: new Date("2024-01-01T10:00:00"),
//     copiedDesigns: ["copiedDesign1", "copiedVersion2", "copiedVersion3"],
//     isRestored: false,
//     isRestoredFrom: null,
//     imagesLink: [
//       "../test-img/1.png",
//       "../test-img/4.png",
//       "../test-img/5.png",
//       "../test-img/6.png",
//     ],
//     displayDate: "Jan 1, 2024, 10:00 AM",
//   },
//   {
//     id: "version2",
//     description: "Updated color scheme",
//     images: [
//       {
//         id: "img2",
//         link: "../test-img/2.png",
//         comments: [],
//       },
//     ],
//     createdAt: new Date("2024-01-02T15:30:00"),
//     copiedDesigns: ["copiedDesign4"],
//     isRestored: true,
//     isRestoredFrom: {
//       designId: "originalDesign1",
//       versionId: "version1",
//       createdAt: new Date("2024-01-01T10:00:00"),
//       displayDate: "Jan 1, 2024, 10:00 AM",
//     },
//     imagesLink: ["../test-img/2.png"],
//     displayDate: "Jan 2, 2024, 3:30 PM",
//   },
//   {
//     id: "version3",
//     description: "Updated color scheme",
//     images: [
//       {
//         id: "img2",
//         link: "../test-img/2.png",
//         comments: [],
//       },
//     ],
//     createdAt: new Date("2024-01-02T15:30:00"),
//     copiedDesigns: ["copiedDesign5", "copiedDesign6"],
//     isRestored: true,
//     isRestoredFrom: {
//       designId: "originalDesign1",
//       versionId: "version1",
//       createdAt: new Date("2024-01-01T10:00:00"),
//       displayDate: "Jan 1, 2024, 10:00 AM",
//     },
//     imagesLink: ["../test-img/2.png"],
//     displayDate: "Jan 2, 2024, 3:30 PM",
//   },
//   {
//     id: "version4",
//     description: "Updated color scheme",
//     images: [
//       {
//         id: "img2",
//         link: "../test-img/2.png",
//         comments: [],
//       },
//     ],
//     createdAt: new Date("2024-01-02T15:30:00"),
//     copiedDesigns: [],
//     isRestored: true,
//     isRestoredFrom: {
//       designId: "originalDesign1",
//       versionId: "version1",
//       createdAt: new Date("2024-01-01T10:00:00"),
//       displayDate: "Jan 1, 2024, 10:00 AM",
//     },
//     imagesLink: ["../test-img/2.png"],
//     displayDate: "Jan 2, 2024, 3:30 PM",
//   },
// ];

// const dummyCopiedVersionDetails = [
//   {
//     id: "copiedVersion1",
//     description: "Copied from original design",
//     images: [
//       {
//         id: "imgCopy1",
//         link: "../test-img/3.png",
//         comments: [],
//       },
//     ],
//     createdAt: new Date("2024-01-03T09:15:00"),
//     copiedDesigns: [],
//     isRestored: false,
//     design: {
//       id: "copiedDesign1",
//       designName: "Copy of Living Room",
//       owner: "John Doe",
//     },
//     copiedFrom: "version1",
//     imagesLink: ["../test-img/3.png"],
//     displayDate: "Jan 3, 2024, 9:15 AM",
//   },
//   {
//     id: "copiedVersion2",
//     description: "Copied from original design",
//     images: [
//       {
//         id: "imgCopy1",
//         link: "../test-img/3.png",
//         comments: [],
//       },
//     ],
//     createdAt: new Date("2024-01-03T09:15:00"),
//     copiedDesigns: [],
//     isRestored: false,
//     design: {
//       id: "copiedDesign1",
//       designName: "Copy of Living Room",
//       owner: "John Doe",
//     },
//     copiedFrom: "version1",
//     imagesLink: ["../test-img/3.png"],
//     displayDate: "Jan 3, 2024, 9:15 AM",
//   },
//   {
//     id: "copiedVersion3",
//     description: "Copied from original design",
//     images: [
//       {
//         id: "imgCopy1",
//         link: "../test-img/3.png",
//         comments: [],
//       },
//     ],
//     createdAt: new Date("2024-01-03T09:15:00"),
//     copiedDesigns: [],
//     isRestored: false,
//     design: {
//       id: "copiedDesign1",
//       designName: "Copy of Living Room",
//       owner: "John Doe",
//     },
//     copiedFrom: "version1",
//     imagesLink: ["../test-img/3.png"],
//     displayDate: "Jan 3, 2024, 9:15 AM",
//   },
//   {
//     id: "copiedVersion4",
//     description: "Copied from original design",
//     images: [
//       {
//         id: "imgCopy1",
//         link: "../test-img/7.png",
//         comments: [],
//       },
//     ],
//     createdAt: new Date("2024-01-03T09:15:00"),
//     copiedDesigns: [],
//     isRestored: false,
//     design: {
//       id: "copiedDesign1",
//       designName: "Copy of Living Room",
//       owner: "John Doe",
//     },
//     copiedFrom: "version2",
//     imagesLink: ["../test-img/3.png"],
//     displayDate: "Jan 3, 2024, 9:15 AM",
//   },
//   {
//     id: "copiedVersion5",
//     description: "Copied from original design",
//     images: [
//       {
//         id: "imgCopy1",
//         link: "../test-img/7.png",
//         comments: [],
//       },
//     ],
//     createdAt: new Date("2024-01-03T09:15:00"),
//     copiedDesigns: [],
//     isRestored: false,
//     design: {
//       id: "copiedDesign1",
//       designName: "Copy of Living Room",
//       owner: "John Doe",
//     },
//     copiedFrom: "version3",
//     imagesLink: ["../test-img/3.png"],
//     displayDate: "Jan 3, 2024, 9:15 AM",
//   },
//   {
//     id: "copiedVersion6",
//     description: "Copied from original design",
//     images: [
//       {
//         id: "imgCopy1",
//         link: "../test-img/7.png",
//         comments: [],
//       },
//     ],
//     createdAt: new Date("2024-01-03T09:15:00"),
//     copiedDesigns: [],
//     isRestored: false,
//     design: {
//       id: "copiedDesign1",
//       designName: "Copy of Living Room",
//       owner: "John Doe",
//     },
//     copiedFrom: "version3",
//     imagesLink: ["../test-img/3.png"],
//     displayDate: "Jan 3, 2024, 9:15 AM",
//   },
// ];

const dummyVersionDetails = [];
const dummyCopiedVersionDetails = [];
