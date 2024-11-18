import "../../css/project.css";
import ProjectHead from "./ProjectHead";
import BottomBarDesign from "./BottomBarProject";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ExportIcon from "./svg/ExportIcon";
import { ToastContainer } from "react-toastify";
import { getAuth } from "firebase/auth";
import { collection, getDocs, doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { fetchProjectDesigns } from "./backend/ProjectDetails";
import { toast } from "react-toastify";
import { useSharedProps } from "../../contexts/SharedPropsContext";

function ProjBudget() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [designs, setDesigns] = useState([]);
  const { user } = useSharedProps();
  const [designBudgetItems, setDesignBudgetItems] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          console.log(`Fetching designs for budget: ${projectId}`); // Debug log
          await fetchProjectDesigns(projectId, setDesigns);
        } catch (error) {
          toast.error(`Error fetching project designs: ${error.message}`);
        }
      }
    };

    fetchData();
  }, [user, projectId]);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);

        const fetchProjectDetails = async () => {
          try {
            const projectRef = doc(db, "projects", projectId);
            const projectSnapshot = await getDoc(projectRef);
            if (projectSnapshot.exists()) {
              // Listen for real-time updates to the project document
              const unsubscribeProject = onSnapshot(projectRef, (doc) => {
                if (doc.exists()) {
                  const updatedProject = doc.data();
                }
              });

              // Cleanup listener on component unmount
              return () => unsubscribeProject();
            } else {
              console.error("Project not found");
            }
          } catch (error) {
            console.error("Error fetching project details:", error);
          }
        };

        fetchProjectDetails();
      } else {
        console.error("User is not authenticated");
      }
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [projectId]);

  const totalProjectBudget = designs.reduce((total, design) => {
    const totalCost = designBudgetItems[design.id]?.reduce(
      (sum, item) => sum + parseFloat(item.cost),
      0
    );
    return total + (totalCost || 0);
  }, 0);

  return (
    <>
      <ToastContainer />
      <ProjectHead />
      <div className="budgetHolder">
        <span
          className="priceSum"
          style={{
            backgroundColor: "#397438",
            marginBottom: "20px",
          }}
        >
          Total Project Budget: ₱ <strong>{totalProjectBudget}</strong>
        </span>
        <div style={{ marginBottom: "10%" }}>
          {designs.length > 0 ? (
            designs.map((design) => {
              const totalCost = designBudgetItems[design.id]?.reduce(
                (sum, item) => sum + parseFloat(item.cost),
                0
              );

              return (
                <div className="sectionBudget" key={design.id}>
                  <div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span className="SubtitleBudget" style={{ fontSize: "30px" }}>
                        {design.designName}
                      </span>
                      <span className="SubtitlePrice">Total Cost: Php {totalCost}</span>
                    </div>

                    <div className="image-frame-project">
                      <img
                        src="../../img/logoWhitebg.png"
                        alt={`design preview `}
                        className="image-preview"
                        style={{ marginRight: "10px" }}
                      />
                    </div>
                  </div>
                  <div className="itemList">
                    {designBudgetItems[design.id]?.map((item) => (
                      <div className="item" key={item.id}>
                        <img
                          src="../../img/logoWhitebg.png"
                          alt={`design preview `}
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
                            Php {item.cost}
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
