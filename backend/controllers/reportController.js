const dbService = require('../services/dbService');
const notificationService = require('../services/notificationService');

const reportController = {
  // Get main dashboard KPI card statistics
  async getDashboardStats(req, res) {
    try {
      const stats = await dbService.getTodayStats();
      res.json({ success: true, stats });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard statistics.',
        error: err.message
      });
    }
  },

  // Get daily breakdown reports
  async getDaily(req, res) {
    try {
      const report = await dbService.getDailyReport();
      res.json({ success: true, report });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate daily report.',
        error: err.message
      });
    }
  },

  // Get weekly report (revenue graph, item analytics)
  async getWeekly(req, res) {
    try {
      const report = await dbService.getWeeklyReport();
      res.json({ success: true, report });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate weekly report.',
        error: err.message
      });
    }
  },

  // Get monthly report (growth comparison, daily timeline)
  async getMonthly(req, res) {
    try {
      const report = await dbService.getMonthlyReport();
      res.json({ success: true, report });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate monthly report.',
        error: err.message
      });
    }
  },

  // Get audit log of all notifications
  async getNotificationLogs(req, res) {
    try {
      const logs = notificationService.getNotificationLogs();
      res.json({ success: true, logs });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notification logs.',
        error: err.message
      });
    }
  },

  // Get admin feedback statistics
  async getFeedbackStats(req, res) {
    try {
      const stats = await dbService.getFeedbackStats();
      res.json({ success: true, stats });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve feedback statistics.',
        error: err.message
      });
    }
  }
};

module.exports = reportController;
