// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./pages/Account/Login.js";
import Register from "./pages/Account/Register.js";
import Users from "./users.js";
import ChangePassw from "./pages/Account/ChangePass.js";
import OneTP from "./pages/Account/Otp.js";
import ForgotPass from "./pages/Account/ForgotPass1.js";
import Homepage from "./pages/Homepage/Homepage.js";
import Details from "./pages/Homepage/Details";
import Settings from "./pages/Settings/Settings.js";
import Design from "./pages/DesignSpace/Design.js";
import SeeAllDesigns from "./pages/DesignSpace/SeeAllDesigns.js";
import Budget from "./pages/DesignSpace/Budget.js";
import AddItem from "./pages/DesignSpace/AddItem.js";
import EditItem from "./pages/DesignSpace/EditItem.js";
import SearchItem from "./pages/DesignSpace/SearchItem.js";
import Project from "./pages/ProjectSpace/Project.js";
import ProjBudget from "./pages/ProjectSpace/ProjBudget.js";
import PlanMap from "./pages/ProjectSpace/PlanMap.js";
import Timeline from "./pages/ProjectSpace/Timeline.js";
import AddPin from "./pages/ProjectSpace/AddPin.js";
import EditEvent from "./pages/ProjectSpace/EditEvent";
import ProjectSettings from "./pages/Settings/ProjectSettings.js";
import { AuthProvider } from "./AuthContext"; // Adjust the path as necessary
// import ProtectedRoute from "./ProtectedRoute"; // Adjust the path as necessary
// import { Rotate90DegreesCcw } from "@mui/icons-material";
import { useEffect } from "react";
import {
  getAuth,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

function App() {
  useEffect(() => {
    const auth = getAuth();
    // Set persistence to local so the user stays logged in across sessions.
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        // Check if the user is logged in or not
        onAuthStateChanged(auth, (user) => {
          if (user) {
            // User is signed in, you can set the user state here
            console.log("User is logged in:", user);
          } else {
            // No user is signed in, redirect to login page or handle accordingly
            console.log("No user logged in");
          }
        });
      })
      .catch((error) => {
        console.error("Error with setting persistence:", error);
      });
  }, []);
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Login />} />
          <Route path="/forgot" element={<ForgotPass />} />
          <Route path="/change" element={<ChangePassw />} />
          <Route path="/otp" element={<OneTP />} />
          <Route path="/homepage" element={<Homepage />} />
          <Route path="/details" element={<Details />} />
          <Route path="/settings" element={<Settings />} />
          {/* Use a dynamic ID for the design route */}
          {/* <Route
            path="/homepage"
            element={<ProtectedRoute element={<Homepage />} />}
          />
          <Route
            path="/settings"
            element={<ProtectedRoute element={<Settings />} />}
          />
          <Route
            path="/design"
            element={<ProtectedRoute element={<Design />} />}
          />
          <Route
            path="/users"
            element={<ProtectedRoute element={<Users />} />}
          /> */}

          {/* DESIGN SPACE */}
          {/* <Route path="/design" element={<Design />} /> */}
          <Route path="/design/:designId" element={<Design />} />
          <Route path="/searchItem" element={<SearchItem />} />
          <Route path="/addItem" element={<AddItem />} />
          <Route path="/editItem" element={<EditItem />} />
          <Route path="/users" element={<Users />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/seeAllDesigns" element={<SeeAllDesigns />} />

          {/* PROJECT SPACE */}
          <Route path="/project" element={<Project />} />
          <Route path="/planMap" element={<PlanMap />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/projectBudget" element={<ProjBudget />} />
          <Route path="/addPin" element={<AddPin />} />
          <Route path="/editEvent" element={<EditEvent />} />
          <Route path="/projSetting" element={<ProjectSettings />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
