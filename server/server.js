require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const apiRoutes = require("./routes/api");
const ebayApiRoutes = require("./routes/ebay");
const admin = require("firebase-admin");

const { signInWithPopup, GoogleAuthProvider } = require("firebase/auth");
const { doc, setDoc } = require("firebase/firestore");
const { auth, db, clientAuth, clientDb } = require("./firebase");

// Middleware
const app = express();
app.use(express.json());
app.use(express.urlencoded());

// API routes
app.use("/api", apiRoutes);
app.use("/api/ebay", ebayApiRoutes);

// Middleware to handle CORS
const corsOptions = {
  origin: [
    /^http:\/\/localhost:\d+$/, // Matches any localhost port
    "https://decoraition.onrender.com",
    "https://decoraition.org",
    "https://www.decoraition.org",
    "https://ai-api.decoraition.org",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
  credentials: true,
};
app.use(cors(corsOptions));
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Origin, Accept");
//   next();
// });

// Serve static files, manifest.json and service-worker.js from the React app
app.use(express.static(path.join(__dirname, "build")));
app.get("/manifest", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "manifest.json"));
});
app.get("/service-worker.js", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "service-worker.js"));
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

// Catch-all handler for other routes, serving the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
