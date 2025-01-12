// routes/metrics.js
const express = require('express');
const router = express.Router();
const FailedRequest = require('../models/ErrorLog');

// Get all failed requests for a specific IP
router.get('/metrics/:ip', async (req, res) => {
  try {
    const ipAddress = req.params.ip;
    const failedRequests = await FailedRequest.find({ ip: ipAddress })
      .sort({ timestamp: -1 });

    res.json({
      ip: ipAddress,
      totalFailures: failedRequests.length,
      failures: failedRequests
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Error fetching metrics' });
  }
});

// Get overview of all IPs
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await FailedRequest.aggregate([
      {
        $group: {
          _id: '$ip',
          count: { $sum: 1 },
          lastFailure: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Error fetching metrics' });
  }
});

module.exports = router;