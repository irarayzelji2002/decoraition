require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const apiRoutes = require("./routes/api");
const admin = require("firebase-admin");
const WebSocket = require("ws");

const { initializeApp } = require("firebase/app");
const { getAuth, signInWithPopup, GoogleAuthProvider } = require("firebase/auth");
const { getFirestore, doc, setDoc } = require("firebase/firestore");
const firebaseConfig = require("./firebaseConfig");

// Middleware
const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use("/api", apiRoutes);

// Initialize Firebase app
// const firebaseApp = initializeApp(firebaseConfig);
// const auth = getAuth(firebaseApp);
// const db = getFirestore(firebaseApp);
// Initialize Firebase Admin SDK
admin.initializeApp(firebaseConfig);
const auth = admin.auth();
const db = admin.firestore();

// Middleware to handle CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// Serve static files, manifest.json and service-worker.js from the React app
app.use(express.static(path.join(__dirname, "build")));
app.get("/manifest", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "manifest.json"));
});
app.get("/service-worker.js", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "service-worker.js"));
});

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ server: app.listen(5000) });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const { collections, userId } = JSON.parse(message);
    if (userId) {
      // Verify the user's authentication status
      admin
        .auth()
        .getUser(userId)
        .then((userRecord) => {
          console.log("User is authenticated:", userRecord.uid);
          setupCollectionListeners(ws, collections);
        })
        .catch((error) => {
          console.error("Error verifying user:", error);
          ws.send(JSON.stringify({ error: "Authentication failed" }));
        });
    } else {
      console.log("No user ID provided");
      ws.send(JSON.stringify({ error: "No user ID provided" }));
    }
  });
});

function setupCollectionListeners(ws, collections) {
  collections.forEach((collectionName) => {
    const unsubscribe = db.collection(collectionName).onSnapshot(
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        ws.send(JSON.stringify({ collection: collectionName, data }));
      },
      (error) => {
        console.error(`Snapshot listener error for ${collectionName}:`, error);
      }
    );

    ws.on("close", () => {
      unsubscribe();
    });
  });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: function (req, file, cb) {
    const originalName = file.originalname.replace(/ /g, "-");
    const uniqueFilename = Date.now() + "-" + generateRandomString(8) + "-" + originalName;
    cb(null, uniqueFilename);
  },
});

const upload = multer({ storage: storage });

// Example route to handle file uploads
app.post("/upload", upload.single("file"), (req, res) => {
  res.send("File uploaded successfully");
});

// Function to generate a random string
function generateRandomString(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// API endpoint for Google login
app.post("/api/google-login", async (req, res) => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const { displayName, email } = user;
    const [firstName, lastName] = displayName.split(" ");
    const username = email.split("@")[0];

    await setDoc(doc(db, "users", user.uid), {
      firstName,
      lastName,
      email,
      username,
    });

    res.status(200).json({ message: "You have been logged in" });
  } catch (error) {
    console.error("Google login error", error);
    res.status(500).json({
      message: "Google login failed. Please try again.",
    });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
