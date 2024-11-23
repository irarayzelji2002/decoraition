import "../../css/project.css";
import ProjectHead from "./ProjectHead";
import BottomBarDesign from "./BottomBarProject";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ExportIcon from "./svg/ExportIcon";
import { getAuth } from "firebase/auth";
import { collection, getDocs, doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { fetchProjectDesigns } from "./backend/ProjectDetails";
import { showToast } from "../../functions/utils";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { fetchVersionDetails, getDesignImage } from "../DesignSpace/backend/DesignActions";
import CircularProgress from "@mui/material/CircularProgress";
import Loading from "../../components/Loading";

function ProjBudget() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const {
    user,
    userBudgets,
    items,
    userItems,
    budgets,
    userDesigns,
    designVersions,
    userDesignVersions,
  } = useSharedProps();
  const [designBudgetItems, setDesignBudgetItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [designImages, setDesignImages] = useState({});
  const [itemImages, setItemImages] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          console.log(`Fetching designs for budget: ${projectId}`); // Debug log
          await fetchProjectDesigns(projectId, setDesigns);
        } catch (error) {
          showToast("error", `Error fetching project designs: ${error.message}`);
        }
      }
    };

    fetchData();
  }, [user, projectId]);

  useEffect(() => {
    const fetchBudgetData = async () => {
      const budgetItems = {};
      for (const design of designs) {
        const result = await fetchVersionDetails(design, user);
        if (result.success) {
          const latestVersion = result.versionDetails[0];
          const budgetId = latestVersion?.budgetId;
          if (budgetId) {
            const fetchedBudget =
              userBudgets.find((b) => b.id === budgetId) || budgets.find((b) => b.id === budgetId);
            if (fetchedBudget) {
              const fetchedItems = await Promise.all(
                fetchedBudget.items.map(async (itemId) => {
                  const item =
                    userItems.find((i) => i.id === itemId) || items.find((i) => i.id === itemId);
                  return item || null;
                })
              );
              budgetItems[design.id] = fetchedItems.filter((item) => item !== null);
            }
          }
        }
      }
      setDesignBudgetItems(budgetItems);
      setLoading(false);
    };

    if (designs.length > 0) {
      fetchBudgetData();
    }
  }, [designs, user, userBudgets, items, userItems, budgets]);

  const fetchDesignImage = (designId) => {
    if (!designId) {
      console.log("No design ID provided");
      return "";
    }

    const fetchedDesign =
      userDesigns.find((design) => design.id === designId) ||
      designs.find((design) => design.id === designId);
    if (!fetchedDesign || !fetchedDesign.history || fetchedDesign.history.length === 0) {
      return "";
    }

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

    return fetchedLatestDesignVersion.images[0].link || "";
  };

  useEffect(() => {
    const fetchDesignImages = async () => {
      const images = {};
      for (const design of designs) {
        const image = fetchDesignImage(design.id);
        images[design.id] = image;
      }
      setDesignImages(images);
    };

    const fetchItemImages = async () => {
      const images = {};
      for (const design of designs) {
        for (const item of designBudgetItems[design.id] || []) {
          const image = item.image || "/img/transparent-image.png";
          images[item.id] = image;
        }
      }
      setItemImages(images);
    };

    if (designs.length > 0) {
      fetchDesignImages();
      fetchItemImages();
    }
  }, [designs, designBudgetItems]);

  const totalProjectBudget = designs.reduce((total, design) => {
    const totalCost = designBudgetItems[design.id]?.reduce(
      (sum, item) => sum + parseFloat(item.cost.amount || 0) * (item.quantity || 1),
      0
    );
    return total + (totalCost || 0);
  }, 0);

  return (
    <>
      <ProjectHead />
      <div className="budgetHolder">
        <span
          className="priceSum"
          style={{
            backgroundColor: "#397438",
            marginBottom: "20px",
          }}
        >
          Total Project Budget: ₱ <strong>{totalProjectBudget?.toFixed(2)}</strong>
        </span>
        <div style={{ marginBottom: "10%" }}>
          {loading ? (
            <Loading />
          ) : designs.length > 0 ? (
            designs.map((design) => {
              const totalCost = designBudgetItems[design.id]?.reduce(
                (sum, item) => sum + parseFloat(item.cost.amount || 0) * (item.quantity || 1),
                0
              );

              return (
                <div className="sectionBudget" key={design.id}>
                  <div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span className="SubtitleBudget" style={{ fontSize: "30px" }}>
                        {design.designName}
                      </span>
                      <span className="SubtitlePrice">Total Cost: Php {totalCost?.toFixed(2)}</span>
                    </div>

                    <div className="image-frame-project">
                      {/* the design image goes here */}
                      <img
                        src={designImages[design.id] || "../../img/logoWhitebg.png"}
                        alt={`design preview `}
                        className="image-preview"
                        style={{ marginRight: "10px" }}
                      />
                    </div>
                  </div>
                  <div className="itemList">
                    {designBudgetItems[design.id]?.map((item) => (
                      <div className="item" key={item.id}>
                        {/* the item image goes here */}
                        <img
                          src={itemImages[item.id] || "../../img/logoWhitebg.png"}
                          alt={`item preview `}
                          style={{ width: "80px", height: "80px" }}
                        />
                        <div
                          style={{
                            marginLeft: "12px",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <span className="SubtitleBudget">{item.itemName}</span>
                          <span
                            className="SubtitlePrice"
                            style={{ backgroundColor: "transparent" }}
                          >
                            Php {item.cost.amount?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: "100%", marginLeft: "10px" }}>
                    <div
                      onClick={() =>
                        navigate(`/budget/${design.id}`, {
                          state: { designId: design.id },
                        })
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <ExportIcon />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-content" style={{ height: "80vh" }}>
              <img src="/img/design-placeholder.png" alt="No designs yet" />
              <p>No designs yet. Start creating.</p>
            </div>
          )}
        </div>
      </div>
      <div className="bottom-filler" />

      <BottomBarDesign Budget={true} projId={projectId} />
    </>
  );
}

export default ProjBudget;
