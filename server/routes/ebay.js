const express = require("express");
const router = express.Router();
const axios = require("axios");

const { auth } = require("../firebase");
const { upload } = require("../uploadConfig");

const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// eBay credentials
const EBAY_CLIENT_ID = process.env.REACT_APP_EBAY_CLIENT_ID;
const EBAY_CLIENT_SECRET = process.env.REACT_APP_EBAY_CLIENT_SECRET;

// Get Application Access Token
async function getEbayToken() {
  try {
    const response = await axios.post(
      "https://api.ebay.com/identity/v1/oauth2/token",
      "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString(
            "base64"
          )}`,
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting eBay token:", error);
    throw error;
  }
}

// Search eBay items
router.get("/search", authenticateUser, async (req, res) => {
  try {
    const { query, currency } = req.query;
    const token = await getEbayToken();

    const currencyToMarketplace = {
      USD: "EBAY_US",
      PHP: "EBAY_PH", // not sure supported
    };
    const marketplaceId = currencyToMarketplace[currency?.currencyCode] || "EBAY_US";

    const response = await axios.get(`https://api.ebay.com/buy/browse/v1/item_summary/search`, {
      params: {
        q: query,
        // limit: 10, // default is 50
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": marketplaceId,
      },
    });

    res.json({ items: response.data.itemSummaries });
  } catch (error) {
    console.error("Error searching eBay items:", error);
    res.status(500).json({ error: "Failed to search eBay items" });
  }
});

const SUPPORTED_MARKETPLACES = [
  "EBAY_US",
  "EBAY_GB",
  "EBAY_DE",
  "EBAY_CA",
  "EBAY_IT",
  "EBAY_FR",
  "EBAY_ES",
  "EBAY_AU",
  "EBAY_PH",
];

module.exports = router;
