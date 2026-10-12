
const express = require("express");

const router = express.Router();

// Basic health check
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Ticketing System API is running",
    timestamp: new Date().toISOString(),
  });
});

// Detailed health check
router.get("/status", (req, res) => {
  const mongoose = require("mongoose");

  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    status: databaseConnected ? "healthy" : "degraded",
    services: {
      api: "running",
      database: databaseConnected ? "connected" : "disconnected",
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
