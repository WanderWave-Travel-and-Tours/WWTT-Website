const express = require('express');
const router = express.Router();
const controller = require('../controller/activityLogController');

// ===================================================================
// ACTIVITY LOG ROUTES
// ===================================================================

// Create Activity Log
router.post('/', controller.createActivityLog);
router.post('/activity-log', controller.createActivityLog);

// Get All Activity Logs (Main endpoint for frontend)
router.get('/', controller.getAllActivityLogs);

// Get Activity Statistics
router.get('/stats/summary', controller.getActivityStats);

// Get Logs by Module
router.get('/module/:module', controller.getLogsByModule);

// Get Logs by User
router.get('/user/:userId', controller.getLogsByUser);

// Delete Single Activity Log
router.delete('/:id', controller.deleteActivityLog);

// Cleanup Old Logs (e.g., ?days=90)
router.delete('/cleanup/old', controller.cleanupOldLogs);

// Clear All Logs (DANGEROUS - Use with caution)
router.delete('/clear/all', controller.clearAllLogs);

module.exports = router;