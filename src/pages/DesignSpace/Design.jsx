import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import deepEqual from "deep-equal";
import { useSharedProps } from "../../contexts/SharedPropsContext";
import { showToast } from "../../functions/utils";

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase"; // Assuming you have firebase setup
import DesignSpace from "./DesignSpace";
import DesignHead from "../../components/DesignHead";
import { getAuth } from "firebase/auth";
import PromptBar from "./PromptBar";
import BottomBar from "./BottomBar";
import Loading from "../../components/Loading";
import CommentTabs from "./CommentTabs";
import { ToastContainer, toast } from "react-toastify";
import Version from "./Version";
import "../../css/design.css";
import TwoFrames from "./svg/TwoFrames";
import FourFrames from "./svg/FourFrames";
import CommentContainer from "./CommentContainer";
import { onSnapshot } from "firebase/firestore";
import { Tabs, Tab } from "@mui/material";
import {
  toggleComments,
  togglePromptBar,
  handleSidebarEffect,
  handleNameChange,
} from "./backend/DesignActions"; // Import the functions from the backend file

function Design() {
  const { user, userDoc, designs, userDesigns } = useSharedProps();
  const { designId } = useParams(); // Get designId from the URL
  const [design, setDesign] = useState({});

  // const [designData, setDesignData] = useState(null);
  const [showComments, setShowComments] = useState(false);

  const [showPromptBar, setShowPromptBar] = useState(true);
  const [numImageFrames, setNumImageFrames] = useState(2);
  // const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState("Open");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state for sidebar
  const [activeTab, setActiveTab] = useState(0);

  const [loading, setLoading] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    if (designId && userDesigns.length > 0) {
      const fetchedDesign = userDesigns.find((d) => d.id === designId);

      if (!fetchedDesign) {
        console.error("Design not found.");
      } else if (Object.keys(design).length === 0 || !deepEqual(design, fetchedDesign)) {
        setDesign(fetchedDesign);
      }
    }
    setLoading(false);
  }, [designId, userDesigns]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
  };

  useEffect(() => {
    const handleError = (event) => {
      if (event.message === "ResizeObserver loop completed with undelivered notifications.") {
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  useEffect(() => {
    const cleanup = handleSidebarEffect(isSidebarOpen);
    return cleanup;
  }, [isSidebarOpen]);

  const handleNotifClick = () => {
    setIsNotifOpen(true);
  };

  const handleNotifClose = () => {
    setIsNotifOpen(false);
  };

  if (loading) {
    return <Loading />;
  }

  if (!design) {
    return <div>Design not found. Please reload or navigate to this design again.</div>;
  }

  return (
    <div className="whole">
      <DesignSpace
        design={design}
        isDesign={true}
        designId={designId}
        setShowComments={setShowComments}
      >
        <>
          <div className="create-design">
            <div className="workspace">
              {showPromptBar && <PromptBar />}
              <div
                className="fixed-arrow-button"
                onClick={() => togglePromptBar(setShowPromptBar)}
              ></div>

              <Version isDrawerOpen={isNotifOpen} onClose={handleNotifClose} />
              <div className="working-area">
                <div className="frame-buttons">
                  <button onClick={() => setNumImageFrames(2)}>
                    <TwoFrames />
                  </button>
                  <button onClick={() => setNumImageFrames(4)}>
                    <FourFrames />
                  </button>
                </div>
                <div className={numImageFrames === 4 ? "image-grid-design" : "image-drop"}>
                  {Array.from({ length: numImageFrames }).map((_, index) => (
                    <div className="image-frame" key={index}>
                      <img
                        src="../../img/Room1.png"
                        alt={`design preview ${index + 1}`}
                        className="image-preview"
                      />
                    </div>
                  ))}
                </div>
              </div>
              {showComments && (
                <CommentTabs
                  activeTab={activeTab}
                  handleTabChange={handleTabChange}
                  status={status}
                  handleStatusChange={handleStatusChange}
                />
              )}
            </div>
          </div>
        </>
      </DesignSpace>
    </div>
  );
}

export default Design;
