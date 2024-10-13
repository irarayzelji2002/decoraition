import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import useFirestoreSnapshots from "./hooks/useFirestoreSnapshots";
import {
  getAuth,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { fetchUserData } from "./pages/Homepage/backend/HomepageActions";
import { showToast } from "./functions/utils.js";

import "./App.css";
import Login from "./pages/Account/Login.jsx";
import Register from "./pages/Account/Register.jsx";
import Users from "./users.js";
import ChangePassw from "./pages/Account/ChangePass.jsx";
import OneTP from "./pages/Account/Otp.jsx";
import ForgotPass from "./pages/Account/ForgotPass1.jsx";
import Homepage from "./pages/Homepage/Homepage.jsx";
import Details from "./pages/Homepage/Details.jsx";
import Settings from "./pages/Settings/Settings.jsx";
import Design from "./pages/DesignSpace/Design.jsx";
import SeeAllDesigns from "./pages/DesignSpace/SeeAllDesigns.jsx";
import Budget from "./pages/DesignSpace/Budget.jsx";
import AddItem from "./pages/DesignSpace/AddItem.jsx";
import EditItem from "./pages/DesignSpace/EditItem.jsx";
import SearchItem from "./pages/DesignSpace/SearchItem.jsx";
import Project from "./pages/ProjectSpace/Project.jsx";
import ProjBudget from "./pages/ProjectSpace/ProjBudget.jsx";
import PlanMap from "./pages/ProjectSpace/PlanMap.jsx";
import Timeline from "./pages/ProjectSpace/Timeline.jsx";
import AddPin from "./pages/ProjectSpace/AddPin.jsx";
import EditEvent from "./pages/ProjectSpace/EditEvent.jsx";
import ProjSetting from "./pages/Settings/ProjSetting.jsx";
import Version from "./pages/DesignSpace/Version.jsx";
import SeeAllProjects from "./pages/DesignSpace/SeeAllProjects.jsx";
// import ProtectedRoute from "./ProtectedRoute"; // Adjust the path as necessary
// import { Rotate90DegreesCcw } from "@mui/icons-material";

function App() {
  const { user, setUser, loading, setLoading } = useAuth();

  // State for each collection
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [designVersions, setDesignVersions] = useState([]);
  const [comments, setComments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [projectBudgets, setProjectBudgets] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [items, setItems] = useState([]);
  const [planMaps, setPlanMaps] = useState([]);
  const [pins, setPins] = useState([]);
  const [timelines, setTimelines] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const auth = getAuth();
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("Persistence set to browserLocalPersistence");
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
        return () => unsubscribe();
      })
      .catch((error) => {
        console.error("Error setting persistence:", error);
        setLoading(false);
      });
  }, [setUser, setLoading]);

  // Use useFirestoreSnapshots hook to set up real-time listeners
  const isConnected = useFirestoreSnapshots(
    [
      "users",
      "projects",
      "designs",
      "designVersions",
      "comments",
      "notifications",
      "projectBudgets",
      "budgets",
      "items",
      "planMaps",
      "pins",
      "timelines",
      "events",
    ],
    {
      users: setUsers,
      projects: setProjects,
      designs: setDesigns,
      designVersions: setDesignVersions,
      comments: setComments,
      notifications: setNotifications,
      projectBudgets: setProjectBudgets,
      budgets: setBudgets,
      items: setItems,
      planMaps: setPlanMaps,
      pins: setPins,
      timelines: setTimelines,
      events: setEvents,
    },

    user ? user.uid : null
  );

  const sharedProps = {
    user,
    users,
    setUsers,
    projects,
    setProjects,
    designs,
    setDesigns,
    designVersions,
    setDesignVersions,
    comments,
    setComments,
    notifications,
    setNotifications,
    projectBudgets,
    setProjectBudgets,
    budgets,
    setBudgets,
    items,
    setItems,
    planMaps,
    setPlanMaps,
    pins,
    setPins,
    timelines,
    setTimelines,
    events,
    setEvents,
  };

  const beforeLoginSharedProps = {
    user,
    users,
    setUsers,
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    showToast("error", "Please log in");
    return <div>Please log in</div>;
  }

  if (!isConnected) {
    return <div>Connecting to Firestore...</div>;
  }

  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login {...beforeLoginSharedProps} />} /> {/*Checked */}
            <Route path="/register" element={<Register {...beforeLoginSharedProps} />} />{" "}
            {/*Checked */}
            <Route path="/" element={<Login {...beforeLoginSharedProps} />} /> {/*Checked */}
            <Route path="/forgot" element={<ForgotPass {...beforeLoginSharedProps} />} />{" "}
            {/*Checked */}
            <Route path="/change" element={<ChangePassw {...beforeLoginSharedProps} />} />{" "}
            {/*Checked */}
            <Route path="/otp" element={<OneTP {...beforeLoginSharedProps} />} />
            <Route path="/homepage" element={<Homepage {...sharedProps} />} /> {/*Checked */}
            <Route path="/details" element={<Details />} />
            <Route path="/settings" element={<Settings {...sharedProps} />} />
            {/*Checked */}
            {/* DESIGN SPACE */}
            <Route path="/design/:designId" element={<Design {...sharedProps} />} />
            <Route path="/searchItem" element={<SearchItem {...sharedProps} />} />
            <Route path="/addItem/:designId" element={<AddItem {...sharedProps} />} />
            <Route path="/editItem/:designId/:itemId" element={<EditItem {...sharedProps} />} />
            <Route path="/users" element={<Users {...sharedProps} />} />
            <Route path="/budget/:designId" element={<Budget {...sharedProps} />} />
            <Route path="/seeAllProjects" element={<SeeAllProjects {...sharedProps} />} />
            <Route path="/seeAllDesigns" element={<SeeAllDesigns {...sharedProps} />} />
            <Route path="/version" element={<Version {...sharedProps} />} />
            {/* PROJECT SPACE */}
            <Route path="/project/:projectId" element={<Project {...sharedProps} />} />
            <Route
              path="/design/:designId/:projectId/project"
              element={<Design {...sharedProps} />}
            />
            <Route
              path="/budget/:designId/:projectId/project"
              element={<Budget {...sharedProps} />}
            />
            <Route
              path="/addItem/:designId/:projectId/project"
              element={<AddItem {...sharedProps} />}
            />
            <Route
              path="/editItem/:designId/:itemId/:projectId/project"
              element={<EditItem {...sharedProps} />}
            />
            <Route path="/planMap/:projectId" element={<PlanMap {...sharedProps} />} />
            <Route path="/timeline/:projectId" element={<Timeline {...sharedProps} />} />
            <Route path="/projBudget/:projectId" element={<ProjBudget {...sharedProps} />} />
            <Route path="/addPin/" element={<AddPin {...sharedProps} />} />
            <Route path="/editEvent/:projectId" element={<EditEvent {...sharedProps} />} />
            <Route path="/projSetting/" element={<ProjSetting {...sharedProps} />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
