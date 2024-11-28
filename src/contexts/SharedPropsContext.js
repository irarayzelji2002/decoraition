import React, { useState, useEffect, createContext, useContext } from "react";
import { useAuth } from "./AuthContext.js";
import useFirestoreSnapshots from "../hooks/useFirestoreSnapshots";
import {
  getAuth,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import Loading from "../components/Loading.jsx";
import LoadingPage from "../components/LoadingPage.jsx";

const SharedPropsContext = createContext();

const initialState = {
  users: [],
  projects: [],
  designs: [],
  designVersions: [],
  comments: [],
  notifications: [],
  projectBudgets: [],
  budgets: [],
  items: [],
  planMaps: [],
  pins: [],
  timelines: [],
  events: [],
  userProjects: [],
  userDesigns: [],
  userDesignVersions: [],
  userDesignsComments: [],
  userComments: [],
  userReplies: [],
  userNotifications: [],
  userProjectBudgets: [],
  userBudgets: [],
  userItems: [],
  userPlanMaps: [],
  userPins: [],
  userTimelines: [],
  userEvents: [],
  isDarkMode: true,
};

export function SharedPropsProvider({ children }) {
  const { user, setUser, userDoc, setUserDoc, handleLogout, loading, setLoading } = useAuth() || {};

  const [state, setState] = useState(initialState);

  const setUsers = (users) => setState((prev) => ({ ...prev, users }));
  const setProjects = (projects) => setState((prev) => ({ ...prev, projects }));
  const setDesigns = (designs) => setState((prev) => ({ ...prev, designs }));
  const setDesignVersions = (designVersions) => setState((prev) => ({ ...prev, designVersions }));
  const setComments = (comments) => setState((prev) => ({ ...prev, comments }));
  const setNotifications = (notifications) => setState((prev) => ({ ...prev, notifications }));
  const setProjectBudgets = (projectBudgets) => setState((prev) => ({ ...prev, projectBudgets }));
  const setBudgets = (budgets) => setState((prev) => ({ ...prev, budgets }));
  const setItems = (items) => setState((prev) => ({ ...prev, items }));
  const setPlanMaps = (planMaps) => setState((prev) => ({ ...prev, planMaps }));
  const setPins = (pins) => setState((prev) => ({ ...prev, pins }));
  const setTimelines = (timelines) => setState((prev) => ({ ...prev, timelines }));
  const setEvents = (events) => setState((prev) => ({ ...prev, events }));
  const setUserProjects = (userProjects) => setState((prev) => ({ ...prev, userProjects }));
  const setUserDesigns = (userDesigns) => setState((prev) => ({ ...prev, userDesigns }));
  const setUserDesignVersions = (userDesignVersions) =>
    setState((prev) => ({ ...prev, userDesignVersions }));
  const setUserDesignsComments = (userDesignsComments) =>
    setState((prev) => ({ ...prev, userDesignsComments }));
  const setUserComments = (userComments) => setState((prev) => ({ ...prev, userComments }));
  const setUserReplies = (userReplies) => setState((prev) => ({ ...prev, userReplies }));
  const setUserNotifications = (userNotifications) =>
    setState((prev) => ({ ...prev, userNotifications }));
  const setUserProjectBudgets = (userProjectBudgets) =>
    setState((prev) => ({ ...prev, userProjectBudgets }));
  const setUserBudgets = (userBudgets) => setState((prev) => ({ ...prev, userBudgets }));
  const setUserItems = (userItems) => setState((prev) => ({ ...prev, userItems }));
  const setUserPlanMaps = (userPlanMaps) => setState((prev) => ({ ...prev, userPlanMaps }));
  const setUserPins = (userPins) => setState((prev) => ({ ...prev, userPins }));
  const setUserTimelines = (userTimelines) => setState((prev) => ({ ...prev, userTimelines }));
  const setUserEvents = (userEvents) => setState((prev) => ({ ...prev, userEvents }));
  const setIsDarkMode = (isDarkMode) => setState((prev) => ({ ...prev, isDarkMode }));

  useEffect(() => {
    const auth = getAuth();
    const savedAuthState = localStorage.getItem("authState");

    if (!savedAuthState) {
      // No saved auth state, don't set up persistence or listener
      setLoading(false);
      return;
    }

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
  const generalCollections = [
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
  ];
  const userRelatedCollections = [
    "userDoc",
    "userProjects",
    "userDesigns",
    "userDesignVersions",
    "userDesignsComments",
    "userComments",
    "userReplies",
    "userNotifications",
    "userProjectBudgets",
    "userBudgets",
    "userItems",
    "userPlanMaps",
    "userPins",
    "userTimelines",
    "userEvents",
  ];
  const generalCollectionsStateSetterFunctions = {
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
  };
  const userRelatedCollectionsStateSetterFunctions = {
    userDoc: setUserDoc,
    userProjects: setUserProjects,
    userDesigns: setUserDesigns,
    userDesignVersions: setUserDesignVersions,
    userDesignsComments: setUserDesignsComments,
    userComments: setUserComments,
    userReplies: setUserReplies,
    userNotifications: setUserNotifications,
    userProjectBudgets: setUserProjectBudgets,
    userBudgets: setUserBudgets,
    userItems: setUserItems,
    userPlanMaps: setUserPlanMaps,
    userPins: setUserPins,
    userTimelines: setUserTimelines,
    userEvents: setUserEvents,
  };

  const { isUserDataLoaded, isCollectionLoaded } = useFirestoreSnapshots(
    [...generalCollections, ...userRelatedCollections],
    {
      ...generalCollectionsStateSetterFunctions,
      ...userRelatedCollectionsStateSetterFunctions,
    },
    user ? user : null
  );

  const appURL = process.env.REACT_APP_URL;

  const sharedProps = {
    ...state,
    user,
    setUser,
    userDoc,
    setUserDoc,
    handleLogout,
    loading,
    setLoading,
    appURL,
    setUsers,
    setProjects,
    setDesigns,
    setDesignVersions,
    setComments,
    setNotifications,
    setProjectBudgets,
    setBudgets,
    setItems,
    setPlanMaps,
    setPins,
    setTimelines,
    setEvents,
    setUserProjects,
    setUserDesigns,
    setUserDesignVersions,
    setUserDesignsComments,
    setUserComments,
    setUserReplies,
    setUserNotifications,
    setUserProjectBudgets,
    setUserBudgets,
    setUserItems,
    setUserPlanMaps,
    setUserPins,
    setUserTimelines,
    setUserEvents,
    setIsDarkMode,
  };

  // useEffect for debugging (!!! Remove before production !!!)
  useEffect(() => {
    console.log("User updated:", user);
  }, [user]);
  useEffect(() => {
    console.log("UserDoc updated:", userDoc);
  }, [userDoc]);
  useEffect(() => {
    console.log("Projects updated:", state.projects);
  }, [state.projects]);
  useEffect(() => {
    console.log("Designs updated:", state.designs);
  }, [state.designs]);
  useEffect(() => {
    console.log("Design Versions updated:", state.designVersions);
  }, [state.designVersions]);
  useEffect(() => {
    console.log("Comments updated:", state.comments);
  }, [state.comments]);
  useEffect(() => {
    console.log("Notifications updated:", state.notifications);
  }, [state.notifications]);
  useEffect(() => {
    console.log("Project Budgets updated:", state.projectBudgets);
  }, [state.projectBudgets]);
  useEffect(() => {
    console.log("Budgets updated:", state.budgets);
  }, [state.budgets]);
  useEffect(() => {
    console.log("Items updated:", state.items);
  }, [state.items]);
  useEffect(() => {
    console.log("Plan Maps updated:", state.planMaps);
  }, [state.planMaps]);
  useEffect(() => {
    console.log("Pins updated:", state.pins);
  }, [state.pins]);
  useEffect(() => {
    console.log("Timelines updated:", state.timelines);
  }, [state.timelines]);
  useEffect(() => {
    console.log("Events updated:", state.events);
  }, [state.events]);
  useEffect(() => {
    console.log("User Projects updated:", state.userProjects);
  }, [state.userProjects]);
  useEffect(() => {
    console.log("User Designs updated:", state.userDesigns);
  }, [state.userDesigns]);
  useEffect(() => {
    console.log("User Design Versions updated:", state.userDesignVersions);
  }, [state.userDesignVersions]);
  useEffect(() => {
    console.log("User Design Comments updated:", state.userDesignsComments);
  }, [state.userDesignsComments]);
  useEffect(() => {
    console.log("User Comments updated:", state.userComments);
  }, [state.userComments]);
  useEffect(() => {
    console.log("User Replies updated:", state.userReplies);
  }, [state.userReplies]);
  useEffect(() => {
    console.log("User Notifications updated:", state.userNotifications);
  }, [state.userNotifications]);
  useEffect(() => {
    console.log("User Project Budgets updated:", state.userProjectBudgets);
  }, [state.userProjectBudgets]);
  useEffect(() => {
    console.log("User Budgets updated:", state.userBudgets);
  }, [state.userBudgets]);
  useEffect(() => {
    console.log("User Items updated:", state.userItems);
  }, [state.userItems]);
  useEffect(() => {
    console.log("User Plan Maps updated:", state.userPlanMaps);
  }, [state.userPlanMaps]);
  useEffect(() => {
    console.log("User Pins updated:", state.userPins);
  }, [state.userPins]);
  useEffect(() => {
    console.log("User Timelines updated:", state.userTimelines);
  }, [state.userTimelines]);
  useEffect(() => {
    console.log("User Events updated:", state.userEvents);
  }, [state.userEvents]);
  useEffect(() => {
    console.log("Dark Mode updated:", state.isDarkMode);
  }, [state.isDarkMode]);

  if (!isCollectionLoaded || loading) {
    return (
      <SharedPropsContext.Provider value={sharedProps}>
        <LoadingPage />
      </SharedPropsContext.Provider>
    );
  }

  return <SharedPropsContext.Provider value={sharedProps}>{children}</SharedPropsContext.Provider>;
}

export function useSharedProps() {
  const context = useContext(SharedPropsContext);
  if (!context) {
    throw new Error("useSharedProps must be used within a SharedPropsProvider");
  }
  return context;
}
