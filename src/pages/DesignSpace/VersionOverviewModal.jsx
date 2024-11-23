import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { dialogContentStyles, dialogStyles, dialogTitleStyles } from "../../components/RenameModal";
import { iconButtonStyles } from "../Homepage/DrawerComponent";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { BlankImage } from "./svg/AddImage";
import { getDesignImage } from "./backend/DesignActions";
import { get } from "lodash";

const getPHCurrency = () => {
  let currency = {
    countryISO: "PH",
    currencyCode: "PHP",
    currencyName: "Philippines",
    currencySymbol: "₱",
    flagEmoji: "🇵🇭",
  };
  return currency;
};

function VersionOverviewModal({
  openViewModal,
  setOpenViewModal,
  selectedDesignVersionDetails,
  viewingImage,
  setViewingImage,
  design,
}) {
  const { userDesigns, userDesignVersions, budgets, userBudgets, items, userItems } =
    useSharedProps();
  const [versionDetailTypeTab, setVersionDetailTypeTab] = useState(true); // true for Design, false for Budget
  const [versionBudget, setVersionBudget] = useState(null);
  const [versionItems, setVersionItems] = useState([]);
  const [budgetAmount, setBudgetAmount] = useState(0);
  const [budgetCurrency, setBudgetCurrency] = useState(getPHCurrency());
  const [totalCost, setTotalCost] = useState(0);
  const [formattedTotalCost, setFormattedTotalCost] = useState("0.00");
  const [exceededBudget, setExceededBudget] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isWrapped, setIsWrapped] = useState(false);

  const adjustPillStyle = () => {
    const commentTabsHeader = document.querySelector(".pairTabs");
    setIsWrapped(commentTabsHeader?.offsetWidth <= 219.99);
  };

  useEffect(() => {
    adjustPillStyle();
  }, []);

  const handleVersionDetailTypeTabChange = () => {
    setVersionDetailTypeTab(!versionDetailTypeTab);
  };

  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        if (!selectedDesignVersionDetails?.budgetId) {
          console.error("No budget associated with this version");
          return;
        }
        const fetchedBudget =
          userBudgets.find((b) => b.id === selectedDesignVersionDetails?.budgetId) ||
          budgets.find((b) => b.id === selectedDesignVersionDetails?.budgetId);
        if (!fetchedBudget) {
          console.error("Budget not found");
          return;
        }
        setVersionBudget(fetchedBudget);

        if (!fetchedBudget.items?.length) {
          console.log("No items in budget");
          return;
        }
        const fetchedItems = await Promise.all(
          fetchedBudget.items.map(async (itemId) => {
            const item =
              userItems.find((i) => i.id === itemId) || items.find((i) => i.id === itemId);
            if (!item) {
              console.error(`Item ${itemId} not found`);
              return null;
            }
            return item;
          })
        );
        const validItems = fetchedItems.filter((item) => item !== null);
        setVersionItems(validItems);
      } catch (err) {
        console.error("Failed to load budget data", err.mesage);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetData();
  }, [selectedDesignVersionDetails]);

  // Budget & Item Functions
  const getBudgetColor = (budgetAmount, totalCost) => {
    if (budgetAmount === 0) {
      return "var(--inputBg)"; // no budget
    } else if (totalCost <= budgetAmount) {
      return "var(--green)"; // within budget
    } else {
      return "var(--red)"; // over budget
    }
  };

  const computeTotalCostAndExceededBudget = (designItems, budgetAmount) => {
    if (!designItems || designItems.length === 0) {
      setTotalCost(0);
      setFormattedTotalCost("0.00");
      setExceededBudget(false);
      return;
    }

    const totalCost = designItems
      .filter((item) => item.includedInTotal !== false) // Exclude items not included in total
      .reduce((sum, item) => sum + parseFloat(item.cost.amount || 0) * (item.quantity || 1), 0)
      .toFixed(2);
    setTotalCost(totalCost);

    // Currency
    const currenyDisplay =
      items[0]?.cost?.currency?.currencyCode || items[0]?.cost?.currency || "PHP";

    const formattedTotalCost =
      currenyDisplay +
      " " +
      new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(totalCost);
    setFormattedTotalCost(formattedTotalCost);

    const exceededBudget = parseFloat(totalCost) > budgetAmount; //true/false
    setExceededBudget(exceededBudget);
  };

  const formatNumber = (num) => (typeof num === "number" ? num.toFixed(2) : "0.00");

  useEffect(() => {
    setBudgetAmount(versionBudget?.budget?.amount ?? 0);
    setBudgetCurrency(versionBudget?.budget?.currency ?? getPHCurrency());
  }, [versionBudget]);

  useEffect(() => {
    if (budgetAmount && versionItems.length > 0) {
      computeTotalCostAndExceededBudget(versionItems, budgetAmount);
    }
  }, [versionItems]);

  return (
    <Dialog
      open={openViewModal}
      onClose={() => setOpenViewModal(false)}
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
          {`Version ${selectedDesignVersionDetails.displayDate?.includes(",") ? "at " : ""}${
            selectedDesignVersionDetails.displayDate
          }`}
        </Typography>
        <IconButton
          onClick={() => setOpenViewModal(false)}
          sx={{
            ...iconButtonStyles,
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          ...dialogContentStyles,
          paddingBottom: "20px",
          width: versionDetailTypeTab ? "min(50vw, 50vh)" : "auto",
        }}
      >
        <div style={{ position: "relative" }}>
          <div className="comment-tabs-header">
            {/* Version Tabs */}
            <div className="commentTabsContainer version">
              <div className="pairTabs">
                <Tabs
                  value={versionDetailTypeTab ? 0 : 1}
                  onChange={handleVersionDetailTypeTabChange}
                  sx={{
                    minHeight: "40px",
                    "& .MuiTabs-flexContainer": {
                      gap: 0,
                      flexWrap: "wrap",
                      justifyContent: "center",
                    },
                  }}
                  TabIndicatorProps={{ style: { display: "none" } }} // Hide default indicator
                >
                  <Tab label="Design" sx={getPillTabStyle(isWrapped, versionDetailTypeTab, 0)} />
                  <Tab label="Budget" sx={getPillTabStyle(isWrapped, versionDetailTypeTab, 1)} />
                </Tabs>
              </div>
            </div>
          </div>
          {versionDetailTypeTab ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                position: "relative",
                flexDirection: "column",
              }}
            >
              {/* Version Images */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  position: "relative",
                  gap: "5px",
                  marginBottom: "10px",
                }}
              >
                {selectedDesignVersionDetails.imagesLink.map((img, index) => {
                  return (
                    <div style={{ border: index !== viewingImage && "1px solid transparent" }}>
                      <div
                        key={index}
                        className="select-image-preview version"
                        style={{ border: index === viewingImage && "2px solid var(--brightFont)" }}
                        onClick={() => setViewingImage(index)}
                      >
                        <img src={img ?? "/img/transparent-image.png"} alt="" />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
                <div className="historyImageFrame" key={viewingImage}>
                  <img
                    src={
                      selectedDesignVersionDetails.imagesLink[viewingImage] ??
                      "/img/transparent-image.png"
                    }
                    alt=""
                    className="historyImagePreview"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                alignItems: versionItems.length === 0 ? "center" : "start",
              }}
              className="versionDetailsCont"
            >
              {/* Version Budget */}
              <div className="previewBudgetCont version">
                <span
                  className="priceSum"
                  style={{
                    backgroundColor: getBudgetColor(budgetAmount, totalCost),
                    marginTop: "0px",
                    marginBottom: "10px",
                  }}
                >
                  {(() => {
                    if (formattedTotalCost === "0.00" && budgetAmount === 0) {
                      return <>No cost and added budget</>;
                    } else if (formattedTotalCost === "0.00") {
                      return (
                        <>
                          No cost, Budget:{" "}
                          <strong>
                            {budgetCurrency?.currencyCode} {formatNumber(budgetAmount)}
                          </strong>
                        </>
                      );
                    } else if (budgetAmount === 0) {
                      return (
                        <>
                          Total Cost: <strong>{formattedTotalCost}</strong>, No added budget
                        </>
                      );
                    } else {
                      return (
                        <>
                          Total Cost: <strong>{formattedTotalCost}</strong>, Budget:{" "}
                          <strong>
                            {budgetCurrency?.currencyCode} {formatNumber(budgetAmount)}
                          </strong>
                        </>
                      );
                    }
                  })()}
                </span>
              </div>
              <div className="cutoff version">
                {/* Images */}
                <div className="budgetSpaceImg version pic">
                  <div>
                    <div className="versionImagesPreviewOptionsCont">
                      {selectedDesignVersionDetails.imagesLink.map((img, index) => {
                        return (
                          <div
                            style={{ border: index !== viewingImage && "1px solid transparent" }}
                          >
                            <div
                              key={index}
                              className="select-image-preview budget"
                              style={{
                                border: index === viewingImage && "2px solid var(--brightFont)",
                              }}
                              onClick={() => setViewingImage(index)}
                            >
                              <img src={img ?? "/img/transparent-image.png"} alt="" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="image-frame version">
                      <div className="image-frame-icon">
                        <BlankImage />
                        <span>No design yet</span>
                      </div>
                      <img
                        src={
                          selectedDesignVersionDetails.imagesLink[viewingImage] ??
                          "/img/transparent-image.png"
                        }
                        alt=""
                        className="image-preview"
                      />
                    </div>
                  </div>
                </div>
                {/* Items */}
                <div
                  className="budgetSpaceImg version items"
                  style={{ alignItems: versionItems.length === 0 ? "center" : "start" }}
                >
                  {versionItems.length > 0 ? (
                    versionItems.map((item) => (
                      <div
                        key={item.id}
                        className="itemSpace version"
                        style={{ display: "flex", flexDirection: "row" }}
                      >
                        <img
                          src={item.image ?? "/img/transparent-image.png"}
                          alt=""
                          className="thumbnail"
                        />
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            margin: "12px",
                            width: "auto  ",
                          }}
                        >
                          <span className="itemName">{item.quantity + " " + item.itemName}</span>
                          <span className="itemPrice">
                            {item.cost.currency?.currencyCode +
                              " " +
                              formatNumber(item.cost.amount)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="placeholderDiv" style={{ margin: "0 !important" }}>
                      <img
                        src={"../../img/design-placeholder.png"}
                        style={{ width: "100px" }}
                        alt=""
                      />
                      <p className="grey-text center">No items in this version.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VersionOverviewModal;

const getPillTabStyle = (isWrapped, selectedTab, index) => {
  const isSelected = (selectedTab && index === 0) || (!selectedTab && index === 1);
  return {
    px: "5px", // Padding for the pill shape
    paddingLeft: index === 0 ? "10px" : "5px",
    paddingRight: index === 0 ? "5px" : "10px",
    py: 0,
    textTransform: "none",
    borderRadius: !isWrapped
      ? index === 0
        ? "20px 0px 0px 20px"
        : "0px 20px 20px 0px" // Left or Right rounded
      : index === 0
      ? "20px 20px 0 0"
      : "0 0 20px 20px", // Top or Bottom rounded
    fontWeight: "bold",
    transition: "background-color 0.3s, color 0.3s",
    backgroundColor: isSelected ? "var(--brightFont)" : "transparent",
    color: isSelected ? "var(--color-white)" : "var(--color-white)", // Set selected color here
    border: isSelected ? "none" : "1.5px solid var(--brightFont)",
    "&:hover": {
      backgroundColor: isSelected ? "var(--brightFont)" : "rgba(0,0,0,0.05)",
    },
    "&.Mui-selected": {
      color: isSelected ? "var(--color-white)" : "var(--color-white)",
    },
    minHeight: "40px",
    width: "112px", // Ensures tabs are the same size
  };
};
