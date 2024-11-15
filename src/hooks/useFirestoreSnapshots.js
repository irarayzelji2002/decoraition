import { useState, useEffect } from "react";
import { isEqual } from "lodash";
import { initializeApp as initializeClientApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  documentId,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};
const clientApp = initializeClientApp(firebaseConfig);
const db = getFirestore(clientApp);

const useFirestoreSnapshots = (collections, stateSetterFunctions, user) => {
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
  const [isCollectionLoaded, setIsCollectionLoaded] = useState(false);

  // Effect for general collections
  useEffect(() => {
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
    const unsubscribeCallbacks = [];

    collections.forEach((collectionName) => {
      if (!generalCollections.includes(collectionName)) {
        // console.warn(`Warning: ${collectionName} is not a general collection.`);
        return;
      }

      const collectionRef = collection(db, collectionName);

      const unsubscribe = onSnapshot(
        collectionRef,
        (querySnapshot) => {
          const stateSetter = stateSetterFunctions[collectionName];
          if (stateSetter) {
            const updatedData = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            stateSetter(updatedData);
            console.log(
              `State updated for collection: ${collectionName} with ${updatedData.length} items`
            );
          } else {
            console.error(`No state setter found for collection: ${collectionName}`);
          }
        },
        (error) => {
          console.error(`Error in snapshot listener for ${collectionName}:`, error);
        }
      );

      unsubscribeCallbacks.push(unsubscribe);
    });

    setIsCollectionLoaded(true);

    return () => {
      unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  // Effect for user-related data
  useEffect(() => {
    const userRelatedCollections = [
      "userDoc",
      "userProjects",
      "userDesigns",
      "userDesignVersions",
      "userDesignsComments",
      "userComments",
      "userNotifications",
      "userProjectBudgets",
      "userBudgets",
      "userItems",
      "userPlanMaps",
      "userPins",
      "userTimelines",
      "userEvents",
    ];
    const collectionMapping = {
      userDoc: "users",
      userProjects: "projects",
      userDesigns: "designs",
      userDesignVersions: "designVersions",
      userDesignsComments: "comments",
      userComments: "comments",
      userNotifications: "notifications",
      userProjectBudgets: "projectBudgets",
      userBudgets: "budgets",
      userItems: "items",
      userPlanMaps: "planMaps",
      userPins: "pins",
      userTimelines: "timelines",
      userEvents: "events",
    };
    const dependencyMap = {
      userDesignVersions: ["userDesigns"],
      userDesignsComments: ["userDesignVersions"],
      userProjectBudgets: ["userProjects"],
      userBudgets: ["userProjectBudgets", "userDesigns"],
      userItems: ["userBudgets"],
      userPlanMaps: ["userProjects"],
      userPins: ["userPlanMaps"],
      userTimelines: ["userProjects"],
      userEvents: ["userTimelines"],
    };
    const fetchFunctions = {
      userDoc: (user) => fetchUserDoc(user),
      userProjects: (user) => fetchUserProjects(user),
      userDesigns: (user) => fetchUserDesigns(user),
      userDesignVersions: (designsSnapshot) => fetchUserDesignVersions(designsSnapshot),
      userDesignsComments: (designVersionsSnapshot) =>
        fetchUserDesignsComments(designVersionsSnapshot),
      userComments: (user) => fetchUserComments(user),
      userNotifications: (user) => fetchUserNotifications(user),
      userProjectBudgets: (projectsSnapshot) => fetchUserProjectBudgets(projectsSnapshot),
      userBudgets: (projectBudgetsSnapshot, designsSnapshot) =>
        fetchUserBudgets(projectBudgetsSnapshot, designsSnapshot),
      userItems: (budgetsSnapshot) => fetchUserItems(budgetsSnapshot),
      userPlanMaps: (projectsSnapshot) => fetchUserPlanMaps(projectsSnapshot),
      userPins: (planMapsSnapshot) => fetchUserPins(planMapsSnapshot),
      userTimelines: (projectsSnapshot) => fetchUserTimelines(projectsSnapshot),
      userEvents: (timelinesSnapshot) => fetchUserEvents(timelinesSnapshot),
    };

    if (!user) {
      setIsUserDataLoaded(false);
      console.log("User is null, not setting up listeners");
      return;
    }

    const unsubscribers = [];

    const setupListener = (userDataName, fetchFunction) => {
      if (!userRelatedCollections.includes(userDataName)) {
        // console.warn(`Warning: ${collectionName} is not a user-related collection`);
        return;
      }
      const collectionName = collectionMapping[userDataName];
      if (!collectionName) {
        console.warn(`Warning: No collection mapping found for ${userDataName}`);
        return;
      }
      let isProcessingDependentUpdate = false;

      const unsubscribe = onSnapshot(collection(db, collectionName), async () => {
        try {
          // Skip if this update is from a dependent collection
          if (isProcessingDependentUpdate && userDataName === "userItems") {
            return;
          }
          const { snapshot: newSnapshot, data: newData } = await fetchFunction();
          const currentData = stateSetterFunctions[userDataName]();
          if (!isEqual(newData, currentData)) {
            stateSetterFunctions[userDataName](newData);
            console.log(
              `State updated for user data: ${userDataName} with ${newData.length} items`
            );

            // Check and update dependent collections
            const dependents = Object.keys(dependencyMap).filter((key) =>
              dependencyMap[key].includes(userDataName)
            );

            if (dependents.length > 0) {
              isProcessingDependentUpdate = true;
              for (const dependent of dependents) {
                const dependentFetchFunction = fetchFunctions[dependent];
                if (dependentFetchFunction) {
                  try {
                    let dependentNewData;
                    if (dependent === "userBudgets") {
                      // Special case for userBudgets
                      let projectBudgetsSnapshot, designsSnapshot;
                      if (userDataName === "userProjectBudgets") {
                        projectBudgetsSnapshot = newSnapshot;
                        const dependentFetchFunction = fetchFunctions["userDesigns"];
                        const { snapshot: fetchedDesignsSnapshot } = await dependentFetchFunction(
                          user
                        );
                        designsSnapshot = fetchedDesignsSnapshot;
                      } else if (userDataName === "userDesigns") {
                        designsSnapshot = newSnapshot;
                        const dependentFetchFunction = fetchFunctions["userProjectBudgets"];
                        const { snapshot: fetchedProjectBudgetsSnapshot } =
                          await dependentFetchFunction(user);
                        projectBudgetsSnapshot = fetchedProjectBudgetsSnapshot;
                      }
                      const { data } = await dependentFetchFunction(
                        projectBudgetsSnapshot,
                        designsSnapshot
                      );
                      dependentNewData = data;
                    } else {
                      // For all other cases
                      const { data } = await dependentFetchFunction(newSnapshot);
                      dependentNewData = data;
                    }
                    const currentDependentData = stateSetterFunctions[dependent]();
                    if (!isEqual(dependentNewData, currentDependentData)) {
                      stateSetterFunctions[dependent](dependentNewData);
                      console.log(
                        `State updated for dependent user data: ${dependent} with ${dependentNewData.length} items`
                      );
                    }
                  } catch (error) {
                    console.error(`Error updating dependent data for ${dependent}:`, error);
                  }
                }
              }
              isProcessingDependentUpdate = false;
            }
          }
        } catch (error) {
          console.error(`Error updating ${userDataName}:`, error);
        }
      });
      unsubscribers.push(unsubscribe);
    };

    const fetchData = async () => {
      try {
        const { data: userDocData } = await fetchUserDoc(user);
        stateSetterFunctions.userDoc(userDocData);
        setupListener("userDoc", () => fetchUserDoc(user));

        const { snapshot: projectsSnapshot, data: projectsData } = await fetchUserProjects(user);
        stateSetterFunctions.userProjects(projectsData);
        setupListener("userProjects", () => fetchUserProjects(user));

        const { snapshot: designsSnapshot, data: designsData } = await fetchUserDesigns(user);
        stateSetterFunctions.userDesigns(designsData);
        setupListener("userDesigns", () => fetchUserDesigns(user));

        const { snapshot: designVersionsSnapshot, data: designVersionsData } =
          await fetchUserDesignVersions(designsSnapshot);
        stateSetterFunctions.userDesignVersions(designVersionsData);
        setupListener("userDesignVersions", () => fetchUserDesignVersions(designsSnapshot));

        const { data: designsCommentsData } = await fetchUserDesignsComments(
          designVersionsSnapshot
        );
        stateSetterFunctions.userDesignsComments(designsCommentsData);
        setupListener("userDesignsComments", () =>
          fetchUserDesignsComments(designVersionsSnapshot)
        );

        const { data: userCommentsData } = await fetchUserComments(user);
        stateSetterFunctions.userComments(userCommentsData);
        setupListener("userComments", () => fetchUserComments(user));

        const { data: notificationsData } = await fetchUserNotifications(user);
        stateSetterFunctions.userNotifications(notificationsData);
        setupListener("userNotifications", () => fetchUserNotifications(user));

        const { snapshot: projectBudgetsSnapshot, data: projectBudgetsData } =
          await fetchUserProjectBudgets(projectsSnapshot);
        stateSetterFunctions.userProjectBudgets(projectBudgetsData);
        setupListener("userProjectBudgets", () => fetchUserProjectBudgets(projectsSnapshot));

        const { snapshot: budgetsSnapshot, data: budgetsData } = await fetchUserBudgets(
          projectBudgetsSnapshot,
          designsSnapshot
        );
        stateSetterFunctions.userBudgets(budgetsData);
        setupListener("userBudgets", () =>
          fetchUserBudgets(projectBudgetsSnapshot, designsSnapshot)
        );

        const { data: itemsData } = await fetchUserItems(budgetsSnapshot);
        stateSetterFunctions.userItems(itemsData);
        setupListener("userItems", () => fetchUserItems(budgetsSnapshot));

        const { snapshot: planMapsSnapshot, data: planMapsData } = await fetchUserPlanMaps(
          projectsSnapshot
        );
        stateSetterFunctions.userPlanMaps(planMapsData);
        setupListener("userPlanMaps", () => fetchUserPlanMaps(projectsSnapshot));

        const { data: pinsData } = await fetchUserPins(planMapsSnapshot);
        stateSetterFunctions.userPins(pinsData);
        setupListener("userPins", () => fetchUserPins(planMapsSnapshot));

        const { snapshot: timelinesSnapshot, data: timelinesData } = await fetchUserTimelines(
          projectsSnapshot
        );
        stateSetterFunctions.userTimelines(timelinesData);
        setupListener("userTimelines", () => fetchUserTimelines(projectsSnapshot));

        const { data: eventsData } = await fetchUserEvents(timelinesSnapshot);
        stateSetterFunctions.userEvents(eventsData);
        setupListener("userEvents", () => fetchUserEvents(timelinesSnapshot));

        setIsUserDataLoaded(true);
      } catch (error) {
        console.error("Error fetching user data (snapshots):", error);
        setIsUserDataLoaded(false);
      }
    };

    fetchData();

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [user]);

  return {
    isUserDataLoaded,
    isCollectionLoaded,
  };
};

// Helper function to batch arrays into chunks of 30
const batchIntoChunks = (array, chunkSize = 30) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Combine all snapshots divided from chunks into one
const combineSnapshots = (snapshots) => {
  if (!snapshots || snapshots.length === 0) return null;
  const allDocs = snapshots.flatMap((snapshot) => snapshot.docs || []);
  const mockSnapshot = {
    // Essential properties
    docs: allDocs,
    empty: allDocs.length === 0,
    size: allDocs.length,

    // Essential methods
    forEach: (callback) => allDocs.forEach(callback),
    map: (callback) => allDocs.map(callback),
    flatMap: (callback) => allDocs.flatMap(callback),
    filter: (callback) => allDocs.filter(callback),

    // Additional QuerySnapshot methods if needed
    docChanges: () => [],
    metadata: snapshots[0]?.metadata || {},
    query: snapshots[0]?.query || {},

    // Helper method to check if snapshot exists
    exists: () => allDocs.length > 0,
  };

  return mockSnapshot;
};

//get user's document
const fetchUserDoc = async (user) => {
  if (!user) {
    return { snapshot: null, data: [] };
  }
  const userDocRef = doc(db, "users", user.uid);
  const userDocSnapshot = await getDoc(userDocRef);
  const data = { id: userDocSnapshot.id, ...userDocSnapshot.data() };
  const snapshot = userDocSnapshot;
  return { snapshot, data };
};

//get all projects with user's document in users collection projects field projects: [{projectId: string, role: int}]
const fetchUserProjects = async (user) => {
  if (!user) {
    return { snapshot: null, data: [] };
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) return { snapshots: [], data: [] };
  const userData = userDoc.data();
  const projectIds = userData?.projects?.map((p) => p.projectId) || [];
  if (projectIds.length === 0) {
    return { snapshot: null, data: [] };
  }
  const batches = batchIntoChunks(projectIds);
  const projectsSnapshots = await Promise.all(
    batches.map((batch) =>
      getDocs(query(collection(db, "projects"), where(documentId(), "in", batch)))
    )
  );
  const data = projectsSnapshots.flatMap((snapshot) =>
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  );
  const snapshot = combineSnapshots(projectsSnapshots);
  return { snapshot, data };
};

//get all designs with user's document in users collection designs field designs: [{designId: string, role: int}]
const fetchUserDesigns = async (user) => {
  if (!user) {
    return { snapshot: null, data: [] };
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) return { snapshots: [], data: [] };
  const userData = userDoc.data();
  const designIds = userData?.designs?.map((d) => d.designId) || [];
  if (designIds.length === 0) {
    return { snapshot: null, data: [] };
  }
  const batches = batchIntoChunks(designIds);
  const designsSnapshots = await Promise.all(
    batches.map((batch) =>
      getDocs(query(collection(db, "designs"), where(documentId(), "in", batch)))
    )
  );
  const data = designsSnapshots.flatMap((snapshot) =>
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  );
  const snapshot = combineSnapshots(designsSnapshots);
  return { snapshot, data };
};

//get all designVersions of userDesigns through the history field history: array of designVersionIds in designs collection
const fetchUserDesignVersions = async (designsSnapshot) => {
  if (!designsSnapshot || designsSnapshot.empty || !designsSnapshot.docs) {
    return { snapshot: null, data: [] };
  }
  const designVersionIds = designsSnapshot.docs.flatMap((doc) => doc.data().history || []);
  if (designVersionIds.length === 0) {
    return { snapshot: null, data: [] };
  }
  const batches = batchIntoChunks(designVersionIds);
  const designVersionsSnapshots = await Promise.all(
    batches.map((batch) =>
      getDocs(query(collection(db, "designVersions"), where(documentId(), "in", batch)))
    )
  );
  const data = designVersionsSnapshots.flatMap((snapshot) =>
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  );
  const snapshot = combineSnapshots(designVersionsSnapshots);
  return { snapshot, data };
};

//get all comments in userDesigns, meaning designVersionImageId of comments collection is in userDesignVersions
const fetchUserDesignsComments = async (designVersionsSnapshot) => {
  if (!designVersionsSnapshot || designVersionsSnapshot.empty || !designVersionsSnapshot.docs) {
    return { snapshot: null, data: [] };
  }
  const imageIds = designVersionsSnapshot.docs.flatMap((doc) =>
    (doc.data().images || []).map((img) => img.imageId)
  );
  if (imageIds.length === 0) {
    return { snapshot: null, data: [] };
  }
  const batches = batchIntoChunks(imageIds);
  const commentsSnapshots = await Promise.all(
    batches.map((batch) =>
      getDocs(query(collection(db, "comments"), where(documentId(), "in", batch)))
    )
  );
  const data = commentsSnapshots.flatMap((snapshot) =>
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  );
  const snapshot = combineSnapshots(commentsSnapshots);
  return { snapshot, data };
};

//get all user's comments in comments collection where userId = user's id
const fetchUserComments = async (user) => {
  if (!user) {
    return { snapshot: null, data: [] };
  }
  const userCommentsSnapshot = await getDocs(
    query(collection(db, "comments"), where("userId", "==", user.uid))
  );
  const data = userCommentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const snapshot = userCommentsSnapshot;
  return { snapshot, data };
};

//get all notifications where userId = user's id
const fetchUserNotifications = async (user) => {
  if (!user) {
    return { snapshot: null, data: [] };
  }
  const userNotificationsSnapshot = await getDocs(
    query(collection(db, "notifications"), where("userId", "==", user.uid))
  );
  const data = userNotificationsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const snapshot = userNotificationsSnapshot;
  return { snapshot, data };
};

//get all user-related project budget by matching userProjects's project's projectBudgetId field in the projectBudget collection
const fetchUserProjectBudgets = async (projectsSnapshot) => {
  if (!projectsSnapshot || projectsSnapshot.empty || !projectsSnapshot.docs) {
    return { snapshot: null, data: [] };
  }
  const projectBudgetIds = projectsSnapshot.docs
    .map((doc) => doc.data().projectBudgetId)
    .filter(Boolean);
  if (projectBudgetIds.length === 0) {
    return { snapshot: null, data: [] };
  }
  const batches = batchIntoChunks(projectBudgetIds);
  const projectBudgetsSnapshots = await Promise.all(
    batches.map((batch) =>
      getDocs(query(collection(db, "projectBudgets"), where(documentId(), "in", batch)))
    )
  );
  const data = projectBudgetsSnapshots.flatMap((snapshot) =>
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  );
  const snapshot = combineSnapshots(projectBudgetsSnapshots);
  return { snapshot, data };
};

//get all user-related budgets from the budgets array field of userProjectBudgets's documents AND also from the budgetId field of userDesigns's documents in the budgets collection
const fetchUserBudgets = async (projectBudgetsSnapshot, designsSnapshot) => {
  let budgetIdsFromProjects = [];
  let budgetIdsFromDesigns = [];
  if (projectBudgetsSnapshot && !projectBudgetsSnapshot.empty) {
    budgetIdsFromProjects =
      projectBudgetsSnapshot?.docs.flatMap((doc) => doc.data().budgets || []) || [];
  }
  if (designsSnapshot && !designsSnapshot.empty) {
    budgetIdsFromDesigns =
      designsSnapshot?.docs.map((doc) => doc.data().budgetId).filter(Boolean) || [];
  }
  const allBudgetIds = [...new Set([...budgetIdsFromProjects, ...budgetIdsFromDesigns])];
  if (allBudgetIds.length === 0) {
    return { snapshot: null, data: [] };
  }
  const batches = batchIntoChunks(allBudgetIds);
  const budgetsSnapshots = await Promise.all(
    batches.map((batch) =>
      getDocs(query(collection(db, "budgets"), where(documentId(), "in", batch)))
    )
  );
  const data = budgetsSnapshots.flatMap((snapshot) =>
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  );
  const snapshot = combineSnapshots(budgetsSnapshots);
  return { snapshot, data };
};

//get all user-related items from the items array field of userBudgets's documents in the items collection
const fetchUserItems = async (budgetsSnapshot) => {
  if (!budgetsSnapshot || budgetsSnapshot.empty || !budgetsSnapshot.docs) {
    return { snapshot: null, data: [] };
  }
  const itemIds = budgetsSnapshot.docs.flatMap((doc) => doc.data().items || []);
  if (itemIds.length === 0) {
    return { snapshot: null, data: [] };
  }
  const batches = batchIntoChunks(itemIds);
  const itemsSnapshots = await Promise.all(
    batches.map((batch) =>
      getDocs(query(collection(db, "items"), where(documentId(), "in", batch)))
    )
  );
  const data = itemsSnapshots.flatMap((snapshot) =>
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  );
  const snapshot = combineSnapshots(itemsSnapshots);
  return { snapshot, data };
};

//get all user-related plan maps by matching userProjects's project's planMapId field in the planMaps collection
const fetchUserPlanMaps = async (projectsSnapshot) => {
  if (!projectsSnapshot || projectsSnapshot.empty || !projectsSnapshot.docs) {
    return { snapshot: null, data: [] };
  }
  const planMapIds = projectsSnapshot.docs.map((doc) => doc.data().planMapId).filter(Boolean);
  if (planMapIds.length === 0) {
    return { snapshot: null, data: [] };
  }
  const batches = batchIntoChunks(planMapIds);
  const planMapsSnapshots = await Promise.all(
    batches.map((batch) =>
      getDocs(query(collection(db, "planMaps"), where(documentId(), "in", batch)))
    )
  );
  const data = planMapsSnapshots.flatMap((snapshot) =>
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  );
  const snapshot = combineSnapshots(planMapsSnapshots);
  return { snapshot, data };
};

//get all pins from the pins array field of userPlanMaps's documents in the pins collection
const fetchUserPins = async (planMapsSnapshot) => {
  if (!planMapsSnapshot || planMapsSnapshot.empty || !planMapsSnapshot.docs) {
    return { snapshot: null, data: [] };
  }
  const pinIds = planMapsSnapshot.docs.flatMap((doc) => doc.data().pins || []);
  if (pinIds.length === 0) {
    return { snapshot: null, data: [] };
  }
  const batches = batchIntoChunks(pinIds);
  const pinsSnapshots = await Promise.all(
    batches.map((batch) => getDocs(query(collection(db, "pins"), where(documentId(), "in", batch))))
  );
  const data = pinsSnapshots.flatMap((snapshot) =>
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  );
  const snapshot = combineSnapshots(pinsSnapshots);
  return { snapshot, data };
};

//get all user-related timeline by matching userProjects's project's timelineId field in timelines collection
const fetchUserTimelines = async (projectsSnapshot) => {
  if (!projectsSnapshot || projectsSnapshot.empty || !projectsSnapshot.docs) {
    return { snapshot: null, data: [] };
  }
  const timelineIds = projectsSnapshot.docs.map((doc) => doc.data().timelineId).filter(Boolean);
  if (timelineIds.length === 0) {
    return { snapshot: null, data: [] };
  }
  const batches = batchIntoChunks(timelineIds);
  const timelinesSnapshots = await Promise.all(
    batches.map((batch) =>
      getDocs(query(collection(db, "timelines"), where(documentId(), "in", batch)))
    )
  );
  const data = timelinesSnapshots.flatMap((snapshot) =>
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  );
  const snapshot = combineSnapshots(timelinesSnapshots);
  return { snapshot, data };
};

//get all user-related events from the events array field of userTimelines's documents in the events collection
const fetchUserEvents = async (timelinesSnapshot) => {
  if (!timelinesSnapshot || timelinesSnapshot.empty || !timelinesSnapshot.docs) {
    return { snapshot: null, data: [] };
  }
  const eventIds = timelinesSnapshot.docs.flatMap((doc) => doc.data().events || []);
  if (eventIds.length === 0) {
    return { snapshot: null, data: [] };
  }
  const batches = batchIntoChunks(eventIds);
  const eventsSnapshots = await Promise.all(
    batches.map((batch) =>
      getDocs(query(collection(db, "events"), where(documentId(), "in", batch)))
    )
  );
  const data = eventsSnapshots.flatMap((snapshot) =>
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  );
  const snapshot = combineSnapshots(eventsSnapshots);
  return { snapshot, data };
};

export default useFirestoreSnapshots;
