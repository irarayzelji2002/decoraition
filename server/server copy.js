const express = require("express");
const multer = require("multer");
const dotenv = require("dotenv").config({ path: "./.env" });
const path = require("path");

const app = express();

// Parse URL-encoded bodies (form data)
app.use(express.urlencoded({ extended: true }));

// Middleware to set CORS headers (Allow requests from any origin & any headers in requests)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// Serve static files, manifest.json and service-worker.js from the React app
app.use(express.static(path.join(__dirname, "build")));
app.get("/manifest.json", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "manifest.json"));
});
app.get("/service-worker.js", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "service-worker.js"));
});

// const { MY_API_KEY } = process.env;
/*
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Set the destination folder for uploaded files
    cb(null, "../public/uploads");
  },
  filename: function (req, file, cb) {
    // Set the filename for uploaded files
    const originalName = file.originalname.replace(/ /g, "-");
    const uniqueFilename =
      Date.now() + "-" + generateRandomString(8) + "-" + originalName;
    cb(null, Date.now() + uniqueFilename);
  },
});
const upload = multer({ storage: storage });
const { admin } = require("./admin");
const { db } = require("./firebase");
const {
  collection,
  onSnapshot,
  doc,
  getDocs,
  addDoc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
} = require("firebase/firestore");
const { FieldValue } = require("firebase-admin/firestore");
*/

function generateRandomString(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// GET USER SAMPLE
app.get("/api/sample", async (req, res) => {
  res.json({ users: ["userOne", "userTwo", "userThree"] });
});

// All other requests should return to index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// SERVER ON PORT 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SERVER STARTED ON PORT ${PORT}`);
});
