import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { SharedPropsProvider } from "./contexts/SharedPropsContext";
import { useAuth } from "./contexts/AuthContext.js";

import "./App.css";
import Layout from "./components/Layout.jsx";
import Loading from "./components/Loading.jsx";
import Landing from "./pages/Landing/Landing.jsx";
import Login from "./pages/Account/Login.jsx";
import Register from "./pages/Account/Register.jsx";
import Users from "./users.js";
import ChangePassw from "./pages/Account/ChangePass.jsx";
import OneTP from "./pages/Account/Otp.jsx";
import ForgotPass from "./pages/Account/ForgotPass1.jsx";
import Homepage from "./pages/Homepage/Homepage.jsx";
import Details from "./pages/Homepage/Details.jsx";
import SeeAllDesigns from "./pages/Homepage/SeeAllDesigns.jsx";
import SeeAllProjects from "./pages/Homepage/SeeAllProjects.jsx";
import Settings from "./pages/Settings/Settings.jsx";
import Design from "./pages/DesignSpace/Design.jsx";
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
import DesignSettings from "./pages/DesignSpace/DesignSettings.jsx";

function ProtectedRoute({ children }) {
  const { user, userDoc, userDocFetched } = useAuth();
  if (!userDocFetched) return <Loading />;
  if (!user || !userDoc) return <Navigate to="/login" replace />;
  return children;
}

function AuthPublicRoute({ children }) {
  const { user, userDoc, userDocFetched } = useAuth();
  if (!userDocFetched) return <Loading />;
  if (user && userDoc) return <Navigate to="/homepage" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <div className="App">
        <Layout>
          <SharedPropsProvider>
            <Routes>
              {/* PUBLIC ROUTES */}
              <Route path="/" element={<Landing />} />
              <Route path="/landing" element={<Landing />} />

              {/* AUTH PUBLIC ROUTES */}
              <Route
                path="/login"
                element={
                  <AuthPublicRoute>
                    <Login />
                  </AuthPublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <AuthPublicRoute>
                    <Register />
                  </AuthPublicRoute>
                }
              />
              <Route
                path="/forgot"
                element={
                  <AuthPublicRoute>
                    <ForgotPass />
                  </AuthPublicRoute>
                }
              />
              <Route
                path="/change"
                element={
                  <AuthPublicRoute>
                    <ChangePassw />
                  </AuthPublicRoute>
                }
              />
              <Route
                path="/otp"
                element={
                  <AuthPublicRoute>
                    <OneTP />
                  </AuthPublicRoute>
                }
              />
              {/* PROTECTED ROUTES */}
              {/* Homepage */}
              <Route
                path="/homepage"
                element={
                  <ProtectedRoute>
                    <Homepage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/version"
                element={
                  <ProtectedRoute>
                    <Version />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seeAllDesigns"
                element={
                  <ProtectedRoute>
                    <SeeAllDesigns />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seeAllProjects"
                element={
                  <ProtectedRoute>
                    <SeeAllProjects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/details/:designId"
                element={
                  <ProtectedRoute>
                    <Details />
                  </ProtectedRoute>
                }
              />
              {/* Account */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              {/* Design Space */}
              <Route
                path="/design/:designId"
                element={
                  <ProtectedRoute>
                    <Design />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/setting/:designId"
                element={
                  <ProtectedRoute>
                    <DesignSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/budget/:designId"
                element={
                  <ProtectedRoute>
                    <Budget />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/searchItem"
                element={
                  <ProtectedRoute>
                    <SearchItem />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/addItem/:designId"
                element={
                  <ProtectedRoute>
                    <AddItem />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editItem/:designId/:itemId"
                element={
                  <ProtectedRoute>
                    <EditItem />
                  </ProtectedRoute>
                }
              />
              {/* Project Space */}
              <Route
                path="/project/:projectId"
                element={
                  <ProtectedRoute>
                    <Project />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projSetting/:projectId"
                element={
                  <ProtectedRoute>
                    <ProjSetting />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/design/:designId/:projectId/project"
                element={
                  <ProtectedRoute>
                    <Design />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/planMap/:projectId"
                element={
                  <ProtectedRoute>
                    <PlanMap />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/addPin"
                element={
                  <ProtectedRoute>
                    <AddPin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/timeline/:projectId"
                element={
                  <ProtectedRoute>
                    <Timeline />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editEvent/:projectId"
                element={
                  <ProtectedRoute>
                    <EditEvent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projectBudget/:projectId"
                element={
                  <ProtectedRoute>
                    <ProjBudget />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/budget/:designId/:projectId/project"
                element={
                  <ProtectedRoute>
                    <Budget />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/addItem/:designId/:projectId/project"
                element={
                  <ProtectedRoute>
                    <AddItem />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editItem/:designId/:itemId/:projectId/project"
                element={
                  <ProtectedRoute>
                    <EditItem />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </SharedPropsProvider>
        </Layout>
      </div>
    </Router>
  );
}

export default App;
